import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const responses = await prisma.questionnaireResponse.findMany({
    select: {
      id: true,
      questionnaireType: true,
      cpId: true,
      respondentEmail: true,
      respondentInfo: true,
      notes: true,
    }
  });
  console.log(JSON.stringify(responses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
