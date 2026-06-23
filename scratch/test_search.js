const { searchSimilarChunks } = require('./src/lib/actions/search');

async function test() {
  const res = await searchSimilarChunks("cara stunning", 2);
  console.log(res);
}
test().catch(console.error);
