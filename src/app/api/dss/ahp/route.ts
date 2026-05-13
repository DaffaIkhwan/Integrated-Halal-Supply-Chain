import { NextResponse } from "next/server";
import { 
  loadMatrixFromDB, 
  calculateFSE, 
  defuzzify, 
  normalizeWeights, 
  calculateConsistencyRatio 
} from "@/lib/dss/fuzzyAHP";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "LEVEL1_CP"; // default to Level 1

  try {
    const { matrix, codes } = await loadMatrixFromDB(type);
    const fse = calculateFSE(matrix);
    const crispValues = fse.map((val) => defuzzify(val));
    const normalizedWeights = normalizeWeights(crispValues);
    const cr = calculateConsistencyRatio(matrix, normalizedWeights);

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

    return NextResponse.json({
      codes,
      pairwiseTable,
      resultTable,
      cr,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
