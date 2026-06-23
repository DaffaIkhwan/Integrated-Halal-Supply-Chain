/**
 * Script to check RAG coverage for each CP and its Sub-CP criteria.
 * Verifies that recommendation-grade content exists in the knowledge base
 * for every Critical Point, including regulatory references (pasal/ayat).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All CP sub-criteria mapped to search keywords
const CP_SUBCRITERIA: Record<string, { name: string; keywords: string[] }[]> = {
  CP1: [
    { name: 'F1 - Asal-usul sapi', keywords: ['asal-usul', 'asal usul', 'ternak', 'identifikasi hewan'] },
    { name: 'F2 - Status kesehatan sapi', keywords: ['kesehatan', 'ante-mortem', 'pemeriksaan hewan'] },
    { name: 'F3 - Kepatuhan pakan', keywords: ['pakan', 'halal feed', 'kepatuhan pakan'] },
    { name: 'F4 - Penggunaan obat/vaksin', keywords: ['obat', 'vaksin', 'antibiotik', 'residu'] },
    { name: 'F5 - Dokumentasi pemeliharaan', keywords: ['dokumentasi', 'pencatatan', 'rekam jejak'] },
    { name: 'F6 - Kebersihan kandang', keywords: ['kebersihan', 'sanitasi', 'kandang', 'higiene'] },
    { name: 'F7 - Kesiapan hewan disembelih', keywords: ['kesiapan sembelih', 'istirahat hewan', 'resting'] },
  ],
  CP2: [
    { name: 'FD1 - Status halal pakan', keywords: ['halal pakan', 'bahan pakan', 'feed halal'] },
    { name: 'FD2 - Supplier reliability', keywords: ['supplier', 'pemasok', 'suplier'] },
    { name: 'FD3 - Penyimpanan pakan', keywords: ['penyimpanan pakan', 'gudang pakan', 'feed storage'] },
    { name: 'FD4 - Pengendalian obat', keywords: ['pengendalian obat', 'medication', 'kontrol obat'] },
    { name: 'FD5 - Pengawasan veteriner', keywords: ['veteriner', 'dokter hewan', 'veterinary'] },
  ],
  CP3: [
    { name: 'T1 - Kelayakan kendaraan', keywords: ['kelayakan kendaraan', 'kendaraan angkut', 'transportasi hewan'] },
    { name: 'T2 - Kebersihan kendaraan', keywords: ['kebersihan kendaraan', 'sanitasi kendaraan'] },
    { name: 'T3 - Animal welfare', keywords: ['animal welfare', 'kesejahteraan hewan', 'perlakuan hewan'] },
    { name: 'T4 - Traceability during transport', keywords: ['penelusuran transport', 'traceability', 'ketertelusuran'] },
    { name: 'T5 - Dokumentasi perjalanan', keywords: ['dokumentasi', 'surat jalan', 'dokumen angkut'] },
  ],
  CP4: [
    { name: 'R1 - Sertifikat halal RPH', keywords: ['sertifikat halal', 'sertifikat rph', 'izin halal'] },
    { name: 'R2 - Kompetensi juru sembelih', keywords: ['juru sembelih', 'kompetensi', 'skkni', 'penyembelih'] },
    { name: 'R3 - Proses penyembelihan syariah', keywords: ['syariah', 'penyembelihan', 'basmallah', 'sembelih'] },
    { name: 'R4 - Pemeriksaan ante/post-mortem', keywords: ['ante-mortem', 'post-mortem', 'pemeriksaan'] },
    { name: 'R5 - Sanitasi alat dan area', keywords: ['sanitasi', 'higiene', 'kebersihan alat'] },
    { name: 'R6 - Segregasi halal/non-halal', keywords: ['segregasi', 'pemisahan', 'halal non-halal'] },
    { name: 'R7 - Dokumentasi penyembelihan', keywords: ['dokumentasi', 'pencatatan', 'rekam'] },
    { name: 'R8 - Pengawasan halal internal', keywords: ['pengawasan', 'auditor', 'internal'] },
    { name: 'R9 - Audit & corrective action', keywords: ['audit', 'corrective action', 'tindakan koreksi'] },
    { name: 'R10 - Traceability batch', keywords: ['traceability', 'batch', 'ketertelusuran'] },
  ],
  CP5: [
    { name: 'PS1 - Handling carcass', keywords: ['karkas', 'carcass', 'penanganan karkas'] },
    { name: 'PS2 - Sanitasi', keywords: ['sanitasi', 'higiene', 'pembersihan'] },
    { name: 'PS3 - Batch identification', keywords: ['batch', 'identifikasi', 'pelabelan'] },
    { name: 'PS4 - Segregasi', keywords: ['segregasi', 'pemisahan'] },
    { name: 'PS5 - Dokumentasi', keywords: ['dokumentasi', 'pencatatan'] },
  ],
  CP6: [
    { name: 'P1 - Halal ingredients', keywords: ['bahan halal', 'bahan tambahan', 'aditif', 'ingredients'] },
    { name: 'P2 - Equipment sanitation', keywords: ['sanitasi alat', 'peralatan', 'mesin'] },
    { name: 'P3 - Dedicated production line', keywords: ['lini produksi', 'produksi khusus', 'dedicated line'] },
    { name: 'P4 - Batch control', keywords: ['batch control', 'pengendalian batch'] },
    { name: 'P5 - Packaging & labeling', keywords: ['kemasan', 'label', 'pengemasan'] },
    { name: 'P6 - Operator competence', keywords: ['operator', 'kompetensi', 'pelatihan'] },
    { name: 'P7 - Product formulation', keywords: ['formulasi', 'resep produk', 'formulation'] },
  ],
  CP7: [
    { name: 'CS1 - Temperature compliance', keywords: ['suhu', 'temperatur', 'cold chain'] },
    { name: 'CS2 - Halal segregation', keywords: ['segregasi', 'pemisahan halal'] },
    { name: 'CS3 - Storage hygiene', keywords: ['higiene', 'kebersihan gudang'] },
    { name: 'CS4 - Batch traceability', keywords: ['traceability', 'ketertelusuran'] },
    { name: 'CS5 - FIFO/FEFO compliance', keywords: ['fifo', 'fefo', 'expired', 'kedaluwarsa'] },
    { name: 'CS6 - Documentation', keywords: ['dokumentasi', 'pencatatan'] },
    { name: 'CS7 - Incident handling', keywords: ['insiden', 'penanganan masalah'] },
  ],
  CP8: [
    { name: 'D1 - Dedicated halal transport', keywords: ['transportasi halal', 'kendaraan khusus'] },
    { name: 'D2 - Vehicle sanitation', keywords: ['sanitasi kendaraan', 'kebersihan kendaraan'] },
    { name: 'D3 - Temperature control', keywords: ['suhu', 'temperatur', 'cold chain'] },
    { name: 'D4 - Route traceability', keywords: ['rute', 'pengiriman', 'traceability'] },
    { name: 'D5 - Loading-unloading', keywords: ['bongkar muat', 'loading', 'unloading'] },
    { name: 'D6 - Documentation', keywords: ['dokumentasi', 'surat jalan'] },
    { name: 'D7 - Contamination prevention', keywords: ['kontaminasi', 'pencegahan', 'cross contamination'] },
  ],
  CP9: [
    { name: 'RT1 - Halal label validity', keywords: ['label halal', 'sertifikat halal', 'validitas label'] },
    { name: 'RT2 - Display segregation', keywords: ['display', 'penempatan', 'segregasi'] },
    { name: 'RT3 - Storage temperature', keywords: ['suhu', 'penyimpanan', 'temperatur'] },
    { name: 'RT4 - Expiry date control', keywords: ['kadaluarsa', 'expired', 'kedaluwarsa'] },
    { name: 'RT5 - Consumer information', keywords: ['informasi konsumen', 'consumer info'] },
    { name: 'RT6 - Supplier traceability', keywords: ['supplier', 'traceability', 'asal produk'] },
    { name: 'RT7 - Complaint handling', keywords: ['pengaduan', 'keluhan', 'complaint'] },
  ],
};

// Keywords for regulatory references (pasal, ayat)
const REGULATION_KEYWORDS = ['pasal', 'ayat', 'peraturan', 'undang-undang', 'keputusan', 'permentan', 'fatwa', 'sni'];

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  RAG Coverage Audit for CP/Sub-CP Recommendations');
  console.log('═══════════════════════════════════════════════════\n');

  // Get total RAG chunks
  const totalChunks = await prisma.oai.count();
  console.log(`📊 Total RAG chunks in database: ${totalChunks}\n`);

  // Check coverage for each CP
  const results: Record<string, { found: boolean; count: number; hasRegRef: boolean; sampleSources: string[]; sampleContent: string }[]> = {};
  
  const missing: { cp: string; subCp: string }[] = [];
  const noRegRef: { cp: string; subCp: string }[] = [];
  
  for (const [cpId, subcriteria] of Object.entries(CP_SUBCRITERIA)) {
    console.log(`\n━━━ ${cpId} ━━━`);
    results[cpId] = [];
    
    for (const sub of subcriteria) {
      // Search for chunks matching this sub-criteria's keywords
      const chunks = await prisma.oai.findMany({
        where: {
          OR: sub.keywords.map(kw => ({
            chunk: { contains: kw, mode: 'insensitive' as const }
          }))
        },
        take: 10,
        select: { chunk: true, metadata: true }
      });
      
      // Check if any chunks contain regulatory references
      let hasRegRef = false;
      const sources = new Set<string>();
      let bestChunk = '';
      
      for (const c of chunks) {
        const text = (c.chunk || '').toLowerCase();
        if (REGULATION_KEYWORDS.some(kw => text.includes(kw))) {
          hasRegRef = true;
        }
        if (c.metadata) {
          try {
            const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata;
            if (meta.documentTitle) sources.add(meta.documentTitle);
            else if (meta.source) sources.add(meta.source);
          } catch {}
        }
        if (!bestChunk && text.length > 50) {
          bestChunk = (c.chunk || '').substring(0, 150);
        }
      }
      
      const found = chunks.length > 0;
      const status = found 
        ? (hasRegRef ? '✅' : '⚠️  (no regulation ref)') 
        : '❌ MISSING';
      
      console.log(`  ${status} ${sub.name} — ${chunks.length} chunks${sources.size > 0 ? ` [${Array.from(sources).slice(0, 2).join(', ')}]` : ''}`);
      
      if (!found) missing.push({ cp: cpId, subCp: sub.name });
      if (found && !hasRegRef) noRegRef.push({ cp: cpId, subCp: sub.name });
      
      results[cpId].push({
        found,
        count: chunks.length,
        hasRegRef,
        sampleSources: Array.from(sources).slice(0, 3),
        sampleContent: bestChunk,
      });
    }
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  
  if (missing.length > 0) {
    console.log(`\n❌ ${missing.length} Sub-CP TANPA data RAG sama sekali:`);
    for (const m of missing) {
      console.log(`   - ${m.cp} → ${m.subCp}`);
    }
  } else {
    console.log('\n✅ Semua Sub-CP memiliki data RAG.');
  }
  
  if (noRegRef.length > 0) {
    console.log(`\n⚠️  ${noRegRef.length} Sub-CP TANPA referensi regulasi (pasal/ayat):`);
    for (const m of noRegRef) {
      console.log(`   - ${m.cp} → ${m.subCp}`);
    }
  } else {
    console.log('\n✅ Semua Sub-CP memiliki referensi regulasi.');
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
