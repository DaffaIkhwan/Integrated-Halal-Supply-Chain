/**
 * Seed Script: Kuesioner Pembobotan, Risiko, Aktual
 * Run: npx tsx src/scripts/seed-questionnaires.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PDF dari Cloudinary (sudah diupload sebelumnya)
const PDF_URL = 'https://res.cloudinary.com/dzrd37naa/image/upload/v1778840178/nextrag_questionnaires/seed_kuesioner_pembobotan.pdf';
const PDF_THUMB = 'https://res.cloudinary.com/dzrd37naa/image/upload/w_400,h_300,c_fill,pg_1/nextrag_questionnaires/seed_kuesioner_pembobotan.jpg';
const PDF_FILE = { key: 'dokumen_pendukung', filename: 'KUESIONER_1_PEMBOBOTAN.pdf', url: PDF_URL, thumbnailUrl: PDF_THUMB };

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate full risk answers for a CP with given indicator count per subCriteria */
function riskAnswers(subCodes: string[], indCount: number, baseValue: number) {
  const risks: Record<string, number> = {};
  const evidence: Record<string, boolean> = {};
  subCodes.forEach(code => {
    for (let i = 1; i <= indCount; i++) {
      risks[`${code}_${i}`] = baseValue;
      evidence[`${code}_${i}`] = true;
    }
  });
  return { risks, evidence };
}

/** Standard supervisor notes */
function supervisorNotes(tingkat: string, avg: string) {
  return {
    namaSupervisor: 'Dr. Ahmad Fauzi, S.Pt., M.Si.',
    hasilVerifikasi: 'sesuai',
    tingkatRisiko: tingkat,
    avgRiskScore: avg,
    tindakanKorektif: 'Tidak diperlukan tindakan korektif. Semua indikator terpenuhi dengan baik.',
    tanggalVerifikasi: '2026-05-14',
  };
}

// ─── PEMBOBOTAN DATA ─────────────────────────────────────────────────────────

const CP_LABELS = [
  { id: 'CP1', name: 'Kandang Sapi (Farm)' },
  { id: 'CP2', name: 'Pakan & Kesehatan Hewan' },
  { id: 'CP3', name: 'Transportasi Hewan ke RPH' },
  { id: 'CP4', name: 'Rumah Potong Hewan (RPH)' },
  { id: 'CP5', name: 'Post-Slaughter Handling' },
  { id: 'CP6', name: 'Pengolahan Daging' },
  { id: 'CP7', name: 'Penyimpanan (Cold Storage)' },
  { id: 'CP8', name: 'Distribusi & Logistik' },
  { id: 'CP9', name: 'Retail & Pasar' },
];

const EXPERT_RESPONDENTS = [
  { name: 'Prof. Dr. Ir. Budi Santoso, M.Sc.', role: 'Akademisi', org: 'Universitas Gadjah Mada', jenisKelamin: 'Laki-laki', lamaBekerja: '15 tahun' },
  { name: 'Dr. Hj. Siti Rahayu, M.Ag.', role: 'Pakar Halal', org: 'LPPOM MUI Pusat', jenisKelamin: 'Perempuan', lamaBekerja: '12 tahun' },
  { name: 'Ir. Agus Hermawan, M.T.', role: 'Pakar Supply Chain', org: 'PT. Logistik Halal Nusantara', jenisKelamin: 'Laki-laki', lamaBekerja: '20 tahun' },
];

// Scale values for pembobotan: 1=Sama, 3=Sedikit Lebih, 5=Lebih, 7=Jauh Lebih, 9=Mutlak
const PEMBOBOTAN_ANSWERS_EXPERT1: Record<string, number> = {
  'CP1_CP2': 3, 'CP1_CP3': 5, 'CP1_CP4': 1/5, 'CP1_CP5': 3, 'CP1_CP6': 3, 'CP1_CP7': 5, 'CP1_CP8': 5, 'CP1_CP9': 7,
  'CP2_CP3': 3, 'CP2_CP4': 1/7, 'CP2_CP5': 1, 'CP2_CP6': 1, 'CP2_CP7': 3, 'CP2_CP8': 3, 'CP2_CP9': 5,
  'CP3_CP4': 1/7, 'CP3_CP5': 1/3, 'CP3_CP6': 1/3, 'CP3_CP7': 1, 'CP3_CP8': 1, 'CP3_CP9': 3,
  'CP4_CP5': 5, 'CP4_CP6': 5, 'CP4_CP7': 7, 'CP4_CP8': 7, 'CP4_CP9': 9,
  'CP5_CP6': 1, 'CP5_CP7': 3, 'CP5_CP8': 3, 'CP5_CP9': 5,
  'CP6_CP7': 3, 'CP6_CP8': 3, 'CP6_CP9': 5,
  'CP7_CP8': 1, 'CP7_CP9': 3,
  'CP8_CP9': 3,
};

// ─── MAIN SEED ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🗑️  Menghapus semua data kuesioner lama...');
  await prisma.questionnaireResponse.deleteMany({});
  console.log('✅ Data lama berhasil dihapus.\n');

  // ══════════════════════════════════════════
  // 1. KUESIONER PEMBOBOTAN (K1)
  // ══════════════════════════════════════════
  console.log('📋 Seeding Kuesioner 1 — Pembobotan...');

  for (const expert of EXPERT_RESPONDENTS) {
    // CP-Level comparison
    await prisma.questionnaireResponse.create({
      data: {
        questionnaireType: 'pembobotan',
        cpId: null,
        respondentName: expert.name,
        respondentRole: expert.role,
        respondentOrg: expert.org,
        respondentInfo: {
          tanggal: '2026-05-14',
          nama: expert.name,
          jenisKelamin: expert.jenisKelamin,
          posisi: expert.role,
          namaInstansi: expert.org,
          lamaBekerja: expert.lamaBekerja,
        },
        answers: { type: 'CP_LEVEL', comparisons: PEMBOBOTAN_ANSWERS_EXPERT1 },
        notes: {},
        files: [PDF_FILE],
        status: 'SUBMITTED',
      }
    });

    // Per-CP sub-criteria comparisons (CP1-CP4 as examples)
    for (const cp of CP_LABELS.slice(0, 4)) {
      const subAnswers: Record<string, number> = {};
      const subCount = cp.id === 'CP4' ? 9 : 5;
      for (let i = 1; i <= subCount; i++) {
        for (let j = i + 1; j <= subCount; j++) {
          subAnswers[`${cp.id}.${i}_${cp.id}.${j}`] = i === 1 ? 3 : i === 2 ? 5 : 1;
        }
      }
      await prisma.questionnaireResponse.create({
        data: {
          questionnaireType: 'pembobotan',
          cpId: cp.id,
          respondentName: expert.name,
          respondentRole: expert.role,
          respondentOrg: expert.org,
          respondentInfo: {
            tanggal: '2026-05-14',
            nama: expert.name,
            jenisKelamin: expert.jenisKelamin,
            posisi: expert.role,
            namaInstansi: expert.org,
            lamaBekerja: expert.lamaBekerja,
          },
          answers: { type: 'SUBCRITERIA_LEVEL', cpId: cp.id, cpName: cp.name, comparisons: subAnswers },
          notes: {},
          files: [PDF_FILE],
          status: 'SUBMITTED',
        }
      });
    }
  }
  console.log(`✅ Pembobotan: ${EXPERT_RESPONDENTS.length * 5} records seeded.\n`);

  // ══════════════════════════════════════════
  // 2. KUESIONER RISIKO (K2) — per CP1-CP9
  // ══════════════════════════════════════════
  console.log('📋 Seeding Kuesioner 2 — Risiko...');

  const RISIKO_DATA = [
    { cpId: 'CP1', respondentName: 'Drs. Hendra Kusuma, S.Pt.', respondentRole: 'Penyelia Halal', respondentOrg: 'Peternakan Berkah Mandiri', noSertifikat: 'LPPOM-2023-001', subCodes: ['CP1.1','CP1.2','CP1.3','CP1.4','CP1.5'], baseRisk: 2, bgData: { namaFarm: 'Peternakan Berkah Mandiri', lokasi: 'Lembang, Jawa Barat', noSertifikat: 'LPPOM-2023-001', posisi: 'Penyelia Halal', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP2', respondentName: 'drh. Maya Indrawati', respondentRole: 'Veteriner', respondentOrg: 'Peternakan Berkah Mandiri', noSertifikat: 'VET-2024-087', subCodes: ['CP2.1','CP2.2','CP2.3','CP2.4','CP2.5'], baseRisk: 2, bgData: { namaFarm: 'Peternakan Berkah Mandiri', lokasi: 'Lembang, Jawa Barat', noSertifikat: 'VET-2024-087', posisi: 'Veteriner', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP3', respondentName: 'Bpk. Sugiono, S.T.', respondentRole: 'Supervisor Transportasi', respondentOrg: 'PT. Ternak Angkut Sejahtera', noSertifikat: 'AH-2023-045', subCodes: ['CP3.1','CP3.2','CP3.3','CP3.4','CP3.5'], baseRisk: 3, bgData: { namaPerusahaan: 'PT. Ternak Angkut Sejahtera', noKendaraan: 'B 1234 XYZ', noSertifikat: 'AH-2023-045', posisi: 'Supervisor', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP4', respondentName: 'H. Zainal Arifin, S.Pt., M.Si.', respondentRole: 'Juru Sembelih Halal', respondentOrg: 'RPH Syariah Al-Anam Bogor', noSertifikat: 'JULEHA-2022-112', subCodes: ['CP4.1','CP4.2','CP4.3','CP4.4','CP4.5','CP4.6','CP4.7','CP4.8','CP4.9'], baseRisk: 1, bgData: { namaRPH: 'RPH Syariah Al-Anam', alamat: 'Jl. RPH Cibinong, Bogor', noSertifikat: 'JULEHA-2022-112', posisi: 'Juru Sembelih Halal', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP5', respondentName: 'Ir. Dewi Kusumawati', respondentRole: 'QC Supervisor', respondentOrg: 'RPH Syariah Al-Anam Bogor', noSertifikat: 'QC-2024-033', subCodes: ['CP5.1','CP5.2','CP5.3','CP5.4'], baseRisk: 2, bgData: { namaRPH: 'RPH Syariah Al-Anam', noSertifikat: 'QC-2024-033', posisi: 'QC Supervisor', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP6', respondentName: 'Bpk. Rudi Hartono, S.T.P.', respondentRole: 'Supervisor Produksi', respondentOrg: 'PT. Olahan Halal Nusantara', noSertifikat: 'PROC-2023-076', subCodes: ['CP6.1','CP6.2','CP6.3','CP6.4'], baseRisk: 2, bgData: { namaPerusahaan: 'PT. Olahan Halal Nusantara', lokasi: 'Cikarang, Bekasi', noSertifikat: 'PROC-2023-076', posisi: 'Supervisor Produksi', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP7', respondentName: 'Ibu Rina Marlina, A.Md.', respondentRole: 'Warehouse Supervisor', respondentOrg: 'PT. Cold Chain Halal Indonesia', noSertifikat: 'WH-2024-021', subCodes: ['CP7.1','CP7.2','CP7.3','CP7.4','CP7.5','CP7.6','CP7.7'], baseRisk: 2, bgData: { namaGudang: 'Cold Storage Halal 1', lokasi: 'Cilincing, Jakarta Utara', noSertifikat: 'WH-2024-021', posisi: 'Warehouse Supervisor', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP8', respondentName: 'Bpk. Faisal Rahman, S.E.', respondentRole: 'Logistics Manager', respondentOrg: 'PT. Distribusi Halal Sejahtera', noSertifikat: 'LOG-2023-099', subCodes: ['CP8.1','CP8.2','CP8.3','CP8.4','CP8.5','CP8.6','CP8.7'], baseRisk: 3, bgData: { namaPerusahaan: 'PT. Distribusi Halal Sejahtera', noSertifikat: 'LOG-2023-099', posisi: 'Logistics Manager', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP9', respondentName: 'Ibu Sri Wahyuni, S.E.', respondentRole: 'QC Retail', respondentOrg: 'Supermarket HalalMart Bandung', noSertifikat: 'RET-2024-055', subCodes: ['CP9.1','CP9.2','CP9.3','CP9.4','CP9.5','CP9.6','CP9.7'], baseRisk: 2, bgData: { namaOutlet: 'HalalMart Bandung', lokasi: 'Jl. Dago No. 45, Bandung', noSertifikat: 'RET-2024-055', posisi: 'QC Retail', tanggal: '2026-05-14', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
  ];

  for (const d of RISIKO_DATA) {
    const { risks, evidence } = riskAnswers(d.subCodes, 5, d.baseRisk);
    await prisma.questionnaireResponse.create({
      data: {
        questionnaireType: 'risiko',
        cpId: d.cpId,
        respondentName: d.respondentName,
        respondentRole: d.respondentRole,
        respondentOrg: d.respondentOrg,
        respondentEmail: `${d.respondentName.toLowerCase().replace(/[^a-z]/g, '.')}@example.co.id`,
        respondentInfo: { ...d.bgData, noSertifikat: d.noSertifikat },
        answers: { risks, evidence },
        notes: {},
        files: [PDF_FILE],
        status: 'SUBMITTED',
      }
    });
  }
  console.log(`✅ Risiko: ${RISIKO_DATA.length} records seeded.\n`);

  // ══════════════════════════════════════════
  // 3. KUESIONER AKTUAL (K3) — per CP1-CP9
  // ══════════════════════════════════════════
  console.log('📋 Seeding Kuesioner 3 — Kondisi Aktual...');

  const AKTUAL_DATA = [
    { cpId: 'CP1', name: 'Pak Eko Prasetyo', role: 'Supervisor', org: 'Peternakan Berkah Mandiri', subCodes: ['CP1.1','CP1.2','CP1.3','CP1.4','CP1.5'], baseRisk: 2, bgData: { namaFarm: 'Peternakan Berkah Mandiri', lokasi: 'Lembang, Jawa Barat', namaStaff: 'Pak Eko Prasetyo', jabatan: 'Supervisor', tanggal: '2026-05-14', shift: 'Pagi', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP2', name: 'drh. Maya Indrawati', role: 'Veteriner', org: 'Peternakan Berkah Mandiri', subCodes: ['CP2.1','CP2.2','CP2.3','CP2.4','CP2.5'], baseRisk: 2, bgData: { namaFarm: 'Peternakan Berkah Mandiri', lokasi: 'Lembang, Jawa Barat', namaPIC: 'drh. Maya Indrawati', jabatan: 'Veteriner', tanggal: '2026-05-14', shift: 'Pagi', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP3', name: 'Bpk. Sugiono', role: 'Supervisor', org: 'PT. Ternak Angkut Sejahtera', subCodes: ['CP3.1','CP3.2','CP3.3','CP3.4','CP3.5'], baseRisk: 3, bgData: { namaPerusahaan: 'PT. Ternak Angkut Sejahtera', nomorKendaraan: 'B 1234 XYZ', namaPIC: 'Bpk. Sugiono', jabatan: 'Supervisor', tanggal: '2026-05-14', waktuBerangkat: '06:00', lokasiAsal: 'Lembang, Jawa Barat', lokasiTujuan: 'RPH Al-Anam, Bogor', batch: 'TAG-A003 (Peternakan Berkah Mandiri)', jumlahHewan: '12' } },
    { cpId: 'CP4', name: 'H. Zainal Arifin', role: 'Juru Sembelih Halal', org: 'RPH Syariah Al-Anam', subCodes: ['CP4.1','CP4.2','CP4.3','CP4.4','CP4.5','CP4.6','CP4.7','CP4.8','CP4.9'], baseRisk: 1, bgData: { namaRPH: 'RPH Syariah Al-Anam', nomorSertifikat: 'RPH-HALAL-2023-001', masaBerlaku: '2025-12-31', alamat: 'Jl. RPH Cibinong, Bogor', namaPIC: 'H. Zainal Arifin', jabatan: 'Juru Sembelih Halal', idKaryawan: 'EMP-RPH-001', tanggal: '2026-05-14', shift: 'Pagi', waktuMulai: '05:30', batch: 'TAG-A003 (Peternakan Berkah Mandiri)', jumlahHewan: '12', asalHewan: 'Peternakan Berkah Mandiri, Lembang', kendaraan: 'B 1234 XYZ', supplier: 'Peternakan Berkah Mandiri' } },
    { cpId: 'CP5', name: 'Ir. Dewi Kusumawati', role: 'QC Supervisor', org: 'RPH Syariah Al-Anam', subCodes: ['CP5.1','CP5.2','CP5.3','CP5.4'], baseRisk: 2, bgData: { namaRPH: 'RPH Syariah Al-Anam', nomorSertifikat: 'RPH-HALAL-2023-001', masaBerlaku: '2025-12-31', alamat: 'Jl. RPH Cibinong, Bogor', namaPIC: 'Ir. Dewi Kusumawati', jabatan: 'QC Supervisor', idKaryawan: 'EMP-RPH-002', tanggal: '2026-05-14', shift: 'Pagi', waktuMulai: '07:30', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP6', name: 'Bpk. Rudi Hartono', role: 'Supervisor Produksi', org: 'PT. Olahan Halal Nusantara', subCodes: ['CP6.1','CP6.2','CP6.3','CP6.4'], baseRisk: 2, bgData: { namaPerusahaan: 'PT. Olahan Halal Nusantara', lokasi: 'Cikarang, Bekasi', namaPIC: 'Bpk. Rudi Hartono', jabatan: 'Supervisor Produksi', idKaryawan: 'EMP-PROC-001', tanggal: '2026-05-14', shift: 'Siang', waktuMulai: '08:00', batch: 'TAG-A003 (Peternakan Berkah Mandiri)', namaProduk: 'Daging Sapi Halal Segar', jenisProduk: 'Fresh Meat', jumlahProduk: '500' } },
    { cpId: 'CP7', name: 'Ibu Rina Marlina', role: 'Warehouse Supervisor', org: 'PT. Cold Chain Halal Indonesia', subCodes: ['CP7.1','CP7.2','CP7.3','CP7.4','CP7.5','CP7.6','CP7.7'], baseRisk: 2, bgData: { namaGudang: 'Cold Storage Halal Unit 1', lokasi: 'Cilincing, Jakarta Utara', namaPIC: 'Ibu Rina Marlina', jabatan: 'Warehouse Supervisor', idKaryawan: 'EMP-WH-001', tanggal: '2026-05-14', shift: 'Pagi', suhuAwal: '-2', suhuAkhir: '-4', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP8', name: 'Bpk. Faisal Rahman', role: 'Logistics Manager', org: 'PT. Distribusi Halal Sejahtera', subCodes: ['CP8.1','CP8.2','CP8.3','CP8.4','CP8.5','CP8.6','CP8.7'], baseRisk: 3, bgData: { namaPerusahaan: 'PT. Distribusi Halal Sejahtera', lokasi: 'Jakarta Timur', namaPIC: 'Bpk. Faisal Rahman', jabatan: 'Logistics Manager', idKaryawan: 'EMP-LOG-001', tanggal: '2026-05-14', shift: 'Pagi', nomorKendaraan: 'B 5678 ABC', tujuanDistribusi: 'HalalMart Bandung, Jabodetabek', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
    { cpId: 'CP9', name: 'Ibu Sri Wahyuni', role: 'QC Retail', org: 'HalalMart Bandung', subCodes: ['CP9.1','CP9.2','CP9.3','CP9.4','CP9.5','CP9.6','CP9.7'], baseRisk: 2, bgData: { namaOutlet: 'HalalMart Bandung — Dago', lokasi: 'Jl. Dago No. 45, Bandung', namaPIC: 'Ibu Sri Wahyuni', jabatan: 'QC Retail', idKaryawan: 'EMP-RET-001', tanggal: '2026-05-14', shift: 'Pagi', batch: 'TAG-A003 (Peternakan Berkah Mandiri)' } },
  ];

  for (const d of AKTUAL_DATA) {
    const indCount = d.subCodes.length >= 7 ? 5 : 5;
    const { risks, evidence } = riskAnswers(d.subCodes, indCount, d.baseRisk);
    const riskValues = Object.values(risks) as number[];
    const avg = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;
    const labels = ['', 'Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];
    const tingkat = labels[Math.round(avg)] || 'Rendah';

    await prisma.questionnaireResponse.create({
      data: {
        questionnaireType: 'aktual',
        cpId: d.cpId,
        respondentName: d.name,
        respondentRole: d.role,
        respondentOrg: d.org,
        respondentEmail: `${d.name.toLowerCase().replace(/[^a-z]/g, '.')}@example.co.id`,
        respondentInfo: d.bgData,
        answers: { risks, evidence },
        notes: supervisorNotes(tingkat, avg.toFixed(2)),
        files: [PDF_FILE],
        status: 'SUBMITTED',
      }
    });
  }
  console.log(`✅ Aktual: ${AKTUAL_DATA.length} records seeded.\n`);

  console.log('🎉 SEEDING SELESAI!');
  console.log(`   Pembobotan : ${EXPERT_RESPONDENTS.length * 5} records`);
  console.log(`   Risiko     : ${RISIKO_DATA.length} records`);
  console.log(`   Aktual     : ${AKTUAL_DATA.length} records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
