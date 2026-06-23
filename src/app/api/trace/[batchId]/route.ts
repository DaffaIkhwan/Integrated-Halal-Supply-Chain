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
        cattle: {
          include: { farm: { select: { name: true, location: true } } },
        },
        slaughterhouse: { select: { name: true, location: true } },
        cpRecords: {
          include: {
            criticalPoint: { select: { id: true, name: true } },
            criteriaWeight: { select: { weight: true } },
          },
          orderBy: { criticalPoint: { id: "asc" } },
        },
        cp1Farm: { take: 1, orderBy: { createdAt: "desc" } },
        cp2Feed: { take: 1, orderBy: { createdAt: "desc" } },
        cp3Transport: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { transporter: { select: { name: true, vehicleNumber: true, originLocation: true, destinationLocation: true, animalCount: true } } },
        },
        cp4Slaughter: { take: 1, orderBy: { createdAt: "desc" } },
        cp5PostSlaughter: { take: 1, orderBy: { createdAt: "desc" } },
        cp6Processing: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { processingPlant: { select: { name: true, location: true } } },
        },
        cp7Storage: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { warehouse: { select: { name: true, location: true } } },
        },
        cp8Distribution: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { distributor: { select: { name: true, location: true, coverageArea: true } } },
        },
        cp9Retail: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { retailOutlet: { select: { name: true, location: true, outletType: true } } },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: `Batch "${batchId}" tidak ditemukan` },
        { status: 404 }
      );
    }

    const { getRiskLevel } = await import("@/lib/dss/fuzzyAHP");

    // Helper: find highest risk sub-criteria from a CP detail record
    function getHighestSubCp(record: Record<string, any>, mapping: Record<string, string>) {
      let highest = { name: "-", value: 0 };
      for (const [field, label] of Object.entries(mapping)) {
        const val = record[field];
        if (typeof val === "number" && val > highest.value) {
          highest = { name: label, value: val };
        }
      }
      return highest;
    }

    // Sub-CP field mappings
    const subCpMappings: Record<string, Record<string, string>> = {
      CP1: { asalUsulRisk: "Asal-usul Sapi", kesehatanRisk: "Kesehatan", kepatuhanPakanRisk: "Kepatuhan Pakan", obatVaksinRisk: "Obat/Vaksin", dokumentasiRisk: "Dokumentasi", kebersihanKandangRisk: "Kebersihan Kandang", kesiapanSembelihRisk: "Kesiapan Sembelih" },
      CP2: { halalFeedStatusRisk: "Halal Feed Status", supplierRisk: "Supplier", feedStorageRisk: "Feed Storage", medicationRisk: "Medication", vetSupervisionRisk: "Vet Supervision" },
      CP3: { kelayakanRisk: "Kelayakan", kebersihanRisk: "Kebersihan", animalWelfareRisk: "Animal Welfare", traceabilityRisk: "Traceability", dokumentasiRisk: "Dokumentasi" },
      CP4: { sertifikatHalalRisk: "Sertifikat Halal", kompetensiSembelihRisk: "Kompetensi", prosesSyariahRisk: "Proses Syariah", pemeriksaanRisk: "Pemeriksaan", sanitasiRisk: "Sanitasi", segregasiRisk: "Segregasi", dokumentasiRisk: "Dokumentasi", pengawasanRisk: "Pengawasan", auditRisk: "Audit", traceabilityRisk: "Traceability" },
      CP5: { handlingRisk: "Handling", sanitasiRisk: "Sanitasi", batchIdRisk: "Batch ID", segregasiRisk: "Segregasi", dokumentasiRisk: "Dokumentasi" },
      CP6: { halalIngredientsRisk: "Halal Ingredients", equipmentRisk: "Equipment", dedicatedLineRisk: "Dedicated Line", batchControlRisk: "Batch Control", packagingRisk: "Packaging", operatorRisk: "Operator", formulaRisk: "Formula" },
      CP7: { temperatureRisk: "Temperature", segregasiRisk: "Segregasi", hygieneRisk: "Hygiene", traceabilityRisk: "Traceability", fifoFefoRisk: "FIFO/FEFO", dokumentasiRisk: "Dokumentasi", incidentRisk: "Incident" },
      CP8: { dedicatedTransRisk: "Dedicated Transport", vehicleSanitasiRisk: "Vehicle Sanitation", temperatureRisk: "Temperature", routeRisk: "Route", loadingRisk: "Loading", dokumentasiRisk: "Dokumentasi", kontaminasiRisk: "Kontaminasi" },
      CP9: { labelHalalRisk: "Label Halal", displayRisk: "Display", storageTemRisk: "Storage Temperature", expiryRisk: "Expiry", consumerInfoRisk: "Consumer Info", supplierTraceRisk: "Supplier Trace", complaintRisk: "Complaint" },
    };

    const cpDetailMap: Record<string, any> = {
      CP1: batch.cp1Farm?.[0],
      CP2: batch.cp2Feed?.[0],
      CP3: batch.cp3Transport?.[0],
      CP4: batch.cp4Slaughter?.[0],
      CP5: batch.cp5PostSlaughter?.[0],
      CP6: batch.cp6Processing?.[0],
      CP7: batch.cp7Storage?.[0],
      CP8: batch.cp8Distribution?.[0],
      CP9: batch.cp9Retail?.[0],
    };

    const cpRecordsEnriched = batch.cpRecords
      .filter((r) => !r.criticalPointId.startsWith("CP10"))
      .map((r) => {
        const cpId = r.criticalPoint.id;
        const detail = cpDetailMap[cpId];
        const mapping = subCpMappings[cpId];
        const highestSub = detail && mapping ? getHighestSubCp(detail, mapping) : { name: "-", value: 0 };

        return {
          cpId,
          cpName: r.criticalPoint.name,
          status: r.complianceStatus,
          riskValue: Number(r.riskValue.toFixed(4)),
          weightedRisk: Number(r.weightedRisk.toFixed(4)),
          riskLevel: getRiskLevel(r.riskValue),
          highestSubCp: highestSub.name,
          highestSubCpValue: Number(highestSub.value.toFixed(4)),
        };
      });

    // Transport info
    const transport = batch.cp3Transport?.[0];
    const transportInfo = transport?.transporter
      ? {
          name: transport.transporter.name,
          vehicleNumber: transport.transporter.vehicleNumber,
          origin: transport.transporter.originLocation,
          destination: transport.transporter.destinationLocation,
          animalCount: transport.transporter.animalCount,
        }
      : null;

    // Processing info
    const processing = batch.cp6Processing?.[0];
    const processingInfo = processing?.processingPlant
      ? { name: processing.processingPlant.name, location: processing.processingPlant.location }
      : null;

    // Warehouse info
    const storage = batch.cp7Storage?.[0];
    const storageInfo = storage?.warehouse
      ? { name: storage.warehouse.name, location: storage.warehouse.location }
      : null;

    // Distribution info
    const dist = batch.cp8Distribution?.[0];
    const distributionInfo = dist?.distributor
      ? { name: dist.distributor.name, location: dist.distributor.location, coverageArea: dist.distributor.coverageArea }
      : null;

    // Retail info
    const retail = batch.cp9Retail?.[0];
    const retailInfo = retail?.retailOutlet
      ? { name: retail.retailOutlet.name, location: retail.retailOutlet.location, outletType: retail.retailOutlet.outletType }
      : null;

    const response = {
      id: batch.id,
      productionDate: batch.productionDate,
      totalRiskScore: Number(batch.totalRiskScore.toFixed(4)),
      riskLevel: batch.riskLevel,
      earTag: batch.cattle.earTag,
      breed: batch.cattle.breed,
      birthDate: batch.cattle.birthDate,
      farmName: batch.cattle.farm.name,
      farmLocation: batch.cattle.farm.location,
      rphName: batch.slaughterhouse.name,
      rphLocation: batch.slaughterhouse.location,
      butcherName: batch.butcherName,
      cpRecords: cpRecordsEnriched,
      // Supply chain entities
      transport: transportInfo,
      processing: processingInfo,
      storage: storageInfo,
      distribution: distributionInfo,
      retail: retailInfo,
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
