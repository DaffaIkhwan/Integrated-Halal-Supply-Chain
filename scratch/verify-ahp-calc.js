// Verify Fuzzy AHP calculations step by step
// This script reads the pairwise matrix from DB and recalculates everything manually

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Core Fuzzy AHP Functions (replicated for verification) ───

function defuzzify(tfn) {
  return (tfn[0] + tfn[1] + tfn[2]) / 3;
}

function sumTFNs(tfns) {
  return tfns.reduce((acc, val) => {
    return [acc[0] + (val[0] || 0), acc[1] + (val[1] || 0), acc[2] + (val[2] || 0)];
  }, [0, 0, 0]);
}

function calculateFSE(matrix) {
  const rowSums = matrix.map(row => sumTFNs(row));
  const totalSum = sumTFNs(rowSums);
  const reverseTotal = [1 / totalSum[2], 1 / totalSum[1], 1 / totalSum[0]];
  
  return rowSums.map(rowSum => [
    rowSum[0] * reverseTotal[0],
    rowSum[1] * reverseTotal[1],
    rowSum[2] * reverseTotal[2],
  ]);
}

function normalizeWeights(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 1 / weights.length);
  return weights.map(w => w / sum);
}

function calculateCR(matrix) {
  const n = matrix.length;
  const RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };
  
  // Defuzzify matrix
  const crispMatrix = matrix.map(row => row.map(cell => defuzzify(cell)));
  
  // Column sums
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) colSums[j] += crispMatrix[i][j];
  }
  
  // Normalized weights
  const crispWeights = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) rowSum += crispMatrix[i][j] / colSums[j];
    crispWeights[i] = rowSum / n;
  }
  
  // Aw = crispMatrix × crispWeights
  const Aw = crispMatrix.map(row => row.reduce((sum, val, j) => sum + val * crispWeights[j], 0));
  
  // λmax
  const lambdaMax = Aw.reduce((sum, aw_i, i) => {
    if (crispWeights[i] === 0) return sum;
    return sum + aw_i / crispWeights[i];
  }, 0) / n;
  
  const ci = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
  const ri = RI_TABLE[n] || 1.49;
  const cr = ri === 0 ? 0 : ci / ri;
  
  return { lambdaMax, ci, cr, isConsistent: cr < 0.10, crispWeights };
}

async function verify(matrixType, label) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  VERIFIKASI: ${label} (${matrixType})`);
  console.log(`${'═'.repeat(70)}`);
  
  const entries = await prisma.pairwiseComparison.findMany({
    where: { matrixType },
    orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
  });
  
  if (entries.length === 0) {
    console.log('  ⚠ Tidak ada data matriks.');
    return;
  }
  
  // Extract codes
  const codeSet = new Set();
  for (const e of entries) { codeSet.add(e.rowCode); codeSet.add(e.colCode); }
  const codes = Array.from(codeSet).sort();
  const n = codes.length;
  
  console.log(`\n  Ukuran matriks: ${n}×${n}`);
  console.log(`  Kode: ${codes.join(', ')}`);
  console.log(`  Jumlah entri DB: ${entries.length}`);
  
  // Build matrix
  const matrix = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push([1, 1, 1]);
    matrix.push(row);
  }
  
  for (const entry of entries) {
    const i = codes.indexOf(entry.rowCode);
    const j = codes.indexOf(entry.colCode);
    if (i >= 0 && j >= 0) {
      matrix[i][j] = [entry.tfnLow, entry.tfnMid, entry.tfnUp];
    }
  }
  
  // ─── Step 1: Pairwise Comparison Matrix (Crisp = defuzzified) ───
  console.log(`\n  ── STEP 1: Matriks Pairwise Comparison (Crisp) ──`);
  const header = ['        '].concat(codes.map(c => c.padStart(8)));
  console.log(header.join(''));
  for (let i = 0; i < n; i++) {
    const row = [codes[i].padEnd(8)];
    for (let j = 0; j < n; j++) {
      row.push(defuzzify(matrix[i][j]).toFixed(4).padStart(8));
    }
    console.log(row.join(''));
  }
  
  // ─── Verify reciprocal symmetry: M[i][j] × M[j][i] ≈ 1 ───
  console.log(`\n  ── VERIFIKASI RESIPROKAL (M[i][j] × M[j][i] ≈ 1) ──`);
  let reciprocalOk = true;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const prod_l = matrix[i][j][0] * matrix[j][i][2]; // l × u'
      const prod_m = matrix[i][j][1] * matrix[j][i][1]; // m × m'
      const prod_u = matrix[i][j][2] * matrix[j][i][0]; // u × l'
      if (Math.abs(prod_m - 1) > 0.01) {
        console.log(`  ❌ ${codes[i]} vs ${codes[j]}: m×m' = ${prod_m.toFixed(4)} (seharusnya ≈ 1)`);
        reciprocalOk = false;
      }
    }
  }
  if (reciprocalOk) console.log('  ✅ Semua resiprokal valid (m×m\' ≈ 1)');
  
  // ─── Step 2: Row Sums ───
  const rowSums = matrix.map(row => sumTFNs(row));
  console.log(`\n  ── STEP 2: Jumlah Baris (Row Sums) ──`);
  for (let i = 0; i < n; i++) {
    const [l, m, u] = rowSums[i];
    console.log(`  ${codes[i]}: [${l.toFixed(4)}, ${m.toFixed(4)}, ${u.toFixed(4)}]`);
  }
  
  const totalSum = sumTFNs(rowSums);
  console.log(`  TOTAL: [${totalSum[0].toFixed(4)}, ${totalSum[1].toFixed(4)}, ${totalSum[2].toFixed(4)}]`);
  
  // ─── Step 3: FSE ───
  const fse = calculateFSE(matrix);
  console.log(`\n  ── STEP 3: Fuzzy Synthetic Extent (FSE) ──`);
  for (let i = 0; i < n; i++) {
    const [l, m, u] = fse[i];
    console.log(`  ${codes[i]}: [${l.toFixed(4)}, ${m.toFixed(4)}, ${u.toFixed(4)}]`);
  }
  
  // Verify FSE sum ≈ 1
  const fseSum = sumTFNs(fse);
  console.log(`  FSE SUM: [${fseSum[0].toFixed(4)}, ${fseSum[1].toFixed(4)}, ${fseSum[2].toFixed(4)}]`);
  
  // ─── Step 4: Defuzzification (Crisp) ───
  const crispValues = fse.map(f => defuzzify(f));
  console.log(`\n  ── STEP 4: Defuzzifikasi (CoA) ──`);
  for (let i = 0; i < n; i++) {
    console.log(`  ${codes[i]}: Crisp = ${crispValues[i].toFixed(6)}`);
  }
  console.log(`  SUM Crisp: ${crispValues.reduce((a, b) => a + b, 0).toFixed(6)}`);
  
  // ─── Step 5: Normalized Weights ───
  const weights = normalizeWeights(crispValues);
  console.log(`\n  ── STEP 5: Bobot Normalisasi (Global Weight) ──`);
  let sumW = 0;
  for (let i = 0; i < n; i++) {
    console.log(`  ${codes[i]}: W = ${weights[i].toFixed(6)} (${(weights[i] * 100).toFixed(2)}%)`);
    sumW += weights[i];
  }
  console.log(`  SUM W: ${sumW.toFixed(6)} (harus = 1.000000)`);
  
  // ─── Step 6: Consistency Ratio ───
  const cr = calculateCR(matrix);
  console.log(`\n  ── STEP 6: Uji Konsistensi (CR) ──`);
  console.log(`  λmax     = ${cr.lambdaMax.toFixed(6)}`);
  console.log(`  CI       = ${cr.ci.toFixed(6)}`);
  console.log(`  CR       = ${cr.cr.toFixed(6)}`);
  console.log(`  Status   = ${cr.isConsistent ? '✅ KONSISTEN (CR < 0.10)' : '❌ TIDAK KONSISTEN (CR ≥ 0.10)'}`);
  
  // ─── Cross-check with DB CriticalPoint weights ───
  if (matrixType === 'LEVEL1_CP') {
    console.log(`\n  ── CROSS-CHECK: DB CriticalPoint.globalWeight ──`);
    const cps = await prisma.criticalPoint.findMany({ orderBy: { id: 'asc' } });
    for (const cp of cps) {
      const idx = codes.indexOf(cp.id);
      if (idx >= 0) {
        const calcW = weights[idx];
        const dbW = cp.globalWeight;
        const diff = Math.abs(calcW - dbW);
        const status = diff < 0.0001 ? '✅' : `⚠ Δ=${diff.toFixed(6)}`;
        console.log(`  ${cp.id}: DB=${dbW.toFixed(6)} vs Calc=${calcW.toFixed(6)} ${status}`);
      } else {
        console.log(`  ${cp.id}: DB=${cp.globalWeight.toFixed(6)} (tidak ada di matriks)`);
      }
    }
  }
  
  return { codes, matrix, fse, crispValues, weights, cr };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   CROSSCHECK FUZZY AHP - SEMUA LEVEL                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  // Level 1: Antar CP
  await verify('LEVEL1_CP', 'Antar CP — Level 1');
  
  // KU Level
  await verify('KU_LEVEL', 'Kriteria Umum (KU)');
  
  // Level 2: Sub-Kriteria per CP
  for (let i = 1; i <= 9; i++) {
    await verify(`LEVEL2_CP${i}`, `Sub-Kriteria CP${i}`);
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  VERIFIKASI SELESAI');
  console.log(`${'═'.repeat(70)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
