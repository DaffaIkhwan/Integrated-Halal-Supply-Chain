import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.questionnaireResponse.deleteMany({ 
    where: { 
      questionnaireType: 'pembobotan', 
      respondentName: 'Anonim' 
    } 
  });
  console.log('Deleted:', res.count);
}
main();
