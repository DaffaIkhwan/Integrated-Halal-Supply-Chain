import fs from 'fs';
import path from 'path';
import { oaiVectorDB } from '../lib/db/vector';

const RAG_DIR = path.join(process.cwd(), 'public', 'RAG');

/**
 * Files to EXCLUDE from RAG ingest.
 * These contain DSS/risk score data that should ONLY be accessed
 * via the check_halal_risk tool (database), not via knowledge base.
 */
const EXCLUDED_FILES = [
  'Analisis Fuzzy AHP .pdf.txt',
  'Fuzzy AHP DSS Halal Suuply Chain (1).pdf.txt',
  'note file.pdf.txt',
];

/**
 * Extract a human-readable document title from filename
 * e.g. "1. UU No. 33 Tahun 2014 — Jaminan Produk Halal (...).pdf.txt"
 *   → "UU No. 33 Tahun 2014 — Jaminan Produk Halal"
 */
function extractDocTitle(filename: string): string {
  return filename
    .replace(/\.pdf\.txt$/, '')
    .replace(/\.pdf$/, '')
    .replace(/\.txt$/, '')
    // Remove leading number + dot
    .replace(/^\d+\.\s*/, '')
    // Remove parenthetical info
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    // Remove trailing category codes like "A1 · UU JPH"
    .replace(/\s+[A-Z]\d+\s*·.*$/, '')
    .trim();
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  RAG Semantic Ingest — Recursive Chunking Engine');
  console.log('═══════════════════════════════════════════════════');

  if (!fs.existsSync(RAG_DIR)) {
    console.error(`Folder tidak ditemukan: ${RAG_DIR}`);
    return;
  }

  try {
    console.log('\n🗑️  Menghapus data lama dari tabel oai...');
    const { query } = await import('../lib/db/pg');
    await query('TRUNCATE TABLE "oai" RESTART IDENTITY');
    console.log('✅ Data lama berhasil dihapus.');
  } catch (error) {
    console.error('❌ Gagal menghapus data lama:', error);
  }

  const allFiles = fs.readdirSync(RAG_DIR).filter(file => file.endsWith('.txt'));
  const files = allFiles.filter(file => !EXCLUDED_FILES.includes(file));
  const excluded = allFiles.filter(file => EXCLUDED_FILES.includes(file));

  console.log(`\n📂 Total file TXT: ${allFiles.length}`);
  console.log(`✅ Akan di-ingest: ${files.length}`);
  console.log(`🚫 Di-exclude (DSS/non-regulasi): ${excluded.length}`);
  for (const ex of excluded) {
    console.log(`   ⊘ ${ex}`);
  }

  // Load CP metadata for keyword matching
  const { HALAL_CRITICAL_POINTS } = await import('../lib/dss/fuzzyAHP');
  const cpWeights = HALAL_CRITICAL_POINTS;

  let totalChunks = 0;

  for (const file of files) {
    const docTitle = extractDocTitle(file);
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 ${file}`);
    console.log(`   Judul: ${docTitle}`);

    const filePath = path.join(RAG_DIR, file);
    const text = fs.readFileSync(filePath, 'utf-8').trim();

    if (!text) {
      console.warn(`   ⚠️  Tidak ada teks. Lewati.`);
      continue;
    }

    try {
      // Semantic chunking with context header
      const chunks = oaiVectorDB.chunkText(text, 'semantic', `Sumber: ${docTitle}`);
      console.log(`   📦 ${chunks.length} chunks (teks: ${text.length} chars)`);

      // Show chunk size distribution
      const sizes = chunks.map(c => c.length);
      const avgSize = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
      const minSize = Math.min(...sizes);
      const maxSize = Math.max(...sizes);
      console.log(`   📊 Ukuran chunk: min=${minSize}, avg=${avgSize}, max=${maxSize}`);

      let processed = 0;
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        // Keyword matching for CP metadata tagging
        let matchedCP: any = null;
        let maxMatches = 0;

        for (const cp of cpWeights) {
          const chunkLower = chunk.toLowerCase();
          const matchCount = cp.keywords.filter((kw: string) => chunkLower.includes(kw)).length;
          if (matchCount > maxMatches) {
            maxMatches = matchCount;
            matchedCP = cp;
          }
        }

        const metadata = {
          source: file.replace('.txt', '').replace('.pdf', ''),
          documentTitle: docTitle,
          documentType: 'regulasi',
          chunkingMethod: 'semantic',
          criticalPoint: matchedCP ? matchedCP.id : null,
          cpName: matchedCP ? matchedCP.name : null,
        };

        await oaiVectorDB.addChunks([chunk], metadata);
        processed++;
      }

      totalChunks += processed;
      console.log(`   ✅ ${processed} chunks berhasil disimpan`);
    } catch (error) {
      console.error(`   ❌ Gagal memproses:`, error);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Selesai! Total ${totalChunks} chunks dari ${files.length} dokumen.`);
  console.log(`🚫 ${excluded.length} file DSS/non-regulasi di-exclude.`);
  console.log('═══════════════════════════════════════════════════');
}

main().catch(console.error);
