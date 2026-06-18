import { NextResponse } from "next/server";
import { 
  loadMatrixFromDB, 
  calculateFSE, 
  defuzzify, 
  normalizeWeights, 
  calculateConsistencyRatio,
  sumTFNs,
  getReciprocal,
  type TFN,
} from "@/lib/dss/fuzzyAHP";

export const dynamic = 'force-dynamic';

// Random Index (RI) table — Saaty (1990)
const RI_TABLE: Record<number, number> = {
  1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "LEVEL1_CP"; // default to Level 1

  try {
    const { matrix, codes } = await loadMatrixFromDB(type);
    const n = codes.length;

    // ─── Intermediate: Row Sums, Total Sum, Inverse ───
    const rowSums = matrix.map((row) => sumTFNs(row.map(cell => cell || [1, 1, 1] as TFN)));
    const totalSum = sumTFNs(rowSums);
    const inversTotal = getReciprocal(totalSum);

    const fse = calculateFSE(matrix);
    const crispValues = fse.map((val) => defuzzify(val));
    const normalizedWeights = normalizeWeights(crispValues);
    const cr = calculateConsistencyRatio(matrix);

    // Format output for tables
    const pairwiseTable = codes.map((rowCode, i) => {
      const row: any = { code: rowCode };
      codes.forEach((colCode, j) => {
        const cell = matrix[i]?.[j] || [1, 1, 1];
        const [l, m, u] = cell;
        row[colCode] = `[${l.toFixed(2)}, ${m.toFixed(2)}, ${u.toFixed(2)}]`;
      });
      return row;
    });

    // Crisp pairwise table — defuzzified middle values for readable Saaty-like display
    const crispPairwiseTable = codes.map((rowCode, i) => {
      const row: any = { code: rowCode };
      codes.forEach((colCode, j) => {
        const cell = matrix[i]?.[j] || [1, 1, 1];
        row[colCode] = defuzzify(cell);
      });
      return row;
    });

    // Row Sums table for intermediate display
    const rowSumsTable = codes.map((code, i) => {
      const rs = rowSums[i] || [0, 0, 0];
      return {
        code,
        rowSum: `[${rs[0].toFixed(3)}, ${rs[1].toFixed(3)}, ${rs[2].toFixed(3)}]`,
      };
    });

    const resultTable = codes.map((code, i) => {
      const f = fse[i] || [0, 0, 0];
      return {
        code,
        fse: `[${f[0].toFixed(3)}, ${f[1].toFixed(3)}, ${f[2].toFixed(3)}]`,
        crisp: (crispValues[i] ?? 0).toFixed(4),
        weight: (normalizedWeights[i] ?? 0).toFixed(4),
        percentage: ((normalizedWeights[i] ?? 0) * 100).toFixed(2) + "%",
      };
    });

    // Calculate CR for all other levels for summary display
    const allMatrixTypes = [
      { id: 'KU_LEVEL', label: 'Kriteria Umum (KU)' },
      { id: 'LEVEL1_CP', label: 'Antar CP — Level 1' },
      { id: 'LEVEL2_CP1', label: 'Sub-Kriteria CP1' },
      { id: 'LEVEL2_CP2', label: 'Sub-Kriteria CP2' },
      { id: 'LEVEL2_CP3', label: 'Sub-Kriteria CP3' },
      { id: 'LEVEL2_CP4', label: 'Sub-Kriteria CP4' },
      { id: 'LEVEL2_CP5', label: 'Sub-Kriteria CP5' },
      { id: 'LEVEL2_CP6', label: 'Sub-Kriteria CP6' },
      { id: 'LEVEL2_CP7', label: 'Sub-Kriteria CP7' },
      { id: 'LEVEL2_CP8', label: 'Sub-Kriteria CP8' },
      { id: 'LEVEL2_CP9', label: 'Sub-Kriteria CP9' },
      { id: 'LEVEL2_CP10', label: 'Sub-Kriteria CP10' },
    ];

    const allCRs = [];
    for (const mt of allMatrixTypes) {
      try {
        const { matrix: m } = await loadMatrixFromDB(mt.id);
        const mCr = calculateConsistencyRatio(m);
        allCRs.push({
          level: mt.label,
          lambdaMax: mCr.lambdaMax,
          ci: mCr.ci,
          cr: mCr.cr,
          isConsistent: mCr.isConsistent,
        });
      } catch (e) {
        // Matrix not found or empty
        allCRs.push({
          level: mt.label,
          lambdaMax: null,
          ci: null,
          cr: null,
          isConsistent: null,
        });
      }
    }

    return NextResponse.json({
      codes,
      n,
      pairwiseTable,
      crispPairwiseTable,
      rowSumsTable,
      totalSum: `[${totalSum[0].toFixed(3)}, ${totalSum[1].toFixed(3)}, ${totalSum[2].toFixed(3)}]`,
      inversTotal: `[${inversTotal[0].toFixed(4)}, ${inversTotal[1].toFixed(4)}, ${inversTotal[2].toFixed(4)}]`,
      ri: RI_TABLE[n] ?? 1.49,
      resultTable,
      cr,
      allCRs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
