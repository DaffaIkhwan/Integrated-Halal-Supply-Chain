/**
 * Recalculate All Fuzzy AHP Weights from Pairwise Matrices
 * 
 * Reads PairwiseComparison table → computes FSE → updates:
 *  - CriticalPoint.globalWeight (Level 1)
 *  - CriteriaWeight.weight (Level 2 per CP)
 * 
 * Run: npx tsx src/scripts/recalculate-weights.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  loadMatrixFromDB,
  calculateWeightsFromMatrix,
  calculateConsistencyRatio,
  getRiskLevel,
} from '../lib/dss/fuzzyAHP';

// Override the prisma instance used by fuzzyAHP
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Recalculating ALL Fuzzy AHP weights from pairwise matrices...\n');

  // ── Step 1: Level 1 (Inter-CP) ──
  console.log('━━━ LEVEL 1: Bobot antar Critical Points ━━━');
  const { matrix: l1Matrix, codes: l1Codes } = await loadMatrixFromDB('LEVEL1_CP');
  const l1Results = calculateWeightsFromMatrix(l1Matrix, l1Codes);
  const l1Weights = l1Results.map((r) => r.weight);
  const l1CR = calculateConsistencyRatio(l1Matrix);

  console.log(`  Criteria: ${l1Codes.join(', ')}`);
  console.log(`  CR = ${l1CR.cr} (${l1CR.isConsistent ? '✅ Konsisten' : '⚠️ TIDAK Konsisten'})`);
  console.log('  Weights:');

  for (const r of l1Results) {
    console.log(`    ${r.code}: ${r.weight.toFixed(4)}`);
    await prisma.criticalPoint.update({
      where: { id: r.code },
      data: { globalWeight: r.weight },
    });
  }

  // ── Step 2: Level 2 (Sub-criteria per CP) ──
  console.log('\n━━━ LEVEL 2: Bobot sub-kriteria per CP ━━━');

  const cpIds = l1Codes; // CP1..CP10
  for (const cpId of cpIds) {
    const matrixType = `LEVEL2_${cpId}`;
    try {
      const { matrix, codes } = await loadMatrixFromDB(matrixType);
      const results = calculateWeightsFromMatrix(matrix, codes);
      const weights = results.map((r) => r.weight);
      const cr = calculateConsistencyRatio(matrix);

      console.log(`\n  ${cpId} (${codes.length} kriteria):`);
      console.log(`    CR = ${cr.cr} (${cr.isConsistent ? '✅' : '⚠️'})`);

      for (const r of results) {
        console.log(`    ${r.code}: ${r.weight.toFixed(4)}`);
        await prisma.criteriaWeight.updateMany({
          where: { criticalPointId: cpId, criteriaCode: r.code },
          data: { weight: r.weight },
        });
      }
    } catch {
      console.log(`  ${cpId}: ⏭️ Matriks Level 2 belum ada — skip`);
    }
  }

  // ── Step 3: Summary ──
  console.log('\n━━━ SUMMARY ━━━');
  const updatedCPs = await prisma.criticalPoint.findMany({
    include: { criteriaWeights: { orderBy: { criteriaCode: 'asc' } } },
    orderBy: { id: 'asc' },
  });

  for (const cp of updatedCPs) {
    console.log(`\n${cp.id} ${cp.name}: globalWeight = ${cp.globalWeight.toFixed(4)}`);
    for (const cw of cp.criteriaWeights) {
      console.log(`  ${cw.criteriaCode} ${cw.criteriaName}: ${cw.weight.toFixed(4)}`);
    }
  }

  console.log('\n🎉 All weights recalculated and saved to database!');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
