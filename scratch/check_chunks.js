const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const count = await p.oai.count();
  console.log('Total chunks in oai table:', count);
  
  const sample = await p.oai.findMany({ take: 3, select: { chunk: true } });
  sample.forEach((s, i) => {
    console.log(`Chunk ${i}: ${s.chunk.length} chars`);
    console.log(`  Preview: ${s.chunk.substring(0, 150)}...`);
  });

  const result = await p.$queryRawUnsafe('SELECT AVG(LENGTH(chunk)) as avg_len, MAX(LENGTH(chunk)) as max_len, SUM(LENGTH(chunk)) as total_len FROM oai');
  console.log('Avg chunk length:', result[0].avg_len);
  console.log('Max chunk length:', result[0].max_len);
  console.log('Total chars in all chunks:', result[0].total_len);
  
  await p.$disconnect();
})().catch(e => { console.error('Error:', e.message); process.exit(0); });
