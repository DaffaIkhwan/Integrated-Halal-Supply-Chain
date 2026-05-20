import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const risikos = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: "risiko", cpId: "CP1" }
  });
  const aktuals = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: "aktual", cpId: "CP1" }
  });

  console.log("Found", risikos.length, "risiko responses and", aktuals.length, "aktual responses");
  
  for (const b of aktuals) {
    const batchCode = b.respondentInfo && typeof b.respondentInfo === 'object' ? (b.respondentInfo as any)["CP1_batch"] : "";
    const isFilled = risikos.some(r => {
      const notes = r.notes && typeof r.notes === 'object' ? (r.notes as any) : {};
      const match = notes.aktualResponseId === b.id;
      console.log(`Comparing r.id=${r.id} notes.aktualResponseId=${notes.aktualResponseId} with b.id=${b.id} (${batchCode}) -> Match: ${match}`);
      return match;
    });
    console.log(`Batch ${batchCode} (id: ${b.id}) -> isFilled: ${isFilled}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
