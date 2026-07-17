export type TFN = [number, number, number]; // [l, m, u] (Lower, Middle, Upper)

/**
 * Fuzzy Linguistic Scale for Halal Risk Assessment
 * Berdasarkan skala Saaty yang di-fuzzy-kan
 */
export const FuzzyScale = {
  EQUAL: [1, 1, 1] as TFN,
  MODERATE: [1, 3, 5] as TFN,
  STRONG: [3, 5, 7] as TFN,
  VERY_STRONG: [5, 7, 9] as TFN,
  EXTREME: [7, 9, 9] as TFN,
};

// ======================================================================
// Core Mathematical Functions (Pure — tidak bergantung DB)
// ======================================================================

/** Mendapatkan nilai resiprokal/kebalikan dari TFN */
export function getReciprocal(tfn: TFN): TFN {
  if (!tfn) return [1, 1, 1] as TFN;
  return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
}

/** Menjumlahkan array TFN */
export function sumTFNs(tfns: TFN[]): TFN {
  return tfns.reduce(
    (acc, val) => {
      if (!val) return acc;
      return [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]] as TFN;
    },
    [0, 0, 0] as TFN
  );
}

/**
 * Menghitung Fuzzy Synthetic Extent (FSE)
 * S_i = Σ M_{gi}^j ⊗ [Σ Σ M_{gi}^j]^{-1}
 */
export function calculateFSE(matrix: TFN[][]): TFN[] {
  if (!matrix || matrix.length === 0) {
    throw new Error('Matriks kosong, tidak bisa menghitung FSE.');
  }
  const rowSums = matrix.map((row) => sumTFNs(row.map(cell => cell || [1, 1, 1] as TFN)));
  const totalSum = sumTFNs(rowSums);
  const reverseTotal = getReciprocal(totalSum);

  return rowSums.map((rowSum) => [
    rowSum[0] * reverseTotal[0],
    rowSum[1] * reverseTotal[1],
    rowSum[2] * reverseTotal[2],
  ]);
}

/** Defuzzification menggunakan metode Center of Area (CoA): D = (l + m + u) / 3 */
export function defuzzify(tfn: TFN): number {
  if (!tfn) return 0;
  return (tfn[0] + tfn[1] + tfn[2]) / 3;
}

/** Menormalkan array sehingga totalnya = 1 */
export function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 1 / weights.length);
  return weights.map((w) => w / sum);
}

/** Menentukan level risiko berdasarkan skor */
export function getRiskLevel(score: number): string {
  if (score >= 0.76) return "Critical";
  if (score >= 0.51) return "High";
  if (score >= 0.26) return "Moderate";
  return "Low";
}

/**
 * Menghitung bobot dari matriks TFN (generik — bisa Level 1 atau Level 2)
 */
export function calculateWeightsFromMatrix(matrix: TFN[][], codes: string[]) {
  const fse = calculateFSE(matrix);
  const crispValues = fse.map((val) => defuzzify(val));
  const normalizedWeights = normalizeWeights(crispValues);

  return codes.map((code, index) => ({
    code,
    weight: normalizedWeights[index],
    fse: fse[index],
  }));
}

/**
 * Menghitung Consistency Ratio (CR)
 * 1. Defuzzify matriks TFN → matriks crisp
 * 2. Normalisasi kolom matriks crisp dan rata-ratakan barisnya untuk mendapat Vektor Bobot (Wi) Konvensional
 * 3. Hitung Aw (matriks crisp × Wi)
 * 4. λmax = (1/n) Σ (Aw_i / w_i)
 * 5. CI = (λmax - n) / (n - 1)
 * 6. CR = CI / RI
 */
export function calculateConsistencyRatio(matrix: TFN[][]): {
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
} {
  const n = matrix.length;

  // Random Index (RI) table — Saaty (1990)
  const RI_TABLE: Record<number, number> = {
    1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
  };

  // Defuzzify matrix → crisp (with null-safe fallback)
  const crispMatrix = matrix.map((row) => row.map((cell) => defuzzify(cell || [1, 1, 1] as TFN)));

  // Calculate classical AHP weights (Wi)
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) colSums[j] += crispMatrix[i][j];
  }

  const crispWeights = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += crispMatrix[i][j] / colSums[j];
    }
    crispWeights[i] = rowSum / n;
  }

  // Aw = crispMatrix × crispWeights
  const Aw = crispMatrix.map((row) =>
    row.reduce((sum, val, j) => sum + val * crispWeights[j], 0)
  );

  // λmax
  const lambdaMax = Aw.reduce((sum, aw_i, i) => {
    if (crispWeights[i] === 0) return sum;
    return sum + aw_i / crispWeights[i];
  }, 0) / n;

  const ci = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
  const ri = RI_TABLE[n] || 1.49;
  const cr = ri === 0 ? 0 : ci / ri;

  return {
    lambdaMax: Number(lambdaMax.toFixed(4)),
    ci: Number(ci.toFixed(4)),
    cr: Number(cr.toFixed(4)),
    isConsistent: cr < 0.10,
  };
}

// ======================================================================
// Database-Driven Functions (Dynamic — baca/tulis dari PostgreSQL)
// ======================================================================

import { prisma } from '@/lib/db/client';

/**
 * Membaca matriks perbandingan berpasangan dari DB dan merekonstruksinya
 * menjadi matriks TFN n×n
 */
export async function loadMatrixFromDB(matrixType: string): Promise<{
  matrix: TFN[][];
  codes: string[];
}> {
  const entries = await prisma.pairwiseComparison.findMany({
    where: { matrixType },
    orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
  });

  if (entries.length === 0) {
    throw new Error(`Matriks "${matrixType}" belum ada di database. Silakan isi data matriks perbandingan berpasangan terlebih dahulu.`);
  }

  // Extract unique codes from BOTH rowCode and colCode to ensure completeness
  const codeSet = new Set<string>();
  for (const e of entries) {
    codeSet.add(e.rowCode);
    codeSet.add(e.colCode);
  }
  const allCodes = Array.from(codeSet);
  allCodes.sort();
  const n = allCodes.length;

  // Build n×n TFN matrix safely
  const matrix: TFN[][] = [];
  for (let r = 0; r < n; r++) {
    const row: TFN[] = [];
    for (let c = 0; c < n; c++) {
      row.push([1, 1, 1] as TFN);
    }
    matrix.push(row);
  }

  for (const entry of entries) {
    const i = allCodes.indexOf(entry.rowCode);
    const j = allCodes.indexOf(entry.colCode);
    if (i >= 0 && j >= 0) {
      matrix[i][j] = [entry.tfnLow, entry.tfnMid, entry.tfnUp];
    }
  }

  return { matrix, codes: allCodes };
}

/**
 * Menghitung bobot Level 1 (antar CP) dari DB dan menyimpan hasilnya
 * ke tabel CriticalPoint
 */
export async function recalculateLevel1Weights(): Promise<{
  weights: { code: string; weight: number }[];
  cr: ReturnType<typeof calculateConsistencyRatio>;
}> {
  const { matrix, codes } = await loadMatrixFromDB('LEVEL1_CP');
  const results = calculateWeightsFromMatrix(matrix, codes);
  const cr = calculateConsistencyRatio(matrix);

  // Update CriticalPoint.globalWeight di DB
  for (const r of results) {
    await prisma.criticalPoint.update({
      where: { id: r.code },
      data: { globalWeight: r.weight },
    });
  }

  return {
    weights: results.map((r) => ({ code: r.code, weight: r.weight })),
    cr,
  };
}

/**
 * Menghitung bobot Level 2 (kriteria dalam 1 CP) dari DB dan menyimpan
 * hasilnya ke tabel CriteriaWeight
 */
export async function recalculateLevel2Weights(cpId: string): Promise<{
  weights: { code: string; weight: number }[];
  cr: ReturnType<typeof calculateConsistencyRatio>;
}> {
  const matrixType = `LEVEL2_${cpId}`;
  const { matrix, codes } = await loadMatrixFromDB(matrixType);
  const results = calculateWeightsFromMatrix(matrix, codes);
  const cr = calculateConsistencyRatio(matrix);

  // Update CriteriaWeight.weight di DB
  for (const r of results) {
    await prisma.criteriaWeight.updateMany({
      where: { criticalPointId: cpId, criteriaCode: r.code },
      data: { weight: r.weight },
    });
  }

  return {
    weights: results.map((r) => ({ code: r.code, weight: r.weight })),
    cr,
  };
}

/**
 * Menghitung SEMUA bobot (Level 1 + semua Level 2) sekaligus
 * dan me-update risk score di CriticalPoint
 */
export async function recalculateAllWeights() {
  // 1. Hitung bobot Level 1 (antar CP)
  const level1 = await recalculateLevel1Weights();

  // 2. Hitung bobot Level 2 untuk setiap CP yang memiliki matriks
  const cps = await prisma.criticalPoint.findMany({ orderBy: { id: 'asc' } });
  const level2Results: Record<string, { weights: { code: string; weight: number }[]; cr: any }> = {};

  for (const cp of cps) {
    try {
      const result = await recalculateLevel2Weights(cp.id);
      level2Results[cp.id] = result;
    } catch {
      // Matriks Level 2 belum ada untuk CP ini — skip
    }
  }

  return { level1, level2: level2Results };
}

/**
 * Menghitung Risk Score per Batch berdasarkan data CP Records + bobot dari DB
 * Formula: RiskScore_CP = Σ(weight_criteria × riskValue_from_record)
 * GlobalRisk = globalWeight_CP × RiskScore_CP
 */
export async function calculateBatchRiskScore(batchId: string) {
  const batch = await prisma.halalBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new Error(`Batch ${batchId} tidak ditemukan.`);

  const cps = await prisma.criticalPoint.findMany({
    include: { criteriaWeights: true },
    orderBy: { id: 'asc' },
  });

  let totalGlobalRisk = 0;
  const cpResults: {
    cpId: string;
    cpName: string;
    localRiskScore: number;
    globalWeight: number;
    globalWeightedRisk: number;
    riskLevel: string;
  }[] = [];

  for (const cp of cps) {
    // Get the matching CP record for this batch
    const record = await getCPRecordRiskValues(batchId, cp.id);
    if (!record) continue;

    // Calculate local risk score using Rule-Based (MAX / Weakest-Link) instead of Weighted Sum
    let maxRawValue = 0;
    for (const cw of cp.criteriaWeights) {
      const rawValue = record[cw.criteriaCode] ?? 0; // 1 to 5 scale
      if (rawValue > maxRawValue) {
        maxRawValue = rawValue;
      }
    }
    
    // Convert raw scale 1-5 to crisp decimal 0.2 - 1.0 to maintain compatibility with DB and UI
    const localRisk = maxRawValue > 0 ? maxRawValue * 0.20 : 0;

    // Rule-Based ignores global weights for calculation, but we map it directly so DB fields stay populated
    const globalWeightedRisk = localRisk; 
    
    // Total batch risk is the MAX of all CP risks (Weakest-Link)
    if (localRisk > totalGlobalRisk) {
      totalGlobalRisk = localRisk;
    }

    cpResults.push({
      cpId: cp.id,
      cpName: cp.name,
      localRiskScore: Number(localRisk.toFixed(4)),
      globalWeight: cp.globalWeight,
      globalWeightedRisk: Number(globalWeightedRisk.toFixed(4)),
      riskLevel: getRiskLevel(localRisk),
    });

    // Update CriticalPoint local risk scores
    await prisma.criticalPoint.update({
      where: { id: cp.id },
      data: {
        localRiskScore: localRisk,
        globalWeightedRisk: globalWeightedRisk,
        riskLevel: getRiskLevel(localRisk),
      },
    });

    // Update CriticalPointRecord for this batch and CP
    await prisma.criticalPointRecord.updateMany({
      where: { halalBatchId: batchId, criticalPointId: cp.id },
      data: {
        riskValue: localRisk,
        weightedRisk: globalWeightedRisk,
      },
    });
  }

  // Update batch total risk
  await prisma.halalBatch.update({
    where: { id: batchId },
    data: {
      totalRiskScore: totalGlobalRisk,
      riskLevel: getRiskLevel(totalGlobalRisk),
    },
  });

  return {
    batchId,
    totalRiskScore: Number(totalGlobalRisk.toFixed(4)),
    riskLevel: getRiskLevel(totalGlobalRisk),
    cpBreakdown: cpResults,
  };
}

/**
 * Helper: Mengambil risk values dari CP Record tabel sesuai CP ID
 * Returns: { criteriaCode: riskValue }
 */
async function getCPRecordRiskValues(
  batchId: string,
  cpId: string
): Promise<Record<string, number> | null> {
  const fieldMappings: Record<string, { model: string; fields: Record<string, string> }> = {
    CP1: {
      model: 'cP1FarmRecord',
      fields: { F1: 'asalUsulRisk', F2: 'kesehatanRisk', F3: 'kepatuhanPakanRisk', F4: 'obatVaksinRisk', F5: 'dokumentasiRisk', F6: 'kebersihanKandangRisk', F7: 'kesiapanSembelihRisk' },
    },
    CP2: {
      model: 'cP2FeedRecord',
      fields: { FD1: 'halalFeedStatusRisk', FD2: 'supplierRisk', FD3: 'feedStorageRisk', FD4: 'medicationRisk', FD5: 'vetSupervisionRisk' },
    },
    CP3: {
      model: 'cP3TransportRecord',
      fields: { T1: 'kelayakanRisk', T2: 'kebersihanRisk', T3: 'animalWelfareRisk', T4: 'traceabilityRisk', T5: 'dokumentasiRisk' },
    },
    CP4: {
      model: 'cP4SlaughterRecord',
      fields: { R1: 'sertifikatHalalRisk', R2: 'kompetensiSembelihRisk', R3: 'prosesSyariahRisk', R4: 'pemeriksaanRisk', R5: 'sanitasiRisk', R6: 'segregasiRisk', R7: 'dokumentasiRisk', R8: 'pengawasanRisk', R9: 'auditRisk', R10: 'traceabilityRisk' },
    },
    CP5: {
      model: 'cP5PostSlaughterRecord',
      fields: { PS1: 'handlingRisk', PS2: 'sanitasiRisk', PS3: 'batchIdRisk', PS4: 'segregasiRisk', PS5: 'dokumentasiRisk' },
    },
    CP6: {
      model: 'cP6ProcessingRecord',
      fields: { P1: 'halalIngredientsRisk', P2: 'equipmentRisk', P3: 'dedicatedLineRisk', P4: 'batchControlRisk', P5: 'packagingRisk', P6: 'operatorRisk', P7: 'formulaRisk' },
    },
    CP7: {
      model: 'cP7StorageRecord',
      fields: { CS1: 'temperatureRisk', CS2: 'segregasiRisk', CS3: 'hygieneRisk', CS4: 'traceabilityRisk', CS5: 'fifoFefoRisk', CS6: 'dokumentasiRisk', CS7: 'incidentRisk' },
    },
    CP8: {
      model: 'cP8DistributionRecord',
      fields: { D1: 'dedicatedTransRisk', D2: 'vehicleSanitasiRisk', D3: 'temperatureRisk', D4: 'routeRisk', D5: 'loadingRisk', D6: 'dokumentasiRisk', D7: 'kontaminasiRisk' },
    },
    CP9: {
      model: 'cP9RetailRecord',
      fields: { RT1: 'labelHalalRisk', RT2: 'displayRisk', RT3: 'storageTemRisk', RT4: 'expiryRisk', RT5: 'consumerInfoRisk', RT6: 'supplierTraceRisk', RT7: 'complaintRisk' },
    },
  };

  const mapping = fieldMappings[cpId];
  if (!mapping) return null;

  // Dynamic query using prisma
  const record = await (prisma as any)[mapping.model].findFirst({
    where: { halalBatchId: batchId },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return null;

  const result: Record<string, number> = {};
  for (const [code, field] of Object.entries(mapping.fields)) {
    result[code] = record[field] ?? 0;
  }
  return result;
}

// ======================================================================
// Reference Data (Metadata — no calculation logic)
// ======================================================================

/** CP metadata for chatbot intent detection (keyword matching) */
export const HALAL_CRITICAL_POINTS = [
  { id: "CP1", name: "Farm/Kandang Sapi", keywords: ["farm", "kandang", "sapi", "ternak"] },
  { id: "CP2", name: "Pakan & Kesehatan Hewan", keywords: ["pakan", "obat", "vaksin", "veteriner"] },
  { id: "CP3", name: "Transportasi ke RPH", keywords: ["transport", "kendaraan", "angkut"] },
  { id: "CP4", name: "RPH/Penyembelihan", keywords: ["sembelih", "RPH", "pisau", "juru sembelih"] },
  { id: "CP5", name: "Post-Slaughter Handling", keywords: ["karkas", "post-slaughter", "carcass"] },
  { id: "CP6", name: "Processing/Pengolahan", keywords: ["proses", "olah", "bumbu", "mesin"] },
  { id: "CP7", name: "Cold Storage/Warehouse", keywords: ["gudang", "suhu", "cold storage", "pendingin"] },
  { id: "CP8", name: "Distribusi/Logistik", keywords: ["distribusi", "logistik", "kirim"] },
  { id: "CP9", name: "Retail/Pasar/Supermarket", keywords: ["retail", "pasar", "supermarket", "toko"] },
];

/**
 * Mendapatkan bobot Critical Points dari database (dynamic, dari Fuzzy AHP).
 * Tidak ada fallback ke data hardcoded — jika DB kosong, throws error.
 */
export async function getDynamicCPWeights() {
  const cps = await prisma.criticalPoint.findMany({
    include: { criteriaWeights: true },
    orderBy: { id: 'asc' },
  });

  if (cps.length === 0) {
    throw new Error(
      'Data CriticalPoint belum ada di database. Jalankan seed-criteria.ts terlebih dahulu.'
    );
  }

  return cps.map((cp) => ({
    cpId: cp.id,
    name: cp.name,
    weight: cp.globalWeight,
    localRiskScore: cp.localRiskScore,
    globalWeightedRisk: cp.globalWeightedRisk,
    riskLevel: cp.riskLevel,
    criteria: cp.criteriaWeights.map((cw) => ({
      code: cw.criteriaCode,
      name: cw.criteriaName,
      weight: cw.weight,
    })),
  }));
}

