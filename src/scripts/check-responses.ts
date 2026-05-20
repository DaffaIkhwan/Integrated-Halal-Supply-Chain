import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.questionnaireResponse.findMany({
    where: {
      questionnaireType: "risiko",
    },
    select: {
      id: true,
      cpId: true,
      notes: true,
      respondentName: true,
      respondentEmail: true,
    }
  });
  console.log("RISIKO RESPONSES:", JSON.stringify(res, null, 2));

  const res2 = await prisma.questionnaireResponse.findMany({
    where: {
      questionnaireType: "aktual",
    },
    select: {
      id: true,
      cpId: true,
      respondentInfo: true,
      respondentName: true,
      respondentEmail: true,
    }
  });
  console.log("AKTUAL RESPONSES:", JSON.stringify(res2, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
