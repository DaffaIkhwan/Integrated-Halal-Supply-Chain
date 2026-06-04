import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { FuzzyScale, recalculateLevel1Weights } from '@/lib/dss/fuzzyAHP';

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

export async function POST() {
    try {
        const responses = await prisma.questionnaireResponse.findMany({
            where: { questionnaireType: 'pembobotan' }
        });

        const cpLevelResponses = responses.filter(r => {
            const ans = r.answers as any;
            return ans && ans.type === 'CP_LEVEL' && Object.keys(ans.comparisons || {}).length > 0;
        });

        if (cpLevelResponses.length === 0) {
            return NextResponse.json({ error: 'No CP_LEVEL data found in K1 responses.' }, { status: 400 });
        }

        const pairTFNs: Record<string, [number, number, number][]> = {};

        for (const res of cpLevelResponses) {
            const comparisons = (res.answers as any).comparisons;
            for (const [key, val] of Object.entries(comparisons)) {
                const numVal = Number(val);
                if (!pairTFNs[key]) pairTFNs[key] = [];
                pairTFNs[key].push(getTFNForScale(numVal));
            }
        }

        const aggregatedTFNs: Record<string, [number, number, number]> = {};
        const n = cpLevelResponses.length;

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

        await prisma.pairwiseComparison.deleteMany({
            where: { matrixType: 'LEVEL1_CP' }
        });

        for (const [key, tfn] of Object.entries(aggregatedTFNs)) {
            const parts = key.split('_vs_');
            if (parts.length !== 2) continue;
            const [rowCode, colCode] = parts;

            await prisma.pairwiseComparison.create({
                data: { matrixType: 'LEVEL1_CP', rowCode, colCode, tfnLow: tfn[0], tfnMid: tfn[1], tfnUp: tfn[2] }
            });
            await prisma.pairwiseComparison.create({
                data: { matrixType: 'LEVEL1_CP', rowCode: colCode, colCode: rowCode, tfnLow: 1 / tfn[2], tfnMid: 1 / tfn[1], tfnUp: 1 / tfn[0] }
            });
        }

        const allCodes = Array.from(new Set(Object.keys(aggregatedTFNs).flatMap(k => k.split('_vs_'))));
        for (const code of allCodes) {
            await prisma.pairwiseComparison.create({
                data: { matrixType: 'LEVEL1_CP', rowCode: code, colCode: code, tfnLow: 1, tfnMid: 1, tfnUp: 1 }
            });
        }

        const { weights, cr } = await recalculateLevel1Weights();

        return NextResponse.json({
            success: true,
            respondents: n,
            cr,
            weights
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
