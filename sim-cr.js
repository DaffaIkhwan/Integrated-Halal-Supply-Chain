const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function sliderToCrispScale(value) {
    const absVal = Math.abs(value);
    const scale = absVal + 1;
    if (value > 0) return 1 / scale;
    if (value < 0) return scale;
    return 1;
}

function calculateCR(matrix) {
    const n = matrix.length;
    const colSums = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            colSums[j] += matrix[i][j];
        }
    }
    
    const normMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
    const weights = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
        let rowSum = 0;
        for (let j = 0; j < n; j++) {
            normMatrix[i][j] = matrix[i][j] / colSums[j];
            rowSum += normMatrix[i][j];
        }
        weights[i] = rowSum / n;
    }
    
    const Aw = matrix.map(row => row.reduce((sum, val, j) => sum + val * weights[j], 0));
    
    const lambdaMax = Aw.reduce((sum, aw, i) => {
        if (weights[i] === 0) return sum;
        return sum + aw / weights[i];
    }, 0) / n;
    
    const CI = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
    const RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 };
    const RI = RI_TABLE[n] || 1.49;
    const CR = RI === 0 ? 0 : CI / RI;
    
    return { CR };
}

function buildMatrix(comparisons) {
    const n = 9;
    const matrix = Array.from({ length: n }, () => new Array(n).fill(1));
    for (const [key, val] of Object.entries(comparisons)) {
        const numVal = Number(val);
        const scale = sliderToCrispScale(numVal);
        const parts = key.split('_vs_');
        const rStr = parts[0].replace('CP', '');
        const cStr = parts[1].replace('CP', '');
        const row = parseInt(rStr) - 1;
        const col = parseInt(cStr) - 1;
        matrix[row][col] = scale;
        matrix[col][row] = 1 / scale;
    }
    return matrix;
}

async function main() {
    const responses = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan' }
    });
    
    const r1 = responses.find(r => r.respondentName === 'Irdha Mirdayati');
    const r2 = responses.find(r => r.respondentName === 'Muhammad Rizki');
    
    if (r1 && r1.answers && r1.answers.type === 'CP_LEVEL') {
        const comp1 = { ...r1.answers.comparisons };
        console.log(`Original CR R1: ${calculateCR(buildMatrix(comp1)).CR.toFixed(4)}`);
        
        // Apply suggestions for R1
        comp1['CP1_vs_CP3'] = 0;  // Sama Penting
        comp1['CP1_vs_CP2'] = 0;  // Sama Penting
        comp1['CP7_vs_CP8'] = -1; // Sedikit lebih penting (Skala 2)
        comp1['CP3_vs_CP7'] = 6;  // CP7 mutlak lebih penting (slider +6)
        comp1['CP3_vs_CP8'] = 6;  // CP8 mutlak lebih penting (slider +6)
        comp1['CP1_vs_CP4'] = 8;  // CP4 mutlak lebih penting (slider +8)
        
        console.log(`Simulated CR R1: ${calculateCR(buildMatrix(comp1)).CR.toFixed(4)}`);
    }

    if (r2 && r2.answers && r2.answers.type === 'CP_LEVEL') {
        const comp2 = { ...r2.answers.comparisons };
        console.log(`Original CR R2: ${calculateCR(buildMatrix(comp2)).CR.toFixed(4)}`);
        
        // Apply suggestions for R2
        comp2['CP1_vs_CP3'] = 0;  // Sama Penting
        comp2['CP3_vs_CP9'] = 0;  // Sama Penting
        comp2['CP1_vs_CP6'] = 2;  // CP6 sedikit lebih penting (slider +2)
        comp2['CP5_vs_CP9'] = -8; // CP5 sangat jauh lebih penting (slider -8)
        
        console.log(`Simulated CR R2: ${calculateCR(buildMatrix(comp2)).CR.toFixed(4)}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
