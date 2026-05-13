import fs from 'fs';
import path from 'path';
import { oaiVectorDB } from '../lib/db/vector';

const RAG_DIR = path.join(process.cwd(), 'public', 'RAG');

async function main() {
  console.log('Memulai proses membaca dan chunking dokumen Teks dari public/RAG...');

  if (!fs.existsSync(RAG_DIR)) {
    console.error(`Folder tidak ditemukan: ${RAG_DIR}`);
    return;
  }

  try {
    console.log('Menghapus data lama dari tabel oai...');
    const { query } = await import('../lib/db/pg');
    await query('TRUNCATE TABLE "oai" RESTART IDENTITY');
    console.log('Data lama berhasil dihapus.');
  } catch (error) {
    console.error('Gagal menghapus data lama:', error);
  }

  const files = fs.readdirSync(RAG_DIR).filter(file => file.endsWith('.txt'));
  console.log(`Ditemukan ${files.length} file TXT.`);

  for (const file of files) {
    console.log(`\nMemproses: ${file}...`);
    const filePath = path.join(RAG_DIR, file);
    const text = fs.readFileSync(filePath, 'utf-8').trim();

    if (!text) {
      console.warn(`Tidak ada teks yang dapat dibaca pada ${file}. Lewati.`);
      continue;
    }

    try {
      console.log(`Mengekstrak dan menyimpan embeddings untuk ${file} (Panjang Teks: ${text.length} karakter)...`);

      // Ambil metadata CP untuk keyword matching
      const { HALAL_CRITICAL_POINTS } = await import('../lib/dss/fuzzyAHP');
      const cpWeights = HALAL_CRITICAL_POINTS;

      // Chunk file secara manual
      const chunks = oaiVectorDB.chunkText(text, 'paragraph');
      console.log(`Ditemukan ${chunks.length} chunks. Melakukan mapping Fuzzy AHP...`);

      let processed = 0;
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        // Simple Keyword Matching untuk mapping Chunk ke Critical Point (CP)
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
          source: file.replace('.txt', ''),
          documentType: 'PDF',
          criticalPoint: matchedCP ? matchedCP.id : null,
          cpName: matchedCP ? matchedCP.name : null,
        };

        // Tambahkan ke database satu persatu (tiap chunk metadata berbeda)
        await oaiVectorDB.addChunks([chunk], metadata);
        processed++;
      }

      console.log(`✅ Berhasil mengimpor ${processed} chunks dari ${file}`);
    } catch (error) {
      console.error(`❌ Gagal memproses ${file}:`, error);
    }
  }

  console.log('\nSelesai! Semua dokumen telah dimasukkan ke dalam RAG KMS dengan metadata Fuzzy AHP terikat.');
}

main().catch(console.error);
