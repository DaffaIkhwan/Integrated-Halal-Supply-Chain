import type { CPDropdownGroup } from "./dropdown-scale";

const o = (value: string, label: string, l: number, m: number, u: number) => ({
  value, label, tfn: [l, m, u] as [number, number, number],
  risk: Number(((l + m + u) / 3).toFixed(2)),
});

export const CP6_OPTIONS: CPDropdownGroup = {
  cpId: "CP6", cpLabel: "CP6 — Pengolahan Daging / Processing",
  criteria: [
    { key: "handlingKarkasRisk", criteriaCode: "CP6.1", label: "Handling Karkas & Sanitasi",
      options: [
        o("cp6_1_1", "Karkas ditangani higienis sesuai SOP halal, APD lengkap, area bersih dan tervalidasi", 0, 0.05, 0.15),
        o("cp6_1_2", "Minor issue APD atau sanitasi peralatan", 0.10, 0.25, 0.35),
        o("cp6_1_3", "Cleaning tidak konsisten atau sebagian APD tidak tersedia", 0.30, 0.45, 0.55),
        o("cp6_1_4", "Karkas berpotensi kontaminasi dan hygiene lemah", 0.50, 0.65, 0.80),
        o("cp6_1_5", "Karkas terkontaminasi najis/non-halal atau area tidak higienis", 0.75, 0.90, 1.00),
      ]},
    { key: "batchIdRisk", criteriaCode: "CP6.2", label: "Batch Identification Karkas",
      options: [
        o("cp6_2_1", "Setiap karkas memiliki kode batch unik, terhubung asal hewan dan operator secara realtime", 0, 0.05, 0.15),
        o("cp6_2_2", "Labeling berjalan dengan minor issue administratif", 0.10, 0.25, 0.35),
        o("cp6_2_3", "Sebagian batch tidak teridentifikasi atau label tidak konsisten", 0.30, 0.45, 0.55),
        o("cp6_2_4", "Traceability batch lemah dan pencatatan tidak konsisten", 0.50, 0.65, 0.80),
        o("cp6_2_5", "Batch tidak dapat ditelusuri atau tidak ada identifikasi karkas", 0.75, 0.90, 1.00),
      ]},
    { key: "segregasiRisk", criteriaCode: "CP6.3", label: "Segregasi Karkas Halal/Non-Halal",
      options: [
        o("cp6_3_1", "Karkas halal dan non-halal sepenuhnya terpisah pada seluruh proses pengolahan", 0, 0.05, 0.15),
        o("cp6_3_2", "Segregasi berjalan dengan minor issue labeling atau identifikasi", 0.10, 0.25, 0.35),
        o("cp6_3_3", "Area segregasi belum optimal atau dokumentasi belum lengkap", 0.30, 0.45, 0.55),
        o("cp6_3_4", "Risiko pencampuran halal/non-halal tinggi pada jalur pengolahan", 0.50, 0.65, 0.80),
        o("cp6_3_5", "Terjadi cross contamination atau pencampuran karkas halal/non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "dokumentasiRisk", criteriaCode: "CP6.4", label: "Dokumentasi Proses Post-Slaughter",
      options: [
        o("cp6_4_1", "Seluruh aktivitas post-slaughter terdokumentasi lengkap dan terhubung batch distribusi", 0, 0.05, 0.15),
        o("cp6_4_2", "Minor issue pencatatan administratif atau cleaning log", 0.10, 0.25, 0.35),
        o("cp6_4_3", "Sebagian logbook atau checklist tidak lengkap", 0.30, 0.45, 0.55),
        o("cp6_4_4", "Dokumentasi tidak konsisten dan sulit diverifikasi", 0.50, 0.65, 0.80),
        o("cp6_4_5", "Tidak tersedia dokumentasi proses pengolahan", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP7_OPTIONS: CPDropdownGroup = {
  cpId: "CP7", cpLabel: "CP7 — Cold Storage / Warehouse",
  criteria: [
    { key: "temperatureRisk", criteriaCode: "CP7.1", label: "Kepatuhan Suhu",
      options: [
        o("cp7_1_1", "Monitoring suhu real-time dan stabil", 0, 0.05, 0.15),
        o("cp7_1_2", "Ada deviasi minor suhu", 0.10, 0.25, 0.35),
        o("cp7_1_3", "Alarm suhu tidak konsisten", 0.30, 0.45, 0.55),
        o("cp7_1_4", "Fluktuasi suhu tinggi", 0.50, 0.65, 0.80),
        o("cp7_1_5", "Suhu gagal dikontrol", 0.75, 0.90, 1.00),
      ]},
    { key: "segregasiRisk", criteriaCode: "CP7.2", label: "Halal Segregated Storage",
      options: [
        o("cp7_2_1", "Penyimpanan halal terpisah sempurna", 0, 0.05, 0.15),
        o("cp7_2_2", "Minor issue labeling", 0.10, 0.25, 0.35),
        o("cp7_2_3", "Area segregasi kurang jelas", 0.30, 0.45, 0.55),
        o("cp7_2_4", "Risiko pencampuran tinggi", 0.50, 0.65, 0.80),
        o("cp7_2_5", "Produk halal bercampur non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "hygieneRisk", criteriaCode: "CP7.3", label: "Kebersihan Gudang / Cold Room",
      options: [
        o("cp7_3_1", "Gudang sangat higienis", 0, 0.05, 0.15),
        o("cp7_3_2", "Minor issue sanitasi", 0.10, 0.25, 0.35),
        o("cp7_3_3", "Cleaning tidak konsisten", 0.30, 0.45, 0.55),
        o("cp7_3_4", "Area berpotensi kontaminasi", 0.50, 0.65, 0.80),
        o("cp7_3_5", "Gudang tidak higienis dan tercemar", 0.75, 0.90, 1.00),
      ]},
    { key: "traceabilityRisk", criteriaCode: "CP7.4", label: "Batch Traceability",
      options: [
        o("cp7_4_1", "Traceability realtime dan FIFO berjalan", 0, 0.05, 0.15),
        o("cp7_4_2", "Minor issue administrasi", 0.10, 0.25, 0.35),
        o("cp7_4_3", "Sebagian batch tidak lengkap", 0.30, 0.45, 0.55),
        o("cp7_4_4", "Sistem traceability lemah", 0.50, 0.65, 0.80),
        o("cp7_4_5", "Produk tidak dapat ditelusuri", 0.75, 0.90, 1.00),
      ]},
    { key: "incidentRisk", criteriaCode: "CP7.5", label: "Penanganan Insiden",
      options: [
        o("cp7_5_1", "Sistem incident handling berjalan efektif", 0, 0.05, 0.15),
        o("cp7_5_2", "Ada delay minor penanganan", 0.10, 0.25, 0.35),
        o("cp7_5_3", "Respons insiden tidak konsisten", 0.30, 0.45, 0.55),
        o("cp7_5_4", "Banyak insiden tidak tertangani", 0.50, 0.65, 0.80),
        o("cp7_5_5", "Tidak ada sistem incident handling", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP8_OPTIONS: CPDropdownGroup = {
  cpId: "CP8", cpLabel: "CP8 — Distribusi / Logistik",
  criteria: [
    { key: "dedicatedTransRisk", criteriaCode: "CP8.1", label: "Transportasi Halal Khusus",
      options: [
        o("cp8_1_1", "Kendaraan khusus halal tervalidasi", 0, 0.05, 0.15),
        o("cp8_1_2", "Shared transport dengan cleansing tervalidasi", 0.10, 0.25, 0.35),
        o("cp8_1_3", "Cleaning tidak konsisten", 0.30, 0.45, 0.55),
        o("cp8_1_4", "Riwayat non-halal tidak jelas", 0.50, 0.65, 0.80),
        o("cp8_1_5", "Transport digunakan campuran halal/non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "vehicleSanitasiRisk", criteriaCode: "CP8.2", label: "Sanitasi Kendaraan",
      options: [
        o("cp8_2_1", "Sanitasi kendaraan optimal", 0, 0.05, 0.15),
        o("cp8_2_2", "Minor issue sanitasi", 0.10, 0.25, 0.35),
        o("cp8_2_3", "Sanitasi tidak konsisten", 0.30, 0.45, 0.55),
        o("cp8_2_4", "Risiko kontaminasi tinggi", 0.50, 0.65, 0.80),
        o("cp8_2_5", "Kendaraan terkontaminasi najis/non-halal", 0.75, 0.90, 1.00),
      ]},
    { key: "temperatureRisk", criteriaCode: "CP8.3", label: "Distribusi dengan Kontrol Suhu",
      options: [
        o("cp8_3_1", "Suhu distribusi stabil dan termonitor", 0, 0.05, 0.15),
        o("cp8_3_2", "Deviasi minor", 0.10, 0.25, 0.35),
        o("cp8_3_3", "Monitoring manual", 0.30, 0.45, 0.55),
        o("cp8_3_4", "Banyak fluktuasi suhu", 0.50, 0.65, 0.80),
        o("cp8_3_5", "Tidak ada kontrol suhu", 0.75, 0.90, 1.00),
      ]},
    { key: "routeRisk", criteriaCode: "CP8.4", label: "Ketelusuran Rute & Pengiriman",
      options: [
        o("cp8_4_1", "Traceability realtime berjalan", 0, 0.05, 0.15),
        o("cp8_4_2", "Minor issue administratif", 0.10, 0.25, 0.35),
        o("cp8_4_3", "Data distribusi tidak lengkap", 0.30, 0.45, 0.55),
        o("cp8_4_4", "Sistem traceability lemah", 0.50, 0.65, 0.80),
        o("cp8_4_5", "Shipment tidak dapat ditelusuri", 0.75, 0.90, 1.00),
      ]},
    { key: "loadingRisk", criteriaCode: "CP8.5", label: "Pencegahan Kontaminasi (Pemuatan)",
      options: [
        o("cp8_5_1", "Loading sangat higienis dan terkontrol", 0, 0.05, 0.15),
        o("cp8_5_2", "Minor issue operasional", 0.10, 0.25, 0.35),
        o("cp8_5_3", "Segregasi loading kurang optimal", 0.30, 0.45, 0.55),
        o("cp8_5_4", "Risiko kontaminasi tinggi", 0.50, 0.65, 0.80),
        o("cp8_5_5", "Terjadi cross contamination", 0.75, 0.90, 1.00),
      ]},
    { key: "dokumentasiRisk", criteriaCode: "CP8.6", label: "Kelengkapan Dokumentasi",
      options: [
        o("cp8_6_1", "Dokumentasi lengkap dan realtime", 0, 0.05, 0.15),
        o("cp8_6_2", "Minor issue administrasi", 0.10, 0.25, 0.35),
        o("cp8_6_3", "Sebagian dokumen tidak lengkap", 0.30, 0.45, 0.55),
        o("cp8_6_4", "Dokumentasi sulit diverifikasi", 0.50, 0.65, 0.80),
        o("cp8_6_5", "Tidak tersedia dokumentasi", 0.75, 0.90, 1.00),
      ]},
  ],
};

export const CP9_OPTIONS: CPDropdownGroup = {
  cpId: "CP9", cpLabel: "CP9 — Retail / Pasar / Supermarket",
  criteria: [
    { key: "labelHalalRisk", criteriaCode: "CP9.1", label: "Validitas Label Halal",
      options: [
        o("cp9_1_1", "Seluruh label halal valid dan terverifikasi", 0, 0.05, 0.15),
        o("cp9_1_2", "Minor issue administratif", 0.10, 0.25, 0.35),
        o("cp9_1_3", "Sebagian label kurang jelas", 0.30, 0.45, 0.55),
        o("cp9_1_4", "Label halal tidak tervalidasi", 0.50, 0.65, 0.80),
        o("cp9_1_5", "Produk tanpa label halal resmi", 0.75, 0.90, 1.00),
      ]},
    { key: "displayRisk", criteriaCode: "CP9.2", label: "Pemisahan Tampilan Halal/Non-Halal",
      options: [
        o("cp9_2_1", "Display halal terpisah sempurna", 0, 0.05, 0.15),
        o("cp9_2_2", "Minor issue layout", 0.10, 0.25, 0.35),
        o("cp9_2_3", "Label display kurang jelas", 0.30, 0.45, 0.55),
        o("cp9_2_4", "Risiko pencampuran tinggi", 0.50, 0.65, 0.80),
        o("cp9_2_5", "Produk halal dan non-halal bercampur", 0.75, 0.90, 1.00),
      ]},
    { key: "storageTemRisk", criteriaCode: "CP9.3", label: "Suhu Penyimpanan Retail",
      options: [
        o("cp9_3_1", "Suhu stabil dan termonitor", 0, 0.05, 0.15),
        o("cp9_3_2", "Minor deviation", 0.10, 0.25, 0.35),
        o("cp9_3_3", "Monitoring kurang konsisten", 0.30, 0.45, 0.55),
        o("cp9_3_4", "Fluktuasi suhu tinggi", 0.50, 0.65, 0.80),
        o("cp9_3_5", "Tidak ada kontrol suhu", 0.75, 0.90, 1.00),
      ]},
    { key: "expiryRisk", criteriaCode: "CP9.4", label: "Pengendalian Tanggal Kedaluwarsa",
      options: [
        o("cp9_4_1", "FIFO/FEFO berjalan optimal", 0, 0.05, 0.15),
        o("cp9_4_2", "Minor issue administrasi", 0.10, 0.25, 0.35),
        o("cp9_4_3", "Monitoring expired lemah", 0.30, 0.45, 0.55),
        o("cp9_4_4", "Banyak produk near expired", 0.50, 0.65, 0.80),
        o("cp9_4_5", "Produk expired dijual", 0.75, 0.90, 1.00),
      ]},
    { key: "supplierTraceRisk", criteriaCode: "CP9.5", label: "Ketelusuran Pemasok",
      options: [
        o("cp9_5_1", "Supplier traceability sangat baik", 0, 0.05, 0.15),
        o("cp9_5_2", "Minor issue dokumen", 0.10, 0.25, 0.35),
        o("cp9_5_3", "Traceability sebagian belum lengkap", 0.30, 0.45, 0.55),
        o("cp9_5_4", "Supplier verification lemah", 0.50, 0.65, 0.80),
        o("cp9_5_5", "Supplier tidak dapat diverifikasi", 0.75, 0.90, 1.00),
      ]},
    { key: "complaintRisk", criteriaCode: "CP9.6", label: "Penanganan Keluhan Konsumen",
      options: [
        o("cp9_6_1", "Sistem complaint handling berjalan efektif", 0, 0.05, 0.15),
        o("cp9_6_2", "Respons lambat minor", 0.10, 0.25, 0.35),
        o("cp9_6_3", "Sebagian complaint tidak terdokumentasi", 0.30, 0.45, 0.55),
        o("cp9_6_4", "Tidak ada tindak lanjut jelas", 0.50, 0.65, 0.80),
        o("cp9_6_5", "Tidak ada sistem penanganan keluhan", 0.75, 0.90, 1.00),
      ]},
  ],
};

