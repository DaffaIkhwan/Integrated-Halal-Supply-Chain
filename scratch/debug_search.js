const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check what embedding model was used
  const sample = await prisma.oai.findFirst({
    select: { metadata: true, chunk: true }
  });
  console.log('=== Sample metadata ===');
  console.log(JSON.stringify(sample?.metadata, null, 2));
  console.log('Chunk preview:', sample?.chunk?.substring(0, 100));

  // Check total records
  const total = await prisma.oai.count();
  console.log('\n=== Total oai records:', total);

  // Test simple text search for "penyembelihan"
  const textResults = await prisma.oai.findMany({
    where: { chunk: { contains: 'penyembelihan', mode: 'insensitive' } },
    take: 3,
    select: { id: true, chunk: true, metadata: true }
  });
  console.log('\n=== Text search "penyembelihan" ===');
  console.log('Found:', textResults.length);
  textResults.forEach((r, i) => {
    console.log(`\n--- Result ${i + 1} ---`);
    console.log('Chunk:', r.chunk?.substring(0, 200));
    console.log('CP:', r.metadata?.criticalPoint);
  });

  // Test for "stunning"
  const stunningResults = await prisma.oai.findMany({
    where: { chunk: { contains: 'stunning', mode: 'insensitive' } },
    take: 2,
    select: { chunk: true }
  });
  console.log('\n=== Text search "stunning" ===');
  console.log('Found:', stunningResults.length);
  stunningResults.forEach((r, i) => {
    console.log(`Result ${i + 1}:`, r.chunk?.substring(0, 150));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
