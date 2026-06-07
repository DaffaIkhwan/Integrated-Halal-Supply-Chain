/**
 * Verify CR values: Compare database TFN data with crisp Saaty calculation
 * to ensure the Excel file has correct input data and CR results.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// RI Table (Saaty, 1990)
const RI_TABLE: Record<number, number> = {
  1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

function calculateCR(matrix: number[][]) {
  const n = matrix.length;

  // Column sums
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // Normalize and get weights
  const normalizedMatrix = matrix.map(row => row.map((val, j) => val / colSums[j]));
  const weights = normalizedMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);

  // Aw
  const Aw = matrix.map(row => row.reduce((sum, val, j) => sum + val * weights[j], 0));

  // λmax
  const lambdaMax = Aw.reduce((sum, aw, i) => {
    if (weights[i] === 0) return sum;
    return sum + aw / weights[i];
  }, 0) / n;

  const CI = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
  const RI = RI_TABLE[n] || 1.49;
  const CR = RI === 0 ? 0 : CI / RI;

  return { lambdaMax, CI, CR, weights, RI, n };
}

async function verifyLevel(matrixType: string, label: string) {
  const entries = await prisma.pairwiseComparison.findMany({
    where: { matrixType },
    orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
  });

  if (entries.length === 0) {
    console.log(`  ⏭️ ${label}: Tidak ada data`);
    return;
  }

  const codes = Array.from(new Set(entries.map(e => e.rowCode))).sort();
  const n = codes.length;

  // Build TFN matrix from DB
  const tfnMatrix: number[][][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => [1, 1, 1])
  );
  for (const e of entries) {
    const i = codes.indexOf(e.rowCode);
    const j = codes.indexOf(e.colCode);
    if (i >= 0 && j >= 0) {
      tfnMatrix[i][j] = [e.tfnLow, e.tfnMid, e.tfnUp];
    }
  }

  // Method 1: Defuzzified matrix (CoA: (l+m+u)/3) — this is what the Excel uses
  const defuzzMatrix = tfnMatrix.map(row => row.map(tfn => (tfn[0] + tfn[1] + tfn[2]) / 3));
  const result1 = calculateCR(defuzzMatrix);

  // Method 2: Using midpoint only (m value)
  const midMatrix = tfnMatrix.map(row => row.map(tfn => tfn[1]));
  const result2 = calculateCR(midMatrix);

  // Method 3: The Excel approach — map TFN back to nearest Saaty scale
  // In the Excel, we store A/B direction + Saaty scale, then build crisp matrix from that
  // The "crisp Saaty" matrix is essentially the midpoint
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 ${label}`);
  console.log(`   Kriteria: ${codes.join(', ')} (n=${n})`);
  console.log(`${'─'.repeat(70)}`);
  
  // Print TFN matrix
  console.log(`\n   Matriks TFN dari Database (l, m, u):`);
  console.log(`   ${''.padStart(8)}${codes.map(c => c.padStart(22)).join('')}`);
  for (let i = 0; i < n; i++) {
    const row = tfnMatrix[i].map(tfn => `(${tfn[0].toFixed(2)},${tfn[1].toFixed(2)},${tfn[2].toFixed(2)})`).map(s => s.padStart(22)).join('');
    console.log(`   ${codes[i].padStart(6)}  ${row}`);
  }

  // Print defuzzified matrix
  console.log(`\n   Matriks Defuzzified (l+m+u)/3:`);
  console.log(`   ${''.padStart(8)}${codes.map(c => c.padStart(10)).join('')}`);
  for (let i = 0; i < n; i++) {
    const row = defuzzMatrix[i].map(v => v.toFixed(4).padStart(10)).join('');
    console.log(`   ${codes[i].padStart(6)}  ${row}`);
  }

  console.log(`\n   ┌──────────────────────────────────────────────────┐`);
  console.log(`   │ METODE 1: Defuzzified CoA (l+m+u)/3             │`);
  console.log(`   │   λmax = ${result1.lambdaMax.toFixed(6).padStart(12)}                         │`);
  console.log(`   │   CI    = ${result1.CI.toFixed(6).padStart(12)}                         │`);
  console.log(`   │   RI    = ${result1.RI.toFixed(2).padStart(12)}                         │`);
  console.log(`   │   CR    = ${result1.CR.toFixed(6).padStart(12)}                         │`);
  console.log(`   │   Status: ${result1.CR < 0.10 ? '✅ KONSISTEN (CR < 0.10)' : '❌ TIDAK KONSISTEN (CR ≥ 0.10)'}       │`);
  console.log(`   └──────────────────────────────────────────────────┘`);

  console.log(`   ┌──────────────────────────────────────────────────┐`);
  console.log(`   │ METODE 2: Midpoint (m only)                     │`);
  console.log(`   │   λmax = ${result2.lambdaMax.toFixed(6).padStart(12)}                         │`);
  console.log(`   │   CI    = ${result2.CI.toFixed(6).padStart(12)}                         │`);
  console.log(`   │   RI    = ${result2.RI.toFixed(2).padStart(12)}                         │`);
  console.log(`   │   CR    = ${result2.CR.toFixed(6).padStart(12)}                         │`);
  console.log(`   │   Status: ${result2.CR < 0.10 ? '✅ KONSISTEN (CR < 0.10)' : '❌ TIDAK KONSISTEN (CR ≥ 0.10)'}       │`);
  console.log(`   └──────────────────────────────────────────────────┘`);

  // Bobot
  console.log(`\n   Bobot (Defuzzified):`);
  for (let i = 0; i < n; i++) {
    console.log(`     ${codes[i]}: ${(result1.weights[i] * 100).toFixed(4)}%`);
  }

  // Verify reciprocal consistency in DB
  let recipErrors = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const val = defuzzMatrix[i][j];
      const recip = defuzzMatrix[j][i];
      const expected = 1 / val;
      const diff = Math.abs(recip - expected);
      if (diff > 0.01) {
        if (recipErrors === 0) console.log(`\n   ⚠️ Kesalahan Resiprokal ditemukan:`);
        console.log(`     ${codes[i]}↔${codes[j]}: a[${i}][${j}]=${val.toFixed(4)}, a[${j}][${i}]=${recip.toFixed(4)}, expected=${expected.toFixed(4)}, diff=${diff.toFixed(4)}`);
        recipErrors++;
      }
    }
  }
  if (recipErrors === 0) {
    console.log(`\n   ✅ Semua resiprokal valid (a[i][j] × a[j][i] ≈ 1)`);
  }

  // What the EXCEL file stores as input
  console.log(`\n   Input untuk Excel (Saaty crisp approx):`);
  let pairNo = 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const crispVal = defuzzMatrix[i][j];
      const isAMore = crispVal >= 1;
      const scale = isAMore ? crispVal : 1 / crispVal;
      const roundedScale = Math.max(1, Math.min(9, Math.round(scale)));
      const direction = isAMore ? 'A' : 'B';
      console.log(`     ${pairNo}. ${codes[i]} vs ${codes[j]}: defuzz=${crispVal.toFixed(4)} → ${direction} lebih penting, skala≈${roundedScale} (exact=${scale.toFixed(4)})`);
      pairNo++;
    }
  }

  return { result1, result2, codes, n };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  VERIFIKASI CR — Kuesioner 1 Fuzzy AHP                 ║');
  console.log('║  Membandingkan data DB dengan perhitungan manual        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Level 1
  await verifyLevel('LEVEL1_CP', 'LEVEL 1 — Antar Critical Point (CP1-CP9)');

  // Level 2 for each CP
  const cpIds = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
  for (const cpId of cpIds) {
    await verifyLevel(`LEVEL2_${cpId}`, `LEVEL 2 — Sub-Kriteria ${cpId}`);
  }

  console.log(`\n\n${'═'.repeat(70)}`);
  console.log('VERIFIKASI SELESAI');
  console.log(`${'═'.repeat(70)}`);

  // IMPORTANT NOTE about the Excel approach
  console.log(`
⚠️  CATATAN PENTING:

Data di database tersimpan sebagai TFN (l, m, u), bukan skala Saaty integer.
Di file Excel, data dikonversi ke skala Saaty terdekat (dibulatkan).
Ini bisa menyebabkan PERBEDAAN KECIL antara CR di Excel vs CR dari database.

Solusi yang lebih akurat:
- Excel menggunakan defuzzified value (l+m+u)/3 langsung sebagai matriks crisp
- BUKAN membulatkan ke skala Saaty integer terlebih dahulu

Perlu update script generate-ahp-excel.ts? (Y/N)
`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
