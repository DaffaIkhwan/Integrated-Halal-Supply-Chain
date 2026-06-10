import { NextResponse } from "next/server";
import { 
  loadMatrixFromDB, 
  calculateFSE, 
  defuzzify, 
  normalizeWeights, 
  calculateConsistencyRatio 
} from "@/lib/dss/fuzzyAHP";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "LEVEL1_CP"; // default to Level 1

  try {
    const { matrix, codes } = await loadMatrixFromDB(type);
    const fse = calculateFSE(matrix);
    const crispValues = fse.map((val) => defuzzify(val));
    const normalizedWeights = normalizeWeights(crispValues);
    const cr = calculateConsistencyRatio(matrix);

    // Format output for tables
    const pairwiseTable = codes.map((rowCode, i) => {
      const row: any = { code: rowCode };
      codes.forEach((colCode, j) => {
        const [l, m, u] = matrix[i][j];
        row[colCode] = `[${l.toFixed(2)}, ${m.toFixed(2)}, ${u.toFixed(2)}]`;
      });
      return row;
    });

    const resultTable = codes.map((code, i) => ({
      code,
      fse: `[${fse[i][0].toFixed(3)}, ${fse[i][1].toFixed(3)}, ${fse[i][2].toFixed(3)}]`,
      crisp: crispValues[i].toFixed(4),
      weight: normalizedWeights[i].toFixed(4),
      percentage: (normalizedWeights[i] * 100).toFixed(2) + "%",
    }));

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
      pairwiseTable,
      resultTable,
      cr,
      allCRs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
