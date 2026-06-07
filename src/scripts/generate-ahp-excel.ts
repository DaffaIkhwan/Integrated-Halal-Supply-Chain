/**
 * Generate Excel Perhitungan Manual Fuzzy AHP — Kuesioner 1
 * 
 * File ini menghasilkan spreadsheet .xlsx dengan rumus Excel lengkap:
 * - Sheet INPUT: Input pairwise comparison (skala Saaty 1-9)
 * - Sheet MATRIKS: Matriks perbandingan berpasangan NxN
 * - Sheet NORMALISASI: Normalisasi kolom + bobot prioritas
 * - Sheet KONSISTENSI: λmax, CI, CR, kesimpulan
 * - Sheet FUZZY_TFN: Konversi ke TFN (l,m,u)
 * - Sheet FSE: Fuzzy Synthetic Extent
 * - Sheet BOBOT_FINAL: Defuzzifikasi + bobot akhir
 * 
 * Run: npx tsx src/scripts/generate-ahp-excel.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── Helpers ───

/** Column letter from 0-based index */
function colLetter(idx: number): string {
  let result = '';
  let n = idx;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Cell ref, e.g. "B3" */
function cellRef(row: number, col: number): string {
  return `${colLetter(col)}${row}`;
}

/** Create a cell with formula */
function formulaCell(f: string): XLSX.CellObject {
  return { t: 'n', f };
}

/** Create a text cell */
function textCell(v: string): XLSX.CellObject {
  return { t: 's', v };
}

/** Create a number cell */
function numCell(v: number): XLSX.CellObject {
  return { t: 'n', v };
}

/** Set cell in worksheet */
function setCell(ws: XLSX.WorkSheet, row: number, col: number, cell: XLSX.CellObject) {
  const ref = cellRef(row, col);
  ws[ref] = cell;
}

/** Ensure sheet range covers the cell */
function expandRange(ws: XLSX.WorkSheet, maxRow: number, maxCol: number) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  if (maxRow > range.e.r) range.e.r = maxRow;
  if (maxCol > range.e.c) range.e.c = maxCol;
  ws['!ref'] = XLSX.utils.encode_range(range);
}

// ─── Saaty Scale → TFN mapping ───
const SAATY_TO_TFN: Record<number, [number, number, number]> = {
  1: [1, 1, 1],
  2: [1, 2, 3],
  3: [1, 3, 5],
  4: [3, 4, 5],
  5: [3, 5, 7],
  6: [5, 6, 7],
  7: [5, 7, 9],
  8: [7, 8, 9],
  9: [7, 9, 9],
};

// Random Index table (Saaty, 1990)
const RI_TABLE: Record<number, number> = {
  1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

// ─── Sheet Names (for cross-sheet references) ───
const SHEET_NAMES = {
  input: 'INPUT_DATA',
  matriksL1: 'MATRIKS_L1',
  normL1: 'NORMALISASI_L1',
  crL1: 'KONSISTENSI_L1',
  fuzzyL1: 'FUZZY_TFN_L1',
  fseL1: 'FSE_BOBOT_L1',
};

interface MatrixData {
  codes: string[];
  matrix: number[][]; // crisp Saaty values (defuzzified from DB or original)
  tfnMatrix: [number, number, number][][]; // raw TFN values from DB
}

// ─── Load data from DB ───
async function loadLevel1Data(): Promise<MatrixData> {
  const entries = await prisma.pairwiseComparison.findMany({
    where: { matrixType: 'LEVEL1_CP' },
    orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
  });

  const codes = Array.from(new Set(entries.map(e => e.rowCode))).sort();
  const n = codes.length;

  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));
  const tfnMatrix: [number, number, number][][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => [1, 1, 1] as [number, number, number])
  );

  for (const e of entries) {
    const i = codes.indexOf(e.rowCode);
    const j = codes.indexOf(e.colCode);
    if (i >= 0 && j >= 0) {
      tfnMatrix[i][j] = [e.tfnLow, e.tfnMid, e.tfnUp];
      matrix[i][j] = (e.tfnLow + e.tfnMid + e.tfnUp) / 3; // defuzzify for crisp
    }
  }

  return { codes, matrix, tfnMatrix };
}

async function loadLevel2Data(cpId: string): Promise<MatrixData | null> {
  const matrixType = `LEVEL2_${cpId}`;
  const entries = await prisma.pairwiseComparison.findMany({
    where: { matrixType },
    orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
  });

  if (entries.length === 0) return null;

  const codes = Array.from(new Set(entries.map(e => e.rowCode))).sort();
  const n = codes.length;

  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));
  const tfnMatrix: [number, number, number][][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => [1, 1, 1] as [number, number, number])
  );

  for (const e of entries) {
    const i = codes.indexOf(e.rowCode);
    const j = codes.indexOf(e.colCode);
    if (i >= 0 && j >= 0) {
      tfnMatrix[i][j] = [e.tfnLow, e.tfnMid, e.tfnUp];
      matrix[i][j] = (e.tfnLow + e.tfnMid + e.tfnUp) / 3;
    }
  }

  return { codes, matrix, tfnMatrix };
}

// ═══════════════════════════════════════════════════════════════
// Sheet Builder Functions
// ═══════════════════════════════════════════════════════════════

function buildInputSheet(ws: XLSX.WorkSheet, data: MatrixData, sheetTitle: string, matriksSheetName: string) {
  const n = data.codes.length;
  let row = 1;

  // Title
  setCell(ws, row, 0, textCell(sheetTitle));
  row++;
  setCell(ws, row, 0, textCell('Data input pairwise comparison — hanya isi kolom kuning'));
  row += 2;

  // Header
  setCell(ws, row, 0, textCell('No'));
  setCell(ws, row, 1, textCell('Kriteria A'));
  setCell(ws, row, 2, textCell('Kriteria B'));
  setCell(ws, row, 3, textCell('Lebih Penting'));
  setCell(ws, row, 4, textCell('Skala Saaty'));
  setCell(ws, row, 5, textCell('Keterangan'));
  row++;

  let pairNo = 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const crispVal = data.matrix[i][j];
      const isAMore = crispVal >= 1;
      const saatyScale = isAMore ? Math.round(crispVal) : Math.round(1 / crispVal);
      const moreImportant = isAMore ? 'A' : 'B';

      setCell(ws, row, 0, numCell(pairNo));
      setCell(ws, row, 1, textCell(data.codes[i]));
      setCell(ws, row, 2, textCell(data.codes[j]));
      setCell(ws, row, 3, textCell(moreImportant)); // INPUT — Lebih penting A atau B
      setCell(ws, row, 4, numCell(Math.max(1, Math.min(9, saatyScale)))); // INPUT — Skala Saaty 1-9
      // Formula: interpretasi otomatis
      const saatyRef = cellRef(row, 4);
      const dirRef = cellRef(row, 3);
      setCell(ws, row, 5, formulaCell(
        `IF(${saatyRef}=1,"Sama Penting",IF(${saatyRef}=3,"Sedikit Lebih Penting",IF(${saatyRef}=5,"Lebih Penting",IF(${saatyRef}=7,"Sangat Lebih Penting",IF(${saatyRef}=9,"Mutlak Lebih Penting","Nilai Antara")))))`
      ));
      row++;
      pairNo++;
    }
  }

  // RI Table reference
  row += 2;
  setCell(ws, row, 0, textCell('Tabel Random Index (RI) — Saaty'));
  row++;
  setCell(ws, row, 0, textCell('n'));
  for (let i = 1; i <= 10; i++) {
    setCell(ws, row, i, numCell(i));
  }
  row++;
  setCell(ws, row, 0, textCell('RI'));
  for (let i = 1; i <= 10; i++) {
    setCell(ws, row, i, numCell(RI_TABLE[i]));
  }

  // TFN Scale reference
  row += 2;
  setCell(ws, row, 0, textCell('Skala Saaty → TFN (Triangular Fuzzy Number)'));
  row++;
  setCell(ws, row, 0, textCell('Skala'));
  setCell(ws, row, 1, textCell('l'));
  setCell(ws, row, 2, textCell('m'));
  setCell(ws, row, 3, textCell('u'));
  row++;
  for (let s = 1; s <= 9; s++) {
    const tfn = SAATY_TO_TFN[s];
    setCell(ws, row, 0, numCell(s));
    setCell(ws, row, 1, numCell(tfn[0]));
    setCell(ws, row, 2, numCell(tfn[1]));
    setCell(ws, row, 3, numCell(tfn[2]));
    row++;
  }

  expandRange(ws, row, 10);
  ws['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 32 },
  ];
}

function buildMatriksSheet(ws: XLSX.WorkSheet, data: MatrixData, inputSheetName: string, title: string) {
  const n = data.codes.length;
  let row = 1;

  setCell(ws, row, 0, textCell(title));
  row++;
  setCell(ws, row, 0, textCell('Matriks perbandingan berpasangan NxN (nilai crisp Saaty)'));
  row++;
  setCell(ws, row, 0, textCell('Data diambil dari sheet INPUT — semua sel ini menggunakan rumus'));
  row += 2;

  const matrixStartRow = row;

  // Header row
  setCell(ws, row, 0, textCell(''));
  for (let j = 0; j < n; j++) {
    setCell(ws, row, j + 1, textCell(data.codes[j]));
  }
  row++;

  // We need to map INPUT_DATA rows to matrix cells
  // Build reference map: for pair (i,j) where i<j, find the row in INPUT_DATA
  const inputDataRow: Record<string, number> = {};
  let inputRow = 5; // Data starts at row 5 in INPUT_DATA sheet (1-indexed)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      inputDataRow[`${i}_${j}`] = inputRow;
      inputRow++;
    }
  }

  // Matrix body
  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) {
        // Diagonal = 1
        setCell(ws, row, j + 1, numCell(1));
      } else if (j > i) {
        // Upper triangle: reference INPUT_DATA
        const inputR = inputDataRow[`${i}_${j}`];
        const scaleRef = `'${inputSheetName}'!E${inputR}`;
        const dirRef = `'${inputSheetName}'!D${inputR}`;
        // If A is more important, value = scale. If B, value = 1/scale
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",${scaleRef},1/${scaleRef})`
        ));
      } else {
        // Lower triangle: reciprocal of upper
        const upperCellRow = matrixStartRow + 1 + j; // row of codes[j]
        const upperCellCol = i + 1; // column of codes[i]
        const upperRef = cellRef(upperCellRow, upperCellCol);
        setCell(ws, row, j + 1, formulaCell(`1/${upperRef}`));
      }
    }
    row++;
  }

  // Column sums
  row++;
  setCell(ws, row, 0, textCell('Jumlah Kolom'));
  for (let j = 0; j < n; j++) {
    const startR = matrixStartRow + 1; // FIX: matrix body starts at matrixStartRow + 1
    const endR = startR + n - 1;
    const col = colLetter(j + 1);
    setCell(ws, row, j + 1, formulaCell(`SUM(${col}${startR}:${col}${endR})`));
  }

  expandRange(ws, row + 1, n + 1);

  const cols: XLSX.ColInfo[] = [{ wch: 12 }];
  for (let j = 0; j < n; j++) cols.push({ wch: 12 });
  ws['!cols'] = cols;
}

function buildNormalisasiSheet(ws: XLSX.WorkSheet, data: MatrixData, matriksSheetName: string, title: string) {
  const n = data.codes.length;
  let row = 1;

  setCell(ws, row, 0, textCell(title));
  row++;
  setCell(ws, row, 0, textCell('Normalisasi kolom: setiap sel dibagi jumlah kolomnya'));
  row += 2;

  const normStartRow = row;

  // Header
  setCell(ws, row, 0, textCell(''));
  for (let j = 0; j < n; j++) {
    setCell(ws, row, j + 1, textCell(data.codes[j]));
  }
  setCell(ws, row, n + 1, textCell('Rata-rata (Bobot)'));
  row++;

  // In MATRIKS sheet:
  // Matrix starts at row 6 (header at row 5), data rows 6..6+n-1
  // Column sums at row 6+n+1
  const matriksDataStartRow = 6;
  const matriksColSumRow = matriksDataStartRow + n + 1;

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));
    for (let j = 0; j < n; j++) {
      // Reference matriks cell / column sum
      const matCellRef = `'${matriksSheetName}'!${cellRef(matriksDataStartRow + i, j + 1)}`;
      const colSumRef = `'${matriksSheetName}'!${cellRef(matriksColSumRow, j + 1)}`;
      setCell(ws, row, j + 1, formulaCell(`${matCellRef}/${colSumRef}`));
    }
    // Average = weight (priority vector)
    const firstCol = cellRef(row, 1);
    const lastCol = cellRef(row, n);
    setCell(ws, row, n + 1, formulaCell(`AVERAGE(${firstCol}:${lastCol})`));
    row++;
  }

  // Total weight
  row++;
  setCell(ws, row, n, textCell('Total'));
  const wStartR = normStartRow + 1;
  const wEndR = wStartR + n - 1;
  const wCol = colLetter(n + 1);
  setCell(ws, row, n + 1, formulaCell(`SUM(${wCol}${wStartR}:${wCol}${wEndR})`));

  expandRange(ws, row + 1, n + 2);

  const cols: XLSX.ColInfo[] = [{ wch: 12 }];
  for (let j = 0; j < n; j++) cols.push({ wch: 12 });
  cols.push({ wch: 18 });
  ws['!cols'] = cols;
}

function buildKonsistensiSheet(
  ws: XLSX.WorkSheet,
  data: MatrixData,
  matriksSheetName: string,
  normSheetName: string,
  title: string
) {
  const n = data.codes.length;
  let row = 1;

  setCell(ws, row, 0, textCell(title));
  row++;
  setCell(ws, row, 0, textCell('Perhitungan Consistency Ratio (CR) — Semua menggunakan rumus Excel'));
  row += 2;

  // Step 1: Aw = Matriks × Bobot
  setCell(ws, row, 0, textCell('LANGKAH 1: Aw = Matriks × Vektor Bobot'));
  row++;
  setCell(ws, row, 0, textCell('Kriteria'));
  setCell(ws, row, 1, textCell('Bobot (Wi)'));
  setCell(ws, row, 2, textCell('Aw'));
  setCell(ws, row, 3, textCell('Aw / Wi'));
  row++;

  const matriksDataStartRow = 6;
  const normDataStartRow = 5; // NORMALISASI: header at row 4, data at row 5
  const awStartRow = row;

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));

    // Bobot from NORMALISASI sheet (column n+1, which is the average/weight column)
    const weightRef = `'${normSheetName}'!${cellRef(normDataStartRow + i, n + 1)}`;
    setCell(ws, row, 1, formulaCell(weightRef));

    // Aw = SUMPRODUCT(matriks_row, bobot_vector)
    // matriks row: MATRIKS!B{matriksDataStartRow+i}:..{matriksDataStartRow+i}
    const matRowStart = `'${matriksSheetName}'!${cellRef(matriksDataStartRow + i, 1)}`;
    const matRowEnd = `'${matriksSheetName}'!${cellRef(matriksDataStartRow + i, n)}`;
    // bobot vector: this sheet B{awStartRow}:B{awStartRow+n-1}
    const wVecStart = cellRef(awStartRow, 1);
    const wVecEnd = cellRef(awStartRow + n - 1, 1);
    setCell(ws, row, 2, formulaCell(`SUMPRODUCT(${matRowStart}:${matRowEnd},$${wVecStart}:$${wVecEnd})`));

    // Aw / Wi
    const awRef = cellRef(row, 2);
    const wiRef = cellRef(row, 1);
    setCell(ws, row, 3, formulaCell(`${awRef}/${wiRef}`));

    row++;
  }

  // Step 2: λmax, CI, CR
  row += 2;
  setCell(ws, row, 0, textCell('LANGKAH 2: Perhitungan λmax, CI, CR'));
  row++;

  const lambdaRow = row;
  setCell(ws, row, 0, textCell('n (jumlah kriteria)'));
  setCell(ws, row, 1, numCell(n));
  row++;

  setCell(ws, row, 0, textCell('λmax'));
  const awWiStart = cellRef(awStartRow, 3);
  const awWiEnd = cellRef(awStartRow + n - 1, 3);
  setCell(ws, row, 1, formulaCell(`AVERAGE(${awWiStart}:${awWiEnd})`));
  const lambdaMaxRef = cellRef(row, 1);
  row++;

  const ciRow = row;
  setCell(ws, row, 0, textCell('CI (Consistency Index)'));
  const nRef = cellRef(lambdaRow, 1);
  setCell(ws, row, 1, formulaCell(`(${lambdaMaxRef}-${nRef})/(${nRef}-1)`));
  const ciRef = cellRef(row, 1);
  row++;

  setCell(ws, row, 0, textCell('RI (Random Index)'));
  setCell(ws, row, 1, numCell(RI_TABLE[n] || 1.49));
  const riRef = cellRef(row, 1);
  row++;

  const crRow = row;
  setCell(ws, row, 0, textCell('CR (Consistency Ratio)'));
  setCell(ws, row, 1, formulaCell(`IF(${riRef}=0, 0, ${ciRef}/${riRef})`));
  const crRef = cellRef(row, 1);
  row++;

  row++;
  setCell(ws, row, 0, textCell('KESIMPULAN'));
  setCell(ws, row, 1, formulaCell(`IF(${crRef}<0.1,"KONSISTEN ✓ (CR < 0.10)","TIDAK KONSISTEN ✗ (CR ≥ 0.10, perlu revisi)")`));

  row += 2;
  setCell(ws, row, 0, textCell('Catatan:'));
  row++;
  setCell(ws, row, 0, textCell('• CR < 0.10 → Matriks dianggap konsisten'));
  row++;
  setCell(ws, row, 0, textCell('• CR ≥ 0.10 → Matriks TIDAK konsisten, perlu revisi penilaian'));
  row++;
  setCell(ws, row, 0, textCell('• λmax ideal ≈ n (jumlah kriteria)'));

  expandRange(ws, row + 1, 4);
  ws['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];
}

function buildFuzzyTFNSheet(
  ws: XLSX.WorkSheet,
  data: MatrixData,
  inputSheetName: string,
  title: string
) {
  const n = data.codes.length;
  let row = 1;

  setCell(ws, row, 0, textCell(title));
  row++;
  setCell(ws, row, 0, textCell('Konversi Skala Saaty → Triangular Fuzzy Number (TFN)'));
  row++;
  setCell(ws, row, 0, textCell('Setiap sel Matriks TFN terdiri dari 3 komponen: (l, m, u)'));
  row += 2;

  // ─── Tabel TFN Lookup (untuk VLOOKUP) ───
  const lookupStartRow = row;
  setCell(ws, row, 0, textCell('Tabel Referensi TFN'));
  row++;
  setCell(ws, row, 0, textCell('Skala'));
  setCell(ws, row, 1, textCell('l'));
  setCell(ws, row, 2, textCell('m'));
  setCell(ws, row, 3, textCell('u'));
  row++;
  const tfnTableStartRow = row;
  for (let s = 1; s <= 9; s++) {
    const tfn = SAATY_TO_TFN[s];
    setCell(ws, row, 0, numCell(s));
    setCell(ws, row, 1, numCell(tfn[0]));
    setCell(ws, row, 2, numCell(tfn[1]));
    setCell(ws, row, 3, numCell(tfn[2]));
    row++;
  }
  const tfnTableEndRow = row - 1;
  const tfnLookupRange = `$A$${tfnTableStartRow}:$D$${tfnTableEndRow}`;
  
  row += 2;

  // ─── Matriks TFN: l ───
  setCell(ws, row, 0, textCell('MATRIKS TFN — Komponen l (Lower)'));
  row++;
  const lMatStartRow = row;

  setCell(ws, row, 0, textCell(''));
  for (let j = 0; j < n; j++) {
    setCell(ws, row, j + 1, textCell(data.codes[j]));
  }
  row++;

  // Reference INPUT pairs
  const inputDataRow: Record<string, number> = {};
  let inputR = 5;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      inputDataRow[`${i}_${j}`] = inputR;
      inputR++;
    }
  }

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) {
        setCell(ws, row, j + 1, numCell(1));
      } else if (j > i) {
        // Upper triangle: lookup TFN.l from input scale
        const iR = inputDataRow[`${i}_${j}`];
        const scaleRef = `'${inputSheetName}'!E${iR}`;
        const dirRef = `'${inputSheetName}'!D${iR}`;
        // If A important: l from VLOOKUP. If B important: 1/u (reciprocal)
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",VLOOKUP(${scaleRef},${tfnLookupRange},2,FALSE),1/VLOOKUP(${scaleRef},${tfnLookupRange},4,FALSE))`
        ));
      } else {
        // Lower triangle: reciprocal → if upper is (l,m,u) then recip_l = 1/u_upper
        // We need the 'u' value of the transposed cell
        // The 'u' matrix will be below, so we reference data directly
        // Actually, for a clean approach: lower[i][j].l = 1 / upper[j][i].u
        // upper[j][i] is in the 'u' matrix at row (lMatStartRow + 1 + j), col (i+1)
        // But 'u' matrix is placed later... 
        // Better approach: compute from input directly
        const iR = inputDataRow[`${j}_${i}`]; // note: j < i here, but pair is stored as j_i
        const scaleRef = `'${inputSheetName}'!E${iR}`;
        const dirRef = `'${inputSheetName}'!D${iR}`;
        // This is the reciprocal position. If A more important (pair j,i → A=j):
        //   upper[j][i] = (l,m,u), so lower[i][j] = (1/u, 1/m, 1/l)
        //   For l component of reciprocal: 1/u of original
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",1/VLOOKUP(${scaleRef},${tfnLookupRange},4,FALSE),VLOOKUP(${scaleRef},${tfnLookupRange},2,FALSE))`
        ));
      }
    }
    row++;
  }

  // Row sums for l
  row++;
  setCell(ws, row, 0, textCell('Σ Baris (l)'));
  for (let i = 0; i < n; i++) {
    const dataRowL = lMatStartRow + 2 + i; // +1 for header, +1 for first data row
    setCell(ws, row, i + 1, formulaCell(
      `SUM(${cellRef(lMatStartRow + 2, i + 1)}:${cellRef(lMatStartRow + 1 + n, i + 1)})`
    ));
  }
  // Actually, row sums not column sums
  const lRowSumRow = row;
  // Override: we want row sums
  for (let j = 0; j < n; j++) {
    ws[cellRef(row, j + 1)] = undefined as any;
  }
  setCell(ws, row, 0, textCell('Σ Baris (l)'));
  for (let i = 0; i < n; i++) {
    const r = lMatStartRow + 2 + i;
    setCell(ws, lRowSumRow + i, n + 1, formulaCell(
      `SUM(${cellRef(r, 1)}:${cellRef(r, n)})`
    ));
  }
  // Hmm, let me restructure this. Row sums should be in the same row as each criteria
  // Let me redo: add row sum column to the right
  // Go back and add header
  ws[cellRef(lMatStartRow + 1, n + 1)] = textCell('Σ Baris');
  for (let i = 0; i < n; i++) {
    const r = lMatStartRow + 2 + i;
    setCell(ws, r, n + 1, formulaCell(`SUM(${cellRef(r, 1)}:${cellRef(r, n)})`));
  }
  // Clean up the wrong cells
  for (let j = 0; j < n; j++) {
    delete ws[cellRef(lRowSumRow, j + 1)];
  }
  // Grand total of row sums
  setCell(ws, row, 0, textCell('TOTAL'));
  setCell(ws, row, n + 1, formulaCell(
    `SUM(${cellRef(lMatStartRow + 2, n + 1)}:${cellRef(lMatStartRow + 1 + n, n + 1)})`
  ));
  const lTotalRef = cellRef(row, n + 1);

  row += 3;

  // ─── Matriks TFN: m ───
  setCell(ws, row, 0, textCell('MATRIKS TFN — Komponen m (Middle)'));
  row++;
  const mMatStartRow = row;

  setCell(ws, row, 0, textCell(''));
  for (let j = 0; j < n; j++) {
    setCell(ws, row, j + 1, textCell(data.codes[j]));
  }
  setCell(ws, row, n + 1, textCell('Σ Baris'));
  row++;

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) {
        setCell(ws, row, j + 1, numCell(1));
      } else if (j > i) {
        const iR = inputDataRow[`${i}_${j}`];
        const scaleRef = `'${inputSheetName}'!E${iR}`;
        const dirRef = `'${inputSheetName}'!D${iR}`;
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",VLOOKUP(${scaleRef},${tfnLookupRange},3,FALSE),1/VLOOKUP(${scaleRef},${tfnLookupRange},3,FALSE))`
        ));
      } else {
        const iR = inputDataRow[`${j}_${i}`];
        const scaleRef = `'${inputSheetName}'!E${iR}`;
        const dirRef = `'${inputSheetName}'!D${iR}`;
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",1/VLOOKUP(${scaleRef},${tfnLookupRange},3,FALSE),VLOOKUP(${scaleRef},${tfnLookupRange},3,FALSE))`
        ));
      }
    }
    setCell(ws, row, n + 1, formulaCell(`SUM(${cellRef(row, 1)}:${cellRef(row, n)})`));
    row++;
  }

  setCell(ws, row, 0, textCell('TOTAL'));
  setCell(ws, row, n + 1, formulaCell(
    `SUM(${cellRef(mMatStartRow + 2, n + 1)}:${cellRef(mMatStartRow + 1 + n, n + 1)})`
  ));
  const mTotalRef = cellRef(row, n + 1);

  row += 3;

  // ─── Matriks TFN: u ───
  setCell(ws, row, 0, textCell('MATRIKS TFN — Komponen u (Upper)'));
  row++;
  const uMatStartRow = row;

  setCell(ws, row, 0, textCell(''));
  for (let j = 0; j < n; j++) {
    setCell(ws, row, j + 1, textCell(data.codes[j]));
  }
  setCell(ws, row, n + 1, textCell('Σ Baris'));
  row++;

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));
    for (let j = 0; j < n; j++) {
      if (i === j) {
        setCell(ws, row, j + 1, numCell(1));
      } else if (j > i) {
        const iR = inputDataRow[`${i}_${j}`];
        const scaleRef = `'${inputSheetName}'!E${iR}`;
        const dirRef = `'${inputSheetName}'!D${iR}`;
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",VLOOKUP(${scaleRef},${tfnLookupRange},4,FALSE),1/VLOOKUP(${scaleRef},${tfnLookupRange},2,FALSE))`
        ));
      } else {
        const iR = inputDataRow[`${j}_${i}`];
        const scaleRef = `'${inputSheetName}'!E${iR}`;
        const dirRef = `'${inputSheetName}'!D${iR}`;
        setCell(ws, row, j + 1, formulaCell(
          `IF(${dirRef}="A",1/VLOOKUP(${scaleRef},${tfnLookupRange},2,FALSE),VLOOKUP(${scaleRef},${tfnLookupRange},4,FALSE))`
        ));
      }
    }
    setCell(ws, row, n + 1, formulaCell(`SUM(${cellRef(row, 1)}:${cellRef(row, n)})`));
    row++;
  }

  setCell(ws, row, 0, textCell('TOTAL'));
  setCell(ws, row, n + 1, formulaCell(
    `SUM(${cellRef(uMatStartRow + 2, n + 1)}:${cellRef(uMatStartRow + 1 + n, n + 1)})`
  ));
  const uTotalRef = cellRef(row, n + 1);

  expandRange(ws, row + 1, n + 3);

  const cols: XLSX.ColInfo[] = [{ wch: 16 }];
  for (let j = 0; j < n; j++) cols.push({ wch: 14 });
  cols.push({ wch: 14 });
  ws['!cols'] = cols;

  // Return references for FSE sheet
  return {
    lMatStartRow, mMatStartRow, uMatStartRow,
    lTotalRef, mTotalRef, uTotalRef,
    tfnLookupRange,
  };
}

function buildFSEBobotSheet(
  ws: XLSX.WorkSheet,
  data: MatrixData,
  fuzzySheetName: string,
  fuzzyRefs: {
    lMatStartRow: number; mMatStartRow: number; uMatStartRow: number;
    lTotalRef: string; mTotalRef: string; uTotalRef: string;
  },
  title: string
) {
  const n = data.codes.length;
  let row = 1;

  setCell(ws, row, 0, textCell(title));
  row++;
  setCell(ws, row, 0, textCell('Fuzzy Synthetic Extent (FSE) + Defuzzifikasi + Bobot Final'));
  row++;
  setCell(ws, row, 0, textCell('Si = (Σ baris_i) ⊗ (Σ total)^(-1) → Defuzzifikasi: D = (l+m+u)/3 → Normalisasi'));
  row += 2;

  // Step 1: FSE
  setCell(ws, row, 0, textCell('LANGKAH 1: Fuzzy Synthetic Extent (FSE)'));
  row++;
  setCell(ws, row, 0, textCell('Kriteria'));
  setCell(ws, row, 1, textCell('Σl_i'));
  setCell(ws, row, 2, textCell('Σm_i'));
  setCell(ws, row, 3, textCell('Σu_i'));
  setCell(ws, row, 4, textCell('ΣΣ_l (total)'));
  setCell(ws, row, 5, textCell('ΣΣ_m'));
  setCell(ws, row, 6, textCell('ΣΣ_u'));
  setCell(ws, row, 7, textCell('Si_l'));
  setCell(ws, row, 8, textCell('Si_m'));
  setCell(ws, row, 9, textCell('Si_u'));
  row++;

  const fseStartRow = row;

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));

    // Row sums from FUZZY sheet
    const lRowSumRef = `'${fuzzySheetName}'!${cellRef(fuzzyRefs.lMatStartRow + 2 + i, n + 1)}`;
    const mRowSumRef = `'${fuzzySheetName}'!${cellRef(fuzzyRefs.mMatStartRow + 2 + i, n + 1)}`;
    const uRowSumRef = `'${fuzzySheetName}'!${cellRef(fuzzyRefs.uMatStartRow + 2 + i, n + 1)}`;
    
    setCell(ws, row, 1, formulaCell(lRowSumRef));
    setCell(ws, row, 2, formulaCell(mRowSumRef));
    setCell(ws, row, 3, formulaCell(uRowSumRef));

    // Totals (same for every row)
    const lTotalFullRef = `'${fuzzySheetName}'!${fuzzyRefs.lTotalRef}`;
    const mTotalFullRef = `'${fuzzySheetName}'!${fuzzyRefs.mTotalRef}`;
    const uTotalFullRef = `'${fuzzySheetName}'!${fuzzyRefs.uTotalRef}`;
    
    setCell(ws, row, 4, formulaCell(lTotalFullRef));
    setCell(ws, row, 5, formulaCell(mTotalFullRef));
    setCell(ws, row, 6, formulaCell(uTotalFullRef));

    // FSE: Si = row_sum ⊗ total^(-1)
    // Si_l = Σl_i × (1/ΣΣ_u) — multiply lower by inverse of upper total
    // Si_m = Σm_i × (1/ΣΣ_m)
    // Si_u = Σu_i × (1/ΣΣ_l)
    const li = cellRef(row, 1);
    const mi = cellRef(row, 2);
    const ui = cellRef(row, 3);
    const tl = cellRef(row, 4);
    const tm = cellRef(row, 5);
    const tu = cellRef(row, 6);

    setCell(ws, row, 7, formulaCell(`${li}*(1/${tu})`)); // Si_l = Σli / ΣΣu
    setCell(ws, row, 8, formulaCell(`${mi}*(1/${tm})`)); // Si_m = Σmi / ΣΣm
    setCell(ws, row, 9, formulaCell(`${ui}*(1/${tl})`)); // Si_u = Σui / ΣΣl

    row++;
  }

  // Step 2: Defuzzifikasi
  row += 2;
  setCell(ws, row, 0, textCell('LANGKAH 2: Defuzzifikasi (Center of Area) + Normalisasi'));
  row++;
  setCell(ws, row, 0, textCell('Kriteria'));
  setCell(ws, row, 1, textCell('Si_l'));
  setCell(ws, row, 2, textCell('Si_m'));
  setCell(ws, row, 3, textCell('Si_u'));
  setCell(ws, row, 4, textCell('Defuzzy = (l+m+u)/3'));
  setCell(ws, row, 5, textCell('Bobot Normal'));
  setCell(ws, row, 6, textCell('Bobot %'));
  setCell(ws, row, 7, textCell('Ranking'));
  row++;

  const defuzzStartRow = row;

  for (let i = 0; i < n; i++) {
    setCell(ws, row, 0, textCell(data.codes[i]));

    // Reference FSE values
    const slRef = cellRef(fseStartRow + i, 7);
    const smRef = cellRef(fseStartRow + i, 8);
    const suRef = cellRef(fseStartRow + i, 9);

    setCell(ws, row, 1, formulaCell(slRef));
    setCell(ws, row, 2, formulaCell(smRef));
    setCell(ws, row, 3, formulaCell(suRef));

    // Defuzzify
    const dl = cellRef(row, 1);
    const dm = cellRef(row, 2);
    const du = cellRef(row, 3);
    setCell(ws, row, 4, formulaCell(`(${dl}+${dm}+${du})/3`));

    row++;
  }

  // Total defuzzified
  const defuzzCol = colLetter(4);
  const defuzzTotalRow = row;
  setCell(ws, row, 3, textCell('TOTAL'));
  setCell(ws, row, 4, formulaCell(`SUM(${defuzzCol}${defuzzStartRow}:${defuzzCol}${defuzzStartRow + n - 1})`));
  const totalDefuzzRef = cellRef(row, 4);

  // Now fill normalized weights and percentage
  for (let i = 0; i < n; i++) {
    const r = defuzzStartRow + i;
    const defuzzRef = cellRef(r, 4);
    setCell(ws, r, 5, formulaCell(`${defuzzRef}/${totalDefuzzRef}`));
    setCell(ws, r, 6, formulaCell(`${cellRef(r, 5)}*100`));
    // Ranking: RANK
    setCell(ws, r, 7, formulaCell(
      `RANK(${cellRef(r, 5)},${colLetter(5)}$${defuzzStartRow}:${colLetter(5)}$${defuzzStartRow + n - 1},0)`
    ));
  }

  expandRange(ws, defuzzTotalRow + 2, 10);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 14 },
  ];
}


// ═══════════════════════════════════════════════════════════════
// Complete AHP Sheet Set for a single level
// ═══════════════════════════════════════════════════════════════

function buildCompleteAHPSheets(
  wb: XLSX.WorkBook,
  data: MatrixData,
  prefix: string,
  levelLabel: string
) {
  const inputName = `INPUT_${prefix}`;
  const matriksName = `MATRIKS_${prefix}`;
  const normName = `NORM_${prefix}`;
  const crName = `CR_${prefix}`;
  const fuzzyName = `FUZZY_${prefix}`;
  const fseName = `FSE_${prefix}`;

  // 1. INPUT sheet
  const wsInput: XLSX.WorkSheet = {};
  wsInput['!ref'] = 'A1';
  buildInputSheet(wsInput, data, `INPUT DATA — ${levelLabel}`, matriksName);
  XLSX.utils.book_append_sheet(wb, wsInput, inputName);

  // 2. MATRIKS sheet
  const wsMatriks: XLSX.WorkSheet = {};
  wsMatriks['!ref'] = 'A1';
  buildMatriksSheet(wsMatriks, data, inputName, `MATRIKS PERBANDINGAN BERPASANGAN — ${levelLabel}`);
  XLSX.utils.book_append_sheet(wb, wsMatriks, matriksName);

  // 3. NORMALISASI sheet
  const wsNorm: XLSX.WorkSheet = {};
  wsNorm['!ref'] = 'A1';
  buildNormalisasiSheet(wsNorm, data, matriksName, `NORMALISASI & BOBOT PRIORITAS — ${levelLabel}`);
  XLSX.utils.book_append_sheet(wb, wsNorm, normName);

  // 4. KONSISTENSI sheet
  const wsCR: XLSX.WorkSheet = {};
  wsCR['!ref'] = 'A1';
  buildKonsistensiSheet(wsCR, data, matriksName, normName, `KONSISTENSI (CR) — ${levelLabel}`);
  XLSX.utils.book_append_sheet(wb, wsCR, crName);

  // 5. FUZZY TFN sheet
  const wsFuzzy: XLSX.WorkSheet = {};
  wsFuzzy['!ref'] = 'A1';
  const fuzzyRefs = buildFuzzyTFNSheet(wsFuzzy, data, inputName, `MATRIKS TFN FUZZY — ${levelLabel}`);
  XLSX.utils.book_append_sheet(wb, wsFuzzy, fuzzyName);

  // 6. FSE + BOBOT FINAL sheet
  const wsFSE: XLSX.WorkSheet = {};
  wsFSE['!ref'] = 'A1';
  buildFSEBobotSheet(wsFSE, data, fuzzyName, fuzzyRefs, `FSE & BOBOT FINAL — ${levelLabel}`);
  XLSX.utils.book_append_sheet(wb, wsFSE, fseName);
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('📊 Generating Excel Perhitungan Manual Fuzzy AHP — Kuesioner 1...\n');

  const wb = XLSX.utils.book_new();

  // ─── Level 1: Antar CP ───
  console.log('📋 Loading Level 1 data (LEVEL1_CP)...');
  const l1Data = await loadLevel1Data();
  console.log(`  → ${l1Data.codes.length} kriteria: ${l1Data.codes.join(', ')}`);
  buildCompleteAHPSheets(wb, l1Data, 'L1', `Level 1 — Antar Critical Point (${l1Data.codes.join(', ')})`);

  // ─── Level 2: Sub-kriteria per CP ───
  const cpIds = l1Data.codes;
  for (const cpId of cpIds) {
    console.log(`📋 Loading Level 2 data (${cpId})...`);
    const l2Data = await loadLevel2Data(cpId);
    if (l2Data && l2Data.codes.length > 1) {
      console.log(`  → ${l2Data.codes.length} sub-kriteria: ${l2Data.codes.join(', ')}`);
      // Truncate sheet name to max 31 chars
      const prefix = cpId;
      buildCompleteAHPSheets(wb, l2Data, prefix, `Level 2 — Sub-Kriteria ${cpId}`);
    } else {
      console.log(`  → ⏭️ Tidak ada data Level 2 untuk ${cpId}`);
    }
  }

  // ─── Save ───
  const outputDir = path.resolve('c:/Users/Acer/Pictures/chatbot/nextrag');
  const filename = `Perhitungan_Manual_FuzzyAHP_K1_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const outputPath = path.join(outputDir, filename);

  XLSX.writeFile(wb, outputPath);
  console.log(`\n✅ File Excel berhasil dibuat: ${outputPath}`);
  console.log(`   Total sheets: ${wb.SheetNames.length}`);
  console.log(`   Sheets: ${wb.SheetNames.join(', ')}`);
  console.log('\n📝 Petunjuk:');
  console.log('   1. Buka file di Excel');
  console.log('   2. Ubah data input di sheet INPUT_L1 (kolom D: "A"/"B", kolom E: skala 1-9)');
  console.log('   3. Semua sheet lainnya akan terupdate otomatis via rumus');
  console.log('   4. Lihat sheet CR_L1 untuk cek konsistensi');
  console.log('   5. Lihat sheet FSE_L1 untuk bobot final Fuzzy AHP');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
