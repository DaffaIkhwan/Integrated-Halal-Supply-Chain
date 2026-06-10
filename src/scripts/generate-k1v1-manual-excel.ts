/**
 * GENERATE EXCEL PERHITUNGAN MANUAL K1V1 — LENGKAP SEMUA DATA
 *
 * Menampilkan SEMUA data K1V1 per responden:
 * - KU_LEVEL (Kriteria Umum)
 * - CP_LEVEL (Antar CP — Level 1)
 * - Sub-CP1 s/d Sub-CP9 (Sub-kriteria per CP — Level 2)
 *
 * Setiap level dibuat 1 sheet berisi:
 *   1. Data Slider setiap responden
 *   2. Konversi TFN (l, m, u) — rumus Excel
 *   3. Geometric Mean — rumus Excel
 *   4. Matriks TFN 9×9 — rumus Excel
 *   5. FSE + Defuzzifikasi + Bobot — rumus Excel
 *   6. Consistency Ratio — rumus Excel
 *
 * Run: pnpm dlx tsx src/scripts/generate-k1v1-manual-excel.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── Cell Helpers ───

function colL(idx: number): string {
  let r = '', n = idx;
  while (n >= 0) { r = String.fromCharCode((n % 26) + 65) + r; n = Math.floor(n / 26) - 1; }
  return r;
}
function cr(row: number, col: number) { return `${colL(col)}${row}`; }
function fc(f: string, z?: string): XLSX.CellObject { const c: XLSX.CellObject = { t: 'n', f }; if (z) c.z = z; return c; }
function tc(v: string): XLSX.CellObject { return { t: 's', v }; }
function nc(v: number, z?: string): XLSX.CellObject { const c: XLSX.CellObject = { t: 'n', v }; if (z) c.z = z; return c; }
function sc(ws: XLSX.WorkSheet, row: number, col: number, cell: XLSX.CellObject) { ws[cr(row, col)] = cell; }
function expand(ws: XLSX.WorkSheet, maxR: number, maxC: number) {
  const rng = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  if (maxR > rng.e.r) rng.e.r = maxR;
  if (maxC > rng.e.c) rng.e.c = maxC;
  ws['!ref'] = XLSX.utils.encode_range(rng);
}

// ─── Constants ───

const RI: Record<number, number> = { 1:0, 2:0, 3:0.58, 4:0.90, 5:1.12, 6:1.24, 7:1.32, 8:1.41, 9:1.45, 10:1.49 };
const FZ = { EQUAL:[1,1,1], MODERATE:[1,3,5], STRONG:[3,5,7], VERY_STRONG:[5,7,9], EXTREME:[7,9,9] };

function getTFN(v: number): [number,number,number] {
  const a = Math.abs(v) + 1;
  let t: number[];
  if (a===1) t=[...FZ.EQUAL]; else if (a<=3) t=[...FZ.MODERATE]; else if (a<=5) t=[...FZ.STRONG]; else if (a<=7) t=[...FZ.VERY_STRONG]; else t=[...FZ.EXTREME];
  if (v > 0) return [1/t[2], 1/t[1], 1/t[0]];
  return t as [number,number,number];
}

// ─── Types ───

interface LevelData {
  type: string;
  label: string;
  sheetName: string;
  codes: string[];
  respondents: { name: string; role: string|null; comparisons: Record<string,number> }[];
}

interface SheetMeta {
  sheetName: string;
  label: string;
  codes: string[];
  fseStart: number;
  lmRow: number | null;
  ciRow: number | null;
  crRow: number | null;
  n: number;
}

// ─── Load ALL K1V1 Data ───

async function loadAllK1V1(): Promise<LevelData[]> {
  const responses = await prisma.questionnaireResponse.findMany({
    where: { questionnaireType: 'pembobotan' },
    orderBy: { createdAt: 'asc' },
  });

  // Group by answers.type
  const byType: Record<string, { name: string; role: string|null; comparisons: Record<string,number> }[]> = {};

  for (const r of responses) {
    const ans = r.answers as any;
    if (!ans || !ans.comparisons || Object.keys(ans.comparisons).length === 0) continue;
    const type = String(ans.type || 'UNKNOWN');
    if (!byType[type]) byType[type] = [];
    byType[type].push({
      name: r.respondentName,
      role: r.respondentRole,
      comparisons: ans.comparisons as Record<string,number>,
    });
  }

  // Extract codes from comparison keys
  function extractCodes(comparisons: Record<string,number>[]): string[] {
    const codes = new Set<string>();
    for (const c of comparisons) {
      for (const key of Object.keys(c)) {
        const parts = key.split('_vs_');
        if (parts.length === 2) { codes.add(parts[0]); codes.add(parts[1]); }
      }
    }
    return Array.from(codes).sort();
  }

  const levels: LevelData[] = [];

  // KU_LEVEL
  if (byType['KU_LEVEL']) {
    levels.push({
      type: 'KU_LEVEL', label: 'Kriteria Umum (KU)', sheetName: 'KU_LEVEL',
      codes: extractCodes(byType['KU_LEVEL'].map(r => r.comparisons)),
      respondents: byType['KU_LEVEL'],
    });
  }

  // CP_LEVEL
  if (byType['CP_LEVEL']) {
    levels.push({
      type: 'CP_LEVEL', label: 'Antar CP — Level 1', sheetName: 'CP_LEVEL',
      codes: extractCodes(byType['CP_LEVEL'].map(r => r.comparisons)),
      respondents: byType['CP_LEVEL'],
    });
  }

  // Sub-CP levels
  for (let cpNum = 1; cpNum <= 9; cpNum++) {
    const cpId = `CP${cpNum}`;
    if (byType[cpId]) {
      levels.push({
        type: cpId, label: `Sub-Kriteria ${cpId}`, sheetName: `SUB_${cpId}`,
        codes: extractCodes(byType[cpId].map(r => r.comparisons)),
        respondents: byType[cpId],
      });
    }
  }

  return levels;
}

// ═══════════════════════════════════════════════════════════════
// Build ONE comprehensive sheet per level
// ═══════════════════════════════════════════════════════════════

function buildLevelSheet(wb: XLSX.WorkBook, level: LevelData): SheetMeta {
  const ws: XLSX.WorkSheet = {};
  ws['!ref'] = 'A1';

  const n = level.codes.length;
  const numR = level.respondents.length;
  const pairs: [number,number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  const numP = pairs.length;

  const pairIndex: Record<string, number> = {};
  for (let p = 0; p < numP; p++) pairIndex[`${pairs[p][0]}_${pairs[p][1]}`] = p;

  let row = 1;

  // ═══ TITLE ═══
  sc(ws, row, 0, tc(`PERHITUNGAN MANUAL K1V1 — ${level.label}`)); row++;
  sc(ws, row, 0, tc(`Kriteria: ${level.codes.join(', ')} (n=${n})`)); row++;
  sc(ws, row, 0, tc(`Pasangan: ${numP} | Responden: ${numR}`)); row++;
  sc(ws, row, 0, tc(`Slider: -8..8 | Negatif=Kiri penting | 0=Sama | Positif=Kanan penting`)); row += 2;

  // ═══ TFN LOOKUP TABLE ═══
  sc(ws, row, 0, tc('TABEL REFERENSI TFN'));  row++;
  sc(ws, row, 0, tc('absVal')); sc(ws, row, 1, tc('l')); sc(ws, row, 2, tc('m')); sc(ws, row, 3, tc('u')); row++;
  const tblStart = row;
  const tblData: [number,number,number,number][] = [
    [1,1,1,1],[2,1,3,5],[3,1,3,5],[4,3,5,7],[5,3,5,7],[6,5,7,9],[7,5,7,9],[8,7,9,9],[9,7,9,9]
  ];
  for (const [a,l,m,u] of tblData) { sc(ws,row,0,nc(a)); sc(ws,row,1,nc(l)); sc(ws,row,2,nc(m)); sc(ws,row,3,nc(u)); row++; }
  const tblEnd = row - 1;
  const tblRange = `$A$${tblStart}:$D$${tblEnd}`;

  row += 1;

  // ═══ RESPONDENT LEGEND ═══
  sc(ws, row, 0, tc('DAFTAR RESPONDEN:')); row++;
  for (let r = 0; r < numR; r++) {
    sc(ws, row, 0, tc(`R${r+1}`));
    sc(ws, row, 1, tc(level.respondents[r].name));
    sc(ws, row, 2, tc(level.respondents[r].role || '-'));
    row++;
  }
  row += 2;

  // ═══ SECTION 1: SLIDER VALUES ═══
  sc(ws, row, 0, tc('═══ BAGIAN 1: DATA SLIDER RESPONDEN ═══')); row++;
  sc(ws, row, 0, tc('No')); sc(ws, row, 1, tc('Pasangan'));
  for (let r = 0; r < numR; r++) sc(ws, row, 2+r, tc(`R${r+1}`));
  row++;

  const sliderStart = row;
  for (let p = 0; p < numP; p++) {
    const [i,j] = pairs[p];
    const pairKey = `${level.codes[i]}_vs_${level.codes[j]}`;
    sc(ws, row, 0, nc(p+1));
    sc(ws, row, 1, tc(pairKey));
    for (let r = 0; r < numR; r++) {
      sc(ws, row, 2+r, nc(level.respondents[r].comparisons[pairKey] ?? 0));
    }
    row++;
  }
  row += 2;

  // ═══ SECTION 2: TFN l (Lower) ═══
  sc(ws, row, 0, tc('═══ BAGIAN 2: TFN l (Lower) per Responden ═══')); row++;
  sc(ws, row, 0, tc('Rumus: IF(slider>0, 1/VLOOKUP(u), VLOOKUP(l))')); row++;
  sc(ws, row, 0, tc('No')); sc(ws, row, 1, tc('Pasangan'));
  for (let r = 0; r < numR; r++) sc(ws, row, 2+r, tc(`R${r+1}_l`));
  row++;

  const tfnLStart = row;
  for (let p = 0; p < numP; p++) {
    sc(ws, row, 0, nc(p+1));
    sc(ws, row, 1, tc(`${level.codes[pairs[p][0]]}_vs_${level.codes[pairs[p][1]]}`));
    for (let r = 0; r < numR; r++) {
      const sRef = cr(sliderStart + p, 2 + r);
      const absRef = `ABS(${sRef})+1`;
      sc(ws, row, 2+r, fc(`IF(${sRef}>0,1/VLOOKUP(${absRef},${tblRange},4,FALSE),VLOOKUP(${absRef},${tblRange},2,FALSE))`, '0.0000'));
    }
    row++;
  }
  row += 2;

  // ═══ SECTION 3: TFN m (Middle) ═══
  sc(ws, row, 0, tc('═══ BAGIAN 3: TFN m (Middle) per Responden ═══')); row++;
  sc(ws, row, 0, tc('No')); sc(ws, row, 1, tc('Pasangan'));
  for (let r = 0; r < numR; r++) sc(ws, row, 2+r, tc(`R${r+1}_m`));
  row++;

  const tfnMStart = row;
  for (let p = 0; p < numP; p++) {
    sc(ws, row, 0, nc(p+1));
    sc(ws, row, 1, tc(`${level.codes[pairs[p][0]]}_vs_${level.codes[pairs[p][1]]}`));
    for (let r = 0; r < numR; r++) {
      const sRef = cr(sliderStart + p, 2 + r);
      const absRef = `ABS(${sRef})+1`;
      sc(ws, row, 2+r, fc(`IF(${sRef}>0,1/VLOOKUP(${absRef},${tblRange},3,FALSE),VLOOKUP(${absRef},${tblRange},3,FALSE))`, '0.0000'));
    }
    row++;
  }
  row += 2;

  // ═══ SECTION 4: TFN u (Upper) ═══
  sc(ws, row, 0, tc('═══ BAGIAN 4: TFN u (Upper) per Responden ═══')); row++;
  sc(ws, row, 0, tc('No')); sc(ws, row, 1, tc('Pasangan'));
  for (let r = 0; r < numR; r++) sc(ws, row, 2+r, tc(`R${r+1}_u`));
  row++;

  const tfnUStart = row;
  for (let p = 0; p < numP; p++) {
    sc(ws, row, 0, nc(p+1));
    sc(ws, row, 1, tc(`${level.codes[pairs[p][0]]}_vs_${level.codes[pairs[p][1]]}`));
    for (let r = 0; r < numR; r++) {
      const sRef = cr(sliderStart + p, 2 + r);
      const absRef = `ABS(${sRef})+1`;
      sc(ws, row, 2+r, fc(`IF(${sRef}>0,1/VLOOKUP(${absRef},${tblRange},2,FALSE),VLOOKUP(${absRef},${tblRange},4,FALSE))`, '0.0000'));
    }
    row++;
  }
  row += 2;

  // ═══ SECTION 5: GEOMETRIC MEAN ═══
  sc(ws, row, 0, tc('═══ BAGIAN 5: GEOMETRIC MEAN ANTAR RESPONDEN ═══')); row++;
  sc(ws, row, 0, tc(`Rumus: GM = PRODUCT(semua R)^(1/${numR})`)); row++;
  sc(ws, row, 0, tc('No')); sc(ws, row, 1, tc('Pasangan'));
  sc(ws, row, 2, tc('GM_l')); sc(ws, row, 3, tc('GM_m')); sc(ws, row, 4, tc('GM_u'));
  row++;

  const gmStart = row;
  for (let p = 0; p < numP; p++) {
    sc(ws, row, 0, nc(p+1));
    sc(ws, row, 1, tc(`${level.codes[pairs[p][0]]}_vs_${level.codes[pairs[p][1]]}`));

    // GM_l = PRODUCT(all R_l for this pair)^(1/n)
    const lRefs: string[] = [];
    const mRefs: string[] = [];
    const uRefs: string[] = [];
    for (let r = 0; r < numR; r++) {
      lRefs.push(cr(tfnLStart + p, 2 + r));
      mRefs.push(cr(tfnMStart + p, 2 + r));
      uRefs.push(cr(tfnUStart + p, 2 + r));
    }
    sc(ws, row, 2, fc(`POWER(PRODUCT(${lRefs.join(',')}),1/${numR})`, '0.0000'));
    sc(ws, row, 3, fc(`POWER(PRODUCT(${mRefs.join(',')}),1/${numR})`, '0.0000'));
    sc(ws, row, 4, fc(`POWER(PRODUCT(${uRefs.join(',')}),1/${numR})`, '0.0000'));
    row++;
  }
  row += 2;

  // ═══ SECTION 6: MATRIKS TFN (l, m, u) ═══
  sc(ws, row, 0, tc('═══ BAGIAN 6: MATRIKS TFN AGREGAT ═══')); row++;
  sc(ws, row, 0, tc('Diagonal=(1,1,1) | Upper=GM | Lower=reciprocal(1/u,1/m,1/l)')); row += 1;

  // --- Matriks l ---
  sc(ws, row, 0, tc('Matriks l (Lower)')); row++;
  const matLHdr = row;
  sc(ws, row, 0, tc(''));
  for (let j = 0; j < n; j++) sc(ws, row, j+1, tc(level.codes[j]));
  sc(ws, row, n+1, tc('Σ Baris')); row++;

  const matLStart = row;
  for (let i = 0; i < n; i++) {
    sc(ws, row, 0, tc(level.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) { sc(ws, row, j+1, nc(1)); }
      else if (j > i) {
        const pIdx = pairIndex[`${i}_${j}`];
        sc(ws, row, j+1, fc(cr(gmStart + pIdx, 2), '0.0000'));
      } else {
        const pIdx = pairIndex[`${j}_${i}`];
        sc(ws, row, j+1, fc(`1/${cr(gmStart + pIdx, 4)}`, '0.0000')); // 1/GM_u
      }
    }
    sc(ws, row, n+1, fc(`SUM(${cr(row,1)}:${cr(row,n)})`, '0.0000'));
    row++;
  }
  const matLTotalRow = row;
  sc(ws, row, n, tc('TOTAL'));
  sc(ws, row, n+1, fc(`SUM(${cr(matLStart, n+1)}:${cr(matLStart+n-1, n+1)})`, '0.0000'));
  row += 2;

  // --- Matriks m ---
  sc(ws, row, 0, tc('Matriks m (Middle)')); row++;
  sc(ws, row, 0, tc(''));
  for (let j = 0; j < n; j++) sc(ws, row, j+1, tc(level.codes[j]));
  sc(ws, row, n+1, tc('Σ Baris')); row++;

  const matMStart = row;
  for (let i = 0; i < n; i++) {
    sc(ws, row, 0, tc(level.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) { sc(ws, row, j+1, nc(1)); }
      else if (j > i) {
        const pIdx = pairIndex[`${i}_${j}`];
        sc(ws, row, j+1, fc(cr(gmStart + pIdx, 3), '0.0000'));
      } else {
        const pIdx = pairIndex[`${j}_${i}`];
        sc(ws, row, j+1, fc(`1/${cr(gmStart + pIdx, 3)}`, '0.0000'));
      }
    }
    sc(ws, row, n+1, fc(`SUM(${cr(row,1)}:${cr(row,n)})`, '0.0000'));
    row++;
  }
  const matMTotalRow = row;
  sc(ws, row, n, tc('TOTAL'));
  sc(ws, row, n+1, fc(`SUM(${cr(matMStart, n+1)}:${cr(matMStart+n-1, n+1)})`, '0.0000'));
  row += 2;

  // --- Matriks u ---
  sc(ws, row, 0, tc('Matriks u (Upper)')); row++;
  sc(ws, row, 0, tc(''));
  for (let j = 0; j < n; j++) sc(ws, row, j+1, tc(level.codes[j]));
  sc(ws, row, n+1, tc('Σ Baris')); row++;

  const matUStart = row;
  for (let i = 0; i < n; i++) {
    sc(ws, row, 0, tc(level.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) { sc(ws, row, j+1, nc(1)); }
      else if (j > i) {
        const pIdx = pairIndex[`${i}_${j}`];
        sc(ws, row, j+1, fc(cr(gmStart + pIdx, 4), '0.0000'));
      } else {
        const pIdx = pairIndex[`${j}_${i}`];
        sc(ws, row, j+1, fc(`1/${cr(gmStart + pIdx, 2)}`, '0.0000')); // 1/GM_l
      }
    }
    sc(ws, row, n+1, fc(`SUM(${cr(row,1)}:${cr(row,n)})`, '0.0000'));
    row++;
  }
  const matUTotalRow = row;
  sc(ws, row, n, tc('TOTAL'));
  sc(ws, row, n+1, fc(`SUM(${cr(matUStart, n+1)}:${cr(matUStart+n-1, n+1)})`, '0.0000'));
  row += 2;

  // ═══ SECTION 7: FSE + DEFUZZIFIKASI + BOBOT ═══
  sc(ws, row, 0, tc('═══ BAGIAN 7: FUZZY SYNTHETIC EXTENT + BOBOT FINAL ═══')); row++;
  sc(ws, row, 0, tc('Si_l=Σl_i/ΣΣu | Si_m=Σm_i/ΣΣm | Si_u=Σu_i/ΣΣl | Defuzzy=(l+m+u)/3')); row++;

  sc(ws, row, 0, tc('Kriteria'));
  sc(ws, row, 1, tc('Σl_i')); sc(ws, row, 2, tc('Σm_i')); sc(ws, row, 3, tc('Σu_i'));
  sc(ws, row, 4, tc('ΣΣl')); sc(ws, row, 5, tc('ΣΣm')); sc(ws, row, 6, tc('ΣΣu'));
  sc(ws, row, 7, tc('Si_l')); sc(ws, row, 8, tc('Si_m')); sc(ws, row, 9, tc('Si_u'));
  sc(ws, row, 10, tc('Defuzzy')); sc(ws, row, 11, tc('Bobot')); sc(ws, row, 12, tc('Bobot%')); sc(ws, row, 13, tc('Rank'));
  row++;

  const fseStart = row;
  for (let i = 0; i < n; i++) {
    sc(ws, row, 0, tc(level.codes[i]));
    // Row sums
    sc(ws, row, 1, fc(cr(matLStart+i, n+1), '0.0000'));
    sc(ws, row, 2, fc(cr(matMStart+i, n+1), '0.0000'));
    sc(ws, row, 3, fc(cr(matUStart+i, n+1), '0.0000'));
    // Grand totals
    sc(ws, row, 4, fc(cr(matLTotalRow, n+1), '0.0000'));
    sc(ws, row, 5, fc(cr(matMTotalRow, n+1), '0.0000'));
    sc(ws, row, 6, fc(cr(matUTotalRow, n+1), '0.0000'));
    // FSE
    sc(ws, row, 7, fc(`${cr(row,1)}/${cr(row,6)}`, '0.000000')); // Si_l = Σl/ΣΣu
    sc(ws, row, 8, fc(`${cr(row,2)}/${cr(row,5)}`, '0.000000')); // Si_m = Σm/ΣΣm
    sc(ws, row, 9, fc(`${cr(row,3)}/${cr(row,4)}`, '0.000000')); // Si_u = Σu/ΣΣl
    // Defuzzy
    sc(ws, row, 10, fc(`(${cr(row,7)}+${cr(row,8)}+${cr(row,9)})/3`, '0.000000'));
    row++;
  }

  // Total defuzzy
  const defTotalRow = row;
  sc(ws, row, 9, tc('TOTAL'));
  sc(ws, row, 10, fc(`SUM(${colL(10)}${fseStart}:${colL(10)}${fseStart+n-1})`, '0.000000'));

  // Bobot, Bobot%, Rank
  for (let i = 0; i < n; i++) {
    const r = fseStart + i;
    sc(ws, r, 11, fc(`${cr(r,10)}/${cr(defTotalRow,10)}`, '0.000000'));
    sc(ws, r, 12, fc(`${cr(r,11)}*100`, '0.00'));
    sc(ws, r, 13, fc(`RANK(${cr(r,11)},${colL(11)}$${fseStart}:${colL(11)}$${fseStart+n-1},0)`));
  }

  // Total weight check
  row++;
  sc(ws, row, 10, tc('Total Wi'));
  sc(ws, row, 11, fc(`SUM(${colL(11)}${fseStart}:${colL(11)}${fseStart+n-1})`, '0.000000'));
  sc(ws, row, 12, tc('← harus 1'));
  row += 2;

  // ═══ SECTION 8: CONSISTENCY RATIO ═══
  let finalLmRow: number | null = null;
  let finalCiRow: number | null = null;
  let finalCrRow: number | null = null;
  if (n >= 3) {
    sc(ws, row, 0, tc('═══ BAGIAN 8: CONSISTENCY RATIO (CR) ═══')); row++;
    sc(ws, row, 0, tc('Dari matriks defuzzified: D(i,j) = (l+m+u)/3')); row += 1;

    // 8a. Matriks Crisp (Defuzzified)
    sc(ws, row, 0, tc('Matriks Crisp D(i,j) = (l+m+u)/3')); row++;
    const crispHdr = row;
    sc(ws, row, 0, tc(''));
    for (let j = 0; j < n; j++) sc(ws, row, j+1, tc(level.codes[j]));
    row++;

    const crispStart = row;
    for (let i = 0; i < n; i++) {
      sc(ws, row, 0, tc(level.codes[i]));
      for (let j = 0; j < n; j++) {
        if (i === j) { sc(ws, row, j+1, nc(1)); }
        else {
          const lRef = cr(matLStart+i, j+1);
          const mRef = cr(matMStart+i, j+1);
          const uRef = cr(matUStart+i, j+1);
          sc(ws, row, j+1, fc(`(${lRef}+${mRef}+${uRef})/3`, '0.0000'));
        }
      }
      row++;
    }

    // Column sums
    row++;
    const colSumRow = row;
    sc(ws, row, 0, tc('Σ Kolom'));
    for (let j = 0; j < n; j++) {
      sc(ws, row, j+1, fc(`SUM(${colL(j+1)}${crispStart}:${colL(j+1)}${crispStart+n-1})`, '0.0000'));
    }
    row += 2;

    // 8b. Normalisasi
    sc(ws, row, 0, tc('Normalisasi Kolom + Bobot (Wi=rata2 baris)')); row++;
    sc(ws, row, 0, tc(''));
    for (let j = 0; j < n; j++) sc(ws, row, j+1, tc(level.codes[j]));
    sc(ws, row, n+1, tc('Wi'));
    row++;

    const normStart = row;
    for (let i = 0; i < n; i++) {
      sc(ws, row, 0, tc(level.codes[i]));
      for (let j = 0; j < n; j++) {
        sc(ws, row, j+1, fc(`${cr(crispStart+i, j+1)}/${cr(colSumRow, j+1)}`, '0.0000'));
      }
      sc(ws, row, n+1, fc(`AVERAGE(${cr(row,1)}:${cr(row,n)})`, '0.000000'));
      row++;
    }
    row += 1;

    // 8c. Aw
    sc(ws, row, 0, tc('Aw = Matriks_Crisp × Wi')); row++;
    sc(ws, row, 0, tc('Kriteria')); sc(ws, row, 1, tc('Wi')); sc(ws, row, 2, tc('Aw')); sc(ws, row, 3, tc('Aw/Wi'));
    row++;

    const awStart = row;
    for (let i = 0; i < n; i++) {
      sc(ws, row, 0, tc(level.codes[i]));
      sc(ws, row, 1, fc(cr(normStart+i, n+1), '0.000000'));
      
      const awTerms = [];
      for (let j = 0; j < n; j++) awTerms.push(`${cr(crispStart+i, j+1)}*$${cr(awStart+j, 1)}`);
      sc(ws, row, 2, fc(awTerms.join('+'), '0.000000'));
      
      sc(ws, row, 3, fc(`${cr(row,2)}/${cr(row,1)}`, '0.0000'));
      row++;
    }
    row += 1;

    // 8d. λmax, CI, CR
    sc(ws, row, 0, tc('n')); sc(ws, row, 1, nc(n)); const nRow = row; row++;
    sc(ws, row, 0, tc('λmax = AVERAGE(Aw/Wi)'));
    sc(ws, row, 1, fc(`AVERAGE(${cr(awStart,3)}:${cr(awStart+n-1,3)})`, '0.0000'));
    const lmRow = row; row++;
    finalLmRow = lmRow;
    sc(ws, row, 0, tc('CI = (λmax-n)/(n-1)'));
    sc(ws, row, 1, fc(`(${cr(lmRow,1)}-${cr(nRow,1)})/(${cr(nRow,1)}-1)`, '0.0000'));
    const ciRow = row; row++;
    finalCiRow = ciRow;
    sc(ws, row, 0, tc(`RI (n=${n})`));
    sc(ws, row, 1, nc(RI[n] ?? 1.49));
    const riRow = row; row++;
    sc(ws, row, 0, tc('CR = CI/RI'));
    sc(ws, row, 1, fc(`IF(${cr(riRow,1)}=0,0,${cr(ciRow,1)}/${cr(riRow,1)})`, '0.0000'));
    const crRow = row; row += 1;
    finalCrRow = crRow;
    sc(ws, row, 0, tc('KESIMPULAN'));
    sc(ws, row, 1, fc(`IF(${cr(crRow,1)}<0.1,"KONSISTEN ✓ (CR<0.10)","TIDAK KONSISTEN ✗ (CR≥0.10)")`));
  } else {
    sc(ws, row, 0, tc('CR tidak dihitung (n < 3)')); row++;
  }

  // ═══ SECTION 9: PERHITUNGAN INDIVIDU PER RESPONDEN ═══
  row += 3;
  sc(ws, row, 0, tc('═══ BAGIAN 9: PERHITUNGAN INDIVIDU PER RESPONDEN (BOBOT & CR) ═══')); row++;
  sc(ws, row, 0, tc('Perhitungan FSE dan CR untuk masing-masing responden secara individual, menggunakan data TFN mereka sendiri.')); row += 2;

  for (let r = 0; r < numR; r++) {
    const respName = level.respondents[r].name;
    sc(ws, row, 0, tc(`▶ RESPONDEN ${r+1}: ${respName}`)); row++;

    // --- 9a. FSE & BOBOT Individu ---
    sc(ws, row, 0, tc('1. FUZZY SYNTHETIC EXTENT (FSE) & BOBOT FINAL')); row++;
    sc(ws, row, 0, tc('Kriteria'));
    sc(ws, row, 1, tc('Σl')); sc(ws, row, 2, tc('Σm')); sc(ws, row, 3, tc('Σu'));
    sc(ws, row, 4, tc('Si_l')); sc(ws, row, 5, tc('Si_m')); sc(ws, row, 6, tc('Si_u'));
    sc(ws, row, 7, tc('Defuzzy')); sc(ws, row, 8, tc('Bobot')); sc(ws, row, 9, tc('Bobot%')); sc(ws, row, 10, tc('Rank'));
    row++;

    const indFseStart = row;
    for (let i = 0; i < n; i++) {
      sc(ws, row, 0, tc(level.codes[i]));
      let sumL = ['1'], sumM = ['1'], sumU = ['1'];
      for (let j = 0; j < n; j++) {
        if (j > i) {
          const p = pairIndex[`${i}_${j}`];
          sumL.push(cr(tfnLStart+p, 2+r));
          sumM.push(cr(tfnMStart+p, 2+r));
          sumU.push(cr(tfnUStart+p, 2+r));
        } else if (i > j) {
          const p = pairIndex[`${j}_${i}`];
          sumL.push(`1/${cr(tfnUStart+p, 2+r)}`);
          sumM.push(`1/${cr(tfnMStart+p, 2+r)}`);
          sumU.push(`1/${cr(tfnLStart+p, 2+r)}`);
        }
      }
      sc(ws, row, 1, fc(sumL.join('+'), '0.0000'));
      sc(ws, row, 2, fc(sumM.join('+'), '0.0000'));
      sc(ws, row, 3, fc(sumU.join('+'), '0.0000'));
      row++;
    }

    const indTotalRow = row;
    sc(ws, row, 0, tc('TOTAL'));
    sc(ws, row, 1, fc(`SUM(${colL(1)}${indFseStart}:${colL(1)}${indFseStart+n-1})`, '0.0000'));
    sc(ws, row, 2, fc(`SUM(${colL(2)}${indFseStart}:${colL(2)}${indFseStart+n-1})`, '0.0000'));
    sc(ws, row, 3, fc(`SUM(${colL(3)}${indFseStart}:${colL(3)}${indFseStart+n-1})`, '0.0000'));
    
    for (let i = 0; i < n; i++) {
      const rIdx = indFseStart + i;
      sc(ws, rIdx, 4, fc(`${cr(rIdx,1)}/$${cr(indTotalRow,3)}`, '0.000000')); // Si_l
      sc(ws, rIdx, 5, fc(`${cr(rIdx,2)}/$${cr(indTotalRow,2)}`, '0.000000')); // Si_m
      sc(ws, rIdx, 6, fc(`${cr(rIdx,3)}/$${cr(indTotalRow,1)}`, '0.000000')); // Si_u
      sc(ws, rIdx, 7, fc(`(${cr(rIdx,4)}+${cr(rIdx,5)}+${cr(rIdx,6)})/3`, '0.000000')); // Defuzzy
    }
    
    sc(ws, indTotalRow, 7, fc(`SUM(${colL(7)}${indFseStart}:${colL(7)}${indFseStart+n-1})`, '0.000000'));
    
    for (let i = 0; i < n; i++) {
      const rIdx = indFseStart + i;
      sc(ws, rIdx, 8, fc(`${cr(rIdx,7)}/$${cr(indTotalRow,7)}`, '0.000000')); // Bobot
      sc(ws, rIdx, 9, fc(`${cr(rIdx,8)}*100`, '0.00')); // Bobot%
      sc(ws, rIdx, 10, fc(`RANK(${cr(rIdx,8)},$${colL(8)}$${indFseStart}:$${colL(8)}$${indFseStart+n-1},0)`)); // Rank
    }
    row += 2;

    // --- 9b. KONSISTENSI (CR) Individu ---
    if (n >= 3) {
      sc(ws, row, 0, tc('2. KONSISTENSI (CR)')); row++;
      sc(ws, row, 0, tc('Matriks Crisp (Defuzzified) & Normalisasi & Aw')); row++;
      
      const crispHdr = row;
      sc(ws, row, 0, tc('Kriteria'));
      for(let j=0; j<n; j++) sc(ws, row, j+1, tc(level.codes[j]));
      sc(ws, row, n+1, tc('Wi (Bobot CR)'));
      sc(ws, row, n+2, tc('Aw'));
      sc(ws, row, n+3, tc('Aw/Wi'));
      row++;
      
      const indCrispStart = row;
      for (let i = 0; i < n; i++) {
        sc(ws, row, 0, tc(level.codes[i]));
        for (let j = 0; j < n; j++) {
          if (i === j) {
            sc(ws, row, j+1, nc(1));
          } else if (j > i) {
            const p = pairIndex[`${i}_${j}`];
            const l = cr(tfnLStart+p, 2+r);
            const m = cr(tfnMStart+p, 2+r);
            const u = cr(tfnUStart+p, 2+r);
            sc(ws, row, j+1, fc(`(${l}+${m}+${u})/3`, '0.0000'));
          } else {
            const p = pairIndex[`${j}_${i}`];
            const l = `1/${cr(tfnUStart+p, 2+r)}`;
            const m = `1/${cr(tfnMStart+p, 2+r)}`;
            const u = `1/${cr(tfnLStart+p, 2+r)}`;
            sc(ws, row, j+1, fc(`(${l}+${m}+${u})/3`, '0.0000'));
          }
        }
        row++;
      }
      
      const indColSumRow = row;
      sc(ws, row, 0, tc('Σ Kolom'));
      for (let j = 0; j < n; j++) {
        sc(ws, row, j+1, fc(`SUM(${colL(j+1)}${indCrispStart}:${colL(j+1)}${indCrispStart+n-1})`, '0.0000'));
      }
      
      for (let i = 0; i < n; i++) {
        const rIdx = indCrispStart + i;
        const wiTerms = [];
        for (let j = 0; j < n; j++) wiTerms.push(`${cr(rIdx, j+1)}/$${cr(indColSumRow, j+1)}`);
        sc(ws, rIdx, n+1, fc(`(${wiTerms.join('+')})/${n}`, '0.000000'));
        
        const awTerms = [];
        for (let j = 0; j < n; j++) awTerms.push(`${cr(rIdx, j+1)}*$${cr(indCrispStart+j, n+1)}`);
        sc(ws, rIdx, n+2, fc(awTerms.join('+'), '0.000000'));
        
        sc(ws, rIdx, n+3, fc(`${cr(rIdx, n+2)}/${cr(rIdx, n+1)}`, '0.0000'));
      }
      row++; // after indColSumRow
      
      row++;
      sc(ws, row, 0, tc('λmax'));
      sc(ws, row, 1, fc(`AVERAGE(${colL(n+3)}${indCrispStart}:${colL(n+3)}${indCrispStart+n-1})`, '0.0000'));
      const lm = cr(row, 1); row++;
      
      sc(ws, row, 0, tc('CI'));
      sc(ws, row, 1, fc(`(${lm}-${n})/(${n}-1)`, '0.0000'));
      const ci = cr(row, 1); row++;
      
      sc(ws, row, 0, tc('CR'));
      const riVal = RI[n] ?? 1.49;
      sc(ws, row, 1, fc(`IF(${riVal}=0,0,${ci}/${riVal})`, '0.0000'));
      const crVal = cr(row, 1); row++;
      
      sc(ws, row, 0, tc('Status'));
      sc(ws, row, 1, fc(`IF(${crVal}<0.1,"KONSISTEN ✓","TIDAK KONSISTEN ✗")`));
    } else {
      sc(ws, row, 0, tc('CR tidak dihitung (n < 3)')); row++;
    }
    row += 3;
  }

  // Expand & column widths
  const maxCol = Math.max(n + 4, numR + 2, 14);
  expand(ws, row + 1, maxCol);
  const cols: XLSX.ColInfo[] = [{ wch: 14 }, { wch: 18 }];
  for (let c = 2; c <= maxCol; c++) cols.push({ wch: 12 });
  ws['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, ws, level.sheetName);

  return {
    sheetName: level.sheetName,
    label: level.label,
    codes: level.codes,
    fseStart,
    lmRow: finalLmRow,
    ciRow: finalCiRow,
    crRow: finalCrRow,
    n
  };
}


// ═══════════════════════════════════════════════════════════════
// RINGKASAN Sheet — Summary
// ═══════════════════════════════════════════════════════════════

function buildRingkasanSheet(wb: XLSX.WorkBook, levels: LevelData[]) {
  const ws: XLSX.WorkSheet = {};
  ws['!ref'] = 'A1';
  let row = 1;

  sc(ws, row, 0, tc('RINGKASAN SELURUH DATA K1V1')); row++;
  sc(ws, row, 0, tc('Excel Perhitungan Manual Fuzzy AHP — Kuesioner 1 Versi 1')); row++;
  sc(ws, row, 0, tc(`Dibuat: ${new Date().toLocaleString('id-ID')}`)); row += 2;

  // Summary table
  sc(ws, row, 0, tc('DAFTAR SHEET PERHITUNGAN'));  row++;
  sc(ws, row, 0, tc('No')); sc(ws, row, 1, tc('Sheet')); sc(ws, row, 2, tc('Level'));
  sc(ws, row, 3, tc('Kriteria')); sc(ws, row, 4, tc('n')); sc(ws, row, 5, tc('Pasangan'));
  sc(ws, row, 6, tc('Responden'));
  row++;

  for (let i = 0; i < levels.length; i++) {
    const lv = levels[i];
    const numP = lv.codes.length * (lv.codes.length - 1) / 2;
    sc(ws, row, 0, nc(i+1));
    sc(ws, row, 1, tc(lv.sheetName));
    sc(ws, row, 2, tc(lv.label));
    sc(ws, row, 3, tc(lv.codes.join(', ')));
    sc(ws, row, 4, nc(lv.codes.length));
    sc(ws, row, 5, nc(numP));
    sc(ws, row, 6, nc(lv.respondents.length));
    row++;
  }
  row += 2;

  // All respondents across all levels
  sc(ws, row, 0, tc('DAFTAR SELURUH RESPONDEN PER KATEGORI')); row++;
  sc(ws, row, 0, tc('Nama')); sc(ws, row, 1, tc('Jabatan'));
  let col = 2;
  for (const lv of levels) { sc(ws, row, col, tc(lv.sheetName)); col++; }
  row++;

  // Collect unique respondents
  const allNames = new Map<string, { role: string|null; levels: Set<string> }>();
  for (const lv of levels) {
    for (const r of lv.respondents) {
      const key = r.name.trim().toLowerCase();
      if (!allNames.has(key)) allNames.set(key, { role: r.role, levels: new Set() });
      allNames.get(key)!.levels.add(lv.sheetName);
    }
  }

  for (const [key, data] of Array.from(allNames.entries()).sort()) {
    // Find original name (not lowercased)
    let originalName = '';
    for (const lv of levels) {
      for (const r of lv.respondents) {
        if (r.name.trim().toLowerCase() === key) { originalName = r.name; break; }
      }
      if (originalName) break;
    }

    sc(ws, row, 0, tc(originalName || ''));
    sc(ws, row, 1, tc(data.role || '-'));
    let col = 2;
    for (const lv of levels) {
      sc(ws, row, col, tc(data.levels.has(lv.sheetName) ? '✓' : '-'));
      col++;
    }
    row++;
  }

  row += 2;

  // Alur perhitungan
  const info = [
    '═══ ALUR PERHITUNGAN DI SETIAP SHEET ═══',
    '',
    'Bagian 1: Data Slider — Nilai slider asli (-8..8) dari database per responden',
    'Bagian 2: TFN l — Konversi slider → TFN komponen Lower (rumus VLOOKUP)',
    'Bagian 3: TFN m — Konversi slider → TFN komponen Middle (rumus VLOOKUP)',
    'Bagian 4: TFN u — Konversi slider → TFN komponen Upper (rumus VLOOKUP)',
    'Bagian 5: Geometric Mean — Agregasi TFN antar responden: GM=(∏xi)^(1/n)',
    'Bagian 6: Matriks TFN — Matriks n×n (l,m,u) dari GM + reciprocal',
    'Bagian 7: FSE + Bobot — Fuzzy Synthetic Extent → Defuzzifikasi CoA → Normalisasi',
    'Bagian 8: Konsistensi CR — Defuzzify → Crisp → Normalisasi → Aw → λmax → CI → CR',
    '',
    '═══ KONVERSI SLIDER → TFN ═══',
    '',
    '|slider| → absVal → Fuzzy Scale → TFN(l,m,u)',
    '0        → 1      → EQUAL       → (1,1,1)',
    '1,2      → 2,3    → MODERATE    → (1,3,5)',
    '3,4      → 4,5    → STRONG      → (3,5,7)',
    '5,6      → 6,7    → VERY_STRONG → (5,7,9)',
    '7,8      → 8,9    → EXTREME     → (7,9,9)',
    '',
    'Jika slider > 0 (kanan penting): TFN di-reciprocal → (1/u, 1/m, 1/l)',
  ];
  for (const line of info) { sc(ws, row, 0, tc(line)); row++; }

  expand(ws, row + 1, 2 + levels.length);
  ws['!cols'] = [{ wch: 35 }, { wch: 25 }, ...levels.map(() => ({ wch: 12 }))];

  XLSX.utils.book_append_sheet(wb, ws, 'RINGKASAN');
}


// ═══════════════════════════════════════════════════════════════
// HASIL_AKHIR Sheet — Total Aggregated Results
// ═══════════════════════════════════════════════════════════════

function buildHasilAkhirSheet(wb: XLSX.WorkBook, metas: SheetMeta[]) {
  const ws: XLSX.WorkSheet = {};
  ws['!ref'] = 'A1';
  let row = 1;

  sc(ws, row, 0, tc('HASIL AKHIR KESELURUHAN (AGREGAT TOTAL)')); row++;
  sc(ws, row, 0, tc('Halaman ini memuat ringkasan Bobot Akhir dan nilai Consistency Ratio (CR) dari seluruh level kriteria (berdasarkan agregasi seluruh responden).')); row += 2;

  // --- CR SUMMARY ---
  sc(ws, row, 0, tc('RINGKASAN KONSISTENSI (CR)')); row++;
  sc(ws, row, 0, tc('Level')); 
  sc(ws, row, 1, tc('λmax')); 
  sc(ws, row, 2, tc('CI')); 
  sc(ws, row, 3, tc('CR Value')); 
  sc(ws, row, 4, tc('Status')); 
  row++;
  for (const m of metas) {
    sc(ws, row, 0, tc(m.label));
    if (m.crRow && m.lmRow && m.ciRow) {
      sc(ws, row, 1, fc(`'${m.sheetName}'!${cr(m.lmRow, 1)}`, '0.0000'));
      sc(ws, row, 2, fc(`'${m.sheetName}'!${cr(m.ciRow, 1)}`, '0.0000'));
      sc(ws, row, 3, fc(`'${m.sheetName}'!${cr(m.crRow, 1)}`, '0.0000'));
      sc(ws, row, 4, fc(`IF(${cr(row, 3)}<0.1,"KONSISTEN","TIDAK KONSISTEN")`));
    } else {
      sc(ws, row, 1, tc('-'));
      sc(ws, row, 2, tc('-'));
      sc(ws, row, 3, tc('-'));
      sc(ws, row, 4, tc('n<3 (Otomatis Konsisten)'));
    }
    row++;
  }
  row += 3;

  // --- WEIGHTS SUMMARY ---
  sc(ws, row, 0, tc('RINGKASAN BOBOT AKHIR (FSE)')); row += 2;
  
  for (const m of metas) {
    sc(ws, row, 0, tc(m.label)); row++;
    sc(ws, row, 0, tc('Kriteria')); sc(ws, row, 1, tc('Bobot Akhir')); sc(ws, row, 2, tc('Persentase')); sc(ws, row, 3, tc('Peringkat')); row++;
    for (let i = 0; i < m.n; i++) {
       // Assuming fseStart is the 1-indexed row where the first criteria of FSE section is located
       const sourceRow = m.fseStart + i;
       sc(ws, row, 0, fc(`'${m.sheetName}'!A${sourceRow}`)); // Kriteria
       sc(ws, row, 1, fc(`'${m.sheetName}'!L${sourceRow}`, '0.000000')); // Bobot
       sc(ws, row, 2, fc(`'${m.sheetName}'!M${sourceRow}`, '0.00')); // %
       sc(ws, row, 3, fc(`'${m.sheetName}'!N${sourceRow}`)); // Rank
       row++;
    }
    row += 2;
  }

  expand(ws, row + 1, 5);
  ws['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'HASIL_AKHIR');
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('📊 Generating Excel K1V1 — SEMUA DATA per Responden + Perhitungan Manual...\n');

  const levels = await loadAllK1V1();
  console.log(`📋 Ditemukan ${levels.length} level perhitungan:`);
  for (const lv of levels) {
    console.log(`   ${lv.sheetName}: ${lv.label} — ${lv.codes.length} kriteria, ${lv.respondents.length} responden`);
  }

  if (levels.length === 0) {
    console.error('❌ Tidak ada data K1V1 di database!');
    process.exit(1);
  }

  const wb = XLSX.utils.book_new();

  // Build RINGKASAN first
  console.log('\n📋 Building RINGKASAN sheet...');
  buildRingkasanSheet(wb, levels);

  // Build each level sheet
  const metadataList: SheetMeta[] = [];
  for (const lv of levels) {
    console.log(`📋 Building ${lv.sheetName} sheet (${lv.respondents.length} responden, ${lv.codes.length} kriteria)...`);
    metadataList.push(buildLevelSheet(wb, lv));
  }

  // Build HASIL_AKHIR sheet
  console.log('\n📋 Building HASIL_AKHIR sheet...');
  buildHasilAkhirSheet(wb, metadataList);

  // Save
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `K1V1_Perhitungan_Manual_Lengkap_${ts}.xlsx`;
  const outputPath = path.resolve('c:/Users/Acer/Pictures/chatbot/nextrag', filename);

  XLSX.writeFile(wb, outputPath);

  console.log(`\n✅ File Excel berhasil dibuat: ${outputPath}`);
  console.log(`   Total sheets: ${wb.SheetNames.length}`);
  console.log(`   Sheets: ${wb.SheetNames.join(', ')}`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
