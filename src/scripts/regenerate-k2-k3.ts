import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PDF_FILE = {
  key: 'dokumen_pendukung',
  filename: 'KUESIONER_DOKUMEN.pdf',
  url: 'https://res.cloudinary.com/dzrd37naa/image/upload/v1778840178/nextrag_questionnaires/seed_kuesioner_pembobotan.pdf',
  thumbnailUrl: 'https://res.cloudinary.com/dzrd37naa/image/upload/w_400,h_300,c_fill,pg_1/nextrag_questionnaires/seed_kuesioner_pembobotan.jpg'
};

async function main() {
  console.log('🗑️ Menghapus data Kuesioner 2 (Risiko) & Kuesioner 3 (Aktual) lama...');
  await prisma.questionnaireResponse.deleteMany({
    where: {
      questionnaireType: {
        in: ['risiko', 'aktual']
      }
    }
  });
  console.log('✅ Data K2 & K3 lama dihapus. (K1 Pembobotan aman tidak disentuh)');

  console.log('🔍 Mengambil data seluruh Halal Batch di database...');
  const batches = await prisma.halalBatch.findMany({
    include: {
      cattle: { include: { farm: true } },
      slaughterhouse: true,
      cp1Farm: true,
      cp2Feed: true,
      cp3Transport: true,
      cp4Slaughter: true,
      cp5PostSlaughter: true,
      cp6Processing: true,
      cp7Storage: true,
      cp8Distribution: true,
      cp9Retail: true,
    }
  });

  console.log(`Berdasarkan DB, ditemukan ${batches.length} Batch.`);

  const cpConfigs = [
    { id: 'CP1', role: 'Supervisor Farm', orgKey: 'farm', subCodes: ['CP1.1','CP1.2','CP1.3','CP1.4','CP1.5'], dbData: 'cp1Farm', map: ['asalUsulRisk','kesehatanRisk','kepatuhanPakanRisk','obatVaksinRisk','dokumentasiRisk'] },
    { id: 'CP2', role: 'Veteriner', orgKey: 'farm', subCodes: ['CP2.1','CP2.2','CP2.3','CP2.4','CP2.5'], dbData: 'cp2Feed', map: ['halalFeedStatusRisk','supplierRisk','feedStorageRisk','medicationRisk','vetSupervisionRisk'] },
    { id: 'CP3', role: 'Transport Supervisor', orgKey: 'farm', subCodes: ['CP3.1','CP3.2','CP3.3','CP3.4','CP3.5'], dbData: 'cp3Transport', map: ['kelayakanRisk','kebersihanRisk','animalWelfareRisk','traceabilityRisk','dokumentasiRisk'] },
    { id: 'CP4', role: 'Juru Sembelih Halal', orgKey: 'slaughterhouse', subCodes: ['CP4.1','CP4.2','CP4.3','CP4.4','CP4.5','CP4.6','CP4.7','CP4.8','CP4.9'], dbData: 'cp4Slaughter', map: ['sertifikatHalalRisk','kompetensiSembelihRisk','prosesSyariahRisk','pemeriksaanRisk','sanitasiRisk','segregasiRisk','dokumentasiRisk','pengawasanRisk','auditRisk'] },
    { id: 'CP5', role: 'QC Supervisor', orgKey: 'slaughterhouse', subCodes: ['CP5.1','CP5.2','CP5.3','CP5.4'], dbData: 'cp5PostSlaughter', map: ['handlingRisk','sanitasiRisk','batchIdRisk','segregasiRisk'] },
    { id: 'CP6', role: 'Produksi', orgKey: 'slaughterhouse', subCodes: ['CP6.1','CP6.2','CP6.3','CP6.4'], dbData: 'cp6Processing', map: ['halalIngredientsRisk','equipmentRisk','dedicatedLineRisk','batchControlRisk'] },
    { id: 'CP7', role: 'Warehouse', orgKey: 'slaughterhouse', subCodes: ['CP7.1','CP7.2','CP7.3','CP7.4','CP7.5','CP7.6','CP7.7'], dbData: 'cp7Storage', map: ['temperatureRisk','segregasiRisk','hygieneRisk','traceabilityRisk','fifoFefoRisk','dokumentasiRisk','incidentRisk'] },
    { id: 'CP8', role: 'Distribusi', orgKey: 'slaughterhouse', subCodes: ['CP8.1','CP8.2','CP8.3','CP8.4','CP8.5','CP8.6','CP8.7'], dbData: 'cp8Distribution', map: ['dedicatedTransRisk','vehicleSanitasiRisk','temperatureRisk','routeRisk','loadingRisk','dokumentasiRisk','kontaminasiRisk'] },
    { id: 'CP9', role: 'Retail', orgKey: 'slaughterhouse', subCodes: ['CP9.1','CP9.2','CP9.3','CP9.4','CP9.5','CP9.6','CP9.7'], dbData: 'cp9Retail', map: ['labelHalalRisk','displayRisk','storageTemRisk','expiryRisk','consumerInfoRisk','supplierTraceRisk','complaintRisk'] },
  ];

  let k2Count = 0;
  let k3Count = 0;

  for (const batch of batches) {
    const batchName = `${batch.cattle.earTag} (${batch.cattle.farm.name})`;
    
    for (const cp of cpConfigs) {
      const recordArray = (batch as any)[cp.dbData];
      const record = recordArray && recordArray.length > 0 ? recordArray[0] : null;

      if (!record) continue; // Skip jika tidak ada data CP untuk batch ini (misal di-skip di operasi)

      const risks: Record<string, number> = {};
      const evidence: Record<string, boolean> = {};

      let totalScore = 0;
      let totalFields = 0;

      cp.subCodes.forEach((code, index) => {
        // Ambil nilai dari DB (0.0 to 1.0) -> di DB nilainya Float. Tunggu, di seed-operations: toScale(val) jadi 1-5.
        let dbRiskValue = 2; // Default 2
        if (record && cp.map[index]) {
          const val = record[cp.map[index]];
          // fuzzyAHP localRiskScore dihitung di tabel CriticalPointRecord dan DB
          // Di tabel CP1FarmRecord dll, nilainya sudah 1-5 karena fungsi toScale (Math.ceil(val * 5))
          if (val && val > 0) dbRiskValue = val;
        }

        for (let i = 1; i <= 5; i++) {
          risks[`${code}_${i}`] = dbRiskValue;
          evidence[`${code}_${i}`] = true;
          totalScore += dbRiskValue;
          totalFields++;
        }
      });

      const avg = totalFields > 0 ? totalScore / totalFields : 0;
      const orgName = cp.orgKey === 'farm' ? batch.cattle.farm.name : batch.slaughterhouse.name;

      // 1. Kuesioner 2 (Risiko)
      await prisma.questionnaireResponse.create({
        data: {
          questionnaireType: 'risiko',
          cpId: cp.id,
          respondentName: `Pakar ${cp.id}`,
          respondentRole: `Pakar ${cp.role}`,
          respondentOrg: orgName,
          respondentEmail: `pakar.${cp.id.toLowerCase()}@example.com`,
          respondentInfo: { batch: batchName, namaInstansi: orgName, tanggal: batch.productionDate.toISOString().split('T')[0] },
          answers: { risks, evidence },
          status: 'SUBMITTED',
          files: [PDF_FILE],
        }
      });
      k2Count++;

      // 2. Kuesioner 3 (Aktual)
      const labels = ['', 'Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];
      const tingkat = labels[Math.round(avg)] || 'Rendah';

      await prisma.questionnaireResponse.create({
        data: {
          questionnaireType: 'aktual',
          cpId: cp.id,
          respondentName: `Auditor ${cp.id}`,
          respondentRole: cp.role,
          respondentOrg: orgName,
          respondentEmail: `auditor.${cp.id.toLowerCase()}@example.com`,
          respondentInfo: { batch: batchName, lokasi: orgName, tanggal: batch.productionDate.toISOString().split('T')[0] },
          answers: { risks, evidence },
          notes: {
            namaSupervisor: 'Admin DSS',
            hasilVerifikasi: 'sesuai',
            tingkatRisiko: tingkat,
            avgRiskScore: avg.toFixed(2),
          },
          status: 'SUBMITTED',
          files: [PDF_FILE],
        }
      });
      k3Count++;
    }
  }

  console.log(`\n🎉 SELESAI REGENERATE!`);
  console.log(`Kuesioner 2 (Risiko) baru: ${k2Count}`);
  console.log(`Kuesioner 3 (Aktual) baru: ${k3Count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
