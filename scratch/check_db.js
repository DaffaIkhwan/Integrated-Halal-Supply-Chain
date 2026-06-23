import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const queries = ["stunning", "sapi"];
  for (const query of queries) {
    const results = await prisma.kMSDocumentChunk.findMany({
      where: {
        chunk: { contains: query, mode: 'insensitive' }
      },
      take: 5
    });
    console.log(`Found ${results.length} results for "${query}"`);
    for (const r of results) {
      console.log(`- [${r.id}] ${r.chunk.substring(0, 100)}...`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
