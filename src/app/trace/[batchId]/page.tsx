import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TracePageClient } from "./trace-client";

interface Props {
  params: { batchId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { batchId } = params;
  return {
    title: `Lacak Batch ${batchId.split("-")[0]} — Halal KMS`,
    description: `Traceability halal supply chain untuk batch ${batchId.split("-")[0]}`,
  };
}

export default async function TracePage({ params }: Props) {
  const { batchId } = params;

  const batch = await prisma.halalBatch.findFirst({
    where: {
      OR: [
        { id: batchId },
        { id: { startsWith: batchId } },
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

  if (!batch) notFound();

  const { getRiskLevel } = await import("@/lib/dss/fuzzyAHP");

  const cpRecords = batch.cpRecords
    .filter((r) => !r.criticalPointId.startsWith("CP10"))
    .map((r) => ({
      cpId: r.criticalPoint.id,
      cpName: r.criticalPoint.name,
      status: r.complianceStatus,
      riskValue: Number(r.riskValue.toFixed(4)),
      weightedRisk: Number(r.weightedRisk.toFixed(4)),
      riskLevel: getRiskLevel(r.riskValue),
    }));

  const data = {
    id: batch.id,
    productionDate: batch.productionDate.toISOString(),
    totalRiskScore: Number(batch.totalRiskScore.toFixed(4)),
    riskLevel: batch.riskLevel,
    earTag: batch.cattle.earTag,
    breed: batch.cattle.breed,
    farmName: batch.cattle.farm.name,
    farmLocation: batch.cattle.farm.location,
    rphName: batch.slaughterhouse.name,
    rphLocation: batch.slaughterhouse.location,
    butcherName: batch.butcherName,
    cpRecords,
  };

  return <TracePageClient data={data} />;
}
