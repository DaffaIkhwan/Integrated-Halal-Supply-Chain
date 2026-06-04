import { PrismaClient } from '@prisma/client';
import { FuzzyScale, recalculateLevel1Weights } from '../lib/dss/fuzzyAHP';

const prisma = new PrismaClient();

// Helper to interpret pairwise scale
function getTFNForScale(value: number): [number, number, number] {
    const absVal = Math.abs(value) + 1; // map 0..8 to 1..9
    let tfn: [number, number, number];

    if (absVal === 1) tfn = FuzzyScale.EQUAL;
    else if (absVal === 2 || absVal === 3) tfn = FuzzyScale.MODERATE;
    else if (absVal === 4 || absVal === 5) tfn = FuzzyScale.STRONG;
    else if (absVal === 6 || absVal === 7) tfn = FuzzyScale.VERY_STRONG;
    else tfn = FuzzyScale.EXTREME;

    // If value < 0, it means left is more important.
    // If value > 0, right is more important, so left gets reciprocal.
    if (value > 0) {
        return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
    }
    return tfn;
}

async function main() {
    console.log("Fetching K1 V1 responses for CP_LEVEL...");
    const responses = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan' }
    });

    // Filter responses that have CP_LEVEL data
    const cpLevelResponses = responses.filter(r => {
        const ans = r.answers as any;
        return ans && ans.type === 'CP_LEVEL' && Object.keys(ans.comparisons || {}).length > 0;
    });

    console.log(`Found ${cpLevelResponses.length} valid respondents for CP_LEVEL.`);

    if (cpLevelResponses.length === 0) {
        console.log("No data to process.");
        return;
    }

    // Aggregate TFNs using geometric mean
    // Store array of TFNs per pair
    const pairTFNs: Record<string, [number, number, number][]> = {};

    for (const res of cpLevelResponses) {
        const comparisons = (res.answers as any).comparisons;
        for (const [key, val] of Object.entries(comparisons)) {
            const numVal = Number(val);
            if (!pairTFNs[key]) pairTFNs[key] = [];
            pairTFNs[key].push(getTFNForScale(numVal));
        }
    }

    // Calculate geometric mean for each pair
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

    console.log("Calculated Geometric Means. Updating PairwiseComparison table...");

    // Clear existing CP LEVEL 1 pairwise matrix
    await prisma.pairwiseComparison.deleteMany({
        where: { matrixType: 'LEVEL1_CP' }
    });

    // Update DB
    for (const [key, tfn] of Object.entries(aggregatedTFNs)) {
        const parts = key.split('_vs_');
        if (parts.length !== 2) continue;
        const [rowCode, colCode] = parts;

        // Insert A -> B
        await prisma.pairwiseComparison.create({
            data: {
                matrixType: 'LEVEL1_CP',
                rowCode,
                colCode,
                tfnLow: tfn[0],
                tfnMid: tfn[1],
                tfnUp: tfn[2]
            }
        });

        // Insert B -> A (reciprocal)
        await prisma.pairwiseComparison.create({
            data: {
                matrixType: 'LEVEL1_CP',
                rowCode: colCode,
                colCode: rowCode,
                tfnLow: 1 / tfn[2],
                tfnMid: 1 / tfn[1],
                tfnUp: 1 / tfn[0]
            }
        });
    }

    // Insert diagonals
    const allCodes = Array.from(new Set(Object.keys(aggregatedTFNs).flatMap(k => k.split('_vs_'))));
    for (const code of allCodes) {
        await prisma.pairwiseComparison.create({
            data: {
                matrixType: 'LEVEL1_CP',
                rowCode: code,
                colCode: code,
                tfnLow: 1,
                tfnMid: 1,
                tfnUp: 1
            }
        });
    }

    console.log("DB Updated. Recalculating weights...");
    const { weights, cr } = await recalculateLevel1Weights();

    console.log("\n=== FINAL RESULTS ===");
    console.log("CR:", cr);
    console.log("Weights:");
    weights.forEach(w => {
        console.log(`${w.code}: ${(w.weight * 100).toFixed(2)}%`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
