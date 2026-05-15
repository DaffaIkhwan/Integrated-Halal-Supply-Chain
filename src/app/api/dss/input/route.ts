import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { calculateBatchRiskScore } from '@/lib/dss/fuzzyAHP';

export const dynamic = 'force-dynamic';

// GET — load dropdown options (farms, cattle, RPH) + CP field definitions
export async function GET() {
  try {
    const [farms, slaughterhouses, cattle, criticalPoints] = await Promise.all([
      prisma.farm.findMany({ orderBy: { name: 'asc' } }),
      prisma.slaughterhouse.findMany({ orderBy: { name: 'asc' } }),
      prisma.cattle.findMany({ include: { farm: true }, orderBy: { earTag: 'asc' } }),
      prisma.criticalPoint.findMany({
        include: { criteriaWeights: { orderBy: { criteriaCode: 'asc' } } },
        orderBy: { id: 'asc' },
      }),
    ]);

    // CP field definitions — maps each CP to its form fields
    const cpFields: Record<string, { label: string; fields: { key: string; label: string; criteriaCode: string }[] }> = {
      CP1: {
        label: 'CP1 — Farm / Kandang Sapi',
        fields: [
          { key: 'asalUsulRisk', label: 'Asal-usul sapi', criteriaCode: 'F1' },
          { key: 'kesehatanRisk', label: 'Status kesehatan sapi', criteriaCode: 'F2' },
          { key: 'kepatuhanPakanRisk', label: 'Kepatuhan pakan', criteriaCode: 'F3' },
          { key: 'obatVaksinRisk', label: 'Penggunaan obat/vaksin', criteriaCode: 'F4' },
          { key: 'dokumentasiRisk', label: 'Dokumentasi pemeliharaan', criteriaCode: 'F5' },
          { key: 'kebersihanKandangRisk', label: 'Kebersihan kandang', criteriaCode: 'F6' },
          { key: 'kesiapanSembelihRisk', label: 'Kesiapan hewan disembelih', criteriaCode: 'F7' },
        ],
      },
      CP2: {
        label: 'CP2 — Pakan & Kesehatan Hewan',
        fields: [
          { key: 'halalFeedStatusRisk', label: 'Status halal bahan pakan', criteriaCode: 'FD1' },
          { key: 'supplierRisk', label: 'Reliabilitas supplier', criteriaCode: 'FD2' },
          { key: 'feedStorageRisk', label: 'Segregasi penyimpanan pakan', criteriaCode: 'FD3' },
          { key: 'medicationRisk', label: 'Kontrol pengobatan', criteriaCode: 'FD4' },
          { key: 'vetSupervisionRisk', label: 'Supervisi veteriner', criteriaCode: 'FD5' },
        ],
      },
      CP3: {
        label: 'CP3 — Transportasi ke RPH',
        fields: [
          { key: 'kelayakanRisk', label: 'Kelayakan kendaraan', criteriaCode: 'T1' },
          { key: 'kebersihanRisk', label: 'Kebersihan kendaraan', criteriaCode: 'T2' },
          { key: 'animalWelfareRisk', label: 'Animal welfare', criteriaCode: 'T3' },
          { key: 'traceabilityRisk', label: 'Traceability selama transport', criteriaCode: 'T4' },
          { key: 'dokumentasiRisk', label: 'Dokumentasi perjalanan', criteriaCode: 'T5' },
        ],
      },
      CP4: {
        label: 'CP4 — RPH / Penyembelihan',
        fields: [
          { key: 'sertifikatHalalRisk', label: 'Validitas sertifikat halal RPH', criteriaCode: 'R1' },
          { key: 'kompetensiSembelihRisk', label: 'Kompetensi juru sembelih', criteriaCode: 'R2' },
          { key: 'prosesSyariahRisk', label: 'Kesesuaian proses syariah', criteriaCode: 'R3' },
          { key: 'pemeriksaanRisk', label: 'Pemeriksaan ante/post-mortem', criteriaCode: 'R4' },
          { key: 'sanitasiRisk', label: 'Sanitasi alat dan area', criteriaCode: 'R5' },
          { key: 'segregasiRisk', label: 'Pemisahan halal/non-halal', criteriaCode: 'R6' },
          { key: 'dokumentasiRisk', label: 'Dokumentasi penyembelihan', criteriaCode: 'R7' },
          { key: 'pengawasanRisk', label: 'Pengawasan halal internal', criteriaCode: 'R8' },
          { key: 'auditRisk', label: 'Audit & corrective action', criteriaCode: 'R9' },
          { key: 'traceabilityRisk', label: 'Traceability batch', criteriaCode: 'R10' },
        ],
      },
      CP5: {
        label: 'CP5 — Post-Slaughter Handling',
        fields: [
          { key: 'handlingRisk', label: 'Handling carcass compliance', criteriaCode: 'PS1' },
          { key: 'sanitasiRisk', label: 'Sanitation', criteriaCode: 'PS2' },
          { key: 'batchIdRisk', label: 'Batch identification', criteriaCode: 'PS3' },
          { key: 'segregasiRisk', label: 'Segregation', criteriaCode: 'PS4' },
          { key: 'dokumentasiRisk', label: 'Documentation', criteriaCode: 'PS5' },
        ],
      },
      CP6: {
        label: 'CP6 — Processing / Pengolahan',
        fields: [
          { key: 'halalIngredientsRisk', label: 'Status halal ingredients', criteriaCode: 'P1' },
          { key: 'equipmentRisk', label: 'Equipment sanitation', criteriaCode: 'P2' },
          { key: 'dedicatedLineRisk', label: 'Dedicated production line', criteriaCode: 'P3' },
          { key: 'batchControlRisk', label: 'Batch control', criteriaCode: 'P4' },
          { key: 'packagingRisk', label: 'Packaging & labeling', criteriaCode: 'P5' },
          { key: 'operatorRisk', label: 'Operator competence', criteriaCode: 'P6' },
          { key: 'formulaRisk', label: 'Product formulation control', criteriaCode: 'P7' },
        ],
      },
      CP7: {
        label: 'CP7 — Cold Storage / Warehouse',
        fields: [
          { key: 'temperatureRisk', label: 'Temperature compliance', criteriaCode: 'CS1' },
          { key: 'segregasiRisk', label: 'Halal segregation', criteriaCode: 'CS2' },
          { key: 'hygieneRisk', label: 'Storage hygiene', criteriaCode: 'CS3' },
          { key: 'traceabilityRisk', label: 'Batch traceability', criteriaCode: 'CS4' },
          { key: 'fifoFefoRisk', label: 'FIFO/FEFO compliance', criteriaCode: 'CS5' },
          { key: 'dokumentasiRisk', label: 'Documentation', criteriaCode: 'CS6' },
          { key: 'incidentRisk', label: 'Incident handling', criteriaCode: 'CS7' },
        ],
      },
      CP8: {
        label: 'CP8 — Distribusi / Logistik',
        fields: [
          { key: 'dedicatedTransRisk', label: 'Dedicated halal transport', criteriaCode: 'D1' },
          { key: 'vehicleSanitasiRisk', label: 'Vehicle sanitation', criteriaCode: 'D2' },
          { key: 'temperatureRisk', label: 'Temperature control', criteriaCode: 'D3' },
          { key: 'routeRisk', label: 'Route & delivery traceability', criteriaCode: 'D4' },
          { key: 'loadingRisk', label: 'Loading-unloading compliance', criteriaCode: 'D5' },
          { key: 'dokumentasiRisk', label: 'Documentation completeness', criteriaCode: 'D6' },
          { key: 'kontaminasiRisk', label: 'Contamination prevention', criteriaCode: 'D7' },
        ],
      },
      CP9: {
        label: 'CP9 — Retail / Pasar / Supermarket',
        fields: [
          { key: 'labelHalalRisk', label: 'Halal label validity', criteriaCode: 'RT1' },
          { key: 'displayRisk', label: 'Display segregation', criteriaCode: 'RT2' },
          { key: 'storageTemRisk', label: 'Storage temperature', criteriaCode: 'RT3' },
          { key: 'expiryRisk', label: 'Expiry date control', criteriaCode: 'RT4' },
          { key: 'consumerInfoRisk', label: 'Consumer info accessibility', criteriaCode: 'RT5' },
          { key: 'supplierTraceRisk', label: 'Supplier traceability', criteriaCode: 'RT6' },
          { key: 'complaintRisk', label: 'Complaint handling', criteriaCode: 'RT7' },
        ],
      },
      CP10: {
        label: 'CP10 — Konsumen & Complaint',
        fields: [
          { key: 'transparansiRisk', label: 'Information transparency', criteriaCode: 'C1' },
          { key: 'traceabilityRisk', label: 'Traceability accessibility', criteriaCode: 'C2' },
          { key: 'responsivenessRisk', label: 'Complaint responsiveness', criteriaCode: 'C3' },
          { key: 'consumerTrustRisk', label: 'Consumer trust', criteriaCode: 'C4' },
          { key: 'halalLiteracyRisk', label: 'Halal literacy', criteriaCode: 'C5' },
        ],
      },
    };

    return NextResponse.json({ farms, slaughterhouses, cattle, criticalPoints, cpFields });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST — submit CP records for a batch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, cpData } = body;
    // cpData is { CP1: { asalUsulRisk: 0.2, ... }, CP2: {...}, ... }

    if (!batchId || !cpData) {
      return NextResponse.json({ error: 'batchId and cpData are required' }, { status: 400 });
    }

    // Verify batch exists
    const batch = await prisma.halalBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Delete old records for this batch (idempotent re-submit)
    await Promise.all([
      prisma.cP1FarmRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP2FeedRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP3TransportRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP4SlaughterRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP5PostSlaughterRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP6ProcessingRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP7StorageRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP8DistributionRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP9RetailRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.cP10ConsumerRecord.deleteMany({ where: { halalBatchId: batchId } }),
      prisma.criticalPointRecord.deleteMany({ where: { halalBatchId: batchId } }),
    ]);

    // Insert new CP records
    if (cpData.CP1) await prisma.cP1FarmRecord.create({ data: { halalBatchId: batchId, ...cpData.CP1 } });
    if (cpData.CP2) await prisma.cP2FeedRecord.create({ data: { halalBatchId: batchId, ...cpData.CP2 } });
    if (cpData.CP3) await prisma.cP3TransportRecord.create({ data: { halalBatchId: batchId, ...cpData.CP3 } });
    if (cpData.CP4) await prisma.cP4SlaughterRecord.create({ data: { halalBatchId: batchId, ...cpData.CP4 } });
    if (cpData.CP5) await prisma.cP5PostSlaughterRecord.create({ data: { halalBatchId: batchId, ...cpData.CP5 } });
    if (cpData.CP6) await prisma.cP6ProcessingRecord.create({ data: { halalBatchId: batchId, ...cpData.CP6 } });
    if (cpData.CP7) await prisma.cP7StorageRecord.create({ data: { halalBatchId: batchId, ...cpData.CP7 } });
    if (cpData.CP8) await prisma.cP8DistributionRecord.create({ data: { halalBatchId: batchId, ...cpData.CP8 } });
    if (cpData.CP9) await prisma.cP9RetailRecord.create({ data: { halalBatchId: batchId, ...cpData.CP9 } });
    if (cpData.CP10) await prisma.cP10ConsumerRecord.create({ data: { halalBatchId: batchId, ...cpData.CP10 } });

    // Create generic CriticalPointRecord entries
    const cps = await prisma.criticalPoint.findMany();
    for (const cp of cps) {
      const cpKey = cp.id; // e.g. "CP1"
      const record = cpData[cpKey];
      // Determine compliance: if any field > 0.5, FAIL; if all 0, PASS; else PENDING
      let status = 'PASS';
      if (record) {
        const vals = Object.values(record).filter((v): v is number => typeof v === 'number');
        if (vals.some((v) => v > 0.5)) status = 'FAIL';
        else if (vals.some((v) => v > 0)) status = 'PENDING';
      }
      await prisma.criticalPointRecord.create({
        data: { halalBatchId: batchId, criticalPointId: cp.id, complianceStatus: status },
      });
    }

    // Recalculate risk score
    const riskResult = await calculateBatchRiskScore(batchId);

    return NextResponse.json({
      success: true,
      batchId,
      totalRiskScore: riskResult.totalRiskScore,
      riskLevel: riskResult.riskLevel,
    });
  } catch (error) {
    console.error('CP Input Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
