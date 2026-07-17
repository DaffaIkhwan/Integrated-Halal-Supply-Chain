/**
 * Rule-Based Intent Classifier
 * Pengganti IndoBERT — tanpa dependency ML, 0ms cold start.
 * 
 * Menggunakan keyword matching dengan priority rules untuk
 * mengklasifikasikan intent user ke 6 label yang sama dengan IndoBERT.
 */

export interface IntentResult {
  label: string;
  score: number;
}

interface IntentRule {
  label: string;
  /** Patterns yang harus match (minimal 1). Regex flags: case-insensitive */
  patterns: RegExp[];
  /** Skor confidence jika match */
  score: number;
  /** Jika true, cek di awal kalimat saja (untuk greeting) */
  startOnly?: boolean;
}

const INTENT_RULES: IntentRule[] = [
  // ─── Greeting (highest priority, check first) ───
  {
    label: 'greeting',
    patterns: [
      /^(halo|hai|hi|hello|hey|selamat\s*(pagi|siang|sore|malam)|assalamu)/i,
      /^(apa\s*kabar|salam)/i,
    ],
    score: 1.0,
    startOnly: true,
  },

  // ─── Out of scope ───
  {
    label: 'out_of_scope',
    patterns: [
      /\b(resep\s*masak|harga\s*saham|cuaca|presiden|sepak\s*bola|film|musik|game|anime)\b/i,
      /\b(siapa\s*(kamu|anda|nama\s*mu)|kamu\s*siapa)\b/i,
      /\b(ceritakan\s*lelucon|joke|lucu)\b/i,
    ],
    score: 0.95,
  },

  // ─── Batch trace ───
  {
    label: 'batch_trace',
    patterns: [
      /\b(lacak|trace|tracking|telusur|pelacak)\b/i,
      /\b(batch\s*[A-Z0-9\-]+|eartag|ear\s*tag)\b/i,
      /\b(riwayat|histori|jejak)\s*(batch|produk|daging|sapi)\b/i,
      /\b(dari\s*mana|asal|sumber)\s*(batch|daging|sapi|produk)\b/i,
    ],
    score: 0.9,
  },

  // ─── Risk check ───
  {
    label: 'risk_check',
    patterns: [
      /\b(risiko|risk|bahaya|ancaman|kerentanan|vulnerab)\b/i,
      /\b(cek|periksa|lihat|tampilkan)\s*(risiko|risk|skor|score)\b/i,
      /\b(fuzzy\s*ahp|bobot|weight|matriks)\b/i,
      /\b(titik\s*kritis|critical\s*point|cp[1-9])\b/i,
      /\b(tingkat|level|status)\s*(risiko|risk|kehalalan|halal)\b/i,
    ],
    score: 0.9,
  },

  // ─── Operational data ───
  {
    label: 'operational_data',
    patterns: [
      /\b(daftar|list|data|rekap)\s*(farm|rph|sapi|batch|gudang|distributor|retail|transporter|juru\s*sembelih)\b/i,
      /\b(berapa\s*(jumlah|total|banyak))\b/i,
      /\b(statistik|summary|rangkuman)\s*(data|operasional|sistem)\b/i,
      /\b(tampilkan|tunjukkan|show)\s*(semua|seluruh|all)\b/i,
    ],
    score: 0.85,
  },

  // ─── Knowledge query (broadest — catch-all for domain questions) ───
  {
    label: 'knowledge_query',
    patterns: [
      /\b(apa\s*(itu|yang|saja)|bagaimana|mengapa|kenapa|jelaskan|sebutkan)\b/i,
      /\b(regulasi|aturan|undang|fatwa|standar|sop|prosedur|syariat|syariah|hukum)\b/i,
      /\b(halal|haram|syubhat|najis|sembelih|penyembelihan|stunning)\b/i,
      /\b(bpjph|mui|lppom|kemenag|sertifikasi\s*halal)\b/i,
      /\b(pakan|vaksin|obat|veteriner|ante.?mortem|post.?mortem|karkas)\b/i,
      /\b(cold\s*storage|suhu|sanitasi|higienis|kontaminasi|segregasi)\b/i,
    ],
    score: 0.8,
  },
];

/**
 * Mengklasifikasikan intent user menggunakan aturan keyword matching.
 * Kompatibel 100% dengan interface IndoBERT (IntentResult).
 * 
 * @param text - Pesan user
 * @returns IntentResult dengan label dan confidence score, atau null jika tidak match
 */
export async function classifyIntent(text: string): Promise<IntentResult | null> {
  if (!text || text.trim().length === 0) return null;

  const cleaned = text.trim();

  for (const rule of INTENT_RULES) {
    const matched = rule.patterns.some(pattern => {
      if (rule.startOnly) {
        return pattern.test(cleaned);
      }
      return pattern.test(cleaned);
    });

    if (matched) {
      console.log(`[RuleBase] Intent: ${rule.label} (score: ${rule.score}) for: "${cleaned.substring(0, 50)}..."`);
      return {
        label: rule.label,
        score: rule.score,
      };
    }
  }

  // Default: treat as knowledge_query jika cukup panjang (likely a question)
  if (cleaned.length > 10) {
    console.log(`[RuleBase] Default fallback to knowledge_query for: "${cleaned.substring(0, 50)}..."`);
    return { label: 'knowledge_query', score: 0.7 };
  }

  return null;
}
