import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cattle = await prisma.cattle.findMany();
  console.log("CATTLE:", JSON.stringify(cattle, null, 2));
  
  const batches = await prisma.halalBatch.findMany({
    include: { cattle: true }
  });
  console.log("BATCHES:", JSON.stringify(batches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
