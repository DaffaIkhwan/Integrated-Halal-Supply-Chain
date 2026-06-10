import { prisma } from '../lib/db/client';
import { loadMatrixFromDB, calculateConsistencyRatio } from '../lib/dss/fuzzyAHP';

async function main() {
  const allMatrixTypes = [
      { id: 'KU_LEVEL', label: 'Kriteria Umum (KU)' },
      { id: 'LEVEL1_CP', label: 'Antar CP — Level 1' },
      { id: 'LEVEL2_CP1', label: 'Sub-Kriteria CP1' },
      { id: 'LEVEL2_CP2', label: 'Sub-Kriteria CP2' },
      { id: 'LEVEL2_CP3', label: 'Sub-Kriteria CP3' },
      { id: 'LEVEL2_CP4', label: 'Sub-Kriteria CP4' },
      { id: 'LEVEL2_CP5', label: 'Sub-Kriteria CP5' },
      { id: 'LEVEL2_CP6', label: 'Sub-Kriteria CP6' },
      { id: 'LEVEL2_CP7', label: 'Sub-Kriteria CP7' },
      { id: 'LEVEL2_CP8', label: 'Sub-Kriteria CP8' },
      { id: 'LEVEL2_CP9', label: 'Sub-Kriteria CP9' },
  ];
  for (const mt of allMatrixTypes) {
    try {
      const { matrix: m } = await loadMatrixFromDB(mt.id);
      const mCr = calculateConsistencyRatio(m);
      console.log(mt.id, 'SUCCESS', mCr.lambdaMax);
    } catch (e: any) {
      console.error(mt.id, 'ERROR:', e.message);
    }
  }
}
main().catch(console.error);
