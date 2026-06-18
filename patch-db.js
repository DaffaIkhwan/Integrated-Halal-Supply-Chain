const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALL_CP_CODES = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
const expectedPairs = [];
for (let i = 0; i < ALL_CP_CODES.length; i++) {
  for (let j = i + 1; j < ALL_CP_CODES.length; j++) {
    expectedPairs.push(`${ALL_CP_CODES[i]}_vs_${ALL_CP_CODES[j]}`);
  }
}

async function main() {
  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: 'pembobotan' }
  });

  let updatedCount = 0;

  for (const response of responses) {
    if (!response.answers) continue;
    
    const ans = response.answers;
    let modified = false;

    if (ans.type === 'CP_LEVEL' && ans.comparisons) {
      const currentComparisons = ans.comparisons;
      let missingCount = 0;

      for (const pair of expectedPairs) {
        if (!(pair in currentComparisons)) {
          // Add missing pair with slider value 0 (which maps to AHP Scale 1 = Sama Penting)
          currentComparisons[pair] = 0;
          missingCount++;
          modified = true;
        }
      }
      
      if (missingCount > 0) {
        console.log(`Response ID ${response.id}: patched ${missingCount} missing pairs.`);
      }
    }

    if (modified) {
      await prisma.questionnaireResponse.update({
        where: { id: response.id },
        data: { answers: ans }
      });
      updatedCount++;
    }
  }

  console.log(`Finished patching. Updated ${updatedCount} responses.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
