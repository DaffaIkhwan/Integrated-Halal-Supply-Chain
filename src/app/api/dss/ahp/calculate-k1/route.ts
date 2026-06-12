import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { FuzzyScale, recalculateLevel1Weights, calculateWeightsFromMatrix, loadMatrixFromDB, calculateConsistencyRatio } from '@/lib/dss/fuzzyAHP';

export const dynamic = 'force-dynamic';

function getTFNForScale(value: number): [number, number, number] {
    const absVal = Math.abs(value) + 1; // map 0..8 to 1..9
    let tfn: [number, number, number];

    if (absVal === 1) tfn = FuzzyScale.EQUAL;
    else if (absVal === 2 || absVal === 3) tfn = FuzzyScale.MODERATE;
    else if (absVal === 4 || absVal === 5) tfn = FuzzyScale.STRONG;
    else if (absVal === 6 || absVal === 7) tfn = FuzzyScale.VERY_STRONG;
    else tfn = FuzzyScale.EXTREME;

    if (value > 0) {
        return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
    }
    return tfn;
}

/**
 * Aggregate questionnaire responses for a given matrixType (e.g. 'KU_LEVEL', 'CP_LEVEL')
 * into pairwise comparison TFN entries in the database using geometric mean.
 * Returns the number of respondents processed.
 */
async function aggregateAndSaveMatrix(
    responses: any[],
    answerType: string,
    matrixType: string
): Promise<{ respondents: number; processed: boolean }> {
    const filtered = responses.filter(r => {
        const ans = r.answers as any;
        return ans && ans.type === answerType && Object.keys(ans.comparisons || {}).length > 0;
    });

    if (filtered.length === 0) {
        return { respondents: 0, processed: false };
    }

    const pairTFNs: Record<string, [number, number, number][]> = {};

    for (const res of filtered) {
        const comparisons = (res.answers as any).comparisons;
        for (const [key, val] of Object.entries(comparisons)) {
            const numVal = Number(val);
            if (!pairTFNs[key]) pairTFNs[key] = [];
            pairTFNs[key].push(getTFNForScale(numVal));
        }
    }

    const n = filtered.length;
    const aggregatedTFNs: Record<string, [number, number, number]> = {};

    for (const [key, tfns] of Object.entries(pairTFNs)) {
        let prodL = 1, prodM = 1, prodU = 1;
        for (const [l, m, u] of tfns) {
            prodL *= l;
            prodM *= m;
            prodU *= u;
        }
        aggregatedTFNs[key] = [
            Math.pow(prodL, 1 / n),
            Math.pow(prodM, 1 / n),
            Math.pow(prodU, 1 / n)
        ];
    }

    // Clear existing matrix data
    await prisma.pairwiseComparison.deleteMany({
        where: { matrixType }
    });

    // Save upper triangle + reciprocal lower triangle
    for (const [key, tfn] of Object.entries(aggregatedTFNs)) {
        const parts = key.split('_vs_');
        if (parts.length !== 2) continue;
        const [rowCode, colCode] = parts;

        await prisma.pairwiseComparison.create({
            data: { matrixType, rowCode, colCode, tfnLow: tfn[0], tfnMid: tfn[1], tfnUp: tfn[2] }
        });
        await prisma.pairwiseComparison.create({
            data: { matrixType, rowCode: colCode, colCode: rowCode, tfnLow: 1 / tfn[2], tfnMid: 1 / tfn[1], tfnUp: 1 / tfn[0] }
        });
    }

    // Save diagonal (1,1,1)
    const allCodes = Array.from(new Set(Object.keys(aggregatedTFNs).flatMap(k => k.split('_vs_'))));
    for (const code of allCodes) {
        await prisma.pairwiseComparison.create({
            data: { matrixType, rowCode: code, colCode: code, tfnLow: 1, tfnMid: 1, tfnUp: 1 }
        });
    }

    return { respondents: n, processed: true };
}

export async function POST() {
    try {
        const responses = await prisma.questionnaireResponse.findMany({
            where: { questionnaireType: 'pembobotan' }
        });

        const results: Record<string, any> = {};

        // ═══ 1. Kalkulasi KU_LEVEL (Kriteria Umum) ═══
        const kuResult = await aggregateAndSaveMatrix(responses, 'KU_LEVEL', 'KU_LEVEL');
        if (kuResult.processed) {
            const { matrix: kuMatrix, codes: kuCodes } = await loadMatrixFromDB('KU_LEVEL');
            const kuWeightsData = calculateWeightsFromMatrix(kuMatrix, kuCodes);
            const kuCr = calculateConsistencyRatio(kuMatrix);
            results.kuLevel = {
                respondents: kuResult.respondents,
                cr: kuCr,
                weights: kuWeightsData.map(w => ({ code: w.code, weight: w.weight })),
            };
        }

        // ═══ 2. Kalkulasi CP_LEVEL (Antar CP — Level 1) ═══
        const cpResult = await aggregateAndSaveMatrix(responses, 'CP_LEVEL', 'LEVEL1_CP');
        if (cpResult.processed) {
            const { weights, cr } = await recalculateLevel1Weights();
            results.cpLevel = {
                respondents: cpResult.respondents,
                cr,
                weights,
            };
        }

        // ═══ 3. Kalkulasi Sub-Kriteria per CP (Level 2) ═══
        for (let cpNum = 1; cpNum <= 9; cpNum++) {
            const cpId = `CP${cpNum}`;
            const subResult = await aggregateAndSaveMatrix(responses, cpId, `LEVEL2_${cpId}`);
            if (subResult.processed) {
                const { matrix: subMatrix, codes: subCodes } = await loadMatrixFromDB(`LEVEL2_${cpId}`);
                const subWeightsData = calculateWeightsFromMatrix(subMatrix, subCodes);
                const subCr = calculateConsistencyRatio(subMatrix);
                results[cpId] = {
                    respondents: subResult.respondents,
                    cr: subCr,
                    weights: subWeightsData.map(w => ({ code: w.code, weight: w.weight })),
                };
            }
        }

        if (Object.keys(results).length === 0) {
            return NextResponse.json({ error: 'Tidak ada data kuesioner pembobotan yang ditemukan.' }, { status: 400 });
        }

        // Respondent count summary
        const totalRespondents = Math.max(
            results.kuLevel?.respondents || 0,
            results.cpLevel?.respondents || 0
        );

        return NextResponse.json({
            success: true,
            respondents: totalRespondents,
            cr: results.cpLevel?.cr || results.kuLevel?.cr || null,
            weights: results.cpLevel?.weights || [],
            kuLevel: results.kuLevel || null,
            cpLevel: results.cpLevel || null,
            subLevels: Object.fromEntries(
                Object.entries(results).filter(([k]) => k.startsWith('CP'))
            ),
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
