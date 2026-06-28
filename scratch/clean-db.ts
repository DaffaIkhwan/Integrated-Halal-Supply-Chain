import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all oai records...');
  const records = await prisma.oai.findMany({
    select: { id: true, metadata: true }
  });

  let count = 0;
  for (const record of records) {
    if (record.metadata) {
      let metaStr = typeof record.metadata === 'string' ? record.metadata : JSON.stringify(record.metadata);
      if (metaStr.includes('Fuzzy AHP') || metaStr.includes('note file') || metaStr.includes('Analisis Fuzzy AHP')) {
        await prisma.oai.delete({ where: { id: record.id } });
        console.log(`Deleted record ${record.id} with metadata ${metaStr.substring(0, 50)}`);
        count++;
      }
    }
  }
  console.log(`Deleted ${count} records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
