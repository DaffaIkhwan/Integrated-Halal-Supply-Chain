const fs = require('fs');

const data = JSON.parse(fs.readFileSync('temp_raw.json'));

const SAATY_RI = { 1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };

function extractCode(name) {
  const match = name.match(/^(CP\d+)/);
  return match ? match[1] : null;
}

function calculateCR(matrix) {
  const n = matrix.length;
  // sum columns
  const colSums = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      colSums[j] += matrix[i][j];
    }
  }

  // normalize
  const normalized = Array.from({length: n}, () => Array(n).fill(0));
  const weights = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      normalized[i][j] = matrix[i][j] / colSums[j];
      weights[i] += normalized[i][j];
    }
    weights[i] /= n;
  }

  // lambda max
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += matrix[i][j] * weights[j];
    }
    lambdaMax += rowSum / weights[i];
  }
  lambdaMax /= n;

  const CI = (lambdaMax - n) / (n - 1);
  const RI = SAATY_RI[n] || 1.49;
  const CR = CI / RI;

  return { lambdaMax, CI, CR, weights, matrix };
}

function buildMatrix(rows, codes) {
  const n = codes.length;
  const matrix = Array.from({length: n}, () => Array(n).fill(1));
  
  for (const row of rows) {
    if (!Array.isArray(row) || typeof row[0] !== 'number') continue;
    const codeA = extractCode(String(row[1]));
    const codeB = extractCode(String(row[2]));
    if (!codeA || !codeB || !codes.includes(codeA) || !codes.includes(codeB)) continue;
    
    const i = codes.indexOf(codeA);
    const j = codes.indexOf(codeB);
    
    // new format: [No, KritA, KritB, Skala, Direction]
    const scaleRaw = Number(row[3]);
    let scale = isNaN(scaleRaw) ? 1 : scaleRaw;
    const direction = String(row[4] || '').trim(); // e.g. "← CP1" or "→ CP2"
    
    // Direction points to the more important one
    let moreImp = 'A';
    if (direction.includes('→')) {
      moreImp = 'B';
    } else if (direction.includes('←')) {
      moreImp = 'A';
    }
    
    if (scale === 1) {
      matrix[i][j] = 1;
      matrix[j][i] = 1;
    } else if (moreImp === 'A') {
      matrix[i][j] = scale;
      matrix[j][i] = 1 / scale;
    } else {
      matrix[i][j] = 1 / scale;
      matrix[j][i] = scale;
    }
  }
  return matrix;
}

const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9']; 

['Irdha', 'Rizki'].forEach(person => {
  const m9 = buildMatrix(data[person], codes);
  const cr9 = calculateCR(m9);

  console.log(`\n=== ${person} ===`);
  console.log(`CR (9 criteria): ${cr9.CR.toFixed(4)} ${cr9.CR < 0.1 ? '✅' : '❌'}`);
  console.log("Weights:");
  codes.forEach((c, i) => console.log(`  ${c}: ${(cr9.weights[i]*100).toFixed(2)}%`));
});
