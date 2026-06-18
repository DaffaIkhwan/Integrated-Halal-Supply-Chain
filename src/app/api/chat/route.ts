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
      system: `Anda adalah asisten AI Chatbot khusus untuk sistem **Integrated Halal Supply Chain** — Knowledge Management System & Decision Support System (KMS-DSS).

## ATURAN UTAMA (WAJIB DIPATUHI)
1. Untuk **SETIAP pertanyaan** yang berkaitan dengan halal, rantai pasok, regulasi, atau konsep kehalalan — Anda **WAJIB memanggil tool search_knowledge_base** terlebih dahulu SEBELUM menjawab.
2. Jawaban Anda **HANYA boleh berdasarkan data yang dikembalikan oleh tools** (search_knowledge_base, check_halal_risk, trace_halal_batch). **DILARANG menjawab dari pengetahuan umum Anda sendiri.**
3. Jika tool tidak mengembalikan hasil yang relevan, jawab: "Maaf, informasi mengenai topik tersebut belum tersedia dalam Knowledge Base kami saat ini. Silakan hubungi administrator untuk menambahkan dokumen terkait."
4. **JANGAN PERNAH mengarang jawaban**. Lebih baik mengatakan "tidak tersedia" daripada memberikan informasi yang tidak bersumber dari knowledge base.

## CAKUPAN TOPIK
Topik yang diperbolehkan (tetap harus dicari di knowledge base dulu):
  • Konsep halal dalam Islam, dasar hukum halal-haram, thayyib, syubhat
  • Pertanian, peternakan sapi, jenis pakan sapi, kesehatan hewan peliharaan, dan kesejahteraan hewan (animal welfare)
  • 9 Critical Points (CP1–CP9): Farm, Pakan & Kesehatan Hewan, Transportasi, RPH/Penyembelihan, Post-Slaughter, Processing, Cold Storage, Distribusi, Retail
  • Regulasi halal (UU JPH, PP, Permenag, Fatwa MUI, Standar SNI, LPPOM, BPJPH)
  • Proses sertifikasi halal & audit halal
  • Traceability produk daging halal
  • Fuzzy AHP, pembobotan kriteria, analisis risiko halal
  • SOP operasional di setiap titik kritis rantai pasok
  • Keamanan pangan halal, sanitasi, kontaminasi silang

## BATASAN TOPIK
- **PERHATIAN PENTING**: Pertanyaan tentang **sapi, peternakan, pakan (makanan sapi), rumah potong, dan daging** adalah SANGAT RELEVAN dan WAJIB ANDA JAWAB. Jangan pernah menolak pertanyaan seputar pakan sapi atau cara beternak, karena itu adalah bagian esensial dari CP1 dan CP2.
- Pengguna **DIIZINKAN** bertanya tentang data operasional apa saja yang mungkin ada di database (misal: "apa saja pakan", "siapa saja peternak", "daftar farm", "rph"). Jika data spesifik tidak tersedia, jelaskan dengan baik bahwa datanya belum ada di sistem, **JANGAN MENOLAK** pertanyaannya.
- HANYA tolak pertanyaan jika **sama sekali tidak berhubungan** dengan halal, daging, peternakan, sapi, atau rantai pasok (misalnya: coding, game, cuaca, politik, otomotif, gosip selebriti), dengan kalimat:
  "Maaf, saya hanya dapat membantu pertanyaan seputar Halal Supply Chain, Peternakan, dan data operasional sistem ini."

## TOOLS
- **search_knowledge_base**: WAJIB dipanggil untuk SEMUA pertanyaan TEORI, HUKUM, REGULASI, STANDAR (SOP), KONSEP HALAL, atau rekomendasi praktik (contoh: "apa makanan sapi yang disarankan", "hukum stunning", "aturan pemotongan").
- **check_halal_risk**: Untuk data perhitungan Risk Score, bobot Fuzzy AHP, atau Titik Kritis (CP).
- **trace_halal_batch**: Untuk pelacakan batch produk, misalnya "Lacak Batch #123".
- **get_operational_data**: Gunakan ini HANYA JIKA pengguna menanyakan "daftar entitas" atau "data master" yang TERSIMPAN DI DATABASE sistem (contoh: "daftar farm yang ada", "siapa saja rph terdaftar", "siapa juru sembelihnya").

## FORMAT JAWABAN
- Jawab dalam **Bahasa Indonesia** yang terstruktur dan profesional.
- **WAJIB Gunakan Tabel Markdown (Markdown Table)** HANYA saat menyajikan rincian data berulang/berseri. Misalnya, saat menampilkan rincian Critical Points (CP), skor per CP, atau riwayat compliance.
- **JANGAN Gunakan Tabel** untuk **Informasi Umum** (seperti Batch ID, Tanggal Produksi, Asal Ternak, RPH, Total Risk Score, dsb). Untuk bagian Informasi Umum, gunakan format daftar teks biasa (bullet points atau list bersusun).
- **JANGAN cantumkan kolom "Sub-CP", "Sub-CP Tertinggi", atau "Nilai Sub-CP" di dalam tabel**. Sebutkan hal tersebut HANYA pada paragraf penjelasan di bawah tabel.
- Gunakan poin-poin (bullet points) dan heading jika diperlukan untuk penjelasan teks.
- Setelah memanggil tool, rangkum hasilnya menjadi jawaban informatif. Jangan tampilkan data mentah.
- **Khusus setelah memanggil trace_halal_batch**, setelah menyajikan tabel kesimpulan pelacakan, WAJIB sebutkan secara spesifik **CP mana yang memiliki risiko tertinggi beserta Sub-CP penyumbang risiko terbesarnya**. Lalu berikan saran tindakan selanjutnya (recommendations) yang konkrit untuk menurunkan tingkat risiko tersebut.
- Sertakan referensi sumber jika tersedia (nama dokumen, pasal regulasi, dll).
- Jika data dari knowledge base terbatas, sampaikan apa adanya tanpa menambahkan informasi dari luar knowledge base.`,
      messages,
      tools: {
        search_knowledge_base: {
          description: 'Mencari dokumen, teori, aturan, fatwa, SOP, hukum, atau rekomendasi praktik (misalnya standar pakan sapi, hukum stunning). DILARANG menggunakan ini untuk mencari daftar data entitas dari database.',
          parameters: z.object({
            query: z.string().describe('Kata kunci pencarian spesifik (contoh: "hukuman denda Jaminan Produk Halal", "SOP pemotongan", "hukum stunning")'),
          }),
          execute: async ({ query }) => {
            try {
              const stopWords = ['yang', 'untuk', 'dan', 'atau', 'dengan', 'dari', 'pada', 'dalam', 'ini', 'itu', 'adalah', 'sebagai', 'melalui', 'secara', 'apakah', 'bagaimana', 'mengapa', 'hukum', 'boleh', 'tidak', 'saja', 'terkait', 'tentang'];
              const words = query.split(/[\s\?]+/)
                .map(w => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
                .filter(w => w.length > 3 && !stopWords.includes(w));
              
              // Fallback if all words are filtered out
              const finalWords = words.length > 0 ? words : query.split(' ').map(w => w.toLowerCase()).filter(w => w.length > 3);
              const keywords = Array.from(new Set(finalWords)).slice(0, 5);

              if (keywords.length === 0) return 'Kata kunci pencarian tidak ditemukan atau terlalu pendek.';

              // Fetch up to 20 potential matches using OR
              const rawResults = await prisma.kMSDocumentChunk.findMany({
                where: {
                  OR: keywords.map(kw => ({
                    chunk: { contains: kw, mode: 'insensitive' }
                  }))
                },
                take: 20,
                include: { document: true }
              });

              if (rawResults.length === 0) return 'Tidak ada dokumen yang relevan ditemukan.';

              // Score them in memory based on how many distinct keywords they contain
              const scoredResults = rawResults.map(r => {
                const chunkLower = r.chunk.toLowerCase();
                let score = 0;
                keywords.forEach(kw => {
                  if (chunkLower.includes(kw)) score += 1;
                });
                return { ...r, score };
              });

              // Sort by score descending, then take top 4
              scoredResults.sort((a, b) => b.score - a.score);
              const results = scoredResults.slice(0, 4);

              let totalChars = 0;
              const formattedResults = results
                .map(r => {
                  if (totalChars > 3000) return null;
                  const cp = r.document?.criticalPointId || 'UMUM';
                  const truncatedChunk = r.chunk.length > 1000 
                    ? r.chunk.substring(0, 1000) + '...' 
                    : r.chunk;
                  totalChars += truncatedChunk.length;
                  return `[${cp}] ${truncatedChunk}`;
                })
                .filter(Boolean)
                .join('\n\n');

              return `--- RAG KMS Output ---\n${formattedResults}`;
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
                return `--- DSS Batch Risk (${batchId}) ---\nTotal Risk Score: ${batchRisk.totalRiskScore} (${batchRisk.riskLevel})\n\nBreakdown:\n${batchRisk.cpBreakdown
                  .map((cp: any) => `  ${cp.cpId} ${cp.cpName}: Local=${cp.localRiskScore.toFixed(3)} × Global=${cp.globalWeight.toFixed(3)} = ${cp.globalWeightedRisk.toFixed(3)} [${cp.riskLevel}]`)
                  .join('\n')}`;
              }
              const cpWeights = await getDynamicCPWeights();
              if (!cpWeights || cpWeights.length === 0) return 'Data bobot belum tersedia.';
              return `--- DSS Halal Risk Output ---\n${cpWeights
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
              let traceOutput = `--- Traceability Info ---\nBatch ID: ${batchInfo.id}\nTanggal Produksi: ${batchInfo.productionDate}\nTotal Halal Compliance Risk Score: ${batchInfo.totalRiskScore.toFixed(4)} (${batchInfo.riskLevel})\nAsal Ternak: ${batchInfo.cattle.earTag} dari ${batchInfo.cattle.farm.name}\nRPH: ${batchInfo.slaughterhouse.name}`;
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
                       traceOutput += ` (Sub-CP Tertinggi: ${formattedKey} dengan nilai ${risks[0].value})`;
                     }
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
