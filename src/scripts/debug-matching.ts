import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cpId = "CP1";
  
  // Fetch aktual batches
  const aktualResponses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: "aktual", cpId },
    orderBy: { createdAt: "desc" }
  });
  
  // Fetch risiko responses
  const risikoResponses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: "risiko", cpId },
    orderBy: { createdAt: "desc" }
  });
  
  console.log(`FOUND ${aktualResponses.length} aktual responses for ${cpId}`);
  console.log(`FOUND ${risikoResponses.length} risiko responses for ${cpId}`);
  
  aktualResponses.forEach(b => {
    const batchCode = b.respondentInfo?.[`${cpId}_batch`] || b.respondentInfo?.[`${cpId}_kodeTernak`] || "";
    const isFilled = risikoResponses.some(r => {
      const match = (r.notes as any)?.aktualResponseId === b.id;
      console.log(`Comparing r.notes.aktualResponseId (${(r.notes as any)?.aktualResponseId}) with b.id (${b.id}) -> Match: ${match}`);
      return match;
    });
    console.log(`Batch ${batchCode} (id: ${b.id}) -> isFilled: ${isFilled}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
