import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { searchSimilarChunks } from '@/lib/actions/search';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
- Gunakan **Tabel Markdown** untuk data berseri (skor CP, riwayat compliance). Tabel hanya berisi CP1–CP9.
- Gunakan bullet points/list untuk informasi umum (Batch ID, Tanggal, RPH, dll).
- Jangan cantumkan kolom "Sub-CP" atau "Nilai Sub-CP" di tabel. Sebutkan di paragraf penjelasan saja.
- Setelah memanggil **trace_halal_batch**, sebutkan CP dengan Global Weighted Risk tertinggi beserta Sub-CP penyumbangnya, lalu beri rekomendasi konkrit.
- Sertakan referensi sumber jika tersedia.`,
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
                  cp1Farm: true, cp2Feed: true, cp3Transport: true, cp4Slaughter: true, cp5PostSlaughter: true,
                  cp6Processing: true, cp7Storage: true, cp8Distribution: true, cp9Retail: true
                }
              });
              if (!batchInfo) {
                batchInfo = await prisma.halalBatch.findFirst({
                  where: { id: { contains: batchId } },
                  include: { 
                    cattle: { include: { farm: true } }, 
                    slaughterhouse: true, 
                    cpRecords: { include: { criticalPoint: true }, orderBy: { criticalPoint: { id: 'asc' } } },
                    cp1Farm: true, cp2Feed: true, cp3Transport: true, cp4Slaughter: true, cp5PostSlaughter: true,
                    cp6Processing: true, cp7Storage: true, cp8Distribution: true, cp9Retail: true
                  }
                });
              }
              if (!batchInfo) return `Data Traceability untuk Batch "${batchId}" tidak ditemukan.`;
              let traceOutput = `--- Traceability Info ---\nBatch ID: ${batchInfo.id}\nTanggal Produksi: ${batchInfo.productionDate}\nTotal Halal Compliance Risk Score: ${batchInfo.totalRiskScore.toFixed(4)} (${batchInfo.riskLevel})\nAsal Ternak: ${batchInfo.cattle.earTag} dari ${batchInfo.cattle.farm.name}\nJenis Sapi: ${batchInfo.cattle.breed || 'Tidak Dicatat'}\nUmur/Tanggal Lahir: ${batchInfo.cattle.birthDate ? new Date(batchInfo.cattle.birthDate).toLocaleDateString('id-ID') : 'Tidak Dicatat'}\nDetail Pakan (CP2): Informasi merk/jenis pakan spesifik tidak direkam di master data, masuk dalam evaluasi kepatuhan Peternakan.\nRPH: ${batchInfo.slaughterhouse.name}`;
              if (batchInfo.cpRecords.length > 0) {
                traceOutput += `\n\nCompliance Records:`;
                const { getRiskLevel } = await import('@/lib/dss/fuzzyAHP');
                for (const rec of batchInfo.cpRecords) {
                  const rLevel = getRiskLevel(rec.riskValue);
                  traceOutput += `\n  ${rec.criticalPoint.id} ${rec.criticalPoint.name}: ${rLevel} Risk | Risk Score: ${rec.riskValue.toFixed(4)} | Global Weighted Risk: ${rec.weightedRisk.toFixed(4)}`;
                  
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
                  
                  if (subDetails) {
                     const risks = Object.entries(subDetails)
                       .filter(([k]) => k.endsWith('Risk') && k !== 'riskScore')
                       .map(([k, v]) => ({ key: k, value: Number(v) || 0 }))
                       .sort((a, b) => b.value - a.value);
                     
                     if (risks.length > 0) {
                       let formattedKey = risks[0].key.replace(/Risk$/, '').replace(/([A-Z])/g, ' $1').trim();
                       formattedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
                       traceOutput += ` (Sub-CP Tertinggi: ${formattedKey})`;
                     }
                  }
                }
              }

              // Tambahkan data personel yang terlibat berdasarkan kuesioner aktual
              const personnelRaw = await prisma.questionnaireResponse.findMany({
                where: { questionnaireType: 'aktual' },
                select: { respondentName: true, respondentRole: true, respondentOrg: true, respondentInfo: true, cpId: true }
              });
              
              const involved = personnelRaw.filter((p: any) => {
                 const batchStr = p.respondentInfo?.batch || '';
                 return typeof batchStr === 'string' && batchStr.toLowerCase().includes(batchId.toLowerCase());
              });

              if (involved.length > 0) {
                traceOutput += `\n\nData Personel & Info Operasional Terkait:`;
                involved.forEach((p: any) => {
                  let extra = '';
                  if (p.respondentInfo) {
                    const info = p.respondentInfo as Record<string, any>;
                    const ignoreKeys = ['batch', 'tanggal', 'shift', 'waktuMulai', 'waktuBerangkat', 'idKaryawan', 'namaPIC', 'jabatan', 'namaFarm', 'namaRPH', 'namaPerusahaan', 'lokasi', 'alamat', 'masaBerlaku', 'namaOutlet', 'namaGudang', 'namaStaff'];
                    const extraInfos = Object.keys(info)
                      .filter(k => !ignoreKeys.includes(k) && typeof info[k] === 'string' && info[k].trim() !== '')
                      .map(k => `${k}: ${info[k]}`);
                    if (extraInfos.length > 0) extra = ` | Detail: ${extraInfos.join(', ')}`;
                  }
                  traceOutput += `\n- [${p.cpId || 'Umum'}] ${p.respondentName} (${p.respondentRole} di ${p.respondentOrg})${extra}`;
                });
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
