import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sampleKU = await prisma.questionnaireResponse.findFirst({
    where: { questionnaireType: 'pembobotan' }
  });
  console.log("Sample KU/CP:", sampleKU);
  
  const sampleCP3 = await prisma.questionnaireResponse.findFirst({
    where: { questionnaireType: 'pembobotan', cpId: 'CP3' }
  });
  console.log("Sample CP3:", sampleCP3);
  
  const sampleCP9 = await prisma.questionnaireResponse.findFirst({
    where: { questionnaireType: 'pembobotan', cpId: 'CP9' }
  });
  console.log("Sample CP9:", sampleCP9);
}

main().catch(console.error).finally(() => prisma.$disconnect());
