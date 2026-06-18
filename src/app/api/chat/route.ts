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
  • 9 Critical Points (CP1–CP9): Farm, Pakan & Kesehatan Hewan, Transportasi, RPH/Penyembelihan, Post-Slaughter, Processing, Cold Storage, Distribusi, Retail
  • Regulasi halal (UU JPH, PP, Permenag, Fatwa MUI, Standar SNI, LPPOM, BPJPH)
  • Proses sertifikasi halal & audit halal
  • Traceability produk daging halal
  • Fuzzy AHP, pembobotan kriteria, analisis risiko halal
  • SOP operasional di setiap titik kritis rantai pasok
  • Keamanan pangan halal, sanitasi, kontaminasi silang

## BATASAN TOPIK
- Jika pengguna bertanya tentang topik yang **sama sekali tidak berhubungan** dengan halal, pangan, atau rantai pasok (misalnya: coding, game, cuaca, hiburan, politik, gosip), **tolak dengan sopan**:
  "Maaf, saya hanya dapat membantu pertanyaan seputar **Halal Supply Chain** dan topik kehalalan. Silakan ajukan pertanyaan terkait regulasi halal, titik kritis (CP1–CP9), traceability, atau analisis risiko halal."

## TOOLS
- **search_knowledge_base**: WAJIB dipanggil untuk SEMUA pertanyaan seputar halal. Cari informasi dari dokumen dan regulasi di knowledge base.
- **check_halal_risk**: Untuk data perhitungan Risk Score, bobot Fuzzy AHP, atau Titik Kritis (CP).
- **trace_halal_batch**: Untuk pelacakan batch produk, misalnya "Lacak Batch #123".

## FORMAT JAWABAN
- Jawab dalam **Bahasa Indonesia** yang terstruktur dan profesional.
- **WAJIB Gunakan Tabel Markdown (Markdown Table)** HANYA saat menyajikan rincian data berulang/berseri. Misalnya, saat menampilkan rincian Critical Points (CP), skor per CP, atau riwayat compliance.
- **JANGAN Gunakan Tabel** untuk **Informasi Umum** (seperti Batch ID, Tanggal Produksi, Asal Ternak, RPH, Total Risk Score, dsb). Untuk bagian Informasi Umum, gunakan format daftar teks biasa (bullet points atau list bersusun).
- Gunakan poin-poin (bullet points) dan heading jika diperlukan untuk penjelasan teks.
- Setelah memanggil tool, rangkum hasilnya menjadi jawaban informatif. Jangan tampilkan data mentah.
- **Khusus setelah memanggil trace_halal_batch**, setelah menyajikan tabel kesimpulan pelacakan, WAJIB berikan saran tindakan selanjutnya (recommendations) yang konkrit untuk menurunkan tingkat risiko ketidakhalalan pada CP yang memiliki kategori Moderate Risk, High Risk, atau Critical Risk.
- Sertakan referensi sumber jika tersedia (nama dokumen, pasal regulasi, dll).
- Jika data dari knowledge base terbatas, sampaikan apa adanya tanpa menambahkan informasi dari luar knowledge base.`,
      messages,
      tools: {
        search_knowledge_base: {
          description: 'Mencari informasi riil dari dokumen dan regulasi Halal (KMS) melalui Database Text Search.',
          parameters: z.object({
            query: z.string().describe('Kata kunci pencarian spesifik (contoh: "hukuman denda Jaminan Produk Halal", "SOP pemotongan")'),
          }),
          execute: async ({ query }) => {
            try {
              // Filter stop words from query
              const stopWords = ['yang', 'untuk', 'dan', 'atau', 'dengan', 'dari', 'pada', 'dalam', 'ini', 'itu'];
              const words = query.split(' ')
                .map(w => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
                .filter(w => w.length > 3 && !stopWords.includes(w))
                .sort((a, b) => b.length - a.length); // Sort by length descending to prioritize important keywords

              // Take the top 2 longest/most important words
              const keywords = words.slice(0, 2).map(w => `%${w}%`);
              let searchResults: any[] = [];

              if (keywords.length > 0) {
                // Try AND matching first for high relevance
                const conditions = keywords.map((k: string, i: number) => `chunk ILIKE $${i + 1}`).join(' AND ');
                searchResults = await prisma.$queryRawUnsafe(`SELECT chunk, metadata FROM oai WHERE ${conditions} LIMIT 3`, ...keywords);

                // Fallback to OR if AND yields nothing
                if (searchResults.length === 0) {
                  const orConditions = keywords.map((k: string, i: number) => `chunk ILIKE $${i + 1}`).join(' OR ');
                  searchResults = await prisma.$queryRawUnsafe(`SELECT chunk, metadata FROM oai WHERE ${orConditions} LIMIT 3`, ...keywords);
                }
              } else {
                searchResults = await prisma.$queryRaw`SELECT chunk, metadata FROM oai WHERE chunk ILIKE ${`%${query}%`} LIMIT 3`;
              }
              if (!searchResults || searchResults.length === 0) {
                searchResults = await prisma.$queryRaw`SELECT chunk, metadata FROM oai LIMIT 2`;
              }

              const MAX_CHUNK_CHARS = 1500;
              const MAX_TOTAL_CHARS = 4500;
              let totalChars = 0;

              const formattedResults = searchResults
                .map((r: any) => {
                  if (totalChars >= MAX_TOTAL_CHARS) return null;
                  let meta: any = {};
                  try {
                    meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {});
                  } catch (e) { }
                  const cp = meta.criticalPoint || 'General KMS';
                  const truncatedChunk = r.chunk.length > MAX_CHUNK_CHARS
                    ? r.chunk.substring(0, MAX_CHUNK_CHARS) + '... [dipotong]'
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
                include: { cattle: { include: { farm: true } }, slaughterhouse: true, cpRecords: { include: { criticalPoint: true }, orderBy: { criticalPoint: { id: 'asc' } } } }
              });
              if (!batchInfo) {
                batchInfo = await prisma.halalBatch.findFirst({
                  where: { id: { contains: batchId } },
                  include: { cattle: { include: { farm: true } }, slaughterhouse: true, cpRecords: { include: { criticalPoint: true }, orderBy: { criticalPoint: { id: 'asc' } } } }
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
                }
              }
              return traceOutput;
            } catch (e: any) {
              return `Gagal melacak: ${e.message}`;
            }
          },
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
