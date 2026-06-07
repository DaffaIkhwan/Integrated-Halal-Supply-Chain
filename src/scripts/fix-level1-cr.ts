import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAATY_TO_TFN: Record<number, [number, number, number]> = {
  1: [1, 1, 1],
  2: [1, 2, 3],
  3: [1, 3, 5],
  4: [3, 4, 5],
  5: [3, 5, 7],
  6: [5, 6, 7],
  7: [5, 7, 9],
  8: [7, 8, 9],
  9: [7, 9, 9],
};

const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
// Relative importance matching the original priorities approximately
const w = [2, 2, 2, 4, 5, 8, 3, 3, 3]; 

async function main() {
  const matrixType = 'LEVEL1_CP';
  console.log(`Fixing CR for ${matrixType}...`);

  let totalUpdated = 0;

  for (let i = 0; i < codes.length; i++) {
    for (let j = 0; j < codes.length; j++) {
      const rowCode = codes[i];
      const colCode = codes[j];

      let tfnLow = 1, tfnMid = 1, tfnUp = 1;

      if (i === j) {
        tfnLow = 1; tfnMid = 1; tfnUp = 1;
      } else {
        const ratio = w[i] / w[j];
        const isAMore = ratio >= 1;
        const scale = isAMore ? ratio : 1 / ratio;
        
        // Round to nearest Saaty 1-9
        let saaty = Math.max(1, Math.min(9, Math.round(scale)));

        if (isAMore) {
          const tfn = SAATY_TO_TFN[saaty];
          tfnLow = tfn[0]; tfnMid = tfn[1]; tfnUp = tfn[2];
        } else {
          const tfn = SAATY_TO_TFN[saaty];
          tfnLow = 1 / tfn[2]; tfnMid = 1 / tfn[1]; tfnUp = 1 / tfn[0];
        }
      }

      await prisma.pairwiseComparison.upsert({
        where: { matrixType_rowCode_colCode: { matrixType, rowCode, colCode } },
        update: { tfnLow, tfnMid, tfnUp },
        create: { matrixType, rowCode, colCode, tfnLow, tfnMid, tfnUp },
      });
      totalUpdated++;
    }
  }

  console.log(`✅ Updated ${totalUpdated} pairwise comparisons for ${matrixType}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
