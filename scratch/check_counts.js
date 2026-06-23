const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB for 'halal' or 'penyembelihan'...");
  const halalCount = await prisma.oai.count({
    where: { chunk: { contains: 'halal', mode: 'insensitive' } }
  });
  console.log(`Chunks containing 'halal': ${halalCount}`);

  const penyembelihanCount = await prisma.oai.count({
    where: { chunk: { contains: 'penyembelihan', mode: 'insensitive' } }
  });
  console.log(`Chunks containing 'penyembelihan': ${penyembelihanCount}`);

  const prosedurCount = await prisma.oai.count({
    where: { chunk: { contains: 'prosedur', mode: 'insensitive' } }
  });
  console.log(`Chunks containing 'prosedur': ${prosedurCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
