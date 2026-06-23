import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    const { batchId } = params;

    const batch = await prisma.halalBatch.findFirst({
      where: {
        OR: [
          { id: batchId },
          { id: { startsWith: batchId } },
          { cattle: { earTag: { equals: batchId, mode: "insensitive" } } },
        ],
      },
      include: {
        cattle: { include: { farm: { select: { name: true, location: true } } } },
        slaughterhouse: { select: { name: true, location: true } },
        cpRecords: {
          include: { criticalPoint: { select: { id: true, name: true } } },
          orderBy: { criticalPoint: { id: "asc" } },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: `Batch "${batchId}" tidak ditemukan` },
        { status: 404 }
      );
    }

    const cpRecordsFiltered = batch.cpRecords
      .filter((r) => !r.criticalPointId.startsWith("CP10"))
      .map((r) => ({
        cpId: r.criticalPoint.id,
        cpName: r.criticalPoint.name,
        status: r.complianceStatus,
        riskValue: Number(r.riskValue.toFixed(4)),
        weightedRisk: Number(r.weightedRisk.toFixed(4)),
      }));

    const { getRiskLevel } = await import("@/lib/dss/fuzzyAHP");

    const response = {
      id: batch.id,
      productionDate: batch.productionDate,
      totalRiskScore: Number(batch.totalRiskScore.toFixed(4)),
      riskLevel: batch.riskLevel,
      cattle: {
        earTag: batch.cattle.earTag,
        breed: batch.cattle.breed,
        farm: batch.cattle.farm.name,
        farmLocation: batch.cattle.farm.location,
      },
      slaughterhouse: {
        name: batch.slaughterhouse.name,
        location: batch.slaughterhouse.location,
      },
      butcherName: batch.butcherName,
      cpRecords: cpRecordsFiltered.map((cp) => ({
        ...cp,
        riskLevel: getRiskLevel(cp.riskValue),
      })),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Trace API Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data traceability" },
      { status: 500 }
    );
  }
}
