/**
 * Seed Script: Operational Data for Traceability & Risk Assessment
 * 
 * Creates mock data for:
 * - Farm, Slaughterhouse
 * - Cattle, HalalBatch
 * - CP Records (1 through 9)
 * 
 * Run: npx tsx src/scripts/seed-operations.ts
 */

import { PrismaClient } from '@prisma/client';
import { calculateBatchRiskScore } from '../lib/dss/fuzzyAHP';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Clearing old data...');
    await prisma.criticalPointRecord.deleteMany();
    await prisma.cP1FarmRecord.deleteMany();
    await prisma.cP2FeedRecord.deleteMany();
    await prisma.cP3TransportRecord.deleteMany();
    await prisma.cP4SlaughterRecord.deleteMany();
    await prisma.cP5PostSlaughterRecord.deleteMany();
    await prisma.cP6ProcessingRecord.deleteMany();
    await prisma.cP7StorageRecord.deleteMany();
    await prisma.cP8DistributionRecord.deleteMany();
    await prisma.cP9RetailRecord.deleteMany();

    await prisma.halalBatch.deleteMany();
    await prisma.cattle.deleteMany();
    await prisma.slaughterhouse.deleteMany();
    await prisma.farm.deleteMany();

    console.log('🌱 Seeding Operational Data (Farm, RPH, Cattle, Batches)...');

    // 1. Create Farm
    const farm = await prisma.farm.create({
        data: {
            name: 'Peternakan Berkah Mandiri',
            location: 'Jawa Barat',
            address: 'Jl. Raya Lembang No. 45, Bandung',
        }
    });
    console.log('✅ Created Farm:', farm.name);

    // 2. Create Slaughterhouse (RPH)
    const rph = await prisma.slaughterhouse.create({
        data: {
            name: 'RPH Syariah Al-Anam',
            location: 'Jawa Barat',
            address: 'Jl. RPH Cibinong, Bogor',
        }
    });
    console.log('✅ Created RPH:', rph.name);

    // 3. Create Cattle (Sapi)
    const cattleWithBatch = await Promise.all([
        prisma.cattle.create({ data: { farmId: farm.id, earTag: 'TAG-A001', breed: 'Limousin', birthDate: new Date('2024-01-15') } }),
        prisma.cattle.create({ data: { farmId: farm.id, earTag: 'TAG-A002', breed: 'Brahman', birthDate: new Date('2024-02-10') } }),
        prisma.cattle.create({ data: { farmId: farm.id, earTag: 'TAG-A003', breed: 'Simental', birthDate: new Date('2024-03-05') } }),
    ]);

    const cattleWithoutBatch = await Promise.all([
        prisma.cattle.create({ data: { farmId: farm.id, earTag: 'TAG-B001', breed: 'Angus', birthDate: new Date('2024-04-12') } }),
        prisma.cattle.create({ data: { farmId: farm.id, earTag: 'TAG-B002', breed: 'Ongole', birthDate: new Date('2024-05-20') } }),
        prisma.cattle.create({ data: { farmId: farm.id, earTag: 'TAG-B003', breed: 'Limousin', birthDate: new Date('2024-06-11') } }),
    ]);

    console.log(`✅ Created ${cattleWithBatch.length + cattleWithoutBatch.length} Cattle.`);

    // 4. Create Batches & CP Records (Hanya untuk Sapi di List A)
    for (let i = 0; i < cattleWithBatch.length; i++) {
        const cattle = cattleWithBatch[i];
        
        const batch = await prisma.halalBatch.create({
            data: {
                cattleId: cattle.id,
                slaughterhouseId: rph.id,
                productionDate: new Date(),
                // Start with pending/low, will recalculate at the end
            }
        });

        // Determine risk profile (Batch 1: Perfect, Batch 2: Moderate issues, Batch 3: High issues)
        const isPerfect = i === 0;
        const isModerate = i === 1;
        const isHigh = i === 2;

        // Generate risk values (0 is perfect, 1 is worst)
        const v = (perfectVal: number, modVal: number, highVal: number) => {
            if (isPerfect) return perfectVal;
            if (isModerate) return modVal;
            return highVal;
        };

        // --- CP1 ---
        await prisma.cP1FarmRecord.create({
            data: {
                halalBatchId: batch.id,
                asalUsulRisk: v(0, 0.2, 0.8),
                kesehatanRisk: v(0, 0.1, 0.5),
                kepatuhanPakanRisk: v(0, 0.3, 0.7),
                obatVaksinRisk: v(0, 0, 0.9),
                dokumentasiRisk: v(0, 0.4, 0.6),
                kebersihanKandangRisk: v(0, 0.2, 0.8),
                kesiapanSembelihRisk: v(0, 0, 0.5),
            }
        });

        // --- CP2 ---
        await prisma.cP2FeedRecord.create({
            data: {
                halalBatchId: batch.id,
                halalFeedStatusRisk: v(0, 0.1, 0.9),
                supplierRisk: v(0, 0.2, 0.6),
                feedStorageRisk: v(0, 0, 0.7),
                medicationRisk: v(0, 0, 0.8),
                vetSupervisionRisk: v(0, 0.3, 0.4),
            }
        });

        // --- CP3 ---
        await prisma.cP3TransportRecord.create({
            data: {
                halalBatchId: batch.id,
                kelayakanRisk: v(0, 0.2, 0.5),
                kebersihanRisk: v(0, 0.4, 0.9),
                animalWelfareRisk: v(0, 0, 0.8),
                traceabilityRisk: v(0, 0.2, 0.7),
                dokumentasiRisk: v(0, 0.1, 0.6),
            }
        });

        // --- CP4 (MOST CRITICAL) ---
        await prisma.cP4SlaughterRecord.create({
            data: {
                halalBatchId: batch.id,
                sertifikatHalalRisk: v(0, 0, 0.9), // 0.9 = invalid/expired cert
                kompetensiSembelihRisk: v(0, 0.2, 0.8), // 0.8 = poor competence
                prosesSyariahRisk: v(0, 0.1, 0.95), // 0.95 = major sharia violation
                pemeriksaanRisk: v(0, 0.3, 0.7),
                sanitasiRisk: v(0, 0.4, 0.8),
                segregasiRisk: v(0, 0, 0.9), // 0.9 = mixed with non-halal
                dokumentasiRisk: v(0, 0.2, 0.6),
                pengawasanRisk: v(0, 0, 0.7),
                auditRisk: v(0, 0, 0.5),
                traceabilityRisk: v(0, 0.1, 0.8),
            }
        });

        // --- CP5 ---
        await prisma.cP5PostSlaughterRecord.create({
            data: { halalBatchId: batch.id, handlingRisk: v(0, 0.2, 0.8), sanitasiRisk: v(0, 0.3, 0.7), batchIdRisk: v(0, 0.1, 0.5), segregasiRisk: v(0, 0, 0.8), dokumentasiRisk: v(0, 0.2, 0.6) }
        });

        // --- CP6 ---
        await prisma.cP6ProcessingRecord.create({
            data: { halalBatchId: batch.id, halalIngredientsRisk: v(0, 0.1, 0.8), equipmentRisk: v(0, 0.3, 0.7), dedicatedLineRisk: v(0, 0.2, 0.9), batchControlRisk: v(0, 0, 0.6), packagingRisk: v(0, 0.2, 0.5), operatorRisk: v(0, 0.1, 0.6), formulaRisk: v(0, 0, 0.4) }
        });

        // --- CP7 ---
        await prisma.cP7StorageRecord.create({
            data: { halalBatchId: batch.id, temperatureRisk: v(0, 0.2, 0.7), segregasiRisk: v(0, 0, 0.9), hygieneRisk: v(0, 0.3, 0.6), traceabilityRisk: v(0, 0.1, 0.5), fifoFefoRisk: v(0, 0.4, 0.8), dokumentasiRisk: v(0, 0, 0.6), incidentRisk: v(0, 0, 0.5) }
        });

        // --- CP8 ---
        await prisma.cP8DistributionRecord.create({
            data: { halalBatchId: batch.id, dedicatedTransRisk: v(0, 0.1, 0.8), vehicleSanitasiRisk: v(0, 0.2, 0.7), temperatureRisk: v(0, 0.3, 0.9), routeRisk: v(0, 0.1, 0.6), loadingRisk: v(0, 0.2, 0.7), dokumentasiRisk: v(0, 0, 0.5), kontaminasiRisk: v(0, 0.1, 0.8) }
        });

        // --- CP9 ---
        await prisma.cP9RetailRecord.create({
            data: { halalBatchId: batch.id, labelHalalRisk: v(0, 0, 0.8), displayRisk: v(0, 0.1, 0.9), storageTemRisk: v(0, 0.3, 0.7), expiryRisk: v(0, 0.2, 0.6), consumerInfoRisk: v(0, 0, 0.5), supplierTraceRisk: v(0, 0.1, 0.7), complaintRisk: v(0, 0.2, 0.6) }
        });



        // Create generic CP records linking batch & CP (so traceability UI can easily list them)
        const cps = await prisma.criticalPoint.findMany();
        for (const cp of cps) {
            await prisma.criticalPointRecord.create({
                data: {
                    halalBatchId: batch.id,
                    criticalPointId: cp.id,
                    complianceStatus: isPerfect ? 'PASS' : (isHigh ? 'FAIL' : 'PENDING'),
                }
            });
        }

        // Calculate and save the dynamic risk score
        const riskResult = await calculateBatchRiskScore(batch.id);
        
        console.log(`\n✅ Created HalalBatch: ${batch.id}`);
        console.log(`   Cattle: ${cattle.earTag}`);
        console.log(`   Total Risk Score: ${riskResult.totalRiskScore} (${riskResult.riskLevel})`);
    }

    console.log('\n🎉 Operational Data Seeding Selesai!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
