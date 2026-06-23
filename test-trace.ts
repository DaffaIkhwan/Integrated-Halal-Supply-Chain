import { prisma } from './src/lib/db/client';

async function main() {
  const batchId = 'BATCH-2026-06-23'; // Try to get a valid batch ID first
  const batches = await prisma.halalBatch.findMany({ take: 1 });
  const bid = batches.length > 0 ? batches[0].id : batchId;

  console.log('Tracing batch:', bid);

  let batchInfo = await prisma.halalBatch.findFirst({
    where: { id: { contains: bid } },
    include: { 
      cattle: { include: { farm: true } }, 
      slaughterhouse: true, 
      cpRecords: { include: { criticalPoint: true }, orderBy: { criticalPoint: { id: 'asc' } } },
      cp1Farm: true, cp2Feed: true,
      cp3Transport: { include: { transporter: true } },
      cp4Slaughter: true, cp5PostSlaughter: true,
      cp6Processing: { include: { processingPlant: true } },
      cp7Storage: { include: { warehouse: true } },
      cp8Distribution: { include: { distributor: true } },
      cp9Retail: { include: { retailOutlet: true } }
    }
  });

  if (!batchInfo) {
    console.log("No batch found");
    return;
  }

  const qrResponses = await prisma.questionnaireResponse.findMany({
    where: {
      questionnaireType: { in: ['aktual', 'risiko'] },
      cpId: { in: ['CP1','CP2','CP3','CP4','CP5','CP6','CP7','CP8','CP9'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { cpId: true, respondentName: true, respondentRole: true, respondentOrg: true, respondentInfo: true },
  });
  const latestQRPerCP: Record<string, any> = {};
  for (const qr of qrResponses) {
    if (qr.cpId && !latestQRPerCP[qr.cpId]) latestQRPerCP[qr.cpId] = qr;
  }

  const getCPEntityInfo = (cpId: string): string => {
    switch(cpId) {
      case 'CP1': { const f = batchInfo?.cattle?.farm; return `Nama Farm: ${f?.name || 'Belum diisi'} | Lokasi: ${f?.location || 'Belum diisi'}`; }
      case 'CP2': { const f = batchInfo?.cattle?.farm; return `Farm/Unit Pakan: ${f?.name || 'Belum diisi'} | Lokasi: ${f?.location || 'Belum diisi'}`; }
      case 'CP3': { const t = (batchInfo?.cp3Transport as any)?.[0]?.transporter; return `Transporter: ${t?.name || 'Belum diisi'} | No.Kendaraan: ${t?.vehicleNumber || 'Belum diisi'} | Jenis Kendaraan: ${t?.vehicleType || 'Belum diisi'}`; }
      case 'CP4': { const s = batchInfo?.slaughterhouse; return `RPH: ${s?.name || 'Belum diisi'} | Lokasi RPH: ${s?.location || 'Belum diisi'} | Juru Sembelih: ${batchInfo?.butcherName || 'Belum diisi'}`; }
      case 'CP5': { const s = batchInfo?.slaughterhouse; return `RPH (Post-Slaughter): ${s?.name || 'Belum diisi'} | Lokasi: ${s?.location || 'Belum diisi'}`; }
      case 'CP6': { const p = (batchInfo?.cp6Processing as any)?.[0]?.processingPlant; return `Pabrik Pengolahan: ${p?.name || 'Belum diisi'} | Lokasi: ${p?.location || 'Belum diisi'} | Tipe Produksi: ${p?.productionType || 'Belum diisi'}`; }
      case 'CP7': { const w = (batchInfo?.cp7Storage as any)?.[0]?.warehouse; return `Gudang/Cold Storage: ${w?.name || 'Belum diisi'} | Lokasi: ${w?.location || 'Belum diisi'} | Tipe Storage: ${w?.storageType || 'Belum diisi'}`; }
      case 'CP8': { const d = (batchInfo?.cp8Distribution as any)?.[0]?.distributor; return `Distributor: ${d?.name || 'Belum diisi'} | Lokasi: ${d?.location || 'Belum diisi'} | Area Distribusi: ${d?.coverageArea || 'Belum diisi'}`; }
      case 'CP9': { const r = (batchInfo?.cp9Retail as any)?.[0]?.retailOutlet; return `Retail/Outlet: ${r?.name || 'Belum diisi'} | Lokasi: ${r?.location || 'Belum diisi'} | Tipe Outlet: ${r?.outletType || 'Belum diisi'}`; }
      default: return 'Belum diisi';
    }
  };

  const cpSubCriteriaKeys: Record<string, string[]> = {
    CP1: ['asalUsulRisk', 'kesehatanRisk', 'kepatuhanPakanRisk', 'obatVaksinRisk', 'dokumentasiRisk', 'kebersihanKandangRisk', 'kesiapanSembelihRisk'],
    CP2: ['halalFeedStatusRisk', 'supplierRisk', 'feedStorageRisk', 'medicationRisk', 'vetSupervisionRisk'],
    CP3: ['kelayakanRisk', 'kebersihanRisk', 'animalWelfareRisk', 'traceabilityRisk', 'dokumentasiRisk'],
    CP4: ['sertifikatHalalRisk', 'kompetensiSembelihRisk', 'prosesSyariahRisk', 'pemeriksaanRisk', 'sanitasiRisk', 'segregasiRisk', 'dokumentasiRisk', 'pengawasanRisk', 'auditRisk', 'traceabilityRisk'],
    CP5: ['handlingRisk', 'sanitasiRisk', 'batchIdRisk', 'segregasiRisk', 'dokumentasiRisk'],
    CP6: ['halalIngredientsRisk', 'equipmentRisk', 'dedicatedLineRisk', 'batchControlRisk', 'packagingRisk', 'operatorRisk', 'formulaRisk'],
    CP7: ['temperatureRisk', 'segregasiRisk', 'hygieneRisk', 'traceabilityRisk', 'fifoFefoRisk', 'dokumentasiRisk', 'incidentRisk'],
    CP8: ['dedicatedTransRisk', 'vehicleSanitasiRisk', 'temperatureRisk', 'routeRisk', 'loadingRisk', 'dokumentasiRisk', 'kontaminasiRisk'],
    CP9: ['labelHalalRisk', 'displayRisk', 'storageTemRisk', 'expiryRisk', 'consumerInfoRisk', 'supplierTraceRisk', 'complaintRisk'],
  };

  const mapSubCP = (cpId: string, key: string) => {
    const mappings: Record<string, Record<string, string>> = {
      'CP1': { 'asalUsul': 'F1 - Asal-usul sapi', 'kesehatan': 'F2 - Status kesehatan sapi', 'kepatuhanPakan': 'F3 - Kepatuhan pakan', 'obatVaksin': 'F4 - Penggunaan obat/vaksin', 'dokumentasi': 'F5 - Dokumentasi pemeliharaan', 'kebersihanKandang': 'F6 - Kebersihan kandang', 'kesiapanSembelih': 'F7 - Kesiapan hewan disembelih' },
      'CP2': { 'halalFeedStatus': 'FD1 - Status halal pakan', 'supplier': 'FD2 - Supplier reliability', 'feedStorage': 'FD3 - Penyimpanan pakan', 'medication': 'FD4 - Pengendalian obat', 'vetSupervision': 'FD5 - Pengawasan veteriner' },
      'CP3': { 'kelayakan': 'T1 - Kelayakan kendaraan', 'kebersihan': 'T2 - Kebersihan kendaraan', 'animalWelfare': 'T3 - Animal welfare', 'traceability': 'T4 - Traceability during transport', 'dokumentasi': 'T5 - Dokumentasi perjalanan' },
      'CP4': { 'sertifikatHalal': 'R1 - Sertifikat halal RPH', 'kompetensiSembelih': 'R2 - Kompetensi juru sembelih', 'prosesSyariah': 'R3 - Proses penyembelihan syariah', 'pemeriksaan': 'R4 - Pemeriksaan ante/post-mortem', 'sanitasi': 'R5 - Sanitasi alat dan area', 'segregasi': 'R6 - Segregasi halal/non-halal', 'dokumentasi': 'R7 - Dokumentasi penyembelihan', 'pengawasan': 'R8 - Pengawasan halal internal', 'audit': 'R9 - Audit & corrective action', 'traceability': 'R10 - Traceability batch' },
      'CP5': { 'handling': 'PS1 - Handling carcass', 'sanitasi': 'PS2 - Sanitasi', 'batchId': 'PS3 - Batch identification', 'segregasi': 'PS4 - Segregasi', 'dokumentasi': 'PS5 - Dokumentasi' },
      'CP6': { 'halalIngredients': 'P1 - Halal ingredients', 'equipment': 'P2 - Equipment sanitation', 'dedicatedLine': 'P3 - Dedicated production line', 'batchControl': 'P4 - Batch control', 'packaging': 'P5 - Packaging & labeling', 'operator': 'P6 - Operator competence', 'formula': 'P7 - Product formulation' },
      'CP7': { 'temperature': 'CS1 - Temperature compliance', 'segregasi': 'CS2 - Halal segregation', 'hygiene': 'CS3 - Storage hygiene', 'traceability': 'CS4 - Batch traceability', 'fifoFefo': 'CS5 - FIFO/FEFO compliance', 'dokumentasi': 'CS6 - Documentation', 'incident': 'CS7 - Incident handling' },
      'CP8': { 'dedicatedTrans': 'D1 - Dedicated halal transport', 'vehicleSanitasi': 'D2 - Vehicle sanitation', 'temperature': 'D3 - Temperature control', 'route': 'D4 - Route traceability', 'loading': 'D5 - Loading-unloading', 'dokumentasi': 'D6 - Documentation', 'kontaminasi': 'D7 - Contamination prevention' },
      'CP9': { 'labelHalal': 'RT1 - Halal label validity', 'display': 'RT2 - Display segregation', 'storageTem': 'RT3 - Storage temperature', 'expiry': 'RT4 - Expiry date control', 'consumerInfo': 'RT5 - Consumer information', 'supplierTrace': 'RT6 - Supplier traceability', 'complaint': 'RT7 - Complaint handling' }
    };
    const cleanKey = key.replace(/Risk$/, '');
    return mappings[cpId]?.[cleanKey] || cleanKey;
  };

  let traceOutput = `--- Traceability Info ---\nBatch ID: ${batchInfo.id}`;

  const cpRecordsFiltered = batchInfo.cpRecords.filter((rec: any) => rec.criticalPoint.id !== 'CP10');
  if (cpRecordsFiltered.length > 0) {
    traceOutput += `\n\n--- Compliance Records (Titik Kritis) ---`;
    for (const rec of cpRecordsFiltered) {
      traceOutput += `\n[${rec.criticalPoint.id}] ${rec.criticalPoint.name} | Risk Score: ${rec.riskValue.toFixed(4)}`;
      
      let subDetails: any = null;
      if (rec.criticalPoint.id === 'CP1' && batchInfo.cp1Farm[0]) subDetails = batchInfo.cp1Farm[0];
      if (rec.criticalPoint.id === 'CP2' && batchInfo.cp2Feed[0]) subDetails = batchInfo.cp2Feed[0];
      if (rec.criticalPoint.id === 'CP3' && batchInfo.cp3Transport[0]) subDetails = batchInfo.cp3Transport[0];
      if (rec.criticalPoint.id === 'CP4' && batchInfo.cp4Slaughter[0]) subDetails = batchInfo.cp4Slaughter[0];
      if (rec.criticalPoint.id === 'CP5' && batchInfo.cp5PostSlaughter[0]) subDetails = batchInfo.cp5PostSlaughter[0];
      if (rec.criticalPoint.id === 'CP6' && batchInfo.cp6Processing[0]) subDetails = batchInfo.cp6Processing[0];
      if (rec.criticalPoint.id === 'CP7' && batchInfo.cp7Storage[0]) subDetails = batchInfo.cp7Storage[0];
      if (rec.criticalPoint.id === 'CP8' && batchInfo.cp8Distribution[0]) subDetails = batchInfo.cp8Distribution[0];
      if (rec.criticalPoint.id === 'CP9' && batchInfo.cp9Retail[0]) subDetails = batchInfo.cp9Retail[0];
      
      const cpId = rec.criticalPoint.id;
      if (subDetails) {
         const risks = Object.entries(subDetails)
           .filter(([k]) => k.endsWith('Risk') && k !== 'riskScore')
           .map(([k, v]) => ({ key: k, label: mapSubCP(cpId, k), value: Number(v) || 0 }))
           .sort((a, b) => b.value - a.value);
         if (risks.length > 0) {
           traceOutput += `\n    Sub-Kriteria:`;
           for (const r of risks) {
             traceOutput += `\n      - ${r.label}: ${r.value.toFixed(2)}`;
           }
         }
      } else {
         const expectedKeys = cpSubCriteriaKeys[cpId] || [];
         if (expectedKeys.length > 0) {
           traceOutput += `\n    Sub-Kriteria:`;
           for (const key of expectedKeys) {
             traceOutput += `\n      - ${mapSubCP(cpId, key)}: Belum dinilai`;
           }
         }
      }
      traceOutput += `\n    Entitas: ${getCPEntityInfo(cpId)}`;
      const qrData = latestQRPerCP[cpId];
      if (qrData) {
        traceOutput += `\n    Personel: ${qrData.respondentName || 'Belum diisi'} (${qrData.respondentRole || '-'}) dari ${qrData.respondentOrg || '-'}`;
      } else {
        traceOutput += `\n    Personel: Belum ada data kuesioner`;
      }
    }
  }

  console.log(traceOutput);
}

main().catch(console.error);
