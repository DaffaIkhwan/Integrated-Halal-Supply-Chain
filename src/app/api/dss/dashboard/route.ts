import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

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

    // 3. CP Records per batch (for compliance breakdown)
    const cpRecords = await prisma.criticalPointRecord.findMany({
      include: { criticalPoint: true },
      orderBy: [{ halalBatchId: 'asc' }, { criticalPointId: 'asc' }],
    });

    // 4. Stats
    const totalBatches = batches.length;
    const highRiskBatches = batches.filter((b) => b.riskLevel === 'High' || b.riskLevel === 'CRITICAL').length;
    const passRate = cpRecords.length > 0
      ? Math.round((cpRecords.filter((r) => r.complianceStatus === 'PASS').length / cpRecords.length) * 100)
      : 0;
    const avgRiskScore = batches.length > 0
      ? Number((batches.reduce((sum, b) => sum + b.totalRiskScore, 0) / batches.length).toFixed(4))
      : 0;

    return NextResponse.json({
      criticalPoints: criticalPoints.map((cp) => ({
        id: cp.id,
        name: cp.name,
        globalWeight: cp.globalWeight,
        localRiskScore: cp.localRiskScore,
        globalWeightedRisk: cp.globalWeightedRisk,
        riskLevel: cp.riskLevel,
        criteria: cp.criteriaWeights.map((cw) => ({
          code: cw.criteriaCode,
          name: cw.criteriaName,
          weight: cw.weight,
        })),
      })),
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
      },
    });
  } catch (error: unknown) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data', details: String(error) },
      { status: 500 }
    );
  }
}
