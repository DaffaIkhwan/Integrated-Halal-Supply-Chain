// generate-manual-k1v1.mjs
// Script untuk menghasilkan Buku Manual K1 V1 (Fuzzy AHP) dalam format .docx
// Jalankan: node generate-manual-k1v1.mjs

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  PageNumber, NumberFormat, Footer, Header,
  TableOfContents, ShadingType, VerticalAlign,
  ImageRun, PageBreak,
} from "docx";
import * as fs from "fs";

// ═══════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const FONT = "Calibri";
const FONT_SIZE_BODY = 22; // half-points (11pt)
const FONT_SIZE_SMALL = 18; // 9pt
const FONT_SIZE_H1 = 32; // 16pt
const FONT_SIZE_H2 = 28; // 14pt
const FONT_SIZE_H3 = 24; // 12pt
const FONT_SIZE_FOOTER = 16; // 8pt

const COLOR_PRIMARY = "0891B2"; // cyan-600
const COLOR_SECONDARY = "059669"; // emerald-600
const COLOR_DARK = "1E293B"; // slate-800
const COLOR_GRAY = "64748B"; // slate-500
const COLOR_LIGHT_BG = "F0FDFA"; // teal-50
const COLOR_TABLE_HEADER = "0E7490"; // cyan-700
const COLOR_TABLE_HEADER_TEXT = "FFFFFF";
const COLOR_TABLE_ALT = "F0F9FF"; // sky-50
const COLOR_WARNING = "DC2626"; // red-600

const FOOTER_TEXT = "Buku Manual Kuesioner 1 V1 — Pembobotan Fuzzy AHP | Sistem Halal Supply Chain";

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_H1, bold: true, color: COLOR_PRIMARY })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_H2, bold: true, color: COLOR_DARK })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_H3, bold: true, color: COLOR_SECONDARY })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  });
}

function para(...runs) {
  return new Paragraph({
    children: runs,
    spacing: { after: 120, line: 276 },
  });
}

function text(t, opts = {}) {
  return new TextRun({ text: t, font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK, ...opts });
}

function bold(t, opts = {}) {
  return text(t, { bold: true, ...opts });
}

function italic(t, opts = {}) {
  return text(t, { italics: true, color: COLOR_GRAY, ...opts });
}

function bullet(t, level = 0) {
  return new Paragraph({
    children: [text(t)],
    bullet: { level },
    spacing: { after: 60, line: 276 },
  });
}

function numberedItem(num, t) {
  return para(bold(`${num}. `), text(t));
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { before: pts } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function imagePlaceholder(caption) {
  return new Paragraph({
    children: [
      new TextRun({ text: `[${caption}]`, font: FONT, size: FONT_SIZE_BODY, italics: true, color: COLOR_GRAY }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    border: {
      top: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" },
    },
    shading: { type: ShadingType.SOLID, color: "F8FAFC" },
  });
}

function captionText(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_SMALL, italics: true, color: COLOR_GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

function noteBox(title, content) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${title}: `, font: FONT, size: FONT_SIZE_BODY, bold: true, color: COLOR_PRIMARY }),
      new TextRun({ text: content, font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK }),
    ],
    spacing: { before: 80, after: 120 },
    shading: { type: ShadingType.SOLID, color: COLOR_LIGHT_BG },
    indent: { left: 200, right: 200 },
  });
}

function warningBox(content) {
  return new Paragraph({
    children: [
      new TextRun({ text: "⚠ PERINGATAN: ", font: FONT, size: FONT_SIZE_BODY, bold: true, color: COLOR_WARNING }),
      new TextRun({ text: content, font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK }),
    ],
    spacing: { before: 80, after: 120 },
    shading: { type: ShadingType.SOLID, color: "FEF2F2" },
    indent: { left: 200, right: 200 },
  });
}

function horizontalRule() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" } },
  });
}

// ─── Table helpers ───
function headerCell(t, width) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_SMALL, bold: true, color: COLOR_TABLE_HEADER_TEXT })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: COLOR_TABLE_HEADER },
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function dataCell(t, opts = {}) {
  const { align, shading: shade, boldText } = opts;
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: String(t), font: FONT, size: FONT_SIZE_SMALL, bold: !!boldText, color: COLOR_DARK })],
      alignment: align || AlignmentType.LEFT,
    })],
    shading: shade ? { type: ShadingType.SOLID, color: shade } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}

function createTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, colWidths?.[i])),
    tableHeader: true,
  });
  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      children: row.map((cell, colIdx) =>
        dataCell(cell, {
          shading: rowIdx % 2 === 1 ? COLOR_TABLE_ALT : undefined,
          boldText: colIdx === 0,
        })
      ),
    })
  );
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}


// ═══════════════════════════════════════════════════════════════════
// DOCUMENT SECTIONS
// ═══════════════════════════════════════════════════════════════════

function coverPage() {
  return [
    spacer(1600),
    new Paragraph({
      children: [new TextRun({ text: "BUKU MANUAL PENGGUNA", font: FONT, size: 52, bold: true, color: COLOR_PRIMARY })],
      alignment: AlignmentType.CENTER,
    }),
    spacer(100),
    new Paragraph({
      children: [new TextRun({ text: "Modul Kuesioner 1 Versi 1", font: FONT, size: 40, bold: true, color: COLOR_DARK })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: "Pembobotan Fuzzy AHP", font: FONT, size: 36, color: COLOR_SECONDARY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    horizontalRule(),
    spacer(200),
    new Paragraph({
      children: [new TextRun({ text: "Sistem Informasi Manajemen", font: FONT, size: 28, color: COLOR_GRAY })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: "Integrated Halal Supply Chain", font: FONT, size: 32, bold: true, color: COLOR_DARK })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: "Knowledge Management & Decision Support System", font: FONT, size: 24, color: COLOR_GRAY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    horizontalRule(),
    spacer(600),
    new Paragraph({
      children: [new TextRun({ text: "Versi Dokumen: 1.1", font: FONT, size: FONT_SIZE_BODY, color: COLOR_GRAY })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`, font: FONT, size: FONT_SIZE_BODY, color: COLOR_GRAY })],
      alignment: AlignmentType.CENTER,
    }),
    pageBreak(),
  ];
}

function daftarIsiSection() {
  return [
    heading1("Daftar Isi"),
    spacer(100),
    ...[
      "1. Pendahuluan",
      "2. Use Case Diagram",
      "3. Entity Relationship Diagram (ERD)",
      "4. Activity Diagram",
      "5. Hak Akses Sebagai Admin",
      "   5.1 Halaman Login",
      "   5.2 Menu Kelola User (Pembuatan Akun Pakar K1)",
      "   5.3 Menu Rekap Pembobotan (V1)",
      "   5.4 Menu Tahapan Fuzzy AHP",
      "6. Hak Akses Sebagai Responden Pakar (PAKAR_K1)",
      "   6.1 Halaman Login",
      "   6.2 Pengisian Biodata Responden",
      "   6.3 Pembobotan Kriteria Umum (KU)",
      "   6.4 Pembobotan Antar CP (Level 1)",
      "   6.5 Pembobotan Sub-Kriteria per CP",
      "   6.6 Konfirmasi & Submit",
      "   6.7 Halaman Terima Kasih",
      "7. Daftar Istilah",
    ].map(item => para(text(item))),
    pageBreak(),
  ];
}

function pendahuluanSection() {
  return [
    heading1("1. Pendahuluan"),
    para(
      text("Buku manual ini membahas secara khusus "),
      bold("Modul Kuesioner 1 Versi 1 (K1 V1)"),
      text(", yaitu modul "),
      bold("pembobotan model integrasi Halal Supply Chain menggunakan metode Fuzzy AHP"),
      text(". Modul ini merupakan bagian dari Sistem Informasi Manajemen Halal Supply Chain yang dibangun menggunakan "),
      bold("Next.js"),
      text(", "),
      bold("PostgreSQL (Prisma ORM)"),
      text(", dan "),
      bold("metode Fuzzy Analytical Hierarchy Process (Fuzzy AHP)"),
      text("."),
    ),
    para(
      text("Pada modul K1 V1, para "),
      bold("pakar"),
      text(" melakukan penilaian "),
      bold("pairwise comparison"),
      text(" (perbandingan berpasangan) menggunakan "),
      bold("Skala Saaty (1–9)"),
      text(" terhadap:"),
    ),
    bullet("Kriteria Umum (KU) — Kriteria umum halal supply chain"),
    bullet("Critical Point Level 1 (CP1–CP9) — Perbandingan antar 9 titik kritis"),
    bullet("Sub-Kriteria per CP — Perbandingan sub-kriteria di masing-masing CP"),
    para(text("Hasil pembobotan ini kemudian diolah oleh sistem menggunakan Fuzzy AHP untuk menghasilkan bobot global setiap Critical Point dan sub-kriterianya.")),
    spacer(100),

    heading2("Lingkup Modul K1 V1"),
    createTable(
      ["Level", "Cakupan", "Jumlah Perbandingan"],
      [
        ["Kriteria Umum (KU)", "Perbandingan antar kriteria umum halal supply chain", "Bervariasi (C(n,2) pasangan)"],
        ["Antar CP — Level 1", "Perbandingan kepentingan antar CP1 s/d CP9", "C(9,2) = 36 pasangan"],
        ["Sub-Kriteria per CP", "Perbandingan sub-kriteria di masing-masing CP (CP1–CP9)", "Bervariasi per CP"],
      ],
      [25, 45, 30],
    ),
    spacer(100),

    heading2("Dua Hak Akses pada Modul K1 V1"),
    para(text("Modul ini melibatkan dua hak akses:")),
    createTable(
      ["No", "Hak Akses", "Fungsi"],
      [
        ["1", "Admin", "Mengelola akun pakar, merekap data pembobotan (lihat, edit, hapus, tambah, export Excel), dan melihat tahapan perhitungan Fuzzy AHP secara step-by-step"],
        ["2", "Pakar K1", "Mengisi kuesioner pembobotan pairwise comparison (Kriteria Umum, Antar CP, dan Sub-Kriteria per CP) menggunakan Skala Saaty"],
      ],
      [8, 15, 77],
    ),
    spacer(100),
    imagePlaceholder("Gambar 1. Halaman Login Sistem"),
    captionText("Gambar 1. Halaman Login Sistem"),
    pageBreak(),
  ];
}

function useCaseSection() {
  return [
    heading1("2. Use Case Diagram"),
    para(text("Diagram berikut menggambarkan interaksi Admin dan Pakar K1 dengan fitur-fitur yang tersedia pada modul K1 V1.")),
    spacer(100),
    imagePlaceholder("Gambar 2. Use Case Diagram — Modul K1 V1 & Fuzzy AHP"),
    captionText("Gambar 2. Use Case Diagram — Modul K1 V1 & Fuzzy AHP"),
    spacer(100),
    noteBox("Catatan", "Diagram Use Case dapat di-render dari kode Mermaid yang tersedia pada file Buku_Manual_K1V1_REVISI.md"),

    spacer(200),
    heading2("Deskripsi Use Case"),
    createTable(
      ["No", "Use Case", "Aktor", "Deskripsi"],
      [
        ["UC1", "Login ke Sistem", "Admin, Pakar", "Autentikasi menggunakan email dan password"],
        ["UC2", "Mengisi Biodata Responden", "Pakar", "Mengisi nama, jenis kelamin, keahlian, instansi, pengalaman, email, tanggal"],
        ["UC3", "Memilih Kategori Pembobotan", "Pakar", "Memilih Kriteria Umum (KU), Antar CP (Level 1), atau Sub-Kriteria CPx"],
        ["UC4", "Mengisi Perbandingan Berpasangan", "Pakar", "Menggeser slider Skala Saaty (1–9) untuk menilai kepentingan relatif"],
        ["UC5", "Konfirmasi & Submit", "Pakar", "Menyimpan data ke database; otomatis lanjut ke tab berikutnya"],
        ["UC6", "Halaman Terima Kasih", "Pakar", "Melihat rekap jumlah perbandingan yang telah diisi per kategori"],
        ["UC7", "Membuat Akun Pakar K1", "Admin", "Mendaftarkan pakar baru dengan role PAKAR_K1"],
        ["UC8", "Rekap Pembobotan Per Pakar", "Admin", "Melihat seluruh data pembobotan dalam card grouped by expert"],
        ["UC9", "Detail Perbandingan", "Admin", "Membuka modal detail berisi tabel pairwise"],
        ["UC10", "Edit Nilai Perbandingan", "Admin", "Mengubah nilai melalui slider pada modal detail"],
        ["UC11", "Hapus Data Kuesioner", "Admin", "Menghapus satu entri kuesioner pada kategori tertentu"],
        ["UC12", "Hapus Seluruh Data Responden", "Admin", "Menghapus semua entri kuesioner milik satu pakar"],
        ["UC13", "Tambah Data Kosong", "Admin", "Membuat entri default (Sama Penting) untuk kategori belum terisi"],
        ["UC14", "Export Excel", "Admin", "Mengunduh seluruh data rekap ke file .xlsx"],
        ["UC15", "Tahapan Fuzzy AHP", "Admin", "Melihat perhitungan Fuzzy AHP step-by-step (8 langkah)"],
        ["UC16", "Matriks Perbandingan", "Admin", "Melihat matriks TFN atau Crisp (toggle)"],
        ["UC17", "Hasil Perhitungan AHP", "Admin", "Row Sum, FSE, Defuzzifikasi, Normalisasi, Uji Konsistensi (CR)"],
      ],
      [7, 22, 12, 59],
    ),
    pageBreak(),
  ];
}

function erdSection() {
  return [
    heading1("3. Entity Relationship Diagram (ERD)"),
    para(text("ERD berikut menggambarkan entitas database yang terlibat khusus dalam modul K1 V1 dan proses Fuzzy AHP.")),
    spacer(100),
    imagePlaceholder("Gambar 3. Entity Relationship Diagram — Modul K1 V1"),
    captionText("Gambar 3. Entity Relationship Diagram — Modul K1 V1"),
    spacer(100),
    noteBox("Catatan", "Diagram ERD dapat di-render dari kode Mermaid yang tersedia pada file Buku_Manual_K1V1_REVISI.md"),

    spacer(200),
    heading2("Entitas & Atribut Utama"),

    heading3("a. User"),
    createTable(
      ["Atribut", "Tipe", "Keterangan"],
      [
        ["id", "UUID (PK)", "Primary key"],
        ["name", "String", "Nama lengkap"],
        ["email", "String (Unique)", "Email untuk login"],
        ["password", "String", "Password (hashed)"],
        ["role", "String", "ADMIN atau PAKAR_K1"],
        ["isBanned", "Boolean", "Status banned"],
        ["createdAt", "DateTime", "Tanggal registrasi"],
      ],
      [20, 25, 55],
    ),
    spacer(100),

    heading3("b. QuestionnaireResponse"),
    createTable(
      ["Atribut", "Tipe", "Keterangan"],
      [
        ["id", "UUID (PK)", "Primary key"],
        ["questionnaireType", "String", 'Selalu bernilai "pembobotan"'],
        ["cpId", "String (nullable)", "null untuk KU/CP_LEVEL, atau CP1–CP9"],
        ["respondentName", "String", "Nama pakar"],
        ["respondentInfo", "JSON", "Biodata lengkap (nama, keahlian, instansi, dll.)"],
        ["answers", "JSON", 'Data perbandingan: {type, comparisons: {"X_vs_Y": nilai}}'],
        ["status", "String", "SUBMITTED / REVIEWED / APPROVED"],
      ],
      [22, 22, 56],
    ),
    spacer(100),

    heading3("c. PairwiseComparison"),
    createTable(
      ["Atribut", "Tipe", "Keterangan"],
      [
        ["id", "UUID (PK)", "Primary key"],
        ["matrixType", "String", "KU_LEVEL / LEVEL1_CP / LEVEL2_CPx"],
        ["rowCode", "String", "Kode baris (CP1, R1, S1, dll.)"],
        ["colCode", "String", "Kode kolom (CP2, R2, S2, dll.)"],
        ["tfnLow / tfnMid / tfnUp", "Float", "Triangular Fuzzy Number [l, m, u]"],
        ["evaluatorId", "String (nullable)", "ID pakar yang mengisi (opsional)"],
      ],
      [28, 22, 50],
    ),
    spacer(100),

    heading3("d. CriticalPoint & CriteriaWeight"),
    createTable(
      ["Atribut", "Tipe", "Keterangan"],
      [
        ["CriticalPoint.id", "String (PK)", "CP1 sampai CP9"],
        ["CriticalPoint.globalWeight", "Float", "Bobot global dari Fuzzy AHP"],
        ["CriticalPoint.riskLevel", "String", "Low / Moderate / High / Critical"],
        ["CriteriaWeight.criteriaCode", "String", "Kode sub-kriteria (R1, F1, T1, dll.)"],
        ["CriteriaWeight.weight", "Float", "Bobot sub-kriteria dari pembobotan Level 2"],
      ],
      [30, 20, 50],
    ),
    spacer(100),

    heading2("Penjelasan Relasi"),
    createTable(
      ["Relasi", "Penjelasan"],
      [
        ["User → QuestionnaireResponse", "Satu pakar mengisi banyak kuesioner (satu per kategori)"],
        ["QuestionnaireResponse → PairwiseComparison", "Jawaban pakar diagregatkan menjadi matriks perbandingan berpasangan"],
        ["PairwiseComparison → CriticalPoint", "Matriks diproses Fuzzy AHP untuk menghasilkan bobot global setiap CP"],
        ["CriticalPoint → CriteriaWeight", "Setiap CP memiliki sub-kriteria dengan bobot dari pembobotan Level 2"],
      ],
      [35, 65],
    ),
    pageBreak(),
  ];
}

function activityDiagramSection() {
  return [
    heading1("4. Activity Diagram"),

    heading2("A. Pengisian Kuesioner Pembobotan oleh Pakar K1"),
    para(text("Diagram berikut menggambarkan alur pengisian kuesioner pembobotan oleh Pakar K1, dari login hingga selesai.")),
    imagePlaceholder("Gambar 4. Activity Diagram — Pengisian Kuesioner Pembobotan oleh Pakar K1"),
    captionText("Gambar 4. Activity Diagram — Pengisian Kuesioner Pembobotan oleh Pakar K1"),
    spacer(80),

    heading3("Deskripsi Alur:"),
    numberedItem(1, "Pakar login menggunakan email dan password yang didaftarkan Admin"),
    numberedItem(2, "Sistem memvalidasi kredensial. Jika gagal, tampilkan error dan kembali ke login"),
    numberedItem(3, "Setelah berhasil login, pakar masuk ke halaman Kuesioner 1 — Pembobotan Model"),
    numberedItem(4, "Pakar mengisi biodata responden (nama, jenis kelamin, keahlian, instansi, pengalaman, email, tanggal)"),
    numberedItem(5, "Sistem memuat tab pertama: Kriteria Umum (KU)"),
    numberedItem(6, "Pakar menggeser slider perbandingan berpasangan (Skala Saaty 1–9) untuk setiap pasangan"),
    numberedItem(7, "Pakar klik tombol Simpan Pembobotan. Muncul modal konfirmasi"),
    numberedItem(8, "Jika Ya, data dikirim ke API dan disimpan ke database. Muncul notifikasi sukses"),
    numberedItem(9, "Sistem otomatis berpindah ke tab berikutnya (KU → Antar CP → CP1 → CP2 → ... → CP9)"),
    numberedItem(10, "Setelah semua kategori selesai, muncul modal Terima Kasih dengan rekap pengisian"),
    numberedItem(11, "Pakar dapat mengklik OK, Selesai untuk reset form, atau Kembali untuk meninjau"),
    spacer(100),

    heading2("B. Pengelolaan Rekap Pembobotan V1 oleh Admin"),
    para(text("Diagram berikut menggambarkan alur Admin dalam mengelola data rekap pembobotan K1 V1.")),
    imagePlaceholder("Gambar 5. Activity Diagram — Pengelolaan Rekap Pembobotan oleh Admin"),
    captionText("Gambar 5. Activity Diagram — Pengelolaan Rekap Pembobotan oleh Admin"),
    spacer(80),

    heading3("Deskripsi Alur:"),
    numberedItem(1, "Admin login dan membuka menu K1 → Rekap Data (V1)"),
    numberedItem(2, "Sistem memuat data dari API dan menampilkan per pakar dalam card grouped by expert"),
    numberedItem(3, "Admin dapat: Lihat Detail (ikon mata), Edit (slider), Hapus (satu entri atau semua), Tambah Data Kosong, atau Export Excel"),
    numberedItem(4, "Setiap perubahan langsung tersimpan dan halaman di-refresh"),
    spacer(100),

    heading2("C. Melihat Tahapan Fuzzy AHP oleh Admin"),
    para(text("Diagram berikut menggambarkan alur Admin dalam melihat perhitungan Fuzzy AHP step-by-step.")),
    imagePlaceholder("Gambar 6. Activity Diagram — Tahapan Fuzzy AHP"),
    captionText("Gambar 6. Activity Diagram — Tahapan Fuzzy AHP"),
    spacer(80),

    heading3("Deskripsi Alur:"),
    numberedItem(1, "Admin login dan membuka menu Tahapan FUZZY AHP"),
    numberedItem(2, "Admin memilih jenis matriks (KU, Antar CP L1, Sub-CP1 sampai Sub-CP9)"),
    numberedItem(3, "Sistem menampilkan 8 langkah Fuzzy AHP secara berurutan:"),
    bullet("Step 1-2: Matriks Perbandingan Berpasangan (Toggle TFN / Crisp)", 1),
    bullet("Step 3: Penjumlahan Baris (Row Sum)", 1),
    bullet("Step 4: Total Sum dan Invers", 1),
    bullet("Step 5-6: Fuzzy Synthetic Extent dan Defuzzifikasi (CoA)", 1),
    bullet("Step 7: Normalisasi Bobot Global", 1),
    bullet("Step 8: Uji Konsistensi (CR)", 1),
    numberedItem(4, "Jika CR < 0.10, matriks konsisten. Jika CR ≥ 0.10, tidak konsisten (disarankan isi ulang)"),
    pageBreak(),
  ];
}

function adminSection() {
  return [
    heading1("5. Hak Akses Sebagai Admin"),
    para(text("Hak akses Admin pada modul K1 V1 mencakup: mengelola akun pakar, merekap data pembobotan, dan melihat tahapan perhitungan Fuzzy AHP.")),

    // 5.1 Login
    heading2("5.1 Halaman Login"),
    numberedItem(1, "Buka sistem melalui browser web"),
    numberedItem(2, "Masukkan Email dan Password akun Admin"),
    numberedItem(3, "Klik tombol \"Masuk\""),
    numberedItem(4, "Jika berhasil, Admin diarahkan ke halaman Dashboard"),
    spacer(80),
    imagePlaceholder("Gambar 7. Halaman Login Sistem"),
    captionText("Gambar 7. Halaman Login Sistem"),
    para(text("Pada halaman login terdapat:")),
    bullet("Field Email — Masukkan email yang terdaftar"),
    bullet("Field Password — Masukkan password (tersedia tombol show/hide di sisi kanan)"),
    bullet("Tombol Masuk — Klik untuk melakukan autentikasi"),
    bullet("Tombol Kembali — Ikon panah kiri di sudut kiri atas untuk kembali ke halaman utama"),
    para(text("Jika email atau password salah, akan muncul notifikasi error berwarna merah: "), bold("\"Email atau password salah.\"")),
    imagePlaceholder("Gambar 8. Pesan Error Login"),
    captionText("Gambar 8. Pesan Error Login"),
    para(text("Admin dapat logout dengan mengklik ikon user di sudut kanan atas navbar, lalu pilih Logout.")),
    imagePlaceholder("Gambar 9. Tombol Logout"),
    captionText("Gambar 9. Tombol Logout"),

    // 5.2 Kelola User
    heading2("5.2 Menu Kelola User (Pembuatan Akun Pakar K1)"),
    para(text("Sebelum pakar dapat mengisi kuesioner, Admin perlu mendaftarkan akun pakar terlebih dahulu melalui menu Kelola User.")),
    heading3("Langkah-langkah:"),
    numberedItem(1, "Klik menu \"Kelola User\" pada navigation bar"),
    numberedItem(2, "Klik tombol \"Tambah User Baru\""),
    numberedItem(3, "Isi formulir pendaftaran:"),
    spacer(60),
    createTable(
      ["Field", "Keterangan"],
      [
        ["Nama", "Nama lengkap pakar"],
        ["Email", "Email yang akan digunakan login"],
        ["Password", "Password akun"],
        ["Role", "Pilih \"Pakar — Kuesioner 1 (Pembobotan)\""],
        ["Organisasi", "Pilih atau buat organisasi (opsional)"],
      ],
      [25, 75],
    ),
    spacer(60),
    numberedItem(4, "Klik \"Simpan\" untuk membuat akun"),
    imagePlaceholder("Gambar 10. Formulir Tambah User — Role Pakar K1"),
    captionText("Gambar 10. Formulir Tambah User — Role Pakar K1"),
    noteBox("Tips", "Untuk menambahkan pakar K1, pilih role \"Pakar — Kuesioner 1 (Pembobotan)\" saat membuat akun baru."),
    para(bold("Fitur lain pada Kelola User:")),
    bullet("Ban User — Menonaktifkan akun sehingga tidak bisa login"),
    bullet("Hapus User — Menghapus akun secara permanen"),
    imagePlaceholder("Gambar 11. Daftar User pada Halaman Kelola User"),
    captionText("Gambar 11. Daftar User pada Halaman Kelola User"),

    // 5.3 Rekap Pembobotan
    heading2("5.3 Menu Rekap Pembobotan (V1)"),
    para(text("Menu Rekap Data (V1) diakses melalui dropdown K1 → Rekap Data (V1) pada navigation bar. Halaman ini menampilkan seluruh data kuesioner pembobotan K1 V1 yang telah diisi oleh para pakar.")),

    heading3("5.3.1 Tampilan Data Per Pakar"),
    para(text("Data ditampilkan dalam bentuk card per pakar (dikelompokkan berdasarkan nama). Setiap card menampilkan:")),
    bullet("Header card: Nama pakar, instansi, jabatan, email, dan jumlah respons"),
    bullet("Daftar kategori yang telah diisi (badge KU / L1 / CP1–CP9), jumlah perbandingan, tanggal, status"),
    bullet("Preview perbandingan (compact view) menampilkan hingga 15 pasangan dalam mini-row"),
    bullet("Card dapat di-expand/collapse menggunakan tombol panah"),
    imagePlaceholder("Gambar 12. Tampilan Card Rekap Per Pakar"),
    captionText("Gambar 12. Tampilan Card Rekap Per Pakar"),

    heading3("5.3.2 Melihat Detail Perbandingan"),
    para(text("Klik ikon mata pada kategori tertentu untuk membuka modal detail yang berisi:")),
    bullet("Data Responden — Biodata lengkap pakar"),
    bullet("Statistik — 3 card angka: total pasangan, sudah dinilai, sama penting"),
    bullet("Tabel Perbandingan Pairwise:"),
    spacer(60),
    createTable(
      ["Kolom", "Keterangan"],
      [
        ["No", "Nomor urut"],
        ["Kriteria A", "Kode kriteria sisi kiri (warna cyan jika lebih penting)"],
        ["Skala", "Badge angka skala Saaty + ikon panah arah"],
        ["Kriteria B", "Kode kriteria sisi kanan (warna hijau jika lebih penting)"],
        ["Interpretasi", "Teks deskriptif, contoh: \"CP4 — Sangat Lebih Penting (7)\""],
      ],
      [18, 82],
    ),
    imagePlaceholder("Gambar 13. Modal Detail Perbandingan Pairwise"),
    captionText("Gambar 13. Modal Detail Perbandingan Pairwise"),

    heading3("5.3.3 Edit Data Perbandingan"),
    para(text("Jika Admin perlu mengoreksi data:")),
    numberedItem(1, "Buka modal detail (klik ikon mata)"),
    numberedItem(2, "Klik tombol \"Edit\" (ikon pensil) pada header modal"),
    numberedItem(3, "Kolom Skala berubah menjadi slider interaktif (-8 sampai +8)"),
    numberedItem(4, "Geser slider untuk mengubah nilai perbandingan"),
    numberedItem(5, "Klik \"Simpan\" untuk menyimpan, atau \"Batal\" untuk membatalkan"),
    imagePlaceholder("Gambar 14. Mode Edit — Slider pada Kolom Skala"),
    captionText("Gambar 14. Mode Edit — Slider pada Kolom Skala"),

    heading3("5.3.4 Hapus Data"),
    para(bold("Hapus satu entri kategori:")),
    numberedItem(1, "Buka modal detail"),
    numberedItem(2, "Klik tombol \"Hapus\" (merah) pada header modal"),
    numberedItem(3, "Konfirmasi penghapusan pada dialog"),
    spacer(60),
    para(bold("Hapus seluruh data satu pakar:")),
    numberedItem(1, "Klik tombol \"Hapus Responden\" (merah) pada header card expert"),
    numberedItem(2, "Konfirmasi penghapusan — semua entri milik pakar tersebut akan dihapus"),
    imagePlaceholder("Gambar 15. Tombol Hapus pada Card Expert"),
    captionText("Gambar 15. Tombol Hapus pada Card Expert"),
    warningBox("Penghapusan bersifat permanen dan tidak dapat dibatalkan."),

    heading3("5.3.5 Tambah Data Kosong"),
    para(text("Jika ada kategori yang belum diisi oleh pakar:")),
    numberedItem(1, "Klik tombol \"Tambah Data\" (ikon plus) pada header card expert"),
    numberedItem(2, "Muncul dropdown daftar kategori yang belum terisi"),
    numberedItem(3, "Klik kategori yang diinginkan"),
    numberedItem(4, "Sistem membuat entri kosong dengan semua nilai = Sama Penting (1)"),
    numberedItem(5, "Admin dapat mengedit nilainya melalui modal detail"),
    imagePlaceholder("Gambar 16. Dropdown Tambah Data Kosong"),
    captionText("Gambar 16. Dropdown Tambah Data Kosong"),

    heading3("5.3.6 Export ke Excel"),
    numberedItem(1, "Klik tombol \"Export Excel\" (ikon spreadsheet) pada bagian atas halaman"),
    numberedItem(2, "File .xlsx terunduh otomatis: Rekap_K1_V1_Pairwise_YYYY-MM-DD.xlsx"),
    para(bold("Isi file Excel:")),
    createTable(
      ["Sheet", "Konten"],
      [
        ["Rekap K1 V1 Per Pakar", "Gabungan semua pakar — header, biodata, tabel per kategori"],
        ["[Nama Pakar 1]", "Detail data pakar pertama"],
        ["[Nama Pakar 2]", "Detail data pakar kedua"],
        ["...", "Satu sheet per pakar"],
      ],
      [30, 70],
    ),
    imagePlaceholder("Gambar 17. Tombol Export Excel"),
    captionText("Gambar 17. Tombol Export Excel"),

    // 5.4 Tahapan Fuzzy AHP
    heading2("5.4 Menu Tahapan Fuzzy AHP"),
    para(text("Menu Tahapan FUZZY AHP menampilkan seluruh proses perhitungan Fuzzy AHP secara step-by-step dan interaktif. Diakses melalui tombol \"Tahapan FUZZY AHP\" pada navigation bar.")),

    heading3("5.4.1 Pemilihan Jenis Matriks"),
    para(text("Pada bagian atas halaman, pilih jenis matriks yang ingin dilihat:")),
    createTable(
      ["Tombol", "Kode", "Deskripsi"],
      [
        ["Kriteria Umum (KU)", "KU_LEVEL", "Matriks perbandingan kriteria umum"],
        ["Antar CP — Level 1", "LEVEL1_CP", "Matriks perbandingan antar CP1–CP9"],
        ["Sub-Kriteria CP1", "LEVEL2_CP1", "Sub-kriteria CP1 (Farm)"],
        ["Sub-Kriteria CP2", "LEVEL2_CP2", "Sub-kriteria CP2 (Pakan)"],
        ["Sub-Kriteria CP3", "LEVEL2_CP3", "Sub-kriteria CP3 (Transportasi)"],
        ["Sub-Kriteria CP4", "LEVEL2_CP4", "Sub-kriteria CP4 (Penyembelihan)"],
        ["Sub-Kriteria CP5", "LEVEL2_CP5", "Sub-kriteria CP5 (Post-Slaughter)"],
        ["Sub-Kriteria CP6", "LEVEL2_CP6", "Sub-kriteria CP6 (Pengolahan)"],
        ["Sub-Kriteria CP7", "LEVEL2_CP7", "Sub-kriteria CP7 (Penyimpanan)"],
        ["Sub-Kriteria CP8", "LEVEL2_CP8", "Sub-kriteria CP8 (Distribusi)"],
        ["Sub-Kriteria CP9", "LEVEL2_CP9", "Sub-kriteria CP9 (Retail)"],
      ],
      [28, 18, 54],
    ),
    imagePlaceholder("Gambar 18. Tombol Pemilihan Jenis Matriks"),
    captionText("Gambar 18. Tombol Pemilihan Jenis Matriks"),

    heading3("5.4.2 Step 1 & 2 — Matriks Perbandingan Berpasangan"),
    para(text("Menampilkan matriks n×n dari nilai perbandingan berpasangan. Tersedia dua mode tampilan yang dapat di-toggle:")),
    createTable(
      ["Mode", "Tampilan", "Keterangan"],
      [
        ["TFN", "[l, m, u]", "Triangular Fuzzy Number — tiga komponen per sel"],
        ["Crisp", "Nilai tunggal", "Hasil defuzzifikasi (l+m+u)/3 dari rata-rata geometris pakar"],
      ],
      [15, 25, 60],
    ),
    para(text("Pada mode Crisp, sel diberi warna: kuning (nilai > 1.5), biru (nilai < 0.67), abu-abu (diagonal = 1.00).")),
    imagePlaceholder("Gambar 19. Matriks Perbandingan Berpasangan (Mode Crisp)"),
    captionText("Gambar 19. Matriks Perbandingan Berpasangan (Mode Crisp)"),
    imagePlaceholder("Gambar 20. Matriks Perbandingan Berpasangan (Mode TFN)"),
    captionText("Gambar 20. Matriks Perbandingan Berpasangan (Mode TFN)"),

    heading3("5.4.3 Step 3 — Penjumlahan Baris (Row Sum)"),
    para(bold("Rumus: "), text("Rᵢ = Σⱼ Mᵢⱼ = (Σl, Σm, Σu)")),
    para(text("Ditampilkan dalam tabel dua kolom: Kriteria dan Row Sum [l, m, u].")),
    imagePlaceholder("Gambar 21. Tabel Row Sum"),
    captionText("Gambar 21. Tabel Row Sum"),

    heading3("5.4.4 Step 4 — Total Sum & Invers"),
    createTable(
      ["Card", "Rumus", "Keterangan"],
      [
        ["Total Sum", "T = Σ Rᵢ", "Jumlah seluruh Row Sum"],
        ["Invers Total Sum", "T⁻¹ = (1/u, 1/m, 1/l)", "Invers dari Total Sum"],
      ],
      [25, 30, 45],
    ),
    imagePlaceholder("Gambar 22. Total Sum dan Invers"),
    captionText("Gambar 22. Total Sum dan Invers"),

    heading3("5.4.5 Step 5 & 6 — FSE & Defuzzifikasi"),
    para(bold("Rumus FSE: "), text("Sᵢ = Rᵢ ⊗ T⁻¹")),
    para(bold("Rumus Defuzzifikasi (CoA): "), text("Crisp = (l + m + u) / 3")),
    para(text("Ditampilkan dalam tabel: Kriteria, Fuzzy Synthetic Extent (FSE), dan Nilai Crisp (CoA).")),
    imagePlaceholder("Gambar 23. Tabel FSE dan Nilai Crisp"),
    captionText("Gambar 23. Tabel FSE dan Nilai Crisp"),

    heading3("5.4.6 Step 7 — Normalisasi Bobot Global"),
    para(bold("Rumus: "), text("Wᵢ = Crispᵢ / Σ Crisp")),
    para(text("Tabel menampilkan: Kriteria, Nilai Crisp, Bobot Normalisasi (Global Weight), Persentase (%).")),
    imagePlaceholder("Gambar 24. Tabel Normalisasi Bobot Global"),
    captionText("Gambar 24. Tabel Normalisasi Bobot Global"),

    heading3("5.4.7 Step 8 — Uji Konsistensi (CR)"),
    para(bold("Rumus: "), text("CR = CI / RI")),
    para(text("Dimana CI = (λ_max − n) / (n − 1) dan RI = Random Index berdasarkan ukuran matriks.")),
    createTable(
      ["Hasil", "Indikasi", "Tampilan"],
      [
        ["CR < 0.10", "Matriks Konsisten", "Badge hijau ✅"],
        ["CR ≥ 0.10", "Matriks Tidak Konsisten", "Badge merah ⚠️"],
      ],
      [20, 40, 40],
    ),
    imagePlaceholder("Gambar 25. Hasil Uji Konsistensi (CR)"),
    captionText("Gambar 25. Hasil Uji Konsistensi (CR)"),
    warningBox("Jika CR ≥ 0.10, matriks dianggap tidak konsisten. Disarankan agar pakar mengisi ulang kuesioner pembobotan untuk kategori tersebut."),
    pageBreak(),
  ];
}

function pakarSection() {
  return [
    heading1("6. Hak Akses Sebagai Responden Pakar (PAKAR_K1)"),
    para(text("Hak akses Pakar K1 digunakan khusus untuk mengisi kuesioner pembobotan pairwise comparison pada modul K1 V1. Setelah login, pakar langsung diarahkan ke halaman pengisian kuesioner.")),

    // 6.1
    heading2("6.1 Halaman Login"),
    numberedItem(1, "Buka sistem melalui browser web"),
    numberedItem(2, "Masukkan Email dan Password yang telah didaftarkan oleh Admin"),
    numberedItem(3, "Klik tombol \"Masuk\""),
    numberedItem(4, "Jika berhasil, pakar diarahkan ke halaman Kuesioner 1 — Pembobotan Model"),
    imagePlaceholder("Gambar 26. Halaman Login — Masuk Sebagai Pakar K1"),
    captionText("Gambar 26. Halaman Login — Masuk Sebagai Pakar K1"),
    noteBox("Catatan", "Jika muncul pesan \"Email atau password salah\", hubungi Admin untuk memastikan akun sudah terdaftar."),

    // 6.2
    heading2("6.2 Pengisian Biodata Responden"),
    para(text("Setelah login, pakar melihat halaman \"Kuesioner 1 — Pembobotan Model Integrasi Halal Supply Chain — Metode Fuzzy AHP\" dengan banner informasi cara pengisian.")),
    para(bold("Langkah pertama: "), text("Isi form \"Latar Belakang Responden (Pakar)\" yang terdapat di bagian atas halaman.")),
    createTable(
      ["Field", "Tipe Input", "Keterangan"],
      [
        ["Nama Lengkap", "Text", "Nama lengkap pakar"],
        ["Jenis Kelamin", "Dropdown", "Laki-laki / Perempuan"],
        ["Jenis Keahlian", "Dropdown", "Akademisi Halal, Praktisi Industri, Regulator, dll."],
        ["Posisi / Jabatan", "Text", "Jabatan di instansi"],
        ["Nama Instansi", "Text", "Nama organisasi/instansi"],
        ["Pengalaman (tahun)", "Text", "Lama pengalaman di bidang terkait"],
        ["Email", "Text", "Alamat email"],
        ["Tanggal Pengisian", "Date", "Otomatis terisi tanggal hari ini"],
      ],
      [22, 16, 62],
    ),
    imagePlaceholder("Gambar 27. Form Biodata Responden Pakar"),
    captionText("Gambar 27. Form Biodata Responden Pakar"),
    noteBox("Penting", "Biodata melekat pada setiap data pembobotan yang di-submit. Pastikan diisi lengkap dan benar sebelum memulai pembobotan."),

    // 6.3
    heading2("6.3 Pembobotan Kriteria Umum (KU)"),
    para(text("Di bawah form biodata, terdapat section \"Pilih Kategori Pembobotan\" yang menampilkan deretan tombol tab: Kriteria Umum (aktif pertama kali), Antar CP (Level 1), CP1, CP2, ... CP9.")),

    heading3("Cara Pengisian"),
    para(text("Setiap pasangan perbandingan ditampilkan dalam sebuah card yang berisi:")),
    numberedItem(1, "Label kiri (warna cyan) — Kode dan nama kriteria pertama"),
    numberedItem(2, "Badge \"VS\" — Di tengah antara kedua kriteria"),
    numberedItem(3, "Label kanan (warna hijau) — Kode dan nama kriteria kedua"),
    numberedItem(4, "Skala angka — Baris angka 9-8-7-6-5-4-3-2-1-2-3-4-5-6-7-8-9"),
    numberedItem(5, "Slider — Dapat digeser ke kiri atau ke kanan"),
    numberedItem(6, "Teks interpretasi — Muncul di bawah slider menunjukkan hasil pilihan"),

    spacer(100),
    heading3("Tabel Skala Saaty"),
    createTable(
      ["Nilai", "Definisi"],
      [
        ["1", "Sama Penting"],
        ["2", "Mendekati Sedikit Lebih Penting"],
        ["3", "Sedikit Lebih Penting"],
        ["4", "Mendekati Lebih Penting"],
        ["5", "Lebih Penting"],
        ["6", "Mendekati Sangat Lebih Penting"],
        ["7", "Sangat Lebih Penting"],
        ["8", "Mendekati Mutlak Lebih Penting"],
        ["9", "Mutlak Lebih Penting"],
      ],
      [15, 85],
    ),

    spacer(80),
    heading3("Cara Membaca Slider:"),
    bullet("Tengah (1) = Kedua kriteria sama penting"),
    bullet("Geser ke kiri = Kriteria di sisi kiri lebih penting (teks menjadi cyan)"),
    bullet("Geser ke kanan = Kriteria di sisi kanan lebih penting (teks menjadi hijau)"),
    para(bold("Contoh: "), text("Jika slider digeser ke angka 7 ke arah kiri, teks menampilkan:"), italic(" ← [Nama Kriteria Kiri] — Sangat Lebih Penting (7)")),
    para(text("Di sudut kanan atas section, terdapat counter \"Terisi: X/Y\" untuk memantau progress.")),
    imagePlaceholder("Gambar 28. Card Perbandingan Berpasangan dengan Slider"),
    captionText("Gambar 28. Card Perbandingan Berpasangan dengan Slider"),
    imagePlaceholder("Gambar 29. Contoh Slider Digeser ke Kiri"),
    captionText("Gambar 29. Contoh Slider Digeser ke Kiri (Kriteria Kiri Lebih Penting)"),

    // 6.4
    heading2("6.4 Pembobotan Antar CP (Level 1)"),
    para(text("Setelah menyimpan Kriteria Umum, sistem otomatis berpindah ke tab \"Antar CP (Level 1)\". Pada tab ini, pakar membandingkan kepentingan relatif antar 9 Critical Point:")),
    createTable(
      ["Kode", "Nama Critical Point"],
      [
        ["CP1", "Farm / Kandang Sapi"],
        ["CP2", "Pakan & Kesehatan Hewan"],
        ["CP3", "Transportasi Hewan ke RPH"],
        ["CP4", "RPH / Penyembelihan"],
        ["CP5", "Post-Slaughter Handling"],
        ["CP6", "Pengolahan (Processing)"],
        ["CP7", "Cold Storage / Warehouse"],
        ["CP8", "Distribusi / Logistik"],
        ["CP9", "Retail / Pasar / Supermarket"],
      ],
      [15, 85],
    ),
    para(text("Total pasangan perbandingan: "), bold("C(9,2) = 36 pasangan"), text(".")),
    para(text("Cara pengisian sama seperti Kriteria Umum — geser slider ke arah CP yang dianggap lebih penting.")),
    imagePlaceholder("Gambar 30. Pembobotan Antar CP (Level 1)"),
    captionText("Gambar 30. Pembobotan Antar CP (Level 1)"),

    // 6.5
    heading2("6.5 Pembobotan Sub-Kriteria per CP"),
    para(text("Setelah menyelesaikan Antar CP, sistem otomatis berpindah ke Sub-Kriteria CP1, lalu CP2, CP3, dan seterusnya hingga CP9.")),

    heading3("Contoh Sub-Kriteria CP1 (Farm / Kandang):"),
    createTable(
      ["Kode", "Sub-Kriteria"],
      [
        ["R1", "Asal-usul sapi"],
        ["R2", "Status kesehatan sapi"],
        ["R3", "Kepatuhan pakan"],
        ["R4", "Penggunaan obat/vaksin"],
        ["R5", "Dokumentasi pemeliharaan"],
        ["R6", "Kebersihan kandang"],
        ["R7", "Kesiapan hewan disembelih"],
      ],
      [15, 85],
    ),
    para(text("Jumlah pasangan: "), bold("C(7,2) = 21 pasangan"), text(".")),
    imagePlaceholder("Gambar 31. Pembobotan Sub-Kriteria CP1"),
    captionText("Gambar 31. Pembobotan Sub-Kriteria CP1"),

    heading3("Contoh Sub-Kriteria CP4 (Penyembelihan — Paling Kritis):"),
    createTable(
      ["Kode", "Sub-Kriteria"],
      [
        ["S1", "Validitas sertifikat halal RPH"],
        ["S2", "Kompetensi juru sembelih halal"],
        ["S3", "Kesesuaian proses penyembelihan syariah"],
        ["S4", "Pemeriksaan ante/post-mortem"],
        ["S5", "Sanitasi alat dan area"],
        ["S6", "Pemisahan halal dan non-halal"],
        ["S7", "Dokumentasi penyembelihan"],
        ["S8", "Pengawasan halal internal"],
        ["S9", "Audit dan corrective action"],
        ["S10", "Traceability batch"],
      ],
      [15, 85],
    ),
    para(text("Jumlah pasangan: "), bold("C(10,2) = 45 pasangan"), text(".")),
    imagePlaceholder("Gambar 32. Pembobotan Sub-Kriteria CP4"),
    captionText("Gambar 32. Pembobotan Sub-Kriteria CP4"),

    // 6.6
    heading2("6.6 Konfirmasi & Submit"),
    para(text("Setelah mengisi semua slider pada suatu kategori, klik tombol \"Simpan Pembobotan [Nama Kategori]\" (tombol gradient cyan-hijau) di bagian bawah halaman.")),
    heading3("Proses Submit:"),
    numberedItem(1, "Muncul modal konfirmasi — \"Simpan & Lanjutkan?\""),
    numberedItem(2, "Pertanyaan: \"Apakah Anda yakin semua nilai pembobotan untuk [Nama Kategori] sudah sesuai?\""),
    numberedItem(3, "Peringatan kuning: \"Setelah disimpan, Anda akan otomatis diarahkan ke tab berikutnya.\""),
    numberedItem(4, "Klik \"Ya, Simpan\" untuk menyimpan, atau \"Batal\" untuk kembali mengedit"),
    imagePlaceholder("Gambar 33. Modal Konfirmasi Submit"),
    captionText("Gambar 33. Modal Konfirmasi Submit"),
    para(bold("Setelah disimpan:")),
    bullet("Muncul notifikasi hijau: \"✅ Data pembobotan berhasil disimpan\""),
    bullet("Dalam 1.2 detik, halaman otomatis berpindah ke tab kategori berikutnya"),
    bullet("Halaman otomatis scroll ke atas"),
    para(bold("Urutan tab: "), text("Kriteria Umum → Antar CP → CP1 → CP2 → CP3 → CP4 → CP5 → CP6 → CP7 → CP8 → CP9")),
    imagePlaceholder("Gambar 34. Notifikasi Berhasil dan Perpindahan Tab Otomatis"),
    captionText("Gambar 34. Notifikasi Berhasil dan Perpindahan Tab Otomatis"),

    // 6.7
    heading2("6.7 Halaman Terima Kasih"),
    para(text("Setelah menyelesaikan semua kategori (termasuk Sub-Kriteria CP9), muncul modal \"Terima Kasih!\" dengan:")),
    para(bold("Bagian atas:")),
    bullet("Ikon centang hijau besar"),
    bullet("Judul: \"Terima Kasih!\" (hijau)"),
    bullet("Teks: \"Anda telah menyelesaikan seluruh kuesioner pembobotan.\""),
    spacer(60),
    para(bold("Identitas Responden: "), text("Nama, Instansi, Posisi")),
    spacer(60),
    para(bold("Rekap Pembobotan (Jumlah Terisi):")),
    para(text("Daftar semua kategori beserta jumlah perbandingan yang telah diisi.")),
    spacer(60),
    para(bold("Tombol aksi:")),
    bullet("\"Kembali\" — Menutup modal, kembali ke halaman kuesioner"),
    bullet("\"OK, Selesai\" — Mereset seluruh form dan kembali ke kondisi awal"),
    imagePlaceholder("Gambar 35. Modal Terima Kasih dan Rekap Pengisian"),
    captionText("Gambar 35. Modal Terima Kasih dan Rekap Pengisian"),
    pageBreak(),
  ];
}

function glossarySection() {
  return [
    heading1("7. Daftar Istilah"),
    createTable(
      ["Istilah", "Definisi"],
      [
        ["Fuzzy AHP", "Analytical Hierarchy Process menggunakan logika fuzzy (TFN) untuk menangani ketidakpastian penilaian pakar"],
        ["TFN", "Triangular Fuzzy Number — bilangan fuzzy dengan tiga komponen (l, m, u): lower, middle, upper"],
        ["Pairwise Comparison", "Perbandingan berpasangan antara dua kriteria untuk menentukan kepentingan relatif"],
        ["Skala Saaty", "Skala 1–9 dalam metode AHP: 1 = Sama Penting, 9 = Mutlak Lebih Penting"],
        ["Critical Point (CP)", "Titik kritis dalam rantai pasok halal yang memerlukan evaluasi (CP1–CP9)"],
        ["FSE", "Fuzzy Synthetic Extent — metode menghitung prioritas dari matriks fuzzy"],
        ["CoA", "Center of Area — metode defuzzifikasi: Crisp = (l+m+u)/3"],
        ["CR", "Consistency Ratio — ukuran konsistensi matriks. CR < 0.10 = konsisten"],
        ["CI", "Consistency Index — (λ_max − n) / (n − 1)"],
        ["RI", "Random Index — nilai acak standar berdasarkan ukuran matriks"],
        ["Defuzzifikasi", "Proses mengubah bilangan fuzzy menjadi nilai tunggal (crisp)"],
        ["Normalisasi", "Proses menyekalakan bobot agar total = 100%"],
        ["Rata-rata Geometris", "Metode agregasi jawaban pakar: ⁿ√(x₁ × x₂ × ... × xₙ)"],
        ["Bobot Global", "Bobot akhir setelah normalisasi yang menunjukkan tingkat kepentingan relatif"],
      ],
      [22, 78],
    ),
    spacer(400),
    horizontalRule(),
    new Paragraph({
      children: [
        new TextRun({ text: "Versi Dokumen: 1.1 (Fokus K1 V1 & Fuzzy AHP)", font: FONT, size: FONT_SIZE_SMALL, color: COLOR_GRAY }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
          font: FONT, size: FONT_SIZE_SMALL, color: COLOR_GRAY,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Modul: Kuesioner 1 Versi 1 — Pembobotan Fuzzy AHP", font: FONT, size: FONT_SIZE_SMALL, color: COLOR_GRAY }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];
}


// ═══════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════

const doc = new Document({
  creator: "Sistem Halal Supply Chain — KMS & DSS",
  title: "Buku Manual K1 V1 — Pembobotan Fuzzy AHP",
  description: "Buku Manual Pengguna Modul Kuesioner 1 Versi 1 — Pembobotan Fuzzy AHP",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        pageNumbers: { start: 1 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: "Buku Manual K1 V1 — Pembobotan Fuzzy AHP", font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY, italics: true })],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: FOOTER_TEXT, font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY }),
            new TextRun({ text: "   |   Halaman ", font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY }),
            new TextRun({ text: " dari ", font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children: [
      ...coverPage(),
      ...daftarIsiSection(),
      ...pendahuluanSection(),
      ...useCaseSection(),
      ...erdSection(),
      ...activityDiagramSection(),
      ...adminSection(),
      ...pakarSection(),
      ...glossarySection(),
    ],
  }],
});

// ═══════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════

const OUTPUT_PATH = "./docs/Buku_Manual_K1V1_FuzzyAHP.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`✅ Berhasil membuat: ${OUTPUT_PATH}`);
  console.log(`   Ukuran file: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch((err) => {
  console.error("❌ Gagal membuat docx:", err);
});
