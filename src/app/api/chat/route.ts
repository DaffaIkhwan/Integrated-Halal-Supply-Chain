import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchSimilarChunks } from '@/lib/actions/search';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const result = await streamText({
      model: openrouter('openai/gpt-4o-mini'),
      maxToolRoundtrips: 3,
      system: `Anda adalah asisten AI untuk sistem **Integrated Halal Supply Chain** — Knowledge Management System & Decision Support System (KMS-DSS).

## CARA KERJA
1. Untuk SETIAP pertanyaan pengguna, **SELALU panggil tool search_knowledge_base** terlebih dahulu untuk mencari informasi di Knowledge Base.
2. Setelah mendapat hasil dari tool, **jawab berdasarkan data yang ditemukan**. Rangkum menjadi jawaban yang informatif dan mudah dipahami.
3. Jika hasil pencarian kosong atau tidak relevan dengan pertanyaan, jawab: "Maaf, informasi mengenai topik tersebut belum tersedia dalam Knowledge Base kami saat ini."
4. **JANGAN menolak pertanyaan sebelum mencari.** Selalu cari dulu, baru simpulkan.
5. **SANGAT PENTING: JANGAN PERNAH menjawab dari pengetahuan umum Anda sendiri.** Jawaban HANYA boleh berdasarkan data yang dikembalikan oleh tools. Jika tools tidak mengembalikan data yang relevan, Anda WAJIB mengatakan informasi belum tersedia. DILARANG KERAS mengarang jawaban sendiri.

## TOOLS YANG TERSEDIA
- **search_knowledge_base**: Cari informasi, teori, regulasi, SOP, prosedur, atau apapun di Knowledge Base. SELALU gunakan ini untuk menjawab pertanyaan.
- **check_halal_risk**: Ambil data Risk Score, bobot Fuzzy AHP, atau data Titik Kritis (CP).
- **trace_halal_batch**: Lacak batch produk berdasarkan ID Batch atau eartag.
- **get_operational_data**: Ambil daftar entitas dari database (Farm, RPH, Juru Sembelih, dll).

## FORMAT JAWABAN
- Jawab dalam **Bahasa Indonesia** yang terstruktur dan profesional.
- Gunakan **Tabel Markdown** untuk data berseri (skor CP, riwayat compliance). Tabel hanya berisi CP1–CP9, **TANPA CP10**.
- Di kolom pertama tabel, WAJIB tampilkan **ID DAN Nama CP** (contoh: "CP1 Farm/Kandang Sapi", "CP4 RPH/Penyembelihan"), bukan hanya "CP1".
- Gunakan bullet points/list untuk informasi umum (Batch ID, Tanggal, RPH, dll).
- Setelah tabel, tampilkan **Data Personel & Info Operasional** per CP PERSIS seperti data dari tool. Setiap CP memiliki field operasional yang BERBEDA (contoh: CP1=Farm, CP3=Transporter/Kendaraan, CP4=RPH/Juru Sembelih, CP7=Gudang/Suhu) — tampilkan HANYA info dari baris "Entitas:" dan "Personel:" per CP. DILARANG menambahkan field generik yang sama untuk semua CP (seperti Suhu, Kendaraan, Supplier untuk setiap CP). Tampilkan SEMUA sub-kriteria per CP beserta skornya dari baris "Sub-Kriteria:" pada output tool.
- Setelah memanggil **trace_halal_batch**, sebutkan CP dengan Global Weighted Risk tertinggi beserta Sub-CP penyumbangnya.
- **SANGAT PENTING (REKOMENDASI)**: Untuk memberikan rekomendasi perbaikan pada Sub-CP risiko tinggi tersebut, Anda WAJIB memanggil \`search_knowledge_base\` terlebih dahulu dengan query nama Sub-CP tersebut (contoh: "F1 Asal usul sapi").
- Anda DILARANG KERAS memberikan rekomendasi tanpa menyebutkan spesifik **Pasal atau Ayat**-nya dari teks RAG. Jika di teks RAG tertulis "Pasal 1 Ayat 2", Anda WAJIB mengutipnya.
- Jangan hanya berkata "Berdasarkan dokumen RAG", sebutkan detailnya! Contoh benar: "Berdasarkan Pasal 2 Ayat 1 Dokumen 25 Regulasi Pelengkap, disebutkan bahwa...".
- Jika hasil pencarian RAG untuk Sub-CP tersebut kosong atau tidak memuat rekomendasi/pasal spesifik, jawablah: "Berdasarkan Knowledge Base saat ini, belum ada landasan regulasi atau SOP spesifik untuk merekomendasikan perbaikan pada titik [Nama Sub-CP] ini."
- Sertakan referensi sumber di akhir tanggapan.`,
      messages,
      tools: {
        search_knowledge_base: {
          description: 'Mencari dokumen, teori, aturan, fatwa, SOP, hukum, atau rekomendasi praktik (misalnya standar pakan sapi, hukum stunning). DILARANG menggunakan ini untuk mencari daftar data entitas dari database.',
          parameters: z.object({
            query: z.string().describe('Kata kunci pencarian spesifik (contoh: "hukuman denda Jaminan Produk Halal", "SOP pemotongan", "hukum stunning")'),
          }),
          execute: async ({ query }) => {
            try {
              // Text-based keyword search (vector search incompatible: docs use text-embedding-3-small but searchSimilarChunks uses all-MiniLM-L6-v2)
              const stopWords = ['yang', 'untuk', 'dan', 'atau', 'dengan', 'dari', 'pada', 'dalam', 'ini', 'itu', 'adalah', 'sebagai', 'melalui', 'secara', 'apakah', 'bagaimana', 'mengapa', 'boleh', 'tidak', 'saja', 'terkait', 'tentang', 'cara', 'apa', 'jelaskan', 'sesuai', 'sebutkan'];
              const words = query.split(/[\s\?\!\.]+/)
                .map(w => w.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '').toLowerCase())
                .filter(w => w.length > 2 && !stopWords.includes(w));
              
              const keywords = words.length > 0 ? Array.from(new Set(words)).slice(0, 6) : [query.toLowerCase()];

              if (keywords.length === 0) return 'Kata kunci pencarian tidak ditemukan.';

              console.log('[RAG] Keywords:', keywords);

              const rawResults = await prisma.oai.findMany({
                where: {
                  OR: keywords.map(kw => ({
                    chunk: { contains: kw, mode: 'insensitive' as const }
                  }))
                },
                take: 30,
                select: { chunk: true, metadata: true }
              });

              console.log('[RAG] Raw results count:', rawResults.length);

              if (rawResults.length === 0) return 'Tidak ada dokumen yang relevan ditemukan.';

              // Score by keyword match count
              const scored = rawResults.map(r => {
                const text = (r.chunk || '').toLowerCase();
                let score = 0;
                keywords.forEach(kw => { if (text.includes(kw)) score++; });
                return { ...r, score };
              });

              scored.sort((a, b) => b.score - a.score);
              const topResults = scored.slice(0, 5);

              let totalChars = 0;
              const formatted = topResults
                .map(r => {
                  if (totalChars > 4000) return null;
                  let cp = 'UMUM';
                  if (r.metadata) {
                    try {
                      const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
                      if (meta.criticalPoint) cp = meta.criticalPoint;
                    } catch (e) {}
                  }
                  const chunk = (r.chunk || '').length > 1200 ? (r.chunk || '').substring(0, 1200) + '...' : (r.chunk || '');
                  totalChars += chunk.length;
                  return `[${cp}] ${chunk}`;
                })
                .filter(Boolean)
                .join('\n\n');

              return `--- RAG KMS Output ---\n${formatted}`;
            } catch (e: any) {
              console.error('RAG search error:', e);
              return `Gagal mencari di knowledge base: ${e.message}`;
            }
          },
        },
        check_halal_risk: {
          description: 'Menarik hasil matriks klasifikasi risiko Fuzzy AHP terkini dari database, termasuk bobot (weight) dan tingkat kerentanan untuk semua Titik Kritis (Critical Points / CP).',
          parameters: z.object({
            batchId: z.string().optional().describe('Opsional: HANYA diisi jika user secara eksplisit menyebut kata "Batch" (contoh: "Batch 123"). JANGAN diisi jika user bertanya tentang CP (contoh: "CP1", "Titik Kritis").'),
          }),
          execute: async ({ batchId }) => {
            try {
              const { getDynamicCPWeights, calculateBatchRiskScore } = await import('@/lib/dss/fuzzyAHP');
              if (batchId) {
                const batchRisk = await calculateBatchRiskScore(batchId);
                const filteredBreakdown = batchRisk.cpBreakdown.filter((cp: any) => !cp.cpId?.startsWith('CP10'));
                return `--- DSS Batch Risk (${batchId}) ---\nTotal Risk Score: ${batchRisk.totalRiskScore} (${batchRisk.riskLevel})\n\nBreakdown:\n${filteredBreakdown
                  .map((cp: any) => `  ${cp.cpId} ${cp.cpName}: Local=${cp.localRiskScore.toFixed(3)} × Global=${cp.globalWeight.toFixed(3)} = ${cp.globalWeightedRisk.toFixed(3)} [${cp.riskLevel}]`)
                  .join('\n')}`;
              }
              const cpWeights = await getDynamicCPWeights();
              if (!cpWeights || cpWeights.length === 0) return 'Data bobot belum tersedia.';
              const filtered = cpWeights.filter((cp: any) => !cp.id?.startsWith('CP10'));
              return `--- DSS Halal Risk Output ---\n${filtered
                .map((cp: any) => `Titik Kritis: ${cp.name} | Bobot Global: ${cp.weight.toFixed(4)} | Risk Score Lokal: ${(cp.localRiskScore ?? 0).toFixed(3)} | Status: ${cp.riskLevel}`)
                .join('\n')}`;
            } catch (e: any) {
              return `Gagal mengambil data DSS: ${e.message}`;
            }
          },
        },
        trace_halal_batch: {
          description: 'Melakukan database relational query pelacakan produk daging dan status pemotongannya.',
          parameters: z.object({
            batchId: z.string().describe('Nomor ID Batch atau eartag')
          }),
          execute: async ({ batchId }) => {
            try {
              let batchInfo = await prisma.halalBatch.findFirst({
                where: { cattle: { earTag: { contains: batchId, mode: 'insensitive' } } },
                include: { 
                  cattle: { include: { farm: true } }, 
                  slaughterhouse: true, 
                  cpRecords: { include: { criticalPoint: true }, orderBy: { criticalPoint: { id: 'asc' } } },
                  cp1Farm: true, cp2Feed: true,
                  cp3Transport: { include: { transporter: true } },
                  cp4Slaughter: true, cp5PostSlaughter: true,
                  cp6Processing: { include: { processingPlant: true } },
                  cp7Storage: { include: { warehouse: true } },
                  cp8Distribution: { include: { distributor: true } },
                  cp9Retail: { include: { retailOutlet: true } }
                }
              });
              if (!batchInfo) {
                batchInfo = await prisma.halalBatch.findFirst({
                  where: { id: { contains: batchId } },
                  include: { 
                    cattle: { include: { farm: true } }, 
                    slaughterhouse: true, 
                    cpRecords: { include: { criticalPoint: true }, orderBy: { criticalPoint: { id: 'asc' } } },
                    cp1Farm: true, cp2Feed: true,
                    cp3Transport: { include: { transporter: true } },
                    cp4Slaughter: true, cp5PostSlaughter: true,
                    cp6Processing: { include: { processingPlant: true } },
                    cp7Storage: { include: { warehouse: true } },
                    cp8Distribution: { include: { distributor: true } },
                    cp9Retail: { include: { retailOutlet: true } }
                  }
                });
              }
              if (!batchInfo) return `Data Traceability untuk Batch "${batchId}" tidak ditemukan.`;
              
              // Query latest QuestionnaireResponse per CP for personnel data
              const qrResponses = await prisma.questionnaireResponse.findMany({
                where: {
                  questionnaireType: { in: ['aktual', 'risiko'] },
                  cpId: { in: ['CP1','CP2','CP3','CP4','CP5','CP6','CP7','CP8','CP9'] },
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { cpId: true, respondentName: true, respondentRole: true, respondentOrg: true, respondentInfo: true },
              });
              const latestQRPerCP: Record<string, any> = {};
              for (const qr of qrResponses) {
                if (qr.cpId && !latestQRPerCP[qr.cpId]) latestQRPerCP[qr.cpId] = qr;
              }

              // CP-specific entity info resolver — each CP has DIFFERENT operational fields
              const getCPEntityInfo = (cpId: string): string => {
                switch(cpId) {
                  case 'CP1': { const f = batchInfo.cattle?.farm; return `Nama Farm: ${f?.name || 'Belum diisi'} | Lokasi: ${f?.location || 'Belum diisi'}`; }
                  case 'CP2': { const f = batchInfo.cattle?.farm; return `Farm/Unit Pakan: ${f?.name || 'Belum diisi'} | Lokasi: ${f?.location || 'Belum diisi'}`; }
                  case 'CP3': { const t = (batchInfo.cp3Transport as any)?.[0]?.transporter; return `Transporter: ${t?.name || 'Belum diisi'} | No.Kendaraan: ${t?.vehicleNumber || 'Belum diisi'} | Jenis Kendaraan: ${t?.vehicleType || 'Belum diisi'}`; }
                  case 'CP4': { const s = batchInfo.slaughterhouse; return `RPH: ${s?.name || 'Belum diisi'} | Lokasi RPH: ${s?.location || 'Belum diisi'} | Juru Sembelih: ${batchInfo.butcherName || 'Belum diisi'}`; }
                  case 'CP5': { const s = batchInfo.slaughterhouse; return `RPH (Post-Slaughter): ${s?.name || 'Belum diisi'} | Lokasi: ${s?.location || 'Belum diisi'}`; }
                  case 'CP6': { const p = (batchInfo.cp6Processing as any)?.[0]?.processingPlant; return `Pabrik Pengolahan: ${p?.name || 'Belum diisi'} | Lokasi: ${p?.location || 'Belum diisi'} | Tipe Produksi: ${p?.productionType || 'Belum diisi'}`; }
                  case 'CP7': { const w = (batchInfo.cp7Storage as any)?.[0]?.warehouse; return `Gudang/Cold Storage: ${w?.name || 'Belum diisi'} | Lokasi: ${w?.location || 'Belum diisi'} | Tipe Storage: ${w?.storageType || 'Belum diisi'}`; }
                  case 'CP8': { const d = (batchInfo.cp8Distribution as any)?.[0]?.distributor; return `Distributor: ${d?.name || 'Belum diisi'} | Lokasi: ${d?.location || 'Belum diisi'} | Area Distribusi: ${d?.coverageArea || 'Belum diisi'}`; }
                  case 'CP9': { const r = (batchInfo.cp9Retail as any)?.[0]?.retailOutlet; return `Retail/Outlet: ${r?.name || 'Belum diisi'} | Lokasi: ${r?.location || 'Belum diisi'} | Tipe Outlet: ${r?.outletType || 'Belum diisi'}`; }
                  default: return 'Belum diisi';
                }
              };

              // Expected sub-criteria keys per CP (fallback when no detail record)
              const cpSubCriteriaKeys: Record<string, string[]> = {
                CP1: ['asalUsulRisk', 'kesehatanRisk', 'kepatuhanPakanRisk', 'obatVaksinRisk', 'dokumentasiRisk', 'kebersihanKandangRisk', 'kesiapanSembelihRisk'],
                CP2: ['halalFeedStatusRisk', 'supplierRisk', 'feedStorageRisk', 'medicationRisk', 'vetSupervisionRisk'],
                CP3: ['kelayakanRisk', 'kebersihanRisk', 'animalWelfareRisk', 'traceabilityRisk', 'dokumentasiRisk'],
                CP4: ['sertifikatHalalRisk', 'kompetensiSembelihRisk', 'prosesSyariahRisk', 'pemeriksaanRisk', 'sanitasiRisk', 'segregasiRisk', 'dokumentasiRisk', 'pengawasanRisk', 'auditRisk', 'traceabilityRisk'],
                CP5: ['handlingRisk', 'sanitasiRisk', 'batchIdRisk', 'segregasiRisk', 'dokumentasiRisk'],
                CP6: ['halalIngredientsRisk', 'equipmentRisk', 'dedicatedLineRisk', 'batchControlRisk', 'packagingRisk', 'operatorRisk', 'formulaRisk'],
                CP7: ['temperatureRisk', 'segregasiRisk', 'hygieneRisk', 'traceabilityRisk', 'fifoFefoRisk', 'dokumentasiRisk', 'incidentRisk'],
                CP8: ['dedicatedTransRisk', 'vehicleSanitasiRisk', 'temperatureRisk', 'routeRisk', 'loadingRisk', 'dokumentasiRisk', 'kontaminasiRisk'],
                CP9: ['labelHalalRisk', 'displayRisk', 'storageTemRisk', 'expiryRisk', 'consumerInfoRisk', 'supplierTraceRisk', 'complaintRisk'],
              };

              // Sub-CP Code mapping helper
              const mapSubCP = (cpId: string, key: string) => {
                const mappings: Record<string, Record<string, string>> = {
                  'CP1': { 'asalUsul': 'F1 - Asal-usul sapi', 'kesehatan': 'F2 - Status kesehatan sapi', 'kepatuhanPakan': 'F3 - Kepatuhan pakan', 'obatVaksin': 'F4 - Penggunaan obat/vaksin', 'dokumentasi': 'F5 - Dokumentasi pemeliharaan', 'kebersihanKandang': 'F6 - Kebersihan kandang', 'kesiapanSembelih': 'F7 - Kesiapan hewan disembelih' },
                  'CP2': { 'halalFeedStatus': 'FD1 - Status halal pakan', 'supplier': 'FD2 - Supplier reliability', 'feedStorage': 'FD3 - Penyimpanan pakan', 'medication': 'FD4 - Pengendalian obat', 'vetSupervision': 'FD5 - Pengawasan veteriner' },
                  'CP3': { 'kelayakan': 'T1 - Kelayakan kendaraan', 'kebersihan': 'T2 - Kebersihan kendaraan', 'animalWelfare': 'T3 - Animal welfare', 'traceability': 'T4 - Traceability during transport', 'dokumentasi': 'T5 - Dokumentasi perjalanan' },
                  'CP4': { 'sertifikatHalal': 'R1 - Sertifikat halal RPH', 'kompetensiSembelih': 'R2 - Kompetensi juru sembelih', 'prosesSyariah': 'R3 - Proses penyembelihan syariah', 'pemeriksaan': 'R4 - Pemeriksaan ante/post-mortem', 'sanitasi': 'R5 - Sanitasi alat dan area', 'segregasi': 'R6 - Segregasi halal/non-halal', 'dokumentasi': 'R7 - Dokumentasi penyembelihan', 'pengawasan': 'R8 - Pengawasan halal internal', 'audit': 'R9 - Audit & corrective action', 'traceability': 'R10 - Traceability batch' },
                  'CP5': { 'handling': 'PS1 - Handling carcass', 'sanitasi': 'PS2 - Sanitasi', 'batchId': 'PS3 - Batch identification', 'segregasi': 'PS4 - Segregasi', 'dokumentasi': 'PS5 - Dokumentasi' },
                  'CP6': { 'halalIngredients': 'P1 - Halal ingredients', 'equipment': 'P2 - Equipment sanitation', 'dedicatedLine': 'P3 - Dedicated production line', 'batchControl': 'P4 - Batch control', 'packaging': 'P5 - Packaging & labeling', 'operator': 'P6 - Operator competence', 'formula': 'P7 - Product formulation' },
                  'CP7': { 'temperature': 'CS1 - Temperature compliance', 'segregasi': 'CS2 - Halal segregation', 'hygiene': 'CS3 - Storage hygiene', 'traceability': 'CS4 - Batch traceability', 'fifoFefo': 'CS5 - FIFO/FEFO compliance', 'dokumentasi': 'CS6 - Documentation', 'incident': 'CS7 - Incident handling' },
                  'CP8': { 'dedicatedTrans': 'D1 - Dedicated halal transport', 'vehicleSanitasi': 'D2 - Vehicle sanitation', 'temperature': 'D3 - Temperature control', 'route': 'D4 - Route traceability', 'loading': 'D5 - Loading-unloading', 'dokumentasi': 'D6 - Documentation', 'kontaminasi': 'D7 - Contamination prevention' },
                  'CP9': { 'labelHalal': 'RT1 - Halal label validity', 'display': 'RT2 - Display segregation', 'storageTem': 'RT3 - Storage temperature', 'expiry': 'RT4 - Expiry date control', 'consumerInfo': 'RT5 - Consumer information', 'supplierTrace': 'RT6 - Supplier traceability', 'complaint': 'RT7 - Complaint handling' }
                };
                const cleanKey = key.replace(/Risk$/, '');
                return mappings[cpId]?.[cleanKey] || cleanKey;
              };

              let traceOutput = `--- Traceability Info ---\nBatch ID: ${batchInfo.id}\nTanggal Produksi: ${batchInfo.productionDate}\nTotal Halal Compliance Risk Score: ${batchInfo.totalRiskScore.toFixed(4)} (${batchInfo.riskLevel})\nAsal Ternak: ${batchInfo.cattle?.earTag || '-'} dari Peternakan: ${batchInfo.cattle?.farm?.name || 'Belum diisi'}\nJenis Sapi: ${batchInfo.cattle?.breed || 'Tidak Dicatat'}\nUmur/Tanggal Lahir: ${batchInfo.cattle?.birthDate ? new Date(batchInfo.cattle.birthDate).toLocaleDateString('id-ID') : 'Tidak Dicatat'}`;
              
              // Entity data is now shown per-CP in compliance records below

              // Filter out CP10 from records
              const cpRecordsFiltered = batchInfo.cpRecords.filter(rec => rec.criticalPoint.id !== 'CP10');
              if (cpRecordsFiltered.length > 0) {
                traceOutput += `\n\n--- Compliance Records (Titik Kritis) ---`;
                const { getRiskLevel } = await import('@/lib/dss/fuzzyAHP');
                for (const rec of cpRecordsFiltered) {
                  const rLevel = getRiskLevel(rec.riskValue);
                  traceOutput += `\n[${rec.criticalPoint.id}] ${rec.criticalPoint.name}: Status ${rLevel} | Risk Score: ${rec.riskValue.toFixed(4)} | Global Weighted Risk: ${rec.weightedRisk.toFixed(4)}`;
                  
                  let subDetails: any = null;
                  if (rec.criticalPoint.id === 'CP1' && batchInfo.cp1Farm[0]) subDetails = batchInfo.cp1Farm[0];
                  if (rec.criticalPoint.id === 'CP2' && batchInfo.cp2Feed[0]) subDetails = batchInfo.cp2Feed[0];
                  if (rec.criticalPoint.id === 'CP3' && batchInfo.cp3Transport[0]) subDetails = batchInfo.cp3Transport[0];
                  if (rec.criticalPoint.id === 'CP4' && batchInfo.cp4Slaughter[0]) subDetails = batchInfo.cp4Slaughter[0];
                  if (rec.criticalPoint.id === 'CP5' && batchInfo.cp5PostSlaughter[0]) subDetails = batchInfo.cp5PostSlaughter[0];
                  if (rec.criticalPoint.id === 'CP6' && batchInfo.cp6Processing[0]) subDetails = batchInfo.cp6Processing[0];
                  if (rec.criticalPoint.id === 'CP7' && batchInfo.cp7Storage[0]) subDetails = batchInfo.cp7Storage[0];
                  if (rec.criticalPoint.id === 'CP8' && batchInfo.cp8Distribution[0]) subDetails = batchInfo.cp8Distribution[0];
                  if (rec.criticalPoint.id === 'CP9' && batchInfo.cp9Retail[0]) subDetails = batchInfo.cp9Retail[0];
                  
                  // Show ALL sub-criteria risk scores (each CP has different sub-criteria)
                  const cpId = rec.criticalPoint.id;
                  if (subDetails) {
                     const risks = Object.entries(subDetails)
                       .filter(([k]) => k.endsWith('Risk') && k !== 'riskScore')
                       .map(([k, v]) => ({ key: k, label: mapSubCP(cpId, k), value: Number(v) || 0 }))
                       .sort((a, b) => b.value - a.value);
                     if (risks.length > 0) {
                       traceOutput += `\n    Sub-Kriteria:`;
                       for (const r of risks) {
                         traceOutput += `\n      - ${r.label}: ${r.value.toFixed(2)}`;
                       }
                     }
                  } else {
                     // Fallback: show expected sub-criteria with 'Belum dinilai'
                     const expectedKeys = cpSubCriteriaKeys[cpId] || [];
                     if (expectedKeys.length > 0) {
                       traceOutput += `\n    Sub-Kriteria:`;
                       for (const key of expectedKeys) {
                         traceOutput += `\n      - ${mapSubCP(cpId, key)}: Belum dinilai`;
                       }
                     }
                  }
                  // CP-specific entity & personnel info
                  traceOutput += `\n    Entitas: ${getCPEntityInfo(cpId)}`;
                  const qrData = latestQRPerCP[cpId];
                  if (qrData) {
                    traceOutput += `\n    Personel: ${qrData.respondentName || 'Belum diisi'} (${qrData.respondentRole || '-'}) dari ${qrData.respondentOrg || '-'}`;
                  } else {
                    traceOutput += `\n    Personel: Belum ada data kuesioner`;
                  }
                }
              }

              return traceOutput;
            } catch (e: any) {
              return `Gagal melacak: ${e.message}`;
            }
          },
        },
        get_operational_data: {
          description: 'Mengambil entitas data operasional yang tersimpan di database sistem (DAFTAR Farm, DAFTAR RPH, DAFTAR Juru Sembelih, DAFTAR QC, dsb). DILARANG menggunakan ini untuk pertanyaan teoritis, hukum, atau prosedur standar.',
          parameters: z.object({
            category: z.string().describe('Kategori data, contoh: "Farm", "RPH", "Juru Sembelih", "Pakan", "QC"'),
          }),
          execute: async ({ category }) => {
            try {
              const cat = category.toLowerCase();
              if (cat.includes('farm') || cat.includes('kandang') || cat.includes('peternakan')) {
                const farms = await prisma.farm.findMany({ select: { name: true, location: true } });
                if (farms.length === 0) return "Tidak ada data Farm di database.";
                return "--- Daftar Farm ---\n" + farms.map(f => `- ${f.name} (Lokasi: ${f.location || '-'})`).join('\n');
              }
              if (cat.includes('rph') || cat.includes('slaughter')) {
                const rph = await prisma.slaughterhouse.findMany({ select: { name: true, location: true } });
                if (rph.length === 0) return "Tidak ada data RPH di database.";
                return "--- Daftar RPH ---\n" + rph.map(r => `- ${r.name} (Lokasi: ${r.location || '-'})`).join('\n');
              }
              if (cat.includes('pakan') || cat.includes('feed')) {
                 return "Informasi merk/jenis pakan spesifik tidak tersimpan secara terpisah di tabel master. Evaluasi risiko Pakan (CP2) langsung dinilai berdasarkan kepatuhan peternakan (Farm).";
              }
              
              // Fallback to searching personnel in QuestionnaireResponse
              const personnel = await prisma.questionnaireResponse.findMany({
                where: { respondentRole: { contains: category, mode: 'insensitive' } },
                select: { respondentName: true, respondentRole: true, respondentOrg: true, respondentInfo: true },
                distinct: ['respondentName']
              });
              if (personnel.length === 0) return `Tidak ada data spesifik untuk kategori "${category}" di database sistem saat ini.`;
              return `--- Daftar Data ${category} ---\n` + personnel.map(p => `- ${p.respondentName} (${p.respondentRole}) dari ${p.respondentOrg} - Sertifikat: ${(p.respondentInfo as any)?.noSertifikat || 'Belum diverifikasi'}`).join('\n');
            } catch (e: any) {
              return `Gagal mengambil data operasional: ${e.message}`;
            }
          }
        },
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    let errorMessage = "Maaf, terjadi kesalahan internal pada server AI.";
    
    // Deteksi error dari Vercel AI SDK atau status HTTP 429 (Quota Limit)
    if (
      error?.message?.toLowerCase().includes("quota") ||
      error?.message?.includes("429") ||
      error?.statusCode === 429
    ) {
      errorMessage = "Limit API Key OpenRouter telah habis (Quota Exceeded). Silakan buat API Key baru dan pastikan saldo cukup.";
    } else if (error?.name === 'AI_RetryError' || error?.name === 'AI_APICallError') {
      const detail = error?.responseBody || error?.message || 'Unknown AI error';
      errorMessage = `AI API Error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    } else if (error?.message) {
      errorMessage = `Server Error: ${error.message}`;
    }

    return new Response(errorMessage, {
      status: 500,
    });
  }
}
