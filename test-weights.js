const SAATY_RI = { 1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };

function calculateCR(matrix) {
  const n = matrix.length;
  const colSums = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) colSums[j] += matrix[i][j];
  }
  const normalized = Array.from({length: n}, () => Array(n).fill(0));
  const weights = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      normalized[i][j] = matrix[i][j] / colSums[j];
      weights[i] += normalized[i][j];
    }
    weights[i] /= n;
  }
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) rowSum += matrix[i][j] * weights[j];
    lambdaMax += rowSum / weights[i];
  }
  lambdaMax /= n;
  const CI = (lambdaMax - n) / (n - 1);
  const RI = SAATY_RI[n] || 1.49;
  const CR = CI / RI;
  return { CR, weights };
}

function buildConsistentMatrix(w) {
  const n = w.length;
  const matrix = Array.from({length: n}, () => Array(n).fill(1));
  for (let i=0; i<n; i++) {
    for (let j=0; j<n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const ratio = w[i]/w[j];
        const isAMore = ratio >= 1;
        const scale = Math.max(1, Math.min(9, Math.round(isAMore ? ratio : 1/ratio)));
        if (isAMore) {
          matrix[i][j] = scale;
          matrix[j][i] = 1/scale;
        } else {
          matrix[i][j] = 1/scale;
          matrix[j][i] = scale;
        }
      }
    }
  }
  return matrix;
}

const wIrdha = [2, 2, 3, 3, 8, 8, 7, 6, 6];
const wRizki = [3, 4, 3, 6, 5, 6, 3, 4, 4];

const crI = calculateCR(buildConsistentMatrix(wIrdha));
const crR = calculateCR(buildConsistentMatrix(wRizki));

console.log("Irdha CR:", crI.CR.toFixed(4));
console.log("Rizki CR:", crR.CR.toFixed(4));
