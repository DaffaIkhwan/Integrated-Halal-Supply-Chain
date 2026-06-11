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
      model: openrouter('minimax/minimax-01'),
      maxToolRoundtrips: 3,
      system: `Anda adalah asisten AI Chatbot cerdas untuk Manajemen Rantai Pasok Halal (Halal Supply Chain).
Gunakan **Tools** berikut secara otomatis berdasarkan "Intensi" *user*:
- **search_knowledge_base**: Jika user bertanya seputar regulasi, prosedur (SOP), atau pengetahuan teoritis Rantai Pasok Halal. Tool ini menggunakan PostgreSQL text search.
- **check_halal_risk**: Jika user menanyakan tentang perhitungan "Risk Score", Status Bahaya, atau Titik Kritis (Critical Points) menggunakan algoritma Fuzzy AHP di RPH.
- **trace_halal_batch**: Jika user meminta Pelacakan (Traceability), misalnya "Lacak Batch #123" atau "Kapan sapi ini dipotong?", jalankan tool ini untuk menarik relasi SQL dari database.

Jawablah dengan terstruktur, profesional, dan gunakan poin-poin. Jangan pernah mengarang data. Jika Anda memanggil alat, tunggu hasil datanya untuk kemudian merangkumnya kepada pengguna secara informatif.
Setelah memanggil tool dan menerima hasilnya, SELALU buatkan rangkuman jawaban dalam bahasa Indonesia yang informatif kepada pengguna. Jangan hanya mengembalikan data mentah.`,
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
                searchResults = await prisma.$queryRawUnsafe(`SELECT chunk, metadata FROM oai WHERE ${conditions} LIMIT 5`, ...keywords);

                // Fallback to OR if AND yields nothing
                if (searchResults.length === 0) {
                  const orConditions = keywords.map((k: string, i: number) => `chunk ILIKE $${i + 1}`).join(' OR ');
                  searchResults = await prisma.$queryRawUnsafe(`SELECT chunk, metadata FROM oai WHERE ${orConditions} LIMIT 5`, ...keywords);
                }
              } else {
                searchResults = await prisma.$queryRaw`SELECT chunk, metadata FROM oai WHERE chunk ILIKE ${`%${query}%`} LIMIT 5`;
              }
              if (!searchResults || searchResults.length === 0) {
                searchResults = await prisma.$queryRaw`SELECT chunk, metadata FROM oai LIMIT 2`;
              }
              return `--- RAG KMS Output ---\n${searchResults
                .map((r: any) => {
                  let meta: any = {};
                  try {
                    meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {});
                  } catch (e) { }
                  const cp = meta.criticalPoint || 'General KMS';
                  return `[${cp}] ${r.chunk}`;
                })
                .join('\n\n')}`;
            } catch (e: any) {
              console.error('RAG search error:', e);
              return `Gagal mencari di knowledge base: ${e.message}`;
            }
          },
        },
        check_halal_risk: {
          description: 'Menarik hasil matriks klasifikasi risiko Fuzzy AHP terkini dari database.',
          parameters: z.object({
            batchId: z.string().optional().describe('Opsional: Batch ID untuk risk score spesifik per batch'),
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
              let traceOutput = `--- Traceability Info ---\nBatch ID: ${batchInfo.id}\nTanggal Produksi: ${batchInfo.productionDate}\nTotal Risk Score: ${batchInfo.totalRiskScore.toFixed(4)} (${batchInfo.riskLevel})\nAsal Ternak: ${batchInfo.cattle.earTag} dari ${batchInfo.cattle.farm.name}\nRPH: ${batchInfo.slaughterhouse.name}`;
              if (batchInfo.cpRecords.length > 0) {
                traceOutput += `\n\nCompliance Records:`;
                for (const rec of batchInfo.cpRecords) {
                  traceOutput += `\n  ${rec.criticalPoint.id} ${rec.criticalPoint.name}: ${rec.complianceStatus} | Risk: ${rec.weightedRisk.toFixed(3)}`;
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
      error?.statusCode === 429 ||
      error?.name === 'AI_RetryError' ||
      error?.name === 'AI_APICallError'
    ) {
      errorMessage = "Limit API Key OpenRouter/Minimax telah habis (Quota Exceeded). Silakan buat API Key baru dan pastikan saldo cukup.";
    } else if (error?.message) {
      errorMessage = `Server Error: ${error.message}`;
    }

    return new Response(errorMessage, {
      status: 500,
    });
  }
}
