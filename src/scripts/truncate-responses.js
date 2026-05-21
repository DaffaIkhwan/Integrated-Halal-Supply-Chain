const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.questionnaireResponse.deleteMany({});
  console.log('Deleted:', result.count, 'records');
  await p.$disconnect();
}

main().catch(e => { console.error(e); p.$disconnect(); });
