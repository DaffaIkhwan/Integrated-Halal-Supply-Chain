import { loadMatrixFromDB, calculateFSE, defuzzify, normalizeWeights, calculateConsistencyRatio } from '../lib/dss/fuzzyAHP';

async function main() {
  const type = "LEVEL1_CP";
  const { matrix, codes } = await loadMatrixFromDB(type);
  const fse = calculateFSE(matrix);
  const crispValues = fse.map((val) => defuzzify(val));
  const normalizedWeights = normalizeWeights(crispValues);
  const cr = calculateConsistencyRatio(matrix);

  const pairwiseTable = codes.map((rowCode, i) => {
    const row: any = { code: rowCode };
    codes.forEach((colCode, j) => {
      const [l, m, u] = matrix[i][j];
      row[colCode] = `[${l.toFixed(2)}, ${m.toFixed(2)}, ${u.toFixed(2)}]`;
    });
    return row;
  });

  const resultTable = codes.map((code, i) => ({
    code,
    fse: `[${fse[i][0].toFixed(3)}, ${fse[i][1].toFixed(3)}, ${fse[i][2].toFixed(3)}]`,
    crisp: crispValues[i].toFixed(4),
    weight: normalizedWeights[i].toFixed(4),
    percentage: (normalizedWeights[i] * 100).toFixed(2) + "%",
  }));

  console.log("SUCCESS route logic");
}
main().catch(console.error);
