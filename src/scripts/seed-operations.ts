/**
 * Seed Script: Operational Data for Traceability & Risk Assessment
 * 
 * Creates diverse mock data for:
 * - 3 Farms, 3 Slaughterhouses (RPH)
 * - Supply chain entities: Transporter, ProcessingPlant, Warehouse, Distributor, RetailOutlet
 * - 12 Cattle (various breeds)
 * - 10 HalalBatch records with diverse CP risk profiles
 * - Full CP1–CP9 records per batch
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
    await prisma.cP10ConsumerRecord.deleteMany();

    await prisma.halalBatch.deleteMany();
    await prisma.cattle.deleteMany();
    await prisma.slaughterhouse.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.transporter.deleteMany();
    await prisma.processingPlant.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.distributor.deleteMany();
    await prisma.retailOutlet.deleteMany();

    console.log('🌱 Seeding Operational Data (Farms, RPH, Supply Chain, Cattle, Batches)...\n');

    // ==========================================
    // 1. FARMS (3 different farms)
    // ==========================================
    const farm1 = await prisma.farm.create({
        data: { name: 'Peternakan Berkah Mandiri', location: 'Jawa Barat', address: 'Jl. Raya Lembang No. 45, Bandung' }
    });
    const farm2 = await prisma.farm.create({
        data: { name: 'Peternakan Sumber Rejeki', location: 'Jawa Timur', address: 'Jl. Raya Malang-Batu Km 12, Malang' }
    });
    const farm3 = await prisma.farm.create({
        data: { name: 'Peternakan Nusantara Jaya', location: 'Jawa Tengah', address: 'Jl. Solo-Sragen Km 8, Karanganyar' }
    });
    console.log('✅ Created 3 Farms');

    // ==========================================
    // 2. SLAUGHTERHOUSES / RPH (3 different RPH)
    // ==========================================
    const rph1 = await prisma.slaughterhouse.create({
        data: { name: 'RPH Syariah Al-Anam', location: 'Jawa Barat', address: 'Jl. RPH Cibinong, Bogor' }
    });
    const rph2 = await prisma.slaughterhouse.create({
        data: { name: 'RPH Halal Surabaya', location: 'Jawa Timur', address: 'Jl. Pegirian No. 88, Surabaya' }
    });
    const rph3 = await prisma.slaughterhouse.create({
        data: { name: 'RPH Terpadu Semarang', location: 'Jawa Tengah', address: 'Jl. Industri Raya No. 12, Semarang' }
    });
    console.log('✅ Created 3 RPH (Slaughterhouses)');

    // ==========================================
    // 3. SUPPLY CHAIN ENTITIES
    // ==========================================
    const transporter1 = await prisma.transporter.create({
        data: { name: 'PT Angkutan Ternak Sejahtera', vehicleNumber: 'B 1234 TRN', vehicleType: 'Truk', location: 'Jawa Barat' }
    });
    const transporter2 = await prisma.transporter.create({
        data: { name: 'CV Logistik Hewan Nusantara', vehicleNumber: 'L 5678 LHN', vehicleType: 'Container', location: 'Jawa Timur' }
    });
    const transporter3 = await prisma.transporter.create({
        data: { name: 'UD Transportasi Peternakan Maju', vehicleNumber: 'H 9012 TPM', vehicleType: 'Pickup', location: 'Jawa Tengah' }
    });
    console.log('✅ Created 3 Transporters');

    const processingPlant1 = await prisma.processingPlant.create({
        data: { name: 'PT Olahan Daging Halal Nusantara', location: 'Bogor', productionType: 'Pemotongan' }
    });
    const processingPlant2 = await prisma.processingPlant.create({
        data: { name: 'CV Marinade Halal Indonesia', location: 'Surabaya', productionType: 'Marinade' }
    });
    const processingPlant3 = await prisma.processingPlant.create({
        data: { name: 'PT Sosis Halal Berkah', location: 'Semarang', productionType: 'Olahan' }
    });
    console.log('✅ Created 3 Processing Plants');

    const warehouse1 = await prisma.warehouse.create({
        data: { name: 'Cold Storage Halal Bandung', location: 'Bandung', storageType: 'Frozen' }
    });
    const warehouse2 = await prisma.warehouse.create({
        data: { name: 'Gudang Pendingin Surabaya', location: 'Surabaya', storageType: 'Chilled' }
    });
    const warehouse3 = await prisma.warehouse.create({
        data: { name: 'Warehouse Terpadu Semarang', location: 'Semarang', storageType: 'Frozen' }
    });
    console.log('✅ Created 3 Warehouses');

    const distributor1 = await prisma.distributor.create({
        data: { name: 'PT Distribusi Halal Utama', location: 'Jakarta', coverageArea: 'Jabodetabek' }
    });
    const distributor2 = await prisma.distributor.create({
        data: { name: 'CV Kirim Cepat Halal', location: 'Surabaya', coverageArea: 'Jawa Timur' }
    });
    const distributor3 = await prisma.distributor.create({
        data: { name: 'UD Logistik Halal Jateng', location: 'Semarang', coverageArea: 'Jawa Tengah' }
    });
    console.log('✅ Created 3 Distributors');

    const retail1 = await prisma.retailOutlet.create({
        data: { name: 'Superindo Halal Corner Bandung', location: 'Bandung', outletType: 'Supermarket' }
    });
    const retail2 = await prisma.retailOutlet.create({
        data: { name: 'Pasar Modern Surabaya', location: 'Surabaya', outletType: 'Pasar Tradisional' }
    });
    const retail3 = await prisma.retailOutlet.create({
        data: { name: 'Alfamart Fresh Semarang', location: 'Semarang', outletType: 'Minimarket' }
    });
    console.log('✅ Created 3 Retail Outlets');

    // ==========================================
    // 4. CATTLE (12 total — from 3 farms, various breeds)
    // ==========================================
    // Farm 1 cattle (Bandung)
    const cattleA1 = await prisma.cattle.create({ data: { farmId: farm1.id, earTag: 'TAG-A001', breed: 'Limousin', birthDate: new Date('2024-01-15') } });
    const cattleA2 = await prisma.cattle.create({ data: { farmId: farm1.id, earTag: 'TAG-A002', breed: 'Brahman', birthDate: new Date('2024-02-10') } });
    const cattleA3 = await prisma.cattle.create({ data: { farmId: farm1.id, earTag: 'TAG-A003', breed: 'Simental', birthDate: new Date('2024-03-05') } });
    const cattleA4 = await prisma.cattle.create({ data: { farmId: farm1.id, earTag: 'TAG-A004', breed: 'Angus', birthDate: new Date('2024-04-12') } });

    // Farm 2 cattle (Malang)
    const cattleB1 = await prisma.cattle.create({ data: { farmId: farm2.id, earTag: 'TAG-B001', breed: 'Ongole', birthDate: new Date('2024-05-20') } });
    const cattleB2 = await prisma.cattle.create({ data: { farmId: farm2.id, earTag: 'TAG-B002', breed: 'Limousin', birthDate: new Date('2024-06-11') } });
    const cattleB3 = await prisma.cattle.create({ data: { farmId: farm2.id, earTag: 'TAG-B003', breed: 'Bali', birthDate: new Date('2024-07-18') } });
    const cattleB4 = await prisma.cattle.create({ data: { farmId: farm2.id, earTag: 'TAG-B004', breed: 'PO (Peranakan Ongole)', birthDate: new Date('2024-08-25') } });

    // Farm 3 cattle (Karanganyar)
    const cattleC1 = await prisma.cattle.create({ data: { farmId: farm3.id, earTag: 'TAG-C001', breed: 'Brahman Cross', birthDate: new Date('2024-09-05') } });
    const cattleC2 = await prisma.cattle.create({ data: { farmId: farm3.id, earTag: 'TAG-C002', breed: 'Simental', birthDate: new Date('2024-10-15') } });
    const cattleC3 = await prisma.cattle.create({ data: { farmId: farm3.id, earTag: 'TAG-C003', breed: 'Madura', birthDate: new Date('2024-11-22') } });
    const cattleC4 = await prisma.cattle.create({ data: { farmId: farm3.id, earTag: 'TAG-C004', breed: 'Aceh', birthDate: new Date('2024-12-30') } });

    console.log('✅ Created 12 Cattle (4 per farm)');

    // ==========================================
    // 5. HALAL BATCHES — 10 diverse risk profiles
    // ==========================================

    /**
     * Risk profiles definition:
     * Each profile maps CP risk values as decimals (0.0 to 1.0)
     * Later converted to 1-5 scale via Math.ceil(val * 5)
     */
    interface BatchConfig {
        label: string;
        cattle: typeof cattleA1;
        rph: typeof rph1;
        transporter: typeof transporter1;
        processingPlant: typeof processingPlant1;
        warehouse: typeof warehouse1;
        distributor: typeof distributor1;
        retailOutlet: typeof retail1;
        productionDate: Date;
        /** Risk values per CP. Each cp has specific sub-fields. */
        cp1: { asalUsul: number; kesehatan: number; kepatuhanPakan: number; obatVaksin: number; dokumentasi: number; kebersihanKandang: number; kesiapanSembelih: number };
        cp2: { halalFeedStatus: number; supplier: number; feedStorage: number; medication: number; vetSupervision: number };
        cp3: { kelayakan: number; kebersihan: number; animalWelfare: number; traceability: number; dokumentasi: number };
        cp4: { sertifikatHalal: number; kompetensiSembelih: number; prosesSyariah: number; pemeriksaan: number; sanitasi: number; segregasi: number; dokumentasi: number; pengawasan: number; audit: number; traceability: number };
        cp5: { handling: number; sanitasi: number; batchId: number; segregasi: number; dokumentasi: number };
        cp6: { halalIngredients: number; equipment: number; dedicatedLine: number; batchControl: number; packaging: number; operator: number; formula: number };
        cp7: { temperature: number; segregasi: number; hygiene: number; traceability: number; fifoFefo: number; dokumentasi: number; incident: number };
        cp8: { dedicatedTrans: number; vehicleSanitasi: number; temperature: number; route: number; loading: number; dokumentasi: number; kontaminasi: number };
        cp9: { labelHalal: number; display: number; storageTem: number; expiry: number; consumerInfo: number; supplierTrace: number; complaint: number };
    }

    const batchConfigs: BatchConfig[] = [
        // ========== BATCH 1: Perfect Compliance (Farm 1, RPH 1) ==========
        {
            label: 'Batch 1 — Perfect Compliance',
            cattle: cattleA1, rph: rph1,
            transporter: transporter1, processingPlant: processingPlant1,
            warehouse: warehouse1, distributor: distributor1, retailOutlet: retail1,
            productionDate: new Date('2026-01-10'),
            cp1: { asalUsul: 0, kesehatan: 0, kepatuhanPakan: 0, obatVaksin: 0, dokumentasi: 0, kebersihanKandang: 0, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0, supplier: 0, feedStorage: 0, medication: 0, vetSupervision: 0 },
            cp3: { kelayakan: 0, kebersihan: 0, animalWelfare: 0, traceability: 0, dokumentasi: 0 },
            cp4: { sertifikatHalal: 0, kompetensiSembelih: 0, prosesSyariah: 0, pemeriksaan: 0, sanitasi: 0, segregasi: 0, dokumentasi: 0, pengawasan: 0, audit: 0, traceability: 0 },
            cp5: { handling: 0, sanitasi: 0, batchId: 0, segregasi: 0, dokumentasi: 0 },
            cp6: { halalIngredients: 0, equipment: 0, dedicatedLine: 0, batchControl: 0, packaging: 0, operator: 0, formula: 0 },
            cp7: { temperature: 0, segregasi: 0, hygiene: 0, traceability: 0, fifoFefo: 0, dokumentasi: 0, incident: 0 },
            cp8: { dedicatedTrans: 0, vehicleSanitasi: 0, temperature: 0, route: 0, loading: 0, dokumentasi: 0, kontaminasi: 0 },
            cp9: { labelHalal: 0, display: 0, storageTem: 0, expiry: 0, consumerInfo: 0, supplierTrace: 0, complaint: 0 },
        },

        // ========== BATCH 2: Critical Risk — RPH Violations (Farm 1, RPH 1) ==========
        {
            label: 'Batch 2 — Critical RPH Violations',
            cattle: cattleA2, rph: rph1,
            transporter: transporter1, processingPlant: processingPlant1,
            warehouse: warehouse1, distributor: distributor1, retailOutlet: retail1,
            productionDate: new Date('2026-01-15'),
            cp1: { asalUsul: 0.8, kesehatan: 0.5, kepatuhanPakan: 0.7, obatVaksin: 0.9, dokumentasi: 0.6, kebersihanKandang: 0.8, kesiapanSembelih: 0.5 },
            cp2: { halalFeedStatus: 0.9, supplier: 0.6, feedStorage: 0.7, medication: 0.8, vetSupervision: 0.4 },
            cp3: { kelayakan: 0.5, kebersihan: 0.9, animalWelfare: 0.8, traceability: 0.7, dokumentasi: 0.6 },
            cp4: { sertifikatHalal: 0.9, kompetensiSembelih: 0.8, prosesSyariah: 0.95, pemeriksaan: 0.7, sanitasi: 0.8, segregasi: 0.9, dokumentasi: 0.6, pengawasan: 0.7, audit: 0.5, traceability: 0.8 },
            cp5: { handling: 0.8, sanitasi: 0.7, batchId: 0.5, segregasi: 0.8, dokumentasi: 0.6 },
            cp6: { halalIngredients: 0.8, equipment: 0.7, dedicatedLine: 0.9, batchControl: 0.6, packaging: 0.5, operator: 0.6, formula: 0.4 },
            cp7: { temperature: 0.7, segregasi: 0.9, hygiene: 0.6, traceability: 0.5, fifoFefo: 0.8, dokumentasi: 0.6, incident: 0.5 },
            cp8: { dedicatedTrans: 0.8, vehicleSanitasi: 0.7, temperature: 0.9, route: 0.6, loading: 0.7, dokumentasi: 0.5, kontaminasi: 0.8 },
            cp9: { labelHalal: 0.8, display: 0.9, storageTem: 0.7, expiry: 0.6, consumerInfo: 0.5, supplierTrace: 0.7, complaint: 0.6 },
        },

        // ========== BATCH 3: Moderate Risks (Farm 1, RPH 1) ==========
        {
            label: 'Batch 3 — Moderate Mixed Risks',
            cattle: cattleA3, rph: rph1,
            transporter: transporter1, processingPlant: processingPlant1,
            warehouse: warehouse1, distributor: distributor1, retailOutlet: retail1,
            productionDate: new Date('2026-02-05'),
            cp1: { asalUsul: 0, kesehatan: 0.1, kepatuhanPakan: 0.3, obatVaksin: 0, dokumentasi: 0.4, kebersihanKandang: 0.2, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0.1, supplier: 0.2, feedStorage: 0, medication: 0, vetSupervision: 0.3 },
            cp3: { kelayakan: 0.2, kebersihan: 0.4, animalWelfare: 0, traceability: 0.2, dokumentasi: 0.1 },
            cp4: { sertifikatHalal: 0, kompetensiSembelih: 0.2, prosesSyariah: 0.1, pemeriksaan: 0.3, sanitasi: 0.4, segregasi: 0, dokumentasi: 0.2, pengawasan: 0, audit: 0, traceability: 0.1 },
            cp5: { handling: 0.2, sanitasi: 0.3, batchId: 0.1, segregasi: 0, dokumentasi: 0.2 },
            cp6: { halalIngredients: 0.1, equipment: 0.3, dedicatedLine: 0.2, batchControl: 0, packaging: 0.2, operator: 0.1, formula: 0 },
            cp7: { temperature: 0.2, segregasi: 0, hygiene: 0.3, traceability: 0.1, fifoFefo: 0.4, dokumentasi: 0, incident: 0 },
            cp8: { dedicatedTrans: 0.1, vehicleSanitasi: 0.2, temperature: 0.3, route: 0.1, loading: 0.2, dokumentasi: 0, kontaminasi: 0.1 },
            cp9: { labelHalal: 0, display: 0.1, storageTem: 0.3, expiry: 0.2, consumerInfo: 0, supplierTrace: 0.1, complaint: 0.2 },
        },

        // ========== BATCH 4: Transport & Distribution Issues (Farm 2, RPH 2) ==========
        {
            label: 'Batch 4 — Transport & Distribution Focus',
            cattle: cattleB1, rph: rph2,
            transporter: transporter2, processingPlant: processingPlant2,
            warehouse: warehouse2, distributor: distributor2, retailOutlet: retail2,
            productionDate: new Date('2026-02-20'),
            cp1: { asalUsul: 0.1, kesehatan: 0, kepatuhanPakan: 0.1, obatVaksin: 0, dokumentasi: 0.1, kebersihanKandang: 0, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0, supplier: 0.1, feedStorage: 0, medication: 0, vetSupervision: 0.1 },
            cp3: { kelayakan: 0.7, kebersihan: 0.8, animalWelfare: 0.6, traceability: 0.9, dokumentasi: 0.7 },
            cp4: { sertifikatHalal: 0.1, kompetensiSembelih: 0, prosesSyariah: 0.1, pemeriksaan: 0.2, sanitasi: 0.1, segregasi: 0, dokumentasi: 0.1, pengawasan: 0, audit: 0.1, traceability: 0.2 },
            cp5: { handling: 0.3, sanitasi: 0.2, batchId: 0.4, segregasi: 0.3, dokumentasi: 0.2 },
            cp6: { halalIngredients: 0.1, equipment: 0.2, dedicatedLine: 0.1, batchControl: 0.3, packaging: 0.1, operator: 0, formula: 0.1 },
            cp7: { temperature: 0.6, segregasi: 0.5, hygiene: 0.4, traceability: 0.7, fifoFefo: 0.6, dokumentasi: 0.5, incident: 0.3 },
            cp8: { dedicatedTrans: 0.8, vehicleSanitasi: 0.9, temperature: 0.7, route: 0.8, loading: 0.7, dokumentasi: 0.6, kontaminasi: 0.9 },
            cp9: { labelHalal: 0.2, display: 0.3, storageTem: 0.4, expiry: 0.3, consumerInfo: 0.2, supplierTrace: 0.4, complaint: 0.3 },
        },

        // ========== BATCH 5: Processing & Storage Issues (Farm 2, RPH 2) ==========
        {
            label: 'Batch 5 — Processing & Storage Focus',
            cattle: cattleB2, rph: rph2,
            transporter: transporter2, processingPlant: processingPlant2,
            warehouse: warehouse2, distributor: distributor2, retailOutlet: retail2,
            productionDate: new Date('2026-03-10'),
            cp1: { asalUsul: 0.1, kesehatan: 0.1, kepatuhanPakan: 0, obatVaksin: 0.1, dokumentasi: 0.2, kebersihanKandang: 0.1, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0.1, supplier: 0.2, feedStorage: 0.1, medication: 0.1, vetSupervision: 0 },
            cp3: { kelayakan: 0.1, kebersihan: 0.2, animalWelfare: 0.1, traceability: 0, dokumentasi: 0.1 },
            cp4: { sertifikatHalal: 0.1, kompetensiSembelih: 0.1, prosesSyariah: 0, pemeriksaan: 0.2, sanitasi: 0.2, segregasi: 0.1, dokumentasi: 0.1, pengawasan: 0.1, audit: 0, traceability: 0.1 },
            cp5: { handling: 0.2, sanitasi: 0.3, batchId: 0.1, segregasi: 0.2, dokumentasi: 0.1 },
            cp6: { halalIngredients: 0.8, equipment: 0.7, dedicatedLine: 0.9, batchControl: 0.6, packaging: 0.7, operator: 0.5, formula: 0.8 },
            cp7: { temperature: 0.9, segregasi: 0.8, hygiene: 0.7, traceability: 0.6, fifoFefo: 0.8, dokumentasi: 0.7, incident: 0.6 },
            cp8: { dedicatedTrans: 0.2, vehicleSanitasi: 0.3, temperature: 0.4, route: 0.2, loading: 0.3, dokumentasi: 0.1, kontaminasi: 0.2 },
            cp9: { labelHalal: 0.1, display: 0.2, storageTem: 0.5, expiry: 0.4, consumerInfo: 0.1, supplierTrace: 0.2, complaint: 0.3 },
        },

        // ========== BATCH 6: Farm & Feed Issues (Farm 2, RPH 2) ==========
        {
            label: 'Batch 6 — Farm & Feed Problems',
            cattle: cattleB3, rph: rph2,
            transporter: transporter2, processingPlant: processingPlant2,
            warehouse: warehouse2, distributor: distributor2, retailOutlet: retail2,
            productionDate: new Date('2026-03-25'),
            cp1: { asalUsul: 0.9, kesehatan: 0.7, kepatuhanPakan: 0.8, obatVaksin: 0.6, dokumentasi: 0.7, kebersihanKandang: 0.9, kesiapanSembelih: 0.5 },
            cp2: { halalFeedStatus: 0.8, supplier: 0.7, feedStorage: 0.9, medication: 0.6, vetSupervision: 0.8 },
            cp3: { kelayakan: 0.2, kebersihan: 0.3, animalWelfare: 0.2, traceability: 0.1, dokumentasi: 0.2 },
            cp4: { sertifikatHalal: 0.1, kompetensiSembelih: 0.1, prosesSyariah: 0.1, pemeriksaan: 0.2, sanitasi: 0.2, segregasi: 0.1, dokumentasi: 0.2, pengawasan: 0.1, audit: 0.1, traceability: 0.1 },
            cp5: { handling: 0.1, sanitasi: 0.2, batchId: 0.1, segregasi: 0.1, dokumentasi: 0.1 },
            cp6: { halalIngredients: 0.2, equipment: 0.1, dedicatedLine: 0.1, batchControl: 0.2, packaging: 0.1, operator: 0.1, formula: 0.1 },
            cp7: { temperature: 0.1, segregasi: 0.2, hygiene: 0.1, traceability: 0.1, fifoFefo: 0.2, dokumentasi: 0.1, incident: 0.1 },
            cp8: { dedicatedTrans: 0.1, vehicleSanitasi: 0.1, temperature: 0.2, route: 0.1, loading: 0.1, dokumentasi: 0.1, kontaminasi: 0.1 },
            cp9: { labelHalal: 0.1, display: 0.1, storageTem: 0.2, expiry: 0.1, consumerInfo: 0.1, supplierTrace: 0.1, complaint: 0.1 },
        },

        // ========== BATCH 7: Retail & Consumer Issues (Farm 3, RPH 3) ==========
        {
            label: 'Batch 7 — Retail & Consumer Focus',
            cattle: cattleC1, rph: rph3,
            transporter: transporter3, processingPlant: processingPlant3,
            warehouse: warehouse3, distributor: distributor3, retailOutlet: retail3,
            productionDate: new Date('2026-04-05'),
            cp1: { asalUsul: 0, kesehatan: 0.1, kepatuhanPakan: 0.1, obatVaksin: 0, dokumentasi: 0.1, kebersihanKandang: 0.1, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0.1, supplier: 0, feedStorage: 0.1, medication: 0, vetSupervision: 0.1 },
            cp3: { kelayakan: 0.1, kebersihan: 0.1, animalWelfare: 0, traceability: 0.1, dokumentasi: 0.1 },
            cp4: { sertifikatHalal: 0, kompetensiSembelih: 0.1, prosesSyariah: 0, pemeriksaan: 0.1, sanitasi: 0.1, segregasi: 0, dokumentasi: 0.1, pengawasan: 0, audit: 0, traceability: 0.1 },
            cp5: { handling: 0.1, sanitasi: 0.1, batchId: 0, segregasi: 0.1, dokumentasi: 0.1 },
            cp6: { halalIngredients: 0.1, equipment: 0.2, dedicatedLine: 0.1, batchControl: 0.1, packaging: 0.2, operator: 0.1, formula: 0.1 },
            cp7: { temperature: 0.2, segregasi: 0.1, hygiene: 0.2, traceability: 0.1, fifoFefo: 0.2, dokumentasi: 0.1, incident: 0.1 },
            cp8: { dedicatedTrans: 0.2, vehicleSanitasi: 0.1, temperature: 0.3, route: 0.2, loading: 0.1, dokumentasi: 0.2, kontaminasi: 0.1 },
            cp9: { labelHalal: 0.9, display: 0.8, storageTem: 0.7, expiry: 0.9, consumerInfo: 0.8, supplierTrace: 0.7, complaint: 0.8 },
        },

        // ========== BATCH 8: Near Perfect with Minor Issues (Farm 3, RPH 3) ==========
        {
            label: 'Batch 8 — Near Perfect (minor documentation)',
            cattle: cattleC2, rph: rph3,
            transporter: transporter3, processingPlant: processingPlant3,
            warehouse: warehouse3, distributor: distributor3, retailOutlet: retail3,
            productionDate: new Date('2026-04-20'),
            cp1: { asalUsul: 0, kesehatan: 0, kepatuhanPakan: 0.1, obatVaksin: 0, dokumentasi: 0.2, kebersihanKandang: 0, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0, supplier: 0.1, feedStorage: 0, medication: 0, vetSupervision: 0 },
            cp3: { kelayakan: 0, kebersihan: 0.1, animalWelfare: 0, traceability: 0, dokumentasi: 0.1 },
            cp4: { sertifikatHalal: 0, kompetensiSembelih: 0, prosesSyariah: 0, pemeriksaan: 0.1, sanitasi: 0, segregasi: 0, dokumentasi: 0.1, pengawasan: 0, audit: 0, traceability: 0 },
            cp5: { handling: 0, sanitasi: 0.1, batchId: 0, segregasi: 0, dokumentasi: 0.1 },
            cp6: { halalIngredients: 0, equipment: 0.1, dedicatedLine: 0, batchControl: 0, packaging: 0.1, operator: 0, formula: 0 },
            cp7: { temperature: 0.1, segregasi: 0, hygiene: 0.1, traceability: 0, fifoFefo: 0.1, dokumentasi: 0, incident: 0 },
            cp8: { dedicatedTrans: 0, vehicleSanitasi: 0.1, temperature: 0.1, route: 0, loading: 0, dokumentasi: 0.1, kontaminasi: 0 },
            cp9: { labelHalal: 0, display: 0, storageTem: 0.1, expiry: 0, consumerInfo: 0, supplierTrace: 0, complaint: 0.1 },
        },

        // ========== BATCH 9: High Risk Across All CPs (Farm 3, RPH 3) ==========
        {
            label: 'Batch 9 — High Risk Everywhere',
            cattle: cattleC3, rph: rph3,
            transporter: transporter3, processingPlant: processingPlant3,
            warehouse: warehouse3, distributor: distributor3, retailOutlet: retail3,
            productionDate: new Date('2026-05-10'),
            cp1: { asalUsul: 0.7, kesehatan: 0.6, kepatuhanPakan: 0.8, obatVaksin: 0.7, dokumentasi: 0.6, kebersihanKandang: 0.7, kesiapanSembelih: 0.5 },
            cp2: { halalFeedStatus: 0.7, supplier: 0.6, feedStorage: 0.7, medication: 0.8, vetSupervision: 0.5 },
            cp3: { kelayakan: 0.6, kebersihan: 0.7, animalWelfare: 0.6, traceability: 0.7, dokumentasi: 0.5 },
            cp4: { sertifikatHalal: 0.7, kompetensiSembelih: 0.6, prosesSyariah: 0.8, pemeriksaan: 0.6, sanitasi: 0.7, segregasi: 0.7, dokumentasi: 0.5, pengawasan: 0.6, audit: 0.5, traceability: 0.6 },
            cp5: { handling: 0.6, sanitasi: 0.7, batchId: 0.5, segregasi: 0.6, dokumentasi: 0.5 },
            cp6: { halalIngredients: 0.7, equipment: 0.6, dedicatedLine: 0.7, batchControl: 0.5, packaging: 0.6, operator: 0.5, formula: 0.5 },
            cp7: { temperature: 0.7, segregasi: 0.6, hygiene: 0.7, traceability: 0.5, fifoFefo: 0.6, dokumentasi: 0.5, incident: 0.5 },
            cp8: { dedicatedTrans: 0.7, vehicleSanitasi: 0.6, temperature: 0.7, route: 0.5, loading: 0.6, dokumentasi: 0.5, kontaminasi: 0.7 },
            cp9: { labelHalal: 0.6, display: 0.7, storageTem: 0.6, expiry: 0.5, consumerInfo: 0.6, supplierTrace: 0.5, complaint: 0.6 },
        },

        // ========== BATCH 10: Slaughter-only Critical (Farm 1, RPH 3 cross-region) ==========
        {
            label: 'Batch 10 — CP4 Slaughter Critical Only',
            cattle: cattleA4, rph: rph3,
            transporter: transporter1, processingPlant: processingPlant3,
            warehouse: warehouse1, distributor: distributor3, retailOutlet: retail1,
            productionDate: new Date('2026-06-01'),
            cp1: { asalUsul: 0.1, kesehatan: 0, kepatuhanPakan: 0.1, obatVaksin: 0, dokumentasi: 0.1, kebersihanKandang: 0.1, kesiapanSembelih: 0 },
            cp2: { halalFeedStatus: 0, supplier: 0.1, feedStorage: 0, medication: 0.1, vetSupervision: 0 },
            cp3: { kelayakan: 0.1, kebersihan: 0.2, animalWelfare: 0.1, traceability: 0.1, dokumentasi: 0.1 },
            cp4: { sertifikatHalal: 0.95, kompetensiSembelih: 0.9, prosesSyariah: 0.85, pemeriksaan: 0.8, sanitasi: 0.75, segregasi: 0.9, dokumentasi: 0.7, pengawasan: 0.8, audit: 0.6, traceability: 0.85 },
            cp5: { handling: 0.3, sanitasi: 0.2, batchId: 0.2, segregasi: 0.3, dokumentasi: 0.2 },
            cp6: { halalIngredients: 0.1, equipment: 0.2, dedicatedLine: 0.1, batchControl: 0.1, packaging: 0.1, operator: 0.1, formula: 0 },
            cp7: { temperature: 0.1, segregasi: 0.1, hygiene: 0.2, traceability: 0.1, fifoFefo: 0.1, dokumentasi: 0.1, incident: 0 },
            cp8: { dedicatedTrans: 0.1, vehicleSanitasi: 0.2, temperature: 0.1, route: 0.1, loading: 0.1, dokumentasi: 0.1, kontaminasi: 0.1 },
            cp9: { labelHalal: 0.1, display: 0.1, storageTem: 0.1, expiry: 0.1, consumerInfo: 0.1, supplierTrace: 0.1, complaint: 0.1 },
        },
    ];

    // Helper: convert decimal (0-1) to 1-5 scale
    const toScale = (val: number) => val > 0 ? Math.ceil(val * 5) : 0;

    for (let i = 0; i < batchConfigs.length; i++) {
        const cfg = batchConfigs[i];

        const batch = await prisma.halalBatch.create({
            data: {
                cattleId: cfg.cattle.id,
                slaughterhouseId: cfg.rph.id,
                productionDate: cfg.productionDate,
            }
        });

        // --- CP1: Farm ---
        await prisma.cP1FarmRecord.create({
            data: {
                halalBatchId: batch.id,
                asalUsulRisk: toScale(cfg.cp1.asalUsul),
                kesehatanRisk: toScale(cfg.cp1.kesehatan),
                kepatuhanPakanRisk: toScale(cfg.cp1.kepatuhanPakan),
                obatVaksinRisk: toScale(cfg.cp1.obatVaksin),
                dokumentasiRisk: toScale(cfg.cp1.dokumentasi),
                kebersihanKandangRisk: toScale(cfg.cp1.kebersihanKandang),
                kesiapanSembelihRisk: toScale(cfg.cp1.kesiapanSembelih),
            }
        });

        // --- CP2: Feed ---
        await prisma.cP2FeedRecord.create({
            data: {
                halalBatchId: batch.id,
                halalFeedStatusRisk: toScale(cfg.cp2.halalFeedStatus),
                supplierRisk: toScale(cfg.cp2.supplier),
                feedStorageRisk: toScale(cfg.cp2.feedStorage),
                medicationRisk: toScale(cfg.cp2.medication),
                vetSupervisionRisk: toScale(cfg.cp2.vetSupervision),
            }
        });

        // --- CP3: Transport (linked to Transporter entity) ---
        await prisma.cP3TransportRecord.create({
            data: {
                halalBatchId: batch.id,
                transporterId: cfg.transporter.id,
                kelayakanRisk: toScale(cfg.cp3.kelayakan),
                kebersihanRisk: toScale(cfg.cp3.kebersihan),
                animalWelfareRisk: toScale(cfg.cp3.animalWelfare),
                traceabilityRisk: toScale(cfg.cp3.traceability),
                dokumentasiRisk: toScale(cfg.cp3.dokumentasi),
            }
        });

        // --- CP4: Slaughter (MOST CRITICAL) ---
        await prisma.cP4SlaughterRecord.create({
            data: {
                halalBatchId: batch.id,
                sertifikatHalalRisk: toScale(cfg.cp4.sertifikatHalal),
                kompetensiSembelihRisk: toScale(cfg.cp4.kompetensiSembelih),
                prosesSyariahRisk: toScale(cfg.cp4.prosesSyariah),
                pemeriksaanRisk: toScale(cfg.cp4.pemeriksaan),
                sanitasiRisk: toScale(cfg.cp4.sanitasi),
                segregasiRisk: toScale(cfg.cp4.segregasi),
                dokumentasiRisk: toScale(cfg.cp4.dokumentasi),
                pengawasanRisk: toScale(cfg.cp4.pengawasan),
                auditRisk: toScale(cfg.cp4.audit),
                traceabilityRisk: toScale(cfg.cp4.traceability),
            }
        });

        // --- CP5: Post-Slaughter ---
        await prisma.cP5PostSlaughterRecord.create({
            data: {
                halalBatchId: batch.id,
                handlingRisk: toScale(cfg.cp5.handling),
                sanitasiRisk: toScale(cfg.cp5.sanitasi),
                batchIdRisk: toScale(cfg.cp5.batchId),
                segregasiRisk: toScale(cfg.cp5.segregasi),
                dokumentasiRisk: toScale(cfg.cp5.dokumentasi),
            }
        });

        // --- CP6: Processing (linked to ProcessingPlant) ---
        await prisma.cP6ProcessingRecord.create({
            data: {
                halalBatchId: batch.id,
                processingPlantId: cfg.processingPlant.id,
                halalIngredientsRisk: toScale(cfg.cp6.halalIngredients),
                equipmentRisk: toScale(cfg.cp6.equipment),
                dedicatedLineRisk: toScale(cfg.cp6.dedicatedLine),
                batchControlRisk: toScale(cfg.cp6.batchControl),
                packagingRisk: toScale(cfg.cp6.packaging),
                operatorRisk: toScale(cfg.cp6.operator),
                formulaRisk: toScale(cfg.cp6.formula),
            }
        });

        // --- CP7: Storage (linked to Warehouse) ---
        await prisma.cP7StorageRecord.create({
            data: {
                halalBatchId: batch.id,
                warehouseId: cfg.warehouse.id,
                temperatureRisk: toScale(cfg.cp7.temperature),
                segregasiRisk: toScale(cfg.cp7.segregasi),
                hygieneRisk: toScale(cfg.cp7.hygiene),
                traceabilityRisk: toScale(cfg.cp7.traceability),
                fifoFefoRisk: toScale(cfg.cp7.fifoFefo),
                dokumentasiRisk: toScale(cfg.cp7.dokumentasi),
                incidentRisk: toScale(cfg.cp7.incident),
            }
        });

        // --- CP8: Distribution (linked to Distributor) ---
        await prisma.cP8DistributionRecord.create({
            data: {
                halalBatchId: batch.id,
                distributorId: cfg.distributor.id,
                dedicatedTransRisk: toScale(cfg.cp8.dedicatedTrans),
                vehicleSanitasiRisk: toScale(cfg.cp8.vehicleSanitasi),
                temperatureRisk: toScale(cfg.cp8.temperature),
                routeRisk: toScale(cfg.cp8.route),
                loadingRisk: toScale(cfg.cp8.loading),
                dokumentasiRisk: toScale(cfg.cp8.dokumentasi),
                kontaminasiRisk: toScale(cfg.cp8.kontaminasi),
            }
        });

        // --- CP9: Retail (linked to RetailOutlet) ---
        await prisma.cP9RetailRecord.create({
            data: {
                halalBatchId: batch.id,
                retailOutletId: cfg.retailOutlet.id,
                labelHalalRisk: toScale(cfg.cp9.labelHalal),
                displayRisk: toScale(cfg.cp9.display),
                storageTemRisk: toScale(cfg.cp9.storageTem),
                expiryRisk: toScale(cfg.cp9.expiry),
                consumerInfoRisk: toScale(cfg.cp9.consumerInfo),
                supplierTraceRisk: toScale(cfg.cp9.supplierTrace),
                complaintRisk: toScale(cfg.cp9.complaint),
            }
        });

        // Create generic CriticalPointRecord entries
        const cps = await prisma.criticalPoint.findMany();
        const cpRiskMap: Record<string, number[]> = {
            CP1: Object.values(cfg.cp1),
            CP2: Object.values(cfg.cp2),
            CP3: Object.values(cfg.cp3),
            CP4: Object.values(cfg.cp4),
            CP5: Object.values(cfg.cp5),
            CP6: Object.values(cfg.cp6),
            CP7: Object.values(cfg.cp7),
            CP8: Object.values(cfg.cp8),
            CP9: Object.values(cfg.cp9),
        };

        for (const cp of cps) {
            const vals = cpRiskMap[cp.id] || [];
            let status = 'PASS';
            if (vals.some((v) => v > 0.5)) status = 'FAIL';
            else if (vals.some((v) => v > 0)) status = 'PENDING';

            await prisma.criticalPointRecord.create({
                data: {
                    halalBatchId: batch.id,
                    criticalPointId: cp.id,
                    complianceStatus: status,
                }
            });
        }

        // Calculate and save dynamic risk score
        const riskResult = await calculateBatchRiskScore(batch.id);

        console.log(`✅ ${cfg.label}`);
        console.log(`   Cattle: ${cfg.cattle.earTag} (${cfg.cattle.breed}) | RPH: ${cfg.rph.name}`);
        console.log(`   Total Risk: ${riskResult.totalRiskScore} (${riskResult.riskLevel})\n`);
    }

    // Report remaining cattle without batches
    const cattleWithoutBatch = [cattleB4, cattleC4];
    console.log(`📋 ${cattleWithoutBatch.length} Cattle without batches: ${cattleWithoutBatch.map(c => c.earTag).join(', ')}`);

    console.log('\n🎉 Operational Data Seeding Complete!');
    console.log('   📊 Summary:');
    console.log('   - 3 Farms (Jawa Barat, Jawa Timur, Jawa Tengah)');
    console.log('   - 3 RPH (Bogor, Surabaya, Semarang)');
    console.log('   - 3 Transporters, 3 Processing Plants, 3 Warehouses');
    console.log('   - 3 Distributors, 3 Retail Outlets');
    console.log('   - 12 Cattle (4 breeds × 3 farms)');
    console.log('   - 10 HalalBatch records with diverse risk profiles');
    console.log('   - 90 CP records (CP1–CP9 × 10 batches)');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
