import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Critical Points dan Criteria Weights...');

    // ── 10 Critical Points ──
    const cps = [
        { id: 'CP1', name: 'Farm/Kandang Sapi', globalWeight: 0.080, localRiskScore: 0.376, riskLevel: 'Moderate' },
        { id: 'CP2', name: 'Pakan & Kesehatan Hewan', globalWeight: 0.070, localRiskScore: 0.371, riskLevel: 'Moderate' },
        { id: 'CP3', name: 'Transportasi Hewan ke RPH', globalWeight: 0.080, localRiskScore: 0.413, riskLevel: 'Moderate' },
        { id: 'CP4', name: 'RPH/Penyembelihan', globalWeight: 0.250, localRiskScore: 0.453, riskLevel: 'Moderate-High' },
        { id: 'CP5', name: 'Post-Slaughter Handling', globalWeight: 0.100, localRiskScore: 0.500, riskLevel: 'Moderate-High' },
        { id: 'CP6', name: 'Processing/Pengolahan', globalWeight: 0.120, localRiskScore: 0.518, riskLevel: 'High' },
        { id: 'CP7', name: 'Cold Storage/Warehouse', globalWeight: 0.100, localRiskScore: 0.538, riskLevel: 'High' },
        { id: 'CP8', name: 'Distribusi/Logistik', globalWeight: 0.100, localRiskScore: 0.600, riskLevel: 'High' },
        { id: 'CP9', name: 'Retail/Pasar/Supermarket', globalWeight: 0.070, localRiskScore: 0.420, riskLevel: 'Moderate' },
        { id: 'CP10', name: 'Konsumen & Complaint Handling', globalWeight: 0.030, localRiskScore: 0.463, riskLevel: 'Moderate' },
    ];

    for (const cp of cps) {
        await prisma.criticalPoint.upsert({
            where: { id: cp.id },
            update: { ...cp, globalWeightedRisk: cp.globalWeight * cp.localRiskScore },
            create: { ...cp, globalWeightedRisk: cp.globalWeight * cp.localRiskScore },
        });
    }
    console.log('✅ 10 Critical Points seeded.');

    // ── 65+ Criteria Weights (Bobot Pakar per Sub-Kriteria) ──
    const criteria: { cpId: string; code: string; name: string; weight: number }[] = [
        // CP1 — Farm (7)
        { cpId: 'CP1', code: 'F1', name: 'Asal-usul sapi', weight: 0.20 },
        { cpId: 'CP1', code: 'F2', name: 'Status kesehatan sapi', weight: 0.20 },
        { cpId: 'CP1', code: 'F3', name: 'Kepatuhan pakan', weight: 0.18 },
        { cpId: 'CP1', code: 'F4', name: 'Penggunaan obat/vaksin', weight: 0.15 },
        { cpId: 'CP1', code: 'F5', name: 'Dokumentasi pemeliharaan', weight: 0.12 },
        { cpId: 'CP1', code: 'F6', name: 'Kebersihan kandang', weight: 0.10 },
        { cpId: 'CP1', code: 'F7', name: 'Kesiapan hewan disembelih', weight: 0.05 },
        // CP2 — Feed (5)
        { cpId: 'CP2', code: 'FD1', name: 'Halal status of feed ingredients', weight: 0.30 },
        { cpId: 'CP2', code: 'FD2', name: 'Supplier reliability', weight: 0.20 },
        { cpId: 'CP2', code: 'FD3', name: 'Feed storage segregation', weight: 0.18 },
        { cpId: 'CP2', code: 'FD4', name: 'Medication control', weight: 0.17 },
        { cpId: 'CP2', code: 'FD5', name: 'Veterinary supervision', weight: 0.15 },
        // CP3 — Transport (5)
        { cpId: 'CP3', code: 'T1', name: 'Kelayakan kendaraan', weight: 0.20 },
        { cpId: 'CP3', code: 'T2', name: 'Kebersihan kendaraan', weight: 0.25 },
        { cpId: 'CP3', code: 'T3', name: 'Animal welfare', weight: 0.15 },
        { cpId: 'CP3', code: 'T4', name: 'Traceability during transport', weight: 0.25 },
        { cpId: 'CP3', code: 'T5', name: 'Dokumentasi perjalanan', weight: 0.15 },
        // CP4 — RPH/Slaughter (10)
        { cpId: 'CP4', code: 'R1', name: 'Validitas sertifikat halal RPH', weight: 0.150 },
        { cpId: 'CP4', code: 'R2', name: 'Kompetensi juru sembelih halal', weight: 0.180 },
        { cpId: 'CP4', code: 'R3', name: 'Kesesuaian proses penyembelihan syariah', weight: 0.220 },
        { cpId: 'CP4', code: 'R4', name: 'Pemeriksaan ante/post-mortem', weight: 0.080 },
        { cpId: 'CP4', code: 'R5', name: 'Sanitasi alat dan area', weight: 0.100 },
        { cpId: 'CP4', code: 'R6', name: 'Pemisahan halal dan non-halal', weight: 0.100 },
        { cpId: 'CP4', code: 'R7', name: 'Dokumentasi penyembelihan', weight: 0.070 },
        { cpId: 'CP4', code: 'R8', name: 'Pengawasan halal internal', weight: 0.040 },
        { cpId: 'CP4', code: 'R9', name: 'Audit dan corrective action', weight: 0.030 },
        { cpId: 'CP4', code: 'R10', name: 'Traceability batch', weight: 0.030 },
        // CP5 — Post-Slaughter (5)
        { cpId: 'CP5', code: 'PS1', name: 'Handling carcass compliance', weight: 0.25 },
        { cpId: 'CP5', code: 'PS2', name: 'Sanitation', weight: 0.25 },
        { cpId: 'CP5', code: 'PS3', name: 'Batch identification', weight: 0.20 },
        { cpId: 'CP5', code: 'PS4', name: 'Segregation', weight: 0.20 },
        { cpId: 'CP5', code: 'PS5', name: 'Documentation', weight: 0.10 },
        // CP6 — Processing (7)
        { cpId: 'CP6', code: 'P1', name: 'Halal status of ingredients/additives', weight: 0.25 },
        { cpId: 'CP6', code: 'P2', name: 'Equipment sanitation', weight: 0.18 },
        { cpId: 'CP6', code: 'P3', name: 'Dedicated production line', weight: 0.17 },
        { cpId: 'CP6', code: 'P4', name: 'Batch control', weight: 0.15 },
        { cpId: 'CP6', code: 'P5', name: 'Packaging & labeling compliance', weight: 0.10 },
        { cpId: 'CP6', code: 'P6', name: 'Operator competence', weight: 0.08 },
        { cpId: 'CP6', code: 'P7', name: 'Product formulation control', weight: 0.07 },
        // CP7 — Cold Storage (7)
        { cpId: 'CP7', code: 'CS1', name: 'Temperature compliance', weight: 0.25 },
        { cpId: 'CP7', code: 'CS2', name: 'Halal segregation', weight: 0.20 },
        { cpId: 'CP7', code: 'CS3', name: 'Storage hygiene', weight: 0.15 },
        { cpId: 'CP7', code: 'CS4', name: 'Batch traceability', weight: 0.15 },
        { cpId: 'CP7', code: 'CS5', name: 'FIFO/FEFO compliance', weight: 0.10 },
        { cpId: 'CP7', code: 'CS6', name: 'Documentation', weight: 0.08 },
        { cpId: 'CP7', code: 'CS7', name: 'Incident handling', weight: 0.07 },
        // CP8 — Distribution (7)
        { cpId: 'CP8', code: 'D1', name: 'Dedicated halal transport', weight: 0.20 },
        { cpId: 'CP8', code: 'D2', name: 'Vehicle sanitation', weight: 0.20 },
        { cpId: 'CP8', code: 'D3', name: 'Temperature control', weight: 0.20 },
        { cpId: 'CP8', code: 'D4', name: 'Route & delivery traceability', weight: 0.15 },
        { cpId: 'CP8', code: 'D5', name: 'Loading-unloading compliance', weight: 0.10 },
        { cpId: 'CP8', code: 'D6', name: 'Documentation completeness', weight: 0.08 },
        { cpId: 'CP8', code: 'D7', name: 'Contamination prevention', weight: 0.07 },
        // CP9 — Retail (7)
        { cpId: 'CP9', code: 'RT1', name: 'Halal label validity', weight: 0.20 },
        { cpId: 'CP9', code: 'RT2', name: 'Display segregation', weight: 0.18 },
        { cpId: 'CP9', code: 'RT3', name: 'Storage temperature', weight: 0.18 },
        { cpId: 'CP9', code: 'RT4', name: 'Expiry date control', weight: 0.12 },
        { cpId: 'CP9', code: 'RT5', name: 'Consumer information accessibility', weight: 0.12 },
        { cpId: 'CP9', code: 'RT6', name: 'Supplier traceability', weight: 0.12 },
        { cpId: 'CP9', code: 'RT7', name: 'Complaint handling', weight: 0.08 },
        // CP10 — Consumer (5)
        { cpId: 'CP10', code: 'C1', name: 'Information transparency', weight: 0.25 },
        { cpId: 'CP10', code: 'C2', name: 'Traceability accessibility', weight: 0.25 },
        { cpId: 'CP10', code: 'C3', name: 'Complaint responsiveness', weight: 0.20 },
        { cpId: 'CP10', code: 'C4', name: 'Consumer trust', weight: 0.15 },
        { cpId: 'CP10', code: 'C5', name: 'Halal literacy', weight: 0.15 },
    ];

    for (const c of criteria) {
        await prisma.criteriaWeight.upsert({
            where: {
                id: `${c.cpId}_${c.code}`,
            },
            update: {
                criteriaName: c.name,
                weight: c.weight,
            },
            create: {
                id: `${c.cpId}_${c.code}`,
                criticalPointId: c.cpId,
                criteriaCode: c.code,
                criteriaName: c.name,
                weight: c.weight,
            },
        });
    }
    console.log(`✅ ${criteria.length} Criteria Weights seeded.`);
    console.log('🎉 Seeding selesai!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
