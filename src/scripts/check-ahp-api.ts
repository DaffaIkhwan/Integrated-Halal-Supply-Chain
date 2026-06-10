import { loadMatrixFromDB, calculateFSE, defuzzify, normalizeWeights, calculateConsistencyRatio } from '../lib/dss/fuzzyAHP';
async function test() {
    try {
        const { matrix, codes } = await loadMatrixFromDB("LEVEL1_CP");
        console.log("CODES:", codes);
        const fse = calculateFSE(matrix);
        const crispValues = fse.map((val) => defuzzify(val));
        const normalizedWeights = normalizeWeights(crispValues);
        const cr = calculateConsistencyRatio(matrix);
        console.log("CR:", cr);
    } catch(e) {
        console.error(e);
    }
}
test();
