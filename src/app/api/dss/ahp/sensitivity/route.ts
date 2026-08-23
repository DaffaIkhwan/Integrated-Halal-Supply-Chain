import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

// ─── Types ───
interface CPWeight {
  id: string;
  name: string;
  weight: number;
}

interface RankEntry {
  cpId: string;
  cpName: string;
  weight: number;
  percentage: string;
  rank: number;
}

interface ScenarioResult {
  targetCP: string;
  changePercent: number;
  changeLabel: string;
  newRanking: RankEntry[];
  rankChanges: {
    cpId: string;
    oldRank: number;
    newRank: number;
    delta: number; // positive = moved up, negative = moved down
  }[];
  topChanged: boolean; // did the #1 rank change?
  anyRankChanged: boolean;
}

// ─── Proportional Redistribution ───
function perturbWeights(
  baseline: CPWeight[],
  targetId: string,
  changePercent: number
): CPWeight[] {
  const target = baseline.find((cp) => cp.id === targetId);
  if (!target) return baseline;

  const originalWeight = target.weight;
  let newWeight = originalWeight * (1 + changePercent / 100);
  if (newWeight < 0) newWeight = 0;
  if (newWeight > 1) newWeight = 1;

  const diff = newWeight - originalWeight;
  const sumOthers = 1 - originalWeight;

  return baseline.map((cp) => {
    if (cp.id === targetId) {
      return { ...cp, weight: newWeight };
    }
    const proportion = sumOthers > 0 ? cp.weight / sumOthers : 0;
    const adjusted = cp.weight - proportion * diff;
    return { ...cp, weight: Math.max(0, adjusted) };
  });
}

// ─── Build Ranking ───
function buildRanking(weights: CPWeight[]): RankEntry[] {
  const sorted = [...weights].sort((a, b) => b.weight - a.weight);
  return sorted.map((cp, i) => ({
    cpId: cp.id,
    cpName: cp.name,
    weight: cp.weight,
    percentage: (cp.weight * 100).toFixed(2) + "%",
    rank: i + 1,
  }));
}

// ─── Compare Rankings ───
function compareRankings(
  baselineRanking: RankEntry[],
  newRanking: RankEntry[]
) {
  const baseMap = new Map(baselineRanking.map((r) => [r.cpId, r.rank]));
  return newRanking.map((nr) => ({
    cpId: nr.cpId,
    oldRank: baseMap.get(nr.cpId) || 0,
    newRank: nr.rank,
    delta: (baseMap.get(nr.cpId) || 0) - nr.rank, // positive = moved up
  }));
}

// ─── Main API Handler ───
export async function GET() {
  try {
    // 1. Read live weights from database
    const cps = await prisma.criticalPoint.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, globalWeight: true },
    });

    if (cps.length === 0) {
      return NextResponse.json(
        { error: "Data CriticalPoint belum ada di database." },
        { status: 404 }
      );
    }

    const baseline: CPWeight[] = cps.map((cp) => ({
      id: cp.id,
      name: cp.name,
      weight: cp.globalWeight,
    }));

    const baselineRanking = buildRanking(baseline);

    // 2. Run perturbation scenarios
    const variations = [-20, -15, -10, -5, 5, 10, 15, 20];
    const scenarios: ScenarioResult[] = [];

    for (const cp of baseline) {
      for (const pct of variations) {
        const perturbed = perturbWeights(baseline, cp.id, pct);
        const newRanking = buildRanking(perturbed);
        const rankChanges = compareRankings(baselineRanking, newRanking);
        const anyRankChanged = rankChanges.some((rc) => rc.delta !== 0);
        const topChanged =
          newRanking[0]?.cpId !== baselineRanking[0]?.cpId;

        scenarios.push({
          targetCP: cp.id,
          changePercent: pct,
          changeLabel:
            pct > 0 ? `+${pct}%` : `${pct}%`,
          newRanking,
          rankChanges,
          topChanged,
          anyRankChanged,
        });
      }
    }

    // 3. Sensitivity Index per CP
    const sensitivityIndex = baseline.map((cp) => {
      const cpScenarios = scenarios.filter((s) => s.targetCP === cp.id);
      const totalScenarios = cpScenarios.length;
      const rankChangeCount = cpScenarios.filter(
        (s) => s.anyRankChanged
      ).length;
      const topChangeCount = cpScenarios.filter(
        (s) => s.topChanged
      ).length;

      return {
        cpId: cp.id,
        cpName: cp.name,
        baselineWeight: cp.weight,
        totalScenarios,
        rankChangeCount,
        topChangeCount,
        sensitivityScore: totalScenarios > 0
          ? rankChangeCount / totalScenarios
          : 0,
        stability:
          rankChangeCount === 0
            ? "Sangat Stabil"
            : rankChangeCount <= 2
              ? "Stabil"
              : rankChangeCount <= 4
                ? "Cukup Sensitif"
                : "Sensitif",
      };
    });

    // 4. Overall robustness
    const totalScenarios = scenarios.length;
    const totalRankChanges = scenarios.filter(
      (s) => s.anyRankChanged
    ).length;
    const totalTopChanges = scenarios.filter((s) => s.topChanged).length;
    const robustnessScore = 1 - totalRankChanges / totalScenarios;

    const robustnessLevel =
      robustnessScore >= 0.9
        ? "Sangat Robust"
        : robustnessScore >= 0.7
          ? "Robust"
          : robustnessScore >= 0.5
            ? "Cukup Robust"
            : "Sensitif";

    // 5. Build conclusion
    const top3 = baselineRanking.slice(0, 3).map((r) => r.cpId);
    const top3Stable = !scenarios.some(
      (s) =>
        s.topChanged ||
        s.rankChanges
          .filter((rc) => top3.includes(rc.cpId))
          .some((rc) => Math.abs(rc.delta) >= 2)
    );

    const mostStable = [...sensitivityIndex].sort(
      (a, b) => a.sensitivityScore - b.sensitivityScore
    )[0];
    const mostSensitive = [...sensitivityIndex].sort(
      (a, b) => b.sensitivityScore - a.sensitivityScore
    )[0];

    const conclusion = {
      robustnessLevel,
      robustnessScore: Number((robustnessScore * 100).toFixed(1)),
      totalScenarios,
      totalRankChanges,
      totalTopChanges,
      top3Stable,
      top3CPs: top3,
      mostStableCPId: mostStable?.cpId,
      mostStableCPName: mostStable?.cpName,
      mostSensitiveCPId: mostSensitive?.cpId,
      mostSensitiveCPName: mostSensitive?.cpName,
      summary:
        robustnessScore >= 0.8
          ? `Model Fuzzy AHP memiliki kestabilan yang ${robustnessLevel.toLowerCase()}. Dari ${totalScenarios} skenario perturbasi (±5% s.d. ±20%), hanya ${totalRankChanges} skenario yang mengubah peringkat. Top-3 prioritas (${top3.join(", ")}) ${top3Stable ? "tetap stabil" : "mengalami pergeseran"} pada seluruh variasi.`
          : `Model Fuzzy AHP menunjukkan tingkat sensitivitas terhadap perubahan bobot. Dari ${totalScenarios} skenario, ${totalRankChanges} skenario menggeser peringkat. Perlu perhatian khusus pada ${mostSensitive?.cpId} yang paling sensitif terhadap perubahan.`,
    };

    return NextResponse.json({
      baseline: baselineRanking,
      scenarios,
      sensitivityIndex,
      conclusion,
      variations,
    });
  } catch (error: any) {
    console.error("Sensitivity Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
