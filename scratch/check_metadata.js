const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const oaiRec = await prisma.oai.findFirst();
  console.log('OAI metadata:', oaiRec?.metadata);

  const docRec = await prisma.halalDocument.findFirst();
  console.log('Doc metadata:', docRec?.metadata);
}

main().finally(() => prisma.$disconnect());
