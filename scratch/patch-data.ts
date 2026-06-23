import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding missing master data entities...');

  // 1. Transporter
  const transporter = await prisma.transporter.upsert({
    where: { id: 'trans-01' },
    update: {},
    create: {
      id: 'trans-01',
      name: 'PT Logistik Halal Nusantara',
      vehicleNumber: 'B 1234 HALAL',
      vehicleType: 'Truk Pendingin',
      location: 'Jakarta',
    },
  });

  // 2. Processing Plant
  const processingPlant = await prisma.processingPlant.upsert({
    where: { id: 'proc-01' },
    update: {},
    create: {
      id: 'proc-01',
      name: 'Pabrik Olahan Daging Berkah',
      location: 'Bekasi',
      productionType: 'Pemotongan & Olahan',
    },
  });

  // 3. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'ware-01' },
    update: {},
    create: {
      id: 'ware-01',
      name: 'Gudang Pendingin Utama',
      location: 'Cikarang',
      storageType: 'Frozen',
    },
  });

  // 4. Distributor
  const distributor = await prisma.distributor.upsert({
    where: { id: 'dist-01' },
    update: {},
    create: {
      id: 'dist-01',
      name: 'PT Distribusi Daging Segar',
      location: 'Jakarta Timur',
      coverageArea: 'Jabodetabek',
    },
  });

  // 5. Retail Outlet
  const retailOutlet = await prisma.retailOutlet.upsert({
    where: { id: 'ret-01' },
    update: {},
    create: {
      id: 'ret-01',
      name: 'Supermarket Halal Mart',
      location: 'Jakarta Selatan',
      outletType: 'Supermarket',
    },
  });

  console.log('Master data created/verified.');

  // Create or verify Farm first
  const farm = await prisma.farm.upsert({
    where: { id: 'farm-01' },
    update: {},
    create: { id: 'farm-01', name: 'Peternakan Sapi Maju Jaya', location: 'Jawa Tengah' }
  });

  const batches = await prisma.halalBatch.findMany({
    where: {
      cattle: {
        earTag: { in: ['TAG-A002', 'TAG-A003'] }
      }
    },
    include: { cattle: true }
  });

  console.log(`Found ${batches.length} batches to update.`);

  for (const batch of batches) {
    console.log(`\nUpdating Batch ${batch.id} (EarTag: ${batch.cattle.earTag})...`);

    // Create CP1 - CP9 records with mock data
    const cpData = { halalBatchId: batch.id };

    // Delete existing records to replace them cleanly
    await prisma.cP1FarmRecord.deleteMany({ where: cpData });
    await prisma.cP2FeedRecord.deleteMany({ where: cpData });
    await prisma.cP3TransportRecord.deleteMany({ where: cpData });
    await prisma.cP4SlaughterRecord.deleteMany({ where: cpData });
    await prisma.cP5PostSlaughterRecord.deleteMany({ where: cpData });
    await prisma.cP6ProcessingRecord.deleteMany({ where: cpData });
    await prisma.cP7StorageRecord.deleteMany({ where: cpData });
    await prisma.cP8DistributionRecord.deleteMany({ where: cpData });
    await prisma.cP9RetailRecord.deleteMany({ where: cpData });

    // CP1 Farm
    await prisma.cP1FarmRecord.create({
      data: {
        halalBatchId: batch.id,
        asalUsulRisk: 1, kesehatanRisk: 2, kepatuhanPakanRisk: 1, obatVaksinRisk: 1,
        dokumentasiRisk: 1, kebersihanKandangRisk: 2, kesiapanSembelihRisk: 1
      }
    });

    // CP2 Feed
    await prisma.cP2FeedRecord.create({
      data: {
        halalBatchId: batch.id,
        halalFeedStatusRisk: 1, supplierRisk: 2, feedStorageRisk: 1,
        medicationRisk: 2, vetSupervisionRisk: 1
      }
    });

    // CP3 Transport
    await prisma.cP3TransportRecord.create({
      data: {
        halalBatchId: batch.id, transporterId: transporter.id,
        kelayakanRisk: 2, kebersihanRisk: 1, animalWelfareRisk: 1,
        traceabilityRisk: 1, dokumentasiRisk: 1
      }
    });

    // CP4 Slaughter (Maybe make A003 slightly worse)
    const isA003 = batch.cattle.earTag === 'A003';
    await prisma.cP4SlaughterRecord.create({
      data: {
        halalBatchId: batch.id,
        sertifikatHalalRisk: 1, kompetensiSembelihRisk: 1, prosesSyariahRisk: 1,
        pemeriksaanRisk: isA003 ? 4 : 2, sanitasiRisk: isA003 ? 3 : 1, segregasiRisk: 1,
        dokumentasiRisk: 2, pengawasanRisk: 1, auditRisk: 1, traceabilityRisk: 1
      }
    });

    // CP5 Post Slaughter
    await prisma.cP5PostSlaughterRecord.create({
      data: {
        halalBatchId: batch.id,
        handlingRisk: 1, sanitasiRisk: 1, batchIdRisk: 2,
        segregasiRisk: 1, dokumentasiRisk: 1
      }
    });

    // CP6 Processing
    await prisma.cP6ProcessingRecord.create({
      data: {
        halalBatchId: batch.id, processingPlantId: processingPlant.id,
        halalIngredientsRisk: 1, equipmentRisk: 2, dedicatedLineRisk: 1,
        batchControlRisk: 2, packagingRisk: 1, operatorRisk: 1, formulaRisk: 1
      }
    });

    // CP7 Storage
    await prisma.cP7StorageRecord.create({
      data: {
        halalBatchId: batch.id, warehouseId: warehouse.id,
        temperatureRisk: 2, segregasiRisk: 1, hygieneRisk: 2,
        traceabilityRisk: 1, fifoFefoRisk: 1, dokumentasiRisk: 2, incidentRisk: 1
      }
    });

    // CP8 Distribution
    await prisma.cP8DistributionRecord.create({
      data: {
        halalBatchId: batch.id, distributorId: distributor.id,
        dedicatedTransRisk: 1, vehicleSanitasiRisk: 2, temperatureRisk: 1,
        routeRisk: 1, loadingRisk: 2, dokumentasiRisk: 1, kontaminasiRisk: 1
      }
    });

    // CP9 Retail
    await prisma.cP9RetailRecord.create({
      data: {
        halalBatchId: batch.id, retailOutletId: retailOutlet.id,
        labelHalalRisk: 1, displayRisk: 1, storageTemRisk: 2,
        expiryRisk: 1, consumerInfoRisk: 2, supplierTraceRisk: 1, complaintRisk: 1
      }
    });

    console.log('Created full CP1-CP9 records.');
  }

  // Recalculate Risk Scores for updated batches
  const { calculateBatchRiskScore } = await import('../src/lib/dss/fuzzyAHP.js');
  
  for (const batch of batches) {
    console.log(`Recalculating fuzzy risk score for ${batch.cattle.earTag}...`);
    try {
      await calculateBatchRiskScore(batch.id);
      console.log('Success.');
    } catch (e: any) {
      console.error('Failed to recalculate:', e.message);
    }
  }

  console.log('All done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
