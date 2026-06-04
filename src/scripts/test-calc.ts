import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FuzzyScale = {
    EQUAL: [1, 1, 1],
    MODERATE: [1, 3, 5],
    STRONG: [3, 5, 7],
    VERY_STRONG: [5, 7, 9],
    EXTREME: [7, 9, 9],
};

function getTFNForScale(value: number): number[] {
    const absVal = Math.abs(value) + 1;
    let tfn: number[];

    if (absVal === 1) tfn = FuzzyScale.EQUAL;
    else if (absVal === 2 || absVal === 3) tfn = FuzzyScale.MODERATE;
    else if (absVal === 4 || absVal === 5) tfn = FuzzyScale.STRONG;
    else if (absVal === 6 || absVal === 7) tfn = FuzzyScale.VERY_STRONG;
    else tfn = FuzzyScale.EXTREME;

    if (value > 0) return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
    return tfn;
}

function sumTFNs(tfns: number[][]): number[] {
    return tfns.reduce((acc, val) => [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]], [0, 0, 0]);
}

async function main() {
    const responses = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan' }
    });

    const cpLevelResponses = responses.filter(r => {
        const ans = r.answers as any;
        return ans && ans.type === 'CP_LEVEL' && Object.keys(ans.comparisons || {}).length > 0;
    });

    const pairTFNs: Record<string, number[][]> = {};

    for (const res of cpLevelResponses) {
        const comparisons = (res.answers as any).comparisons;
        for (const [key, val] of Object.entries(comparisons)) {
            const numVal = Number(val);
            if (!pairTFNs[key]) pairTFNs[key] = [];
            pairTFNs[key].push(getTFNForScale(numVal));
        }
    }

    const aggregatedTFNs: Record<string, number[]> = {};
    const n = cpLevelResponses.length;
    if (n === 0) {
        console.log("No data");
        return;
    }

    for (const [key, tfns] of Object.entries(pairTFNs)) {
        let prodL = 1, prodM = 1, prodU = 1;
        for (const [l, m, u] of tfns) {
            prodL *= l;
            prodM *= m;
            prodU *= u;
        }
        aggregatedTFNs[key] = [Math.pow(prodL, 1 / n), Math.pow(prodM, 1 / n), Math.pow(prodU, 1 / n)];
    }

    // Build matrix
    const allCodes = Array.from(new Set(Object.keys(aggregatedTFNs).flatMap(k => k.split('_vs_')))).sort();
    const size = allCodes.length;
    const matrix: number[][][] = Array.from({ length: size }, () => Array.from({ length: size }, () => [1, 1, 1]));

    for (const [key, tfn] of Object.entries(aggregatedTFNs)) {
        const [rowCode, colCode] = key.split('_vs_');
        const i = allCodes.indexOf(rowCode);
        const j = allCodes.indexOf(colCode);
        if (i >= 0 && j >= 0) {
            matrix[i][j] = tfn;
            matrix[j][i] = [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
        }
    }

    const rowSums = matrix.map(row => sumTFNs(row));
    const totalSum = sumTFNs(rowSums);
    const reverseTotal = [1 / totalSum[2], 1 / totalSum[1], 1 / totalSum[0]];
    const fse = rowSums.map(sum => [sum[0] * reverseTotal[0], sum[1] * reverseTotal[1], sum[2] * reverseTotal[2]]);
    const crispValues = fse.map(tfn => (tfn[0] + tfn[1] + tfn[2]) / 3);
    const sumCrisp = crispValues.reduce((a, b) => a + b, 0);
    const weights = crispValues.map(w => w / sumCrisp);

    console.log("=== RESULTS ===");
    for (let i = 0; i < size; i++) {
        console.log(`${allCodes[i]}: ${(weights[i] * 100).toFixed(2)}%`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
