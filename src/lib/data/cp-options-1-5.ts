import type { CPDropdownGroup } from "./dropdown-scale";

// Helper untuk buat opsi cepat
const o = (value: string, label: string, l: number, m: number, u: number) => ({
  value, label, tfn: [l, m, u] as [number, number, number],
  risk: Number(((l + m + u) / 3).toFixed(2)),
});

export const CP1_OPTIONS: CPDropdownGroup = {
  cpId: "CP1", cpLabel: "CP1 — Farm / Kandang Sapi",
  criteria: [
    { key: "asalUsulRisk", criteriaCode: "CP1.1", label: "Asal-usul sapi & Traceability",
      options: [
        o("cp1_1_1", "Seluruh asal ternak dapat ditelusuri digital/manual lengkap, supplier terverifikasi halal", 0, 0.05, 0.15),
        o("cp1_1_2", "Dokumen lengkap namun update histori belum real-time", 0.10, 0.25, 0.35),
        o("cp1_1_3", "Sebagian histori perpindahan ternak tidak terdokumentasi", 0.30, 0.45, 0.55),
        o("cp1_1_4", "Traceability lemah dan supplier belum tervalidasi", 0.50, 0.65, 0.80),
        o("cp1_1_5", "Asal ternak tidak jelas atau tidak dapat ditelusuri", 0.75, 0.90, 1.00),
      ]},
    { key: "kesehatanRisk", criteriaCode: "CP1.2", label: "Status kesehatan sapi",
      options: [
        o("cp1_2_1", "Pemeriksaan veteriner rutin, bebas zoonosis, vaksinasi lengkap", 0, 0.05, 0.15),
        o("cp1_2_2", "Pemeriksaan berjalan namun terdapat keterlambatan dokumentasi", 0.10, 0.25, 0.35),
        o("cp1_2_3", "Sebagian rekam kesehatan tidak lengkap", 0.30, 0.45, 0.55),
        o("cp1_2_4", "Monitoring kesehatan tidak konsisten", 0.50, 0.65, 0.80),
        o("cp1_2_5", "Tidak ada pengawasan kesehatan ternak", 0.75, 0.90, 1.00),
      ]},
    { key: "kepatuhanPakanRisk", criteriaCode: "CP1.3", label: "Kepatuhan pakan",
      options: [
        o("cp1_3_1", "Seluruh bahan pakan bersertifikat halal dan terdokumentasi", 0, 0.05, 0.15),
        o("cp1_3_2", "Ada bahan belum tersertifikasi namun memiliki declaration", 0.10, 0.25, 0.35),
        o("cp1_3_3", "Formula pakan tidak lengkap", 0.30, 0.45, 0.55),
        o("cp1_3_4", "Supplier pakan tidak tervalidasi", 0.50, 0.65, 0.80),
        o("cp1_3_5", "Menggunakan bahan haram/syubhat", 0.75, 0.90, 1.00),
      ]},
    { key: "dokumentasiRisk", criteriaCode: "CP1.4", label: "Dokumentasi pemeliharaan",
      options: [
        o("cp1_4_1", "SOP, cleaning log, audit internal lengkap dan berjalan", 0, 0.05, 0.15),
        o("cp1_4_2", "Dokumen tersedia namun belum konsisten update", 0.10, 0.25, 0.35),
        o("cp1_4_3", "Sebagian checklist maintenance hilang", 0.30, 0.45, 0.55),
        o("cp1_4_4", "Audit halal tidak rutin", 0.50, 0.65, 0.80),
        o("cp1_4_5", "Tidak ada dokumentasi pemeliharaan", 0.75, 0.90, 1.00),
      ]},
    { key: "kebersihanKandangRisk", criteriaCode: "CP1.5", label: "Kebersihan kandang & Sanitasi",
      options: [
        o("cp1_5_1", "Sanitasi kandang optimal dan terdokumentasi", 0, 0.05, 0.15),
        o("cp1_5_2", "Sanitasi berjalan dengan minor issue", 0.10, 0.25, 0.35),
        o("cp1_5_3", "Cleaning tidak konsisten", 0.30, 0.45, 0.55),
        o("cp1_5_4", "Area kandang kotor dan berpotensi kontaminasi", 0.50, 0.65, 0.80),
        o("cp1_5_5", "Kondisi kandang tidak higienis dan melanggar SOP halal", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP2_OPTIONS: CPDropdownGroup = {
  cpId: "CP2", cpLabel: "CP2 — Pakan & Kesehatan Hewan",
  criteria: [
    { key: "halalFeedStatusRisk", criteriaCode: "CP2.1", label: "Halal status bahan pakan",
      options: [
        o("cp2_1_1", "Seluruh bahan pakan memiliki sertifikat halal valid, additive tervalidasi halal, formula terdokumentasi lengkap", 0, 0.05, 0.15),
        o("cp2_1_2", "Sebagian bahan menggunakan supplier declaration, namun masih dapat diverifikasi", 0.10, 0.25, 0.35),
        o("cp2_1_3", "Sebagian formula atau additive belum memiliki validasi halal lengkap", 0.30, 0.45, 0.55),
        o("cp2_1_4", "Banyak bahan belum tervalidasi, supplier tidak konsisten, dan dokumentasi lemah", 0.50, 0.65, 0.80),
        o("cp2_1_5", "Menggunakan bahan hewani non-halal/syubhat atau additive tanpa status halal", 0.75, 0.90, 1.00),
      ]},
    { key: "medicationRisk", criteriaCode: "CP2.2", label: "Kontrol obat/vaksin hewan",
      options: [
        o("cp2_2_1", "Seluruh obat/vaksin legal, terdokumentasi, halal compliant, withdrawal period dipatuhi", 0, 0.05, 0.15),
        o("cp2_2_2", "Minor issue administratif pada pencatatan atau update dokumen", 0.10, 0.25, 0.35),
        o("cp2_2_3", "Sebagian penggunaan antibiotik atau vaksin tidak terdokumentasi lengkap", 0.30, 0.45, 0.55),
        o("cp2_2_4", "Penggunaan obat tidak terkontrol dan monitoring withdrawal lemah", 0.50, 0.65, 0.80),
        o("cp2_2_5", "Menggunakan obat/vaksin ilegal atau mengandung unsur non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "vetSupervisionRisk", criteriaCode: "CP2.3", label: "Pengawasan veteriner",
      options: [
        o("cp2_3_1", "Pemeriksaan veteriner rutin berjalan, SOP biosecurity diterapkan, audit kesehatan aktif", 0, 0.05, 0.15),
        o("cp2_3_2", "Pemeriksaan berjalan namun dokumentasi belum sepenuhnya digital", 0.10, 0.25, 0.35),
        o("cp2_3_3", "Audit kesehatan atau monitoring tidak konsisten", 0.30, 0.45, 0.55),
        o("cp2_3_4", "Pengawasan veteriner minim dan SOP biosecurity tidak optimal", 0.50, 0.65, 0.80),
        o("cp2_3_5", "Tidak ada pengawasan veteriner dan tidak ada SOP biosecurity", 0.75, 0.90, 1.00),
      ]},
    { key: "supplierRisk", criteriaCode: "CP2.4", label: "Supplier reliability pakan",
      options: [
        o("cp2_4_1", "Supplier legal, tersertifikasi halal, audit berkala, SLA aktif dan terdokumentasi", 0, 0.05, 0.15),
        o("cp2_4_2", "Minor issue administratif supplier namun masih compliant", 0.10, 0.25, 0.35),
        o("cp2_4_3", "Sebagian supplier belum diaudit rutin", 0.30, 0.45, 0.55),
        o("cp2_4_4", "Supplier tidak tervalidasi dengan baik dan banyak dokumen expired", 0.50, 0.65, 0.80),
        o("cp2_4_5", "Supplier tidak memiliki legalitas atau status halal tidak jelas", 0.75, 0.90, 1.00),
      ]},
    { key: "feedStorageRisk", criteriaCode: "CP2.5", label: "Penyimpanan pakan (segregasi)",
      options: [
        o("cp2_5_1", "Pakan halal disimpan terpisah, FIFO/FEFO berjalan, gudang higienis dan termonitor", 0, 0.05, 0.15),
        o("cp2_5_2", "Minor issue labeling atau monitoring suhu", 0.10, 0.25, 0.35),
        o("cp2_5_3", "Segregasi belum optimal dan monitoring gudang tidak konsisten", 0.30, 0.45, 0.55),
        o("cp2_5_4", "Risiko pencampuran tinggi dan sanitasi gudang lemah", 0.50, 0.65, 0.80),
        o("cp2_5_5", "Pakan halal bercampur dengan bahan non-halal atau gudang tidak higienis", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP3_OPTIONS: CPDropdownGroup = {
  cpId: "CP3", cpLabel: "CP3 — Transportasi Hewan ke RPH",
  criteria: [
    { key: "kelayakanRisk", criteriaCode: "CP3.1", label: "Kelayakan transportasi hewan",
      options: [
        o("cp3_1_1", "Kendaraan memenuhi welfare standard dan terdokumentasi", 0, 0.05, 0.15),
        o("cp3_1_2", "Minor issue pada ventilasi atau kapasitas", 0.10, 0.25, 0.35),
        o("cp3_1_3", "Monitoring transport tidak konsisten", 0.30, 0.45, 0.55),
        o("cp3_1_4", "Overcrowding atau handling kasar", 0.50, 0.65, 0.80),
        o("cp3_1_5", "Hewan mengalami stress berat/cedera signifikan", 0.75, 0.90, 1.00),
      ]},
    { key: "kebersihanRisk", criteriaCode: "CP3.2", label: "Kebersihan kendaraan",
      options: [
        o("cp3_2_1", "Sanitasi kendaraan sesuai SOP halal logistics", 0, 0.05, 0.15),
        o("cp3_2_2", "Cleaning dilakukan namun logbook kurang lengkap", 0.10, 0.25, 0.35),
        o("cp3_2_3", "Sanitasi tidak konsisten", 0.30, 0.45, 0.55),
        o("cp3_2_4", "Potensi kontaminasi tinggi", 0.50, 0.65, 0.80),
        o("cp3_2_5", "Kendaraan terkontaminasi bahan non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "traceabilityRisk", criteriaCode: "CP3.3", label: "Ketertelusuran selama transportasi",
      options: [
        o("cp3_3_1", "GPS, RFID, dan shipment tracking berjalan", 0, 0.05, 0.15),
        o("cp3_3_2", "Data tersedia namun belum real-time", 0.10, 0.25, 0.35),
        o("cp3_3_3", "Sebagian histori hilang", 0.30, 0.45, 0.55),
        o("cp3_3_4", "Sistem traceability manual dan lemah", 0.50, 0.65, 0.80),
        o("cp3_3_5", "Perjalanan tidak dapat ditelusuri", 0.75, 0.90, 1.00),
      ]},
    { key: "dokumentasiRisk", criteriaCode: "CP3.4", label: "Dokumentasi perjalanan",
      options: [
        o("cp3_4_1", "Seluruh surat jalan, sertifikat kesehatan, jadwal perjalanan, dan incident report lengkap", 0, 0.05, 0.15),
        o("cp3_4_2", "Minor issue administratif pada dokumen", 0.10, 0.25, 0.35),
        o("cp3_4_3", "Sebagian dokumen perjalanan belum lengkap", 0.30, 0.45, 0.55),
        o("cp3_4_4", "Banyak dokumen tidak tervalidasi atau tidak update", 0.50, 0.65, 0.80),
        o("cp3_4_5", "Tidak tersedia dokumen perjalanan atau perjalanan ilegal", 0.75, 0.90, 1.00),
      ]},
    { key: "handlerRisk", criteriaCode: "CP3.5", label: "Kompetensi petugas handler",
      options: [
        o("cp3_5_1", "Seluruh handler memahami SOP halal handling, animal welfare, dan emergency procedure", 0, 0.05, 0.15),
        o("cp3_5_2", "Minor issue training refreshment", 0.10, 0.25, 0.35),
        o("cp3_5_3", "Evaluasi kompetensi tidak konsisten", 0.30, 0.45, 0.55),
        o("cp3_5_4", "Petugas kurang memahami SOP halal logistics", 0.50, 0.65, 0.80),
        o("cp3_5_5", "Tidak ada pelatihan halal handling dan terjadi kesalahan penanganan serius", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP4_OPTIONS: CPDropdownGroup = {
  cpId: "CP4", cpLabel: "CP4 — Rumah Potong Hewan (RPH)",
  criteria: [
    { key: "sertifikatHalalRisk", criteriaCode: "CP4.1", label: "Validitas Sertifikat Halal RPH",
      options: [
        o("cp4_1_1", "Sertifikat halal aktif dan sesuai scope", 0, 0.05, 0.15),
        o("cp4_1_2", "Dokumen lengkap namun mendekati expired", 0.10, 0.25, 0.35),
        o("cp4_1_3", "Audit surveillance terlambat", 0.30, 0.45, 0.55),
        o("cp4_1_4", "Scope sertifikasi tidak sesuai aktivitas", 0.50, 0.65, 0.80),
        o("cp4_1_5", "Tidak memiliki sertifikat halal aktif", 0.75, 0.90, 1.00),
      ]},
    { key: "kompetensiSembelihRisk", criteriaCode: "CP4.2", label: "Kompetensi Juru Sembelih Halal",
      options: [
        o("cp4_2_1", "Seluruh JULEHA tersertifikasi dan kompeten", 0, 0.05, 0.15),
        o("cp4_2_2", "Sebagian training perlu refresh", 0.10, 0.25, 0.35),
        o("cp4_2_3", "Evaluasi kompetensi tidak rutin", 0.30, 0.45, 0.55),
        o("cp4_2_4", "Kompetensi syariah lemah", 0.50, 0.65, 0.80),
        o("cp4_2_5", "Penyembelih tidak tersertifikasi", 0.75, 0.90, 1.00),
      ]},
    { key: "prosesSyariahRisk", criteriaCode: "CP4.3", label: "Kesesuaian Proses Sembelih Syariah",
      options: [
        o("cp4_3_1", "Seluruh proses sesuai syariah dan SJPH", 0, 0.05, 0.15),
        o("cp4_3_2", "Minor deviation administratif", 0.10, 0.25, 0.35),
        o("cp4_3_3", "Stunning belum terdokumentasi optimal", 0.30, 0.45, 0.55),
        o("cp4_3_4", "Prosedur syariah tidak konsisten", 0.50, 0.65, 0.80),
        o("cp4_3_5", "Penyembelihan tidak sesuai syariat Islam", 0.75, 0.90, 1.00),
      ]},
    { key: "pemeriksaanRisk", criteriaCode: "CP4.4", label: "Pemeriksaan Ante/Post-Mortem",
      options: [
        o("cp4_4_1", "Pemeriksaan lengkap dan terdokumentasi", 0, 0.05, 0.15),
        o("cp4_4_2", "Minor delay dokumentasi", 0.10, 0.25, 0.35),
        o("cp4_4_3", "Sebagian inspeksi tidak lengkap", 0.30, 0.45, 0.55),
        o("cp4_4_4", "Pengawasan veteriner lemah", 0.50, 0.65, 0.80),
        o("cp4_4_5", "Tidak dilakukan inspeksi kesehatan", 0.75, 0.90, 1.00),
      ]},
    { key: "sanitasiRisk", criteriaCode: "CP4.5", label: "Sanitasi Alat & Area",
      options: [
        o("cp4_5_1", "Seluruh area produksi, alat sembelih, conveyor, lantai, drainase, dan fasilitas dibersihkan sesuai SOP", 0, 0.05, 0.15),
        o("cp4_5_2", "Sanitasi berjalan baik dengan minor issue administratif pada checklist", 0.10, 0.25, 0.35),
        o("cp4_5_3", "Sanitasi tidak konsisten pada beberapa area atau cleaning validation belum lengkap", 0.30, 0.45, 0.55),
        o("cp4_5_4", "Area berpotensi kontaminasi biologis/najis dan monitoring sanitasi lemah", 0.50, 0.65, 0.80),
        o("cp4_5_5", "Area tidak higienis, alat tercemar najis/non-halal, tidak ada sanitasi sesuai SOP", 0.75, 0.90, 1.00),
      ]},
    { key: "segregasiRisk", criteriaCode: "CP4.6", label: "Pemisahan Halal & Non-Halal",
      options: [
        o("cp4_6_1", "Jalur produksi, area penyimpanan, alat, dan distribusi halal sepenuhnya terpisah dari non-halal", 0, 0.05, 0.15),
        o("cp4_6_2", "Segregasi berjalan dengan minor issue pada labeling atau visual identification", 0.10, 0.25, 0.35),
        o("cp4_6_3", "Area segregasi tersedia namun belum optimal atau belum terdokumentasi lengkap", 0.30, 0.45, 0.55),
        o("cp4_6_4", "Risiko pencampuran halal/non-halal tinggi akibat shared equipment atau layout", 0.50, 0.65, 0.80),
        o("cp4_6_5", "Terjadi cross contamination atau pencampuran langsung produk halal dan non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "batchTraceabilityRisk", criteriaCode: "CP4.7", label: "Dokumentasi & Batch Traceability",
      options: [
        o("cp4_7_1", "Seluruh batch karkas dapat ditelusuri dari asal ternak hingga distribusi secara real-time", 0, 0.05, 0.15),
        o("cp4_7_2", "Sistem traceability berjalan baik namun terdapat minor issue administratif", 0.10, 0.25, 0.35),
        o("cp4_7_3", "Sebagian batch belum terintegrasi penuh dengan sistem traceability", 0.30, 0.45, 0.55),
        o("cp4_7_4", "Dokumentasi tidak konsisten dan sistem traceability lemah/manual", 0.50, 0.65, 0.80),
        o("cp4_7_5", "Produk tidak dapat ditelusuri dan dokumentasi produksi tidak tersedia", 0.75, 0.90, 1.00),
      ]},
    { key: "auditRisk", criteriaCode: "CP4.8", label: "Audit & Corrective Action Internal",
      options: [
        o("cp4_8_1", "Audit internal halal dilakukan rutin, seluruh temuan ditindaklanjuti dan diverifikasi", 0, 0.05, 0.15),
        o("cp4_8_2", "Audit berjalan baik dengan minor delay corrective action", 0.10, 0.25, 0.35),
        o("cp4_8_3", "Audit tidak konsisten atau sebagian CAPA belum terdokumentasi", 0.30, 0.45, 0.55),
        o("cp4_8_4", "Banyak temuan audit berulang dan tindakan korektif tidak efektif", 0.50, 0.65, 0.80),
        o("cp4_8_5", "Tidak ada audit internal atau tidak ada sistem corrective action", 0.75, 0.90, 1.00),
      ]},
    { key: "pengawasanRisk", criteriaCode: "CP4.9", label: "Pengawasan Halal Internal",
      options: [
        o("cp4_9_1", "Penyelia halal aktif melakukan monitoring, verifikasi, pelaporan, dan evaluasi rutin", 0, 0.05, 0.15),
        o("cp4_9_2", "Pengawasan berjalan baik dengan minor issue dokumentasi monitoring", 0.10, 0.25, 0.35),
        o("cp4_9_3", "Monitoring halal belum konsisten di seluruh area", 0.30, 0.45, 0.55),
        o("cp4_9_4", "Penyelia halal tidak aktif atau pelaporan halal lemah", 0.50, 0.65, 0.80),
        o("cp4_9_5", "Tidak ada sistem pengawasan halal internal", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP5_OPTIONS: CPDropdownGroup = {
  cpId: "CP5", cpLabel: "CP5 — Post-Slaughter Handling",
  criteria: [
    { key: "handlingRisk", criteriaCode: "CP5.1", label: "Handling Karkas & Sanitasi",
      options: [
        o("cp5_1_1", "Karkas ditangani higienis sesuai SOP halal", 0, 0.05, 0.15),
        o("cp5_1_2", "Minor issue APD atau sanitasi", 0.10, 0.25, 0.35),
        o("cp5_1_3", "Cleaning tidak konsisten", 0.30, 0.45, 0.55),
        o("cp5_1_4", "Karkas berpotensi kontaminasi", 0.50, 0.65, 0.80),
        o("cp5_1_5", "Karkas terkontaminasi najis", 0.75, 0.90, 1.00),
      ]},
    { key: "batchIdRisk", criteriaCode: "CP5.2", label: "Batch Identification Karkas",
      options: [
        o("cp5_2_1", "Batch tracking lengkap dan realtime terdokumentasi", 0, 0.05, 0.15),
        o("cp5_2_2", "Labeling minor issue", 0.10, 0.25, 0.35),
        o("cp5_2_3", "Sebagian batch tidak teridentifikasi", 0.30, 0.45, 0.55),
        o("cp5_2_4", "Traceability lemah", 0.50, 0.65, 0.80),
        o("cp5_2_5", "Batch tidak dapat ditelusuri", 0.75, 0.90, 1.00),
      ]},
    { key: "segregasiRisk", criteriaCode: "CP5.3", label: "Segregasi Karkas Halal/Non-Halal",
      options: [
        o("cp5_3_1", "Karkas halal dan non-halal sepenuhnya terpisah pada seluruh proses", 0, 0.05, 0.15),
        o("cp5_3_2", "Segregasi berjalan dengan minor issue labeling", 0.10, 0.25, 0.35),
        o("cp5_3_3", "Area segregasi belum optimal", 0.30, 0.45, 0.55),
        o("cp5_3_4", "Risiko pencampuran tinggi", 0.50, 0.65, 0.80),
        o("cp5_3_5", "Terjadi cross contamination halal/non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "dokumentasiRisk", criteriaCode: "CP5.4", label: "Dokumentasi Proses Post-Slaughter",
      options: [
        o("cp5_4_1", "Seluruh aktivitas post-slaughter terdokumentasi lengkap dan realtime", 0, 0.05, 0.15),
        o("cp5_4_2", "Minor issue pencatatan administratif", 0.10, 0.25, 0.35),
        o("cp5_4_3", "Sebagian logbook atau checklist tidak lengkap", 0.30, 0.45, 0.55),
        o("cp5_4_4", "Dokumentasi tidak konsisten dan sulit diverifikasi", 0.50, 0.65, 0.80),
        o("cp5_4_5", "Tidak tersedia dokumentasi proses", 0.75, 0.90, 1.00),
      ]},
  ],
};
