// Types
export interface Indicator {
  no: number;
  statement: string;
  evidence: string;
}

export interface SubCriteria {
  code: string;
  name: string;
  nameEn: string;
  indicators: Indicator[];
}

export interface BackgroundField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'time' | 'number';
  options?: string[];
}

export interface CPQuestionnaire {
  cpId: string;
  cpName: string;
  cpNameEn: string;
  subCriteria: SubCriteria[];
  backgroundFields: BackgroundField[];
}

export interface ExpertType {
  id: string;
  label: string;
}

// Expert types for Kuesioner 1
export const EXPERT_TYPES: ExpertType[] = [
  { id: 'akademisi', label: 'Akademisi' },
  { id: 'pakar_it', label: 'Pakar IT' },
  { id: 'pakar_sc', label: 'Pakar Supply Chain' },
  { id: 'pakar_halal', label: 'Pakar Halal' },
  { id: 'lppom', label: 'Orang LPPOM' },
  { id: 'mui', label: 'Orang MUI' },
  { id: 'bjph', label: 'BJPH' },
  { id: 'dinas_peternakan', label: 'Kepala Dinas Peternakan' },
];

// Risk scale for K2 & K3
export const RISK_SCALE_LIKERT = [
  { value: 1, label: 'Sangat Rendah', labelEn: 'Very Low Risk', interpretation: 'Risiko pelanggaran halal hampir tidak ada' },
  { value: 2, label: 'Rendah', labelEn: 'Low Risk', interpretation: 'Risiko kecil dan masih mudah dikendalikan' },
  { value: 3, label: 'Sedang', labelEn: 'Moderate Risk', interpretation: 'Risiko mulai memerlukan pengawasan' },
  { value: 4, label: 'Tinggi', labelEn: 'High Risk', interpretation: 'Risiko signifikan dan perlu tindakan segera' },
  { value: 5, label: 'Sangat Tinggi', labelEn: 'Critical Risk', interpretation: 'Risiko kritis yang dapat menyebabkan ketidakpatuhan halal serius' },
];

// ══════════════════════════════════════
// CP1 — Kandang Sapi (Farm)
// ══════════════════════════════════════
export const CP1_QUESTIONNAIRE: CPQuestionnaire = {
  cpId: 'CP1', cpName: 'Kandang Sapi', cpNameEn: 'Farm',
  backgroundFields: [
    { key: 'namaFarm', label: 'Nama Farm / Peternakan', type: 'text' },
    { key: 'lokasi', label: 'Lokasi', type: 'text' },
    { key: 'namaStaff', label: 'Nama Staff / Supervisor', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Staff', 'Supervisor', 'QC', 'Penyelia Halal'] },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'batch', label: 'Batch / Kode Ternak', type: 'text' },
  ],
  subCriteria: [
    { code: 'CP1.1', name: 'Asal-usul sapi & Traceability', nameEn: 'Cattle Origins & Traceability',
      indicators: [
        { no: 1, statement: 'Identitas asal sapi terdokumentasi', evidence: 'Surat asal ternak' },
        { no: 2, statement: 'Riwayat perpindahan sapi tersedia', evidence: 'Logbook distribusi' },
        { no: 3, statement: 'Supplier ternak terverifikasi', evidence: 'Vendor approval' },
        { no: 4, statement: 'Sistem traceability berjalan', evidence: 'Database ternak' },
        { no: 5, statement: 'Histori kepemilikan tersedia', evidence: 'Dokumen pembelian' },
      ],
    },
    { code: 'CP1.2', name: 'Status kesehatan sapi', nameEn: 'Cattle Health Status',
      indicators: [
        { no: 1, statement: 'Pemeriksaan kesehatan rutin', evidence: 'Laporan dokter hewan' },
        { no: 2, statement: 'Status bebas penyakit zoonosis', evidence: 'Sertifikat kesehatan' },
        { no: 3, statement: 'Rekam vaksinasi tersedia', evidence: 'Buku vaksinasi' },
        { no: 4, statement: 'Penggunaan antibiotik terdokumentasi', evidence: 'Medical record' },
        { no: 5, statement: 'SOP isolasi sapi sakit tersedia', evidence: 'SOP biosecurity' },
      ],
    },
    { code: 'CP1.3', name: 'Kepatuhan pakan', nameEn: 'Feed Compliance',
      indicators: [
        { no: 1, statement: 'Pakan bersertifikat halal', evidence: 'Sertifikat halal pakan' },
        { no: 2, statement: 'Formula pakan terdokumentasi', evidence: 'Dokumen formulasi' },
        { no: 3, statement: 'Penyimpanan pakan terpisah', evidence: 'SOP gudang' },
        { no: 4, statement: 'Supplier pakan terverifikasi', evidence: 'Vendor document' },
        { no: 5, statement: 'Feed additive halal compliant', evidence: 'Sertifikat additive' },
      ],
    },
    { code: 'CP1.4', name: 'Dokumentasi pemeliharaan', nameEn: 'Maintenance Documentation',
      indicators: [
        { no: 1, statement: 'SOP pemeliharaan tersedia', evidence: 'SOP farm' },
        { no: 2, statement: 'Jadwal maintenance tersedia', evidence: 'Checklist maintenance' },
        { no: 3, statement: 'Cleaning log terdokumentasi', evidence: 'Cleaning logbook' },
        { no: 4, statement: 'Pelatihan halal pekerja tersedia', evidence: 'Sertifikat training' },
        { no: 5, statement: 'Audit internal dilakukan rutin', evidence: 'Audit report' },
      ],
    },
    { code: 'CP1.5', name: 'Kebersihan kandang & Sanitasi', nameEn: 'Coop Cleanliness & Sanitation',
      indicators: [
        { no: 1, statement: 'Frekuensi pembersihan kandang', evidence: 'Jadwal cleaning' },
        { no: 2, statement: 'Sistem pembuangan limbah baik', evidence: 'SOP limbah' },
        { no: 3, statement: 'Sanitasi alat dilakukan rutin', evidence: 'Checklist sanitasi' },
        { no: 4, statement: 'Desinfektan halal tersedia', evidence: 'Sertifikat produk' },
        { no: 5, statement: 'Kualitas air ternak teruji', evidence: 'Hasil uji laboratorium' },
      ],
    },
  ],
};

// ══════════════════════════════════════
// CP2 — Pakan & Kesehatan Hewan
// ══════════════════════════════════════
export const CP2_QUESTIONNAIRE: CPQuestionnaire = {
  cpId: 'CP2', cpName: 'Pakan & Kesehatan Hewan', cpNameEn: 'Animal Feed & Health',
  backgroundFields: [
    { key: 'namaFarm', label: 'Nama Farm / Unit', type: 'text' },
    { key: 'lokasi', label: 'Lokasi', type: 'text' },
    { key: 'namaPIC', label: 'Nama PIC / Staff', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Staff', 'Supervisor', 'QC', 'Veteriner', 'Penyelia Halal'] },
    { key: 'tanggal', label: 'Tanggal Pengisian', type: 'date' },
    { key: 'shift', label: 'Shift', type: 'select', options: ['Pagi', 'Siang', 'Malam'] },
    { key: 'batch', label: 'Batch / Kode Ternak', type: 'text' },
  ],
  subCriteria: [
    { code: 'CP2.1', name: 'Halal status bahan pakan', nameEn: 'Halal Status of Feed Ingredients',
      indicators: [
        { no: 1, statement: 'Seluruh bahan pakan memiliki status halal yang jelas', evidence: 'Sertifikat halal bahan pakan' },
        { no: 2, statement: 'Komposisi bahan pakan terdokumentasi', evidence: 'Dokumen formulasi pakan' },
        { no: 3, statement: 'Feed additive terverifikasi halal', evidence: 'Sertifikat halal additive' },
        { no: 4, statement: 'Tidak menggunakan bahan hewani non-halal', evidence: 'Supplier ingredient declaration' },
        { no: 5, statement: 'Penggunaan bahan GMO/aditif sesuai regulasi', evidence: 'Material Safety Data Sheet (MSDS)' },
      ],
    },
    { code: 'CP2.2', name: 'Kontrol obat/vaksin hewan', nameEn: 'Control of Veterinary Drugs/Vaccines',
      indicators: [
        { no: 1, statement: 'Obat dan vaksin terdaftar resmi', evidence: 'Izin edar obat/vaksin' },
        { no: 2, statement: 'Penggunaan antibiotik terdokumentasi', evidence: 'Medical treatment record' },
        { no: 3, statement: 'Status halal obat/vaksin tersedia', evidence: 'Sertifikat halal obat/vaksin' },
        { no: 4, statement: 'Jadwal pemberian vaksin terdokumentasi', evidence: 'Logbook vaksinasi' },
        { no: 5, statement: 'Masa withdrawal dipatuhi', evidence: 'SOP withdrawal period' },
      ],
    },
    { code: 'CP2.3', name: 'Pengawasan veteriner', nameEn: 'Veterinary Supervision',
      indicators: [
        { no: 1, statement: 'Pemeriksaan kesehatan rutin dilakukan', evidence: 'Veterinary inspection report' },
        { no: 2, statement: 'Dokter hewan terlibat aktif', evidence: 'Surat penugasan dokter hewan' },
        { no: 3, statement: 'Tersedia SOP biosecurity', evidence: 'SOP biosecurity' },
        { no: 4, statement: 'Penanganan hewan sakit sesuai prosedur', evidence: 'Incident handling report' },
        { no: 5, statement: 'Audit kesehatan ternak dilakukan', evidence: 'Audit report kesehatan hewan' },
      ],
    },
    { code: 'CP2.4', name: 'Supplier reliability pakan', nameEn: 'Feed Supplier Reliability',
      indicators: [
        { no: 1, statement: 'Supplier memiliki legalitas usaha', evidence: 'Legal business permit' },
        { no: 2, statement: 'Supplier memiliki sertifikasi halal', evidence: 'Sertifikat halal supplier' },
        { no: 3, statement: 'Supplier memiliki rekam jejak baik', evidence: 'Supplier evaluation report' },
        { no: 4, statement: 'Tersedia kontrak dan SLA supplier', evidence: 'Contract agreement' },
        { no: 5, statement: 'Audit supplier dilakukan berkala', evidence: 'Supplier audit checklist' },
      ],
    },
    { code: 'CP2.5', name: 'Penyimpanan pakan (segregasi)', nameEn: 'Feed Storage (Segregation)',
      indicators: [
        { no: 1, statement: 'Penyimpanan pakan halal terpisah', evidence: 'SOP segregasi gudang' },
        { no: 2, statement: 'Gudang bersih dan higienis', evidence: 'Cleaning checklist gudang' },
        { no: 3, statement: 'Sistem FIFO/FEFO diterapkan', evidence: 'Inventory management record' },
        { no: 4, statement: 'Identifikasi label pakan jelas', evidence: 'Label dan barcode stock' },
        { no: 5, statement: 'Kontrol kelembaban & suhu gudang', evidence: 'Monitoring suhu dan kelembaban' },
      ],
    },
  ],
};

// ══════════════════════════════════════
// CP3 — Transportasi Hewan ke RPH
// ══════════════════════════════════════
export const CP3_QUESTIONNAIRE: CPQuestionnaire = {
  cpId: 'CP3', cpName: 'Transportasi Hewan ke RPH', cpNameEn: 'Transportation of Animals to the Slaughterhouse',
  backgroundFields: [
    { key: 'namaPerusahaan', label: 'Nama Perusahaan / Transporter', type: 'text' },
    { key: 'nomorKendaraan', label: 'Nomor Kendaraan', type: 'text' },
    { key: 'namaPIC', label: 'Nama Responsible Person (PIC)', type: 'text' },
    { key: 'jabatan', label: 'Jabatan', type: 'select', options: ['Driver', 'Handler', 'Supervisor', 'QC', 'Penyelia Halal'] },
    { key: 'tanggal', label: 'Tanggal Pengiriman', type: 'date' },
    { key: 'waktuBerangkat', label: 'Waktu Berangkat', type: 'text' },
    { key: 'lokasiAsal', label: 'Lokasi Asal', type: 'text' },
    { key: 'lokasiTujuan', label: 'Lokasi Tujuan (RPH)', type: 'text' },
    { key: 'batch', label: 'Batch', type: 'text' },
    { key: 'jumlahHewan', label: 'Jumlah Hewan', type: 'text' },
  ],
  subCriteria: [
    { code: 'CP3.1', name: 'Kelayakan Transportasi Hewan', nameEn: 'Animal Welfare in Transport',
      indicators: [
        { no: 1, statement: 'Kondisi kendaraan sesuai standar kesejahteraan hewan', evidence: 'SOP animal welfare transport' },
        { no: 2, statement: 'Kepadatan hewan dalam kendaraan sesuai kapasitas', evidence: 'Checklist kapasitas kendaraan' },
        { no: 3, statement: 'Tersedia ventilasi dan sirkulasi udara baik', evidence: 'Inspection checklist kendaraan' },
        { no: 4, statement: 'Waktu perjalanan sesuai standar', evidence: 'Log waktu perjalanan' },
        { no: 5, statement: 'Penanganan loading/unloading sesuai SOP', evidence: 'SOP handling ternak' },
      ],
    },
    { code: 'CP3.2', name: 'Kebersihan Kendaraan', nameEn: 'Vehicle Cleanliness',
      indicators: [
        { no: 1, statement: 'Kendaraan dibersihkan sebelum digunakan', evidence: 'SOP animal welfare transport' },
        { no: 2, statement: 'Proses sanitasi kendaraan terdokumentasi', evidence: 'Sanitation logbook' },
        { no: 3, statement: 'Kendaraan bebas dari kontaminasi bahan non-halal', evidence: 'Inspection report' },
        { no: 4, statement: 'Desinfektan yang digunakan sesuai standar', evidence: 'Sertifikat bahan sanitasi' },
        { no: 5, statement: 'Area kendaraan kering dan higienis', evidence: 'Dokumentasi foto kendaraan' },
      ],
    },
    { code: 'CP3.3', name: 'Ketertelusuran Selama Transportasi', nameEn: 'Traceability During Transport',
      indicators: [
        { no: 1, statement: 'Identitas hewan dapat ditelusuri selama perjalanan', evidence: 'Ear tag / RFID record' },
        { no: 2, statement: 'Data asal dan tujuan hewan tersedia', evidence: 'Delivery order / shipment document' },
        { no: 3, statement: 'Monitoring lokasi transportasi berjalan', evidence: 'GPS tracking log' },
        { no: 4, statement: 'Histori perjalanan terdokumentasi', evidence: 'Transportation history report' },
        { no: 5, statement: 'Sistem digital traceability tersedia', evidence: 'Database traceability system' },
      ],
    },
    { code: 'CP3.4', name: 'Dokumentasi Perjalanan', nameEn: 'Travel Documentation',
      indicators: [
        { no: 1, statement: 'Surat jalan hewan tersedia', evidence: 'Surat jalan ternak' },
        { no: 2, statement: 'Sertifikat kesehatan hewan lengkap', evidence: 'Veterinary health certificate' },
        { no: 3, statement: 'Dokumen asal ternak tersedia', evidence: 'Animal ownership document' },
        { no: 4, statement: 'Jadwal perjalanan terdokumentasi', evidence: 'Trip schedule document' },
        { no: 5, statement: 'Catatan insiden perjalanan tersedia', evidence: 'Incident report transportasi' },
      ],
    },
    { code: 'CP3.5', name: 'Kompetensi Petugas Handler', nameEn: 'Handler Competencies',
      indicators: [
        { no: 1, statement: 'Petugas memahami SOP halal handling', evidence: 'Sertifikat pelatihan halal' },
        { no: 2, statement: 'Petugas memiliki kompetensi animal welfare', evidence: 'Training certificate animal welfare' },
        { no: 3, statement: 'Petugas memahami prosedur darurat', evidence: 'Emergency SOP training record' },
        { no: 4, statement: 'Evaluasi kinerja petugas dilakukan', evidence: 'Staff performance evaluation' },
        { no: 5, statement: 'Jumlah petugas sesuai kebutuhan transportasi', evidence: 'Staffing assignment document' },
      ],
    },
  ],
};
