"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Convert slider value (0..8 / -8..0) to Saaty crisp scale
function sliderToCrispScale(value) {
    const absVal = Math.abs(value);
    // Slider values: 0=equal(1), 1=2, 2=3, 3=4, 4=5, 5=6, 6=7, 7=8, 8=9
    const scale = absVal + 1;
    // negative = left (A) more important, positive = right (B) more important
    if (value > 0)
        return 1 / scale; // B more important, so A/B = 1/scale
    if (value < 0)
        return scale; // A more important, so A/B = scale
    return 1; // equal
}
// Also check: what does our FuzzyScale mapping do?
function sliderToFuzzyMidpoint(value) {
    const absVal = Math.abs(value) + 1; // map 0..8 to 1..9
    let mid;
    if (absVal === 1)
        mid = 1;
    else if (absVal === 2 || absVal === 3)
        mid = 3;
    else if (absVal === 4 || absVal === 5)
        mid = 5;
    else if (absVal === 6 || absVal === 7)
        mid = 7;
    else
        mid = 9;
    if (value > 0)
        return 1 / mid;
    return mid;
}
function calculateCR(matrix) {
    const n = matrix.length;
    // Calculate column sums for normalization
    const colSums = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            colSums[j] += matrix[i][j];
        }
    }
    // Normalize and get priority vector (weights)
    const normalizedMatrix = matrix.map(row => row.map((val, j) => val / colSums[j]));
    const weights = normalizedMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);
    // Calculate Aw
    const Aw = matrix.map(row => row.reduce((sum, val, j) => sum + val * weights[j], 0));
    // lambda_max
    const lambdaMax = Aw.reduce((sum, aw, i) => {
        if (weights[i] === 0)
            return sum;
        return sum + aw / weights[i];
    }, 0) / n;
    // CI and CR
    const CI = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
    const RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };
    const RI = RI_TABLE[n] || 1.49;
    const CR = RI === 0 ? 0 : CI / RI;
    return { lambdaMax, CI, CR, weights, RI };
}
async function main() {
    console.log("=".repeat(80));
    console.log("FULL VERIFICATION OF AHP INCONSISTENCY REPORT");
    console.log("=".repeat(80));
    // 1. Get all K1 V1 responses
    const responses = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan' }
    });
    const cpResponses = responses.filter(r => {
        const ans = r.answers;
        return ans && ans.type === 'CP_LEVEL' && Object.keys(ans.comparisons || {}).length > 0;
    });
    console.log(`\nTotal K1 V1 responses: ${responses.length}`);
    console.log(`CP_LEVEL responses: ${cpResponses.length}`);
    const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
    const n = codes.length;
    // Expected pairs for full 9x9 matrix
    const expectedPairs = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            expectedPairs.push(`${codes[i]}_vs_${codes[j]}`);
        }
    }
    console.log(`\nExpected number of unique pairs for 9x9 matrix: ${expectedPairs.length}`);
    // ========== PER-RESPONDENT ANALYSIS ==========
    for (let k = 0; k < cpResponses.length; k++) {
        const res = cpResponses[k];
        const comparisons = res.answers.comparisons || {};
        const compKeys = Object.keys(comparisons);
        console.log("\n" + "=".repeat(80));
        console.log(`RESPONDENT ${k + 1}`);
        console.log(`  ID: ${res.id}`);
        console.log(`  Name: ${res.respondentName}`);
        console.log(`  Role: ${res.respondentRole}`);
        console.log(`  Created: ${res.createdAt}`);
        console.log(`  Number of comparisons filled: ${compKeys.length} / ${expectedPairs.length}`);
        // Check missing pairs
        const missingPairs = [];
        for (const ep of expectedPairs) {
            if (!(ep in comparisons)) {
                // Also check reverse
                const [a, b] = ep.split('_vs_');
                const rev = `${b}_vs_${a}`;
                if (!(rev in comparisons)) {
                    missingPairs.push(ep);
                }
            }
        }
        if (missingPairs.length > 0) {
            console.log(`\n  MISSING PAIRS (${missingPairs.length}):`);
            missingPairs.forEach(p => console.log(`    - ${p}`));
        }
        else {
            console.log(`\n  All pairs present ✓`);
        }
        // Dump raw slider values
        console.log("\n  RAW SLIDER VALUES:");
        for (const [key, val] of Object.entries(comparisons).sort()) {
            const numVal = Number(val);
            const crispScale = sliderToCrispScale(numVal);
            const fuzzyMid = sliderToFuzzyMidpoint(numVal);
            const [a, b] = key.split('_vs_');
            const direction = numVal < 0 ? `${a} more important` : numVal > 0 ? `${b} more important` : 'Equal';
            console.log(`    ${key}: slider=${numVal}, crisp=${crispScale.toFixed(4)}, fuzzyMid=${fuzzyMid.toFixed(4)} (${direction})`);
        }
        // Build crisp matrix with RAW Saaty scale (not fuzzy-grouped)
        const crispMatrix = Array.from({ length: n }, () => new Array(n).fill(1));
        for (const [key, val] of Object.entries(comparisons)) {
            const numVal = Number(val);
            const scale = sliderToCrispScale(numVal);
            const [row, col] = key.split('_vs_');
            const i = codes.indexOf(row);
            const j = codes.indexOf(col);
            if (i >= 0 && j >= 0) {
                crispMatrix[i][j] = scale;
                crispMatrix[j][i] = 1 / scale;
            }
        }
        // Print crisp matrix
        console.log("\n  CRISP MATRIX (Raw Saaty Scale):");
        console.log("       " + codes.map(c => c.padStart(8)).join(""));
        for (let i = 0; i < n; i++) {
            const row = crispMatrix[i].map((v) => v.toFixed(4).padStart(8)).join("");
            console.log(`  ${codes[i]}  ${row}`);
        }
        // Calculate CR with raw crisp
        const crispResult = calculateCR(crispMatrix);
        console.log(`\n  CR (Raw Crisp): λmax=${crispResult.lambdaMax.toFixed(4)}, CI=${crispResult.CI.toFixed(4)}, CR=${crispResult.CR.toFixed(4)}`);
        console.log(`  Weights (Raw Crisp): ${codes.map((c, i) => `${c}=${(crispResult.weights[i] * 100).toFixed(2)}%`).join(', ')}`);
        // Build matrix with FUZZY MIDPOINT (as used in our system)
        const fuzzyMidMatrix = Array.from({ length: n }, () => new Array(n).fill(1));
        for (const [key, val] of Object.entries(comparisons)) {
            const numVal = Number(val);
            const mid = sliderToFuzzyMidpoint(numVal);
            const [row, col] = key.split('_vs_');
            const i = codes.indexOf(row);
            const j = codes.indexOf(col);
            if (i >= 0 && j >= 0) {
                fuzzyMidMatrix[i][j] = mid;
                fuzzyMidMatrix[j][i] = 1 / mid;
            }
        }
        const fuzzyResult = calculateCR(fuzzyMidMatrix);
        console.log(`\n  CR (Fuzzy Midpoint): λmax=${fuzzyResult.lambdaMax.toFixed(4)}, CI=${fuzzyResult.CI.toFixed(4)}, CR=${fuzzyResult.CR.toFixed(4)}`);
        console.log(`  Weights (Fuzzy Mid): ${codes.map((c, i) => `${c}=${(fuzzyResult.weights[i] * 100).toFixed(2)}%`).join(', ')}`);
        // Find ALL deviations (not just top 5)
        console.log("\n  ALL TRANSITIVITY DEVIATIONS (threshold > 2.0x):");
        const deviations = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const expected = crispResult.weights[i] / crispResult.weights[j];
                const actual = crispMatrix[i][j];
                const ratio = Math.max(actual / expected, expected / actual);
                if (ratio > 2.0) {
                    deviations.push({
                        pair: `${codes[i]} vs ${codes[j]}`,
                        actualScale: actual,
                        expectedRatio: expected,
                        deviation: ratio,
                        sliderVal: comparisons[`${codes[i]}_vs_${codes[j]}`] ?? comparisons[`${codes[j]}_vs_${codes[i]}`] ?? 'N/A'
                    });
                }
            }
        }
        deviations.sort((a, b) => b.deviation - a.deviation);
        deviations.forEach(d => {
            console.log(`    ${d.pair}: actual=${d.actualScale.toFixed(4)}, expected=${d.expectedRatio.toFixed(4)}, dev=${d.deviation.toFixed(2)}x, slider=${d.sliderVal}`);
        });
        // Specific transitivity check triples
        console.log("\n  TRANSITIVITY CHECK (A>B, B>C => A>C):");
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                for (let kk = j + 1; kk < n; kk++) {
                    const ab = crispMatrix[i][j];
                    const bc = crispMatrix[j][kk];
                    const ac_expected = ab * bc;
                    const ac_actual = crispMatrix[i][kk];
                    const ratio = Math.max(ac_actual / ac_expected, ac_expected / ac_actual);
                    if (ratio > 4) {
                        console.log(`    ${codes[i]}>${codes[j]}>${codes[kk]}: ${codes[i]}/${codes[j]}=${ab.toFixed(2)}, ${codes[j]}/${codes[kk]}=${bc.toFixed(2)}, expected ${codes[i]}/${codes[kk]}=${ac_expected.toFixed(2)}, actual=${ac_actual.toFixed(2)}, dev=${ratio.toFixed(2)}x`);
                    }
                }
            }
        }
    }
    // ========== AGGREGATED ANALYSIS ==========
    console.log("\n" + "=".repeat(80));
    console.log("AGGREGATED MATRIX (Geometric Mean of all respondents)");
    console.log("=".repeat(80));
    // Aggregate using geometric mean of crisp values
    const aggMatrix = Array.from({ length: n }, () => new Array(n).fill(1));
    const numResp = cpResponses.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const key1 = `${codes[i]}_vs_${codes[j]}`;
            let product = 1;
            let count = 0;
            for (const res of cpResponses) {
                const comparisons = res.answers.comparisons || {};
                if (key1 in comparisons) {
                    product *= sliderToCrispScale(Number(comparisons[key1]));
                    count++;
                }
            }
            if (count > 0) {
                const geoMean = Math.pow(product, 1 / count);
                aggMatrix[i][j] = geoMean;
                aggMatrix[j][i] = 1 / geoMean;
            }
        }
    }
    console.log("\n  AGGREGATED CRISP MATRIX:");
    console.log("       " + codes.map(c => c.padStart(8)).join(""));
    for (let i = 0; i < n; i++) {
        const row = aggMatrix[i].map((v) => v.toFixed(4).padStart(8)).join("");
        console.log(`  ${codes[i]}  ${row}`);
    }
    const aggResult = calculateCR(aggMatrix);
    console.log(`\n  CR (Aggregated Crisp): λmax=${aggResult.lambdaMax.toFixed(4)}, CI=${aggResult.CI.toFixed(4)}, CR=${aggResult.CR.toFixed(4)}`);
    console.log(`  Consistent: ${aggResult.CR < 0.1 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Weights: ${codes.map((c, i) => `${c}=${(aggResult.weights[i] * 100).toFixed(2)}%`).join(', ')}`);
    // Check what the FUZZY AHP system actually produces (from current DB)
    console.log("\n" + "=".repeat(80));
    console.log("CURRENT DB STATE (PairwiseComparison table, LEVEL1_CP)");
    console.log("=".repeat(80));
    const dbEntries = await prisma.pairwiseComparison.findMany({
        where: { matrixType: 'LEVEL1_CP' },
        orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }]
    });
    console.log(`  Total entries: ${dbEntries.length}`);
    // Verify completeness
    const dbCodes = Array.from(new Set(dbEntries.map(e => e.rowCode))).sort();
    console.log(`  Codes found: ${dbCodes.join(', ')}`);
    for (const r of dbCodes) {
        for (const c of dbCodes) {
            const entry = dbEntries.find(e => e.rowCode === r && e.colCode === c);
            if (!entry) {
                console.log(`  MISSING in DB: ${r} vs ${c}`);
            }
        }
    }
    // Build TFN matrix from DB and compute Fuzzy AHP CR
    const tfnMatrix = Array.from({ length: dbCodes.length }, () => Array.from({ length: dbCodes.length }, () => [1, 1, 1]));
    for (const entry of dbEntries) {
        const i = dbCodes.indexOf(entry.rowCode);
        const j = dbCodes.indexOf(entry.colCode);
        if (i >= 0 && j >= 0) {
            tfnMatrix[i][j] = [entry.tfnLow, entry.tfnMid, entry.tfnUp];
        }
    }
    // Defuzzified CR (using midpoint)
    const defuzzMatrix = tfnMatrix.map(row => row.map(tfn => (tfn[0] + tfn[1] + tfn[2]) / 3));
    const dbResult = calculateCR(defuzzMatrix);
    console.log(`\n  CR (DB Defuzzified CoA): λmax=${dbResult.lambdaMax.toFixed(4)}, CI=${dbResult.CI.toFixed(4)}, CR=${dbResult.CR.toFixed(4)}`);
    console.log(`  Consistent: ${dbResult.CR < 0.1 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Weights: ${dbCodes.map((c, i) => `${c}=${(dbResult.weights[i] * 100).toFixed(2)}%`).join(', ')}`);
    console.log("\n" + "=".repeat(80));
    console.log("VERIFICATION COMPLETE");
    console.log("=".repeat(80));
}
main().catch(console.error).finally(() => prisma.$disconnect());
