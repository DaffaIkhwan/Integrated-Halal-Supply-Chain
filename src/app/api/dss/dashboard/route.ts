import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

function getRiskLevel(score: number): string {
  if (score >= 0.76) return "Critical";
  if (score >= 0.51) return "High";
  if (score >= 0.26) return "Moderate";
  return "Low";
}

export async function GET() {
  try {
    // 1. Critical Points with weights & criteria
    const criticalPoints = await prisma.criticalPoint.findMany({
      include: {
        criteriaWeights: { orderBy: { criteriaCode: 'asc' } },
      },
      orderBy: { id: 'asc' },
    });

    // 2. Halal Batches with cattle & slaughterhouse info
    const batches = await prisma.halalBatch.findMany({
      include: {
        cattle: { include: { farm: true } },
        slaughterhouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. CP Records per batch (for compliance breakdown and averaging)
    const cpRecords = await prisma.criticalPointRecord.findMany({
      include: { criticalPoint: true },
      orderBy: [{ halalBatchId: 'asc' }, { criticalPointId: 'asc' }],
    });

    // 4. Fetch counts of master data entities + questionnaire responses
    const [
      farmsCount,
      slaughterhousesCount,
      cattleCount,
      k1Count,
      k2Count,
      k3Count,
      recentResponses,
    ] = await Promise.all([
      prisma.farm.count(),
      prisma.slaughterhouse.count(),
      prisma.cattle.count(),
      prisma.questionnaireResponse.count({ where: { questionnaireType: 'pembobotan' } }),
      prisma.questionnaireResponse.count({ where: { questionnaireType: 'risiko' } }),
      prisma.questionnaireResponse.count({ where: { questionnaireType: 'aktual' } }),
      prisma.questionnaireResponse.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          questionnaireType: true,
          cpId: true,
          respondentName: true,
          respondentOrg: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // 5. Aggregate CP statistics in memory across all batches to get actual average risks
    const cpStatsMap = new Map<string, { totalRisk: number; totalWeightedRisk: number; count: number }>();
    for (const r of cpRecords) {
      const stats = cpStatsMap.get(r.criticalPointId) || { totalRisk: 0, totalWeightedRisk: 0, count: 0 };
      stats.totalRisk += r.riskValue;
      stats.totalWeightedRisk += r.weightedRisk;
      stats.count += 1;
      cpStatsMap.set(r.criticalPointId, stats);
    }

    // 6. Stats
    const totalBatches = batches.length;
    const highRiskBatches = batches.filter((b) => b.riskLevel?.toLowerCase() === 'high' || b.riskLevel?.toLowerCase() === 'critical').length;
    const passRate = cpRecords.length > 0
      ? Math.round((cpRecords.filter((r) => r.complianceStatus === 'PASS').length / cpRecords.length) * 100)
      : 0;
    const avgRiskScore = batches.length > 0
      ? Number((batches.reduce((sum, b) => sum + b.totalRiskScore, 0) / batches.length).toFixed(4))
      : 0;

    // 7. Risk distribution breakdown
    const riskDistribution: Record<string, number> = {};
    for (const b of batches) {
      const level = b.riskLevel || 'Unknown';
      riskDistribution[level] = (riskDistribution[level] || 0) + 1;
    }

    return NextResponse.json({
      criticalPoints: criticalPoints.map((cp) => {
        const stats = cpStatsMap.get(cp.id) || { totalRisk: 0, totalWeightedRisk: 0, count: 0 };
        const avgLocalRisk = stats.count > 0 ? stats.totalRisk / stats.count : 0;
        const avgWeightedRisk = stats.count > 0 ? stats.totalWeightedRisk / stats.count : 0;
        return {
          id: cp.id,
          name: cp.name,
          globalWeight: cp.globalWeight,
          localRiskScore: Number(avgLocalRisk.toFixed(4)),
          globalWeightedRisk: Number(avgWeightedRisk.toFixed(4)),
          riskLevel: getRiskLevel(avgLocalRisk),
          criteria: cp.criteriaWeights.map((cw) => ({
            code: cw.criteriaCode,
            name: cw.criteriaName,
            weight: cw.weight,
          })),
        };
      }),
      batches: batches.map((b) => ({
        id: b.id,
        earTag: b.cattle?.earTag ?? 'N/A',
        breed: b.cattle?.breed ?? 'N/A',
        farmName: b.cattle?.farm?.name ?? 'N/A',
        rphName: b.slaughterhouse?.name ?? 'N/A',
        productionDate: b.productionDate,
        totalRiskScore: b.totalRiskScore,
        riskLevel: b.riskLevel,
        cpRecords: cpRecords
          .filter((r) => r.halalBatchId === b.id)
          .map((r) => ({
            cpId: r.criticalPointId,
            cpName: r.criticalPoint.name,
            status: r.complianceStatus,
            riskValue: r.riskValue,
            weightedRisk: r.weightedRisk,
          })),
      })),
      stats: {
        totalBatches,
        highRiskBatches,
        passRate,
        avgRiskScore,
        totalCriticalPoints: criticalPoints.length,
        farmsCount,
        slaughterhousesCount,
        cattleCount,
        k1Count,
        k2Count,
        k3Count,
      },
      riskDistribution,
      recentResponses,
    });
  } catch (error: unknown) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data', details: String(error) },
      { status: 500 }
    );
  }
}
