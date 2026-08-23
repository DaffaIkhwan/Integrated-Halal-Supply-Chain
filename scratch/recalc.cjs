const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getRiskLevel(score) {
  if (score <= 0.20) return "Sangat Rendah";
  if (score <= 0.40) return "Rendah";
  if (score <= 0.60) return "Sedang";
  if (score <= 0.80) return "Tinggi";
  return "Sangat Tinggi";
}

async function main() {
  console.log('🔄 Menghitung ulang semua batch menggunakan logika Rule-Based (MAX)...');
  const batches = await prisma.halalBatch.findMany({
    include: {
      cp1Farm: true, cp2Feed: true, cp3Transport: true, cp4Slaughter: true,
      cp5PostSlaughter: true, cp6Processing: true, cp7Storage: true,
      cp8Distribution: true, cp9Retail: true,
    }
  });

  const cpConfigs = [
    { dbData: 'cp1Farm', map: ['asalUsulRisk','kesehatanRisk','kepatuhanPakanRisk','obatVaksinRisk','dokumentasiRisk','kebersihanKandangRisk','kesiapanSembelihRisk'] },
    { dbData: 'cp2Feed', map: ['halalFeedStatusRisk','supplierRisk','feedStorageRisk','medicationRisk','vetSupervisionRisk'] },
    { dbData: 'cp3Transport', map: ['kelayakanRisk','kebersihanRisk','animalWelfareRisk','traceabilityRisk','dokumentasiRisk'] },
    { dbData: 'cp4Slaughter', map: ['sertifikatHalalRisk','kompetensiSembelihRisk','prosesSyariahRisk','pemeriksaanRisk','sanitasiRisk','segregasiRisk','dokumentasiRisk','pengawasanRisk','auditRisk','traceabilityRisk'] },
    { dbData: 'cp5PostSlaughter', map: ['handlingRisk','sanitasiRisk','batchIdRisk','segregasiRisk','dokumentasiRisk'] },
    { dbData: 'cp6Processing', map: ['halalIngredientsRisk','equipmentRisk','dedicatedLineRisk','batchControlRisk','packagingRisk','operatorRisk','formulaRisk'] },
    { dbData: 'cp7Storage', map: ['temperatureRisk','segregasiRisk','hygieneRisk','traceabilityRisk','fifoFefoRisk','dokumentasiRisk','incidentRisk'] },
    { dbData: 'cp8Distribution', map: ['dedicatedTransRisk','vehicleSanitasiRisk','temperatureRisk','routeRisk','loadingRisk','dokumentasiRisk','kontaminasiRisk'] },
    { dbData: 'cp9Retail', map: ['labelHalalRisk','displayRisk','storageTemRisk','expiryRisk','consumerInfoRisk','supplierTraceRisk','complaintRisk'] },
  ];

  for (const batch of batches) {
    let totalGlobalRisk = 0;

    for (const cp of cpConfigs) {
      const recordArray = batch[cp.dbData];
      const record = recordArray && recordArray.length > 0 ? recordArray[0] : null;
      if (!record) continue;

      let maxRawValue = 0;
      for (const field of cp.map) {
        if (record[field] && record[field] > maxRawValue) {
          maxRawValue = record[field];
        }
      }

      const localRisk = maxRawValue > 0 ? maxRawValue * 0.20 : 0;
      if (localRisk > totalGlobalRisk) {
        totalGlobalRisk = localRisk;
      }
    }

    await prisma.halalBatch.update({
      where: { id: batch.id },
      data: {
        totalRiskScore: totalGlobalRisk,
        riskLevel: getRiskLevel(totalGlobalRisk),
      }
    });
  }

  console.log('✅ Semua batch telah di-update!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
