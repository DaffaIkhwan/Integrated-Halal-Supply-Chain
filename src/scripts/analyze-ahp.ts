import { PrismaClient } from '@prisma/client';
import { FuzzyScale } from '../lib/dss/fuzzyAHP';

const prisma = new PrismaClient();

function getCrispScale(value: number): number {
    const absVal = Math.abs(value) + 1; // 0..8 -> 1..9
    let scale = 1;
    if (absVal === 1) scale = 1;
    else if (absVal === 2 || absVal === 3) scale = 3;
    else if (absVal === 4 || absVal === 5) scale = 5;
    else if (absVal === 6 || absVal === 7) scale = 7;
    else scale = 9;

    if (value > 0) return 1 / scale;
    return scale;
}

function calculateCRForMatrix(matrix: number[][]) {
    const n = matrix.length;
    const colSums = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            colSums[j] += matrix[i][j];
        }
    }
    
    const normalizedMatrix = matrix.map(row => row.map((val, j) => val / colSums[j]));
    const weights = normalizedMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);
    
    const Aw = matrix.map(row => row.reduce((sum, val, j) => sum + val * weights[j], 0));
    const lambdaMax = Aw.reduce((sum, aw, i) => sum + aw / weights[i], 0) / n;
    
    const CI = (lambdaMax - n) / (n - 1);
    const RI_TABLE: Record<number, number> = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 };
    const CR = CI / RI_TABLE[n];
    return { CR, weights, lambdaMax };
}

async function analyze() {
    const responses = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan' }
    });

    const cpResponses = responses.filter(r => (r.answers as any)?.type === 'CP_LEVEL');
    console.log(`Found ${cpResponses.length} respondents for CP_LEVEL.\n`);

    const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
    const n = codes.length;

    for (let k = 0; k < cpResponses.length; k++) {
        const res = cpResponses[k];
        const comparisons = (res.answers as any).comparisons || {};
        
        // Build crisp matrix
        const matrix = Array.from({ length: n }, () => new Array(n).fill(1));
        
        for (const [key, val] of Object.entries(comparisons)) {
            const numVal = Number(val);
            const scale = getCrispScale(numVal);
            
            const [row, col] = key.split('_vs_');
            const i = codes.indexOf(row);
            const j = codes.indexOf(col);
            if (i >= 0 && j >= 0) {
                matrix[i][j] = scale;
                matrix[j][i] = 1 / scale;
            }
        }

        const { CR } = calculateCRForMatrix(matrix);
        console.log(`Respondent ${k + 1} (Evaluator ${res.evaluatorId}): CR = ${CR.toFixed(4)}`);
        
        if (CR > 0.1) {
            console.log(`  -> INCONSISTENT! Identifying top contradictory pairs...`);
            // Simple heuristic to find contradictions:
            // if w_i / w_j is very different from matrix[i][j]
            const { weights } = calculateCRForMatrix(matrix);
            const deviations = [];
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const expected = weights[i] / weights[j];
                    const actual = matrix[i][j];
                    const diff = Math.max(actual / expected, expected / actual);
                    if (diff > 3) { // High deviation threshold
                        deviations.push({
                            pair: `${codes[i]} vs ${codes[j]}`,
                            actual: actual.toFixed(2),
                            expected: expected.toFixed(2),
                            diff: diff.toFixed(2)
                        });
                    }
                }
            }
            deviations.sort((a, b) => Number(b.diff) - Number(a.diff));
            deviations.slice(0, 5).forEach(d => {
                console.log(`     - ${d.pair}: Actual ${d.actual}, Expected ${d.expected} (Dev: ${d.diff}x)`);
            });
        }
        console.log('');
    }
}

analyze().finally(() => prisma.$disconnect());
