import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: "aktual" },
    select: {
      id: true,
      cpId: true,
      respondentName: true,
      files: true,
    }
  });
  console.log(JSON.stringify(responses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
