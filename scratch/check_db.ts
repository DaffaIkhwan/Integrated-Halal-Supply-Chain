import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const query = "stunning";
  const results = await prisma.kMSDocumentChunk.findMany({
    where: {
      chunk: { contains: query, mode: 'insensitive' }
    },
    take: 5
  });
  
  console.log(`Found ${results.length} results for "${query}"`);
  for (const r of results) {
    console.log(`- ${r.chunk.substring(0, 100)}...`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
