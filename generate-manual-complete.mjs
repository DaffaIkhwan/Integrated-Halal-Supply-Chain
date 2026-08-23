// generate-manual-complete.mjs
// Script untuk menghasilkan Buku Manual Lengkap Sistem Halal Supply Chain v2.0
// Mencakup: Use Case, ERD, Activity Diagram, K1, K2, K3, DSS, Chatbot, Dashboard
// Jalankan: node generate-manual-complete.mjs

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  Footer, Header, ShadingType, VerticalAlign, PageBreak,
} from "docx";
import * as fs from "fs";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STYLE CONSTANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const FONT = "Calibri";
const FONT_SIZE_BODY = 22;   // 11pt
const FONT_SIZE_SMALL = 18;  // 9pt
const FONT_SIZE_H1 = 32;    // 16pt
const FONT_SIZE_H2 = 28;    // 14pt
const FONT_SIZE_H3 = 24;    // 12pt
const FONT_SIZE_FOOTER = 16; // 8pt

const COLOR_PRIMARY = "0891B2";   // cyan-600
const COLOR_SECONDARY = "059669"; // emerald-600
const COLOR_DARK = "1E293B";      // slate-800
const COLOR_GRAY = "64748B";      // slate-500
const COLOR_LIGHT_BG = "F0FDFA";  // teal-50
const COLOR_TABLE_HEADER = "0E7490"; // cyan-700
const COLOR_TABLE_HEADER_TEXT = "FFFFFF";
const COLOR_TABLE_ALT = "F0F9FF";    // sky-50
const COLOR_WARNING = "DC2626";      // red-600
const COLOR_SUCCESS = "059669";      // emerald-600

const FOOTER_TEXT = "Buku Manual Pengguna v2.0 \u2014 Sistem Halal Supply Chain Terintegrasi (KMS & DSS)";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HELPER FUNCTIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function heading1(t) {
  return new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_H1, bold: true, color: COLOR_PRIMARY })], heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 } });
}
function heading2(t) {
  return new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_H2, bold: true, color: COLOR_DARK })], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 160 } });
}
function heading3(t) {
  return new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_H3, bold: true, color: COLOR_SECONDARY })], heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 } });
}
function para(...runs) {
  return new Paragraph({ children: runs, spacing: { after: 120, line: 276 } });
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
  return new Paragraph({ children: [text(t)], bullet: { level }, spacing: { after: 60, line: 276 } });
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
    children: [new TextRun({ text: `[${caption}]`, font: FONT, size: FONT_SIZE_BODY, italics: true, color: COLOR_GRAY })],
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 },
    border: {
      top: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" }, bottom: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" }, right: { style: BorderStyle.DASHED, size: 1, color: "CBD5E1" },
    },
    shading: { type: ShadingType.SOLID, color: "F8FAFC" },
  });
}
function captionText(t) {
  return new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_SMALL, italics: true, color: COLOR_GRAY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } });
}
function noteBox(title, content) {
  return new Paragraph({
    children: [new TextRun({ text: `${title}: `, font: FONT, size: FONT_SIZE_BODY, bold: true, color: COLOR_PRIMARY }), new TextRun({ text: content, font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK })],
    spacing: { before: 80, after: 120 }, shading: { type: ShadingType.SOLID, color: COLOR_LIGHT_BG }, indent: { left: 200, right: 200 },
  });
}
function warningBox(content) {
  return new Paragraph({
    children: [new TextRun({ text: "\u26A0 PERINGATAN: ", font: FONT, size: FONT_SIZE_BODY, bold: true, color: COLOR_WARNING }), new TextRun({ text: content, font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK })],
    spacing: { before: 80, after: 120 }, shading: { type: ShadingType.SOLID, color: "FEF2F2" }, indent: { left: 200, right: 200 },
  });
}
function horizontalRule() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" } } });
}

function headerCell(t, width) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: FONT_SIZE_SMALL, bold: true, color: COLOR_TABLE_HEADER_TEXT })], alignment: AlignmentType.CENTER })],
    shading: { type: ShadingType.SOLID, color: COLOR_TABLE_HEADER }, verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}
function dataCell(t, opts = {}) {
  const { align, shading: shade, boldText } = opts;
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(t), font: FONT, size: FONT_SIZE_SMALL, bold: !!boldText, color: COLOR_DARK })], alignment: align || AlignmentType.LEFT })],
    shading: shade ? { type: ShadingType.SOLID, color: shade } : undefined, verticalAlign: VerticalAlign.CENTER, margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}
function createTable(headers, rows, colWidths) {
  const headerRow = new TableRow({ children: headers.map((h, i) => headerCell(h, colWidths?.[i])), tableHeader: true });
  const dataRows = rows.map((row, rowIdx) => new TableRow({ children: row.map((cell, colIdx) => dataCell(cell, { shading: rowIdx % 2 === 1 ? COLOR_TABLE_ALT : undefined, boldText: colIdx === 0 })) }));
  return new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COVER PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function coverPage() {
  return [
    spacer(1600),
    new Paragraph({ children: [new TextRun({ text: "BUKU PANDUAN PENGGUNA", font: FONT, size: 52, bold: true, color: COLOR_PRIMARY })], alignment: AlignmentType.CENTER }),
    spacer(100),
    new Paragraph({ children: [new TextRun({ text: "(USER MANUAL)", font: FONT, size: 36, bold: true, color: COLOR_DARK })], alignment: AlignmentType.CENTER }),
    spacer(200),
    new Paragraph({ children: [new TextRun({ text: "Sistem Informasi Manajemen", font: FONT, size: 28, color: COLOR_GRAY })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: "Integrated Halal Supply Chain", font: FONT, size: 36, bold: true, color: COLOR_DARK })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: "Knowledge Management & Decision Support System", font: FONT, size: 24, color: COLOR_GRAY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    horizontalRule(), spacer(200),
    new Paragraph({ children: [new TextRun({ text: "Modul Lengkap: K1 Fuzzy AHP \u00B7 K2 Pengukuran Risiko \u00B7 K3 Kondisi Aktual \u00B7 AI Chatbot", font: FONT, size: 22, color: COLOR_SECONDARY, bold: true })], alignment: AlignmentType.CENTER }),
    spacer(400), horizontalRule(), spacer(200),
    new Paragraph({ children: [new TextRun({ text: "Versi Dokumen: 2.0 (Lengkap)", font: FONT, size: FONT_SIZE_BODY, color: COLOR_GRAY })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`, font: FONT, size: FONT_SIZE_BODY, color: COLOR_GRAY })], alignment: AlignmentType.CENTER }),
    pageBreak(),
  ];
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DAFTAR ISI
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function daftarIsi() {
  return [
    heading1("DAFTAR ISI"), spacer(100),
    ...[
      "1. Pendahuluan", "   1.1 Tujuan Sistem", "   1.2 Hak Akses Pengguna (Roles)", "   1.3 Alur Kerja Umum Sistem",
      "2. Use Case Diagram", "   2.1 Deskripsi Aktor", "   2.2 Daftar Use Case Keseluruhan Sistem",
      "3. Entity Relationship Diagram (ERD)", "   3.1 Gambaran Umum ERD", "   3.2 Entitas & Atribut Utama", "   3.3 Penjelasan Relasi Antar Entitas",
      "4. Activity Diagram", "   4.1 Pengisian K1 \u2014 Pembobotan Fuzzy AHP", "   4.2 Pengisian K2 \u2014 Pengukuran Risiko", "   4.3 Pengisian K3 \u2014 Kondisi Aktual", "   4.4 Penggunaan Halal AI Chatbot", "   4.5 Pengelolaan Dashboard & Rekap (Admin)",
      "5. Arsitektur Sistem", "   5.1 Modul Kuesioner Pembobotan (Fuzzy AHP)", "   5.2 Modul Kuesioner Kondisi Aktual & Risiko", "   5.3 Modul Halal AI Chatbot (RAG & NLP)", "   5.4 Struktur Database",
      "6. Kuesioner 1 \u2014 Pembobotan Fuzzy AHP (Pakar)", "   6.1 Mengakses Kuesioner 1", "   6.2 Pengisian Profil Responden", "   6.3 Tahap Pengisian Perbandingan Berpasangan", "   6.4 Cara Membaca Slider Skala Saaty", "   6.5 Submit dan Auto-Lanjut", "   6.6 Hasil Kalkulasi Fuzzy AHP", "   6.7 Daftar Sub-Kriteria Per CP",
      "7. Kuesioner 2 \u2014 Pengukuran Tingkat Risiko (Auditor)", "   7.1 Mengakses Kuesioner 2", "   7.2 Skala Tingkat Risiko (Likert 1\u20135)", "   7.3 Memilih Tab CP", "   7.4 Memilih Batch / Data Aktual K3", "   7.5 Pengisian Identitas Auditor", "   7.6 Penilaian Indikator Per Sub-Kriteria", "   7.7 Submit Penilaian K2",
      "8. Kuesioner 3 \u2014 Form Kondisi Aktual (Responden Lapangan)", "   8.1 Mengakses Kuesioner 3", "   8.2 Memilih Tab CP & Latar Belakang", "   8.3 Pengisian Indikator", "   8.4 Validasi Supervisor", "   8.5 Submit Kondisi Aktual",
      "9. Kalkulasi Skor Risiko (DSS)",
      "10. Halal AI Chatbot", "   10.1 Mengakses Chatbot", "   10.2 Fitur Antarmuka Chat", "   10.3 Alur Kerja Chatbot (IndoBERT + RAG + LLM)", "   10.4 Kategori Intent & Tools", "   10.5 Knowledge Base & RAG (Admin)", "   10.6 Contoh Prompt dan Respons",
      "11. Dashboard Admin", "   11.1 Dashboard Utama", "   11.2 Master Data & Pengguna", "   11.3 Laporan & Rekapitulasi",
      "12. Penutup",
    ].map(item => para(text(item))),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 1: PENDAHULUAN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab1() {
  return [
    heading1("1. PENDAHULUAN"),
    heading2("1.1 Tujuan Sistem"),
    para(text("Sistem Informasi Manajemen Halal Supply Chain Terintegrasi adalah platform digital yang menggabungkan "), bold("Decision Support System (DSS)"), text(" berbasis Fuzzy AHP dan "), bold("Knowledge Management System (KMS)"), text(" yang ditenagai oleh kecerdasan buatan (Halal AI Chatbot). Sistem ini dirancang untuk memastikan ketertelusuran ("), italic("traceability"), text(") halal, mengukur skor risiko pada titik-titik kritis (Critical Points / CP1\u2013CP9), dan menyediakan asisten virtual cerdas terkait regulasi dan operasional halal.")),
    spacer(80),
    imagePlaceholder("Gambar 1.1. Halaman Utama Sistem Halal Supply Chain"), captionText("Gambar 1.1. Halaman Utama Sistem Halal Supply Chain"),
    heading2("1.2 Hak Akses Pengguna (Roles)"),
    para(text("Sistem memiliki beberapa tingkatan akses pengguna:")),
    createTable(["No", "Role", "Deskripsi", "Akses Menu"], [
      ["1", "ADMIN", "Kontrol penuh: manajemen user, master data, Knowledge Base, dan monitoring rekapitulasi.", "Semua menu"],
      ["2", "PAKAR_K1", "Pakar yang mengisi Kuesioner 1 (Pembobotan Fuzzy AHP) untuk menentukan bobot prioritas kriteria.", "Kuesioner 1, Dashboard"],
      ["3", "PAKAR_K2", "Auditor yang mengisi Kuesioner 2 (Pengukuran Tingkat Risiko) untuk menilai kepatuhan halal.", "Kuesioner 2, Dashboard"],
      ["4", "CP1_FARM s.d. CP9_RETAIL", "Responden lapangan yang mengisi Kuesioner 3 (Kondisi Aktual) sesuai titik kritis.", "Kuesioner 3 (sesuai CP), Dashboard"],
      ["5", "General User", "Pengguna yang memanfaatkan Halal AI Chatbot untuk melacak status halal.", "Chatbot"],
    ], [5, 18, 50, 27]),
    spacer(80), imagePlaceholder("Gambar 1.2. Halaman Login Sistem"), captionText("Gambar 1.2. Halaman Login Sistem"),
    heading2("1.3 Alur Kerja Umum Sistem"),
    para(text("Diagram berikut menggambarkan alur kerja keseluruhan sistem dari input data hingga output analisis risiko:")),
    para(bold("\u2460 Pakar K1 "), text("mengisi Kuesioner 1 (Perbandingan Berpasangan Fuzzy AHP) \u2192 menghasilkan "), bold("Bobot Global & Lokal CP.")),
    para(bold("\u2461 Auditor K2 "), text("mengisi Kuesioner 2 (Penilaian Risiko skala 1\u20135) untuk setiap indikator.")),
    para(bold("\u2462 Responden Lapangan K3 "), text("mengisi Kuesioner 3 (Kondisi Aktual: ketersediaan bukti, upload file, validasi supervisor).")),
    para(bold("\u2463 DSS Engine "), text("mengalkulasi: Bobot (K1) \u00D7 Nilai Aktual (K3) = "), bold("Skor Risiko Total per Batch.")),
    para(bold("\u2464 Dashboard Admin "), text("menampilkan rekapitulasi risiko; "), bold("AI Chatbot "), text("menjawab pertanyaan berdasarkan data Traceability & Knowledge Base.")),
    spacer(80), imagePlaceholder("Gambar 1.3. Diagram Alur Kerja Sistem \u2014 K1, K2, K3, DSS Engine, Chatbot"), captionText("Gambar 1.3. Diagram Alur Kerja Sistem"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 2: USE CASE DIAGRAM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab2() {
  return [
    heading1("2. USE CASE DIAGRAM"),
    para(text("Diagram berikut menggambarkan interaksi seluruh aktor dengan fitur-fitur yang tersedia pada sistem Halal Supply Chain.")),
    spacer(80), imagePlaceholder("Gambar 2.1. Use Case Diagram \u2014 Sistem Halal Supply Chain Keseluruhan"), captionText("Gambar 2.1. Use Case Diagram"),
    heading2("2.1 Deskripsi Aktor"),
    createTable(["No", "Aktor", "Deskripsi"], [
      ["1", "Admin", "Mengelola pengguna, master data (Farm, RPH, Batch, Sapi), Knowledge Base chatbot, melihat rekap K1/K2/K3, tahapan Fuzzy AHP, dan monitoring dashboard."],
      ["2", "Pakar K1", "Mengisi kuesioner pembobotan pairwise comparison (Kriteria Umum, Antar CP, Sub-Kriteria per CP) menggunakan Skala Saaty."],
      ["3", "Auditor K2", "Mengisi kuesioner pengukuran tingkat risiko (Likert 1\u20135) dengan cross-referencing data K3."],
      ["4", "Responden Lapangan K3", "Mengisi form kondisi aktual kepatuhan halal di masing-masing CP, mengunggah bukti pendukung, dan memvalidasi via Supervisor."],
      ["5", "General User (Chatbot)", "Berinteraksi dengan Halal AI Chatbot untuk menanyakan regulasi halal, mengecek risiko, atau melacak batch produk."],
    ], [6, 20, 74]),
    heading2("2.2 Daftar Use Case Keseluruhan Sistem"),
    createTable(["No", "Use Case", "Aktor", "Deskripsi"], [
      ["UC1", "Login ke Sistem", "Semua", "Autentikasi menggunakan email dan password"],
      ["UC2", "Mengelola User", "Admin", "Menambah, mengedit, ban/unban, atau menghapus akun pengguna dan mengatur role"],
      ["UC3", "Mengelola Master Data", "Admin", "CRUD data Farm, RPH, Batch Sapi, Transporter, Gudang, Distributor, Retail"],
      ["UC4", "Mengelola Knowledge Base", "Admin", "Upload dokumen (PDF/TXT), proses chunking & embedding vektor untuk RAG chatbot"],
      ["UC5", "Melihat Rekap K1", "Admin", "Melihat data pembobotan per pakar (card view), detail perbandingan, edit/hapus, export Excel"],
      ["UC6", "Melihat Tahapan Fuzzy AHP", "Admin", "Melihat 8 langkah kalkulasi Fuzzy AHP (matriks TFN, FSE, defuzzifikasi, CR)"],
      ["UC7", "Melihat Rekap K2 & K3", "Admin", "Melihat ringkasan penilaian risiko (K2) dan kondisi aktual (K3) per CP"],
      ["UC8", "Melihat Dashboard Risiko", "Admin", "Monitoring statistik batch, distribusi risiko, tabel CP, dan batch terbaru"],
      ["UC9", "Mengisi Biodata Responden", "Pakar K1", "Mengisi nama, keahlian, instansi, pengalaman, email, tanggal"],
      ["UC10", "Mengisi Pembobotan KU", "Pakar K1", "Perbandingan berpasangan Kriteria Umum (slider Saaty 1\u20139)"],
      ["UC11", "Mengisi Pembobotan CP Level", "Pakar K1", "Perbandingan berpasangan antar CP1\u2013CP9 (36 pasangan)"],
      ["UC12", "Mengisi Pembobotan Sub-Kriteria", "Pakar K1", "Perbandingan sub-kriteria di setiap CP (CP1\u2013CP9)"],
      ["UC13", "Memilih Batch K3", "Auditor K2", "Memilih data kondisi aktual K3 yang akan dinilai"],
      ["UC14", "Mengisi Identitas Auditor", "Auditor K2", "Mengisi nama, jabatan, instansi, nomor sertifikat"],
      ["UC15", "Menilai Indikator Risiko", "Auditor K2", "Memberikan skor risiko (1\u20135) dan kesesuaian bukti per indikator per CP"],
      ["UC16", "Memilih Batch/Kode Ternak", "Responden K3", "Memilih earTag sapi dari dropdown master data"],
      ["UC17", "Mengisi Ketersediaan Bukti", "Responden K3", "Mengisi Ya/Tidak ketersediaan dokumen per indikator"],
      ["UC18", "Mengunggah File Bukti", "Responden K3", "Upload file pendukung (PDF, TXT, gambar) ke server"],
      ["UC19", "Validasi Supervisor", "Responden K3", "Supervisor mengisi verifikasi, tingkat risiko, dan tindakan korektif"],
      ["UC20", "Bertanya via Chatbot", "General User", "Mengirim pertanyaan dalam Bahasa Indonesia ke AI chatbot"],
      ["UC21", "Scan QR Code Batch", "General User", "Memindai QR code untuk melacak batch langsung di chatbot"],
      ["UC22", "Melihat Riwayat Chat", "General User", "Melihat, melanjutkan, atau menghapus sesi percakapan sebelumnya"],
    ], [5, 22, 12, 61]),
    noteBox("Catatan", "Diagram Use Case di atas mencakup seluruh fitur sistem. Untuk detail alur per fitur, lihat Bab 4 (Activity Diagram)."),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 3: ERD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab3() {
  return [
    heading1("3. ENTITY RELATIONSHIP DIAGRAM (ERD)"),
    para(text("ERD berikut menggambarkan seluruh entitas database yang terlibat dalam sistem, meliputi modul autentikasi, traceability, DSS (Fuzzy AHP), kuesioner, dan chatbot (RAG).")),
    heading2("3.1 Gambaran Umum ERD"),
    imagePlaceholder("Gambar 3.1. Entity Relationship Diagram \u2014 Keseluruhan Sistem Halal Supply Chain"), captionText("Gambar 3.1. ERD Keseluruhan Sistem"),
    noteBox("Catatan", "Diagram ERD mencakup 30+ tabel yang saling berelasi. Tabel pusat adalah HalalBatch yang menghubungkan seluruh entitas traceability, penilaian risiko, dan data lapangan."),
    heading2("3.2 Entitas & Atribut Utama"),
    heading3("a. User (Pengguna & Autentikasi)"),
    createTable(["Atribut", "Tipe", "Keterangan"], [
      ["id", "UUID (PK)", "Primary key"], ["name", "String", "Nama lengkap"], ["email", "String (Unique)", "Email untuk login"],
      ["password", "String", "Password (hashed bcrypt)"], ["role", "String", "ADMIN, PAKAR_K1, PAKAR_K2, CP1_FARM s.d. CP9_RETAIL"],
      ["isBanned", "Boolean", "Status banned"], ["organization", "String (nullable)", "Asal organisasi/instansi"],
    ], [22, 22, 56]),
    spacer(80),
    heading3("b. HalalBatch (Pusat Data Traceability)"),
    createTable(["Atribut", "Tipe", "Keterangan"], [
      ["id", "String (PK)", "ID Batch unik"], ["cattleId", "String (FK)", "Referensi ke Cattle (sapi)"],
      ["slaughterhouseId", "String (FK)", "Referensi ke Slaughterhouse (RPH)"], ["productionDate", "DateTime", "Tanggal produksi"],
      ["totalRiskScore", "Float", "Skor risiko total (kalkulasi DSS)"], ["riskLevel", "String", "LOW / MODERATE / HIGH / CRITICAL"],
    ], [22, 22, 56]),
    spacer(80),
    heading3("c. Entitas Traceability (Farm \u2192 Retail)"),
    createTable(["Entitas", "Atribut Utama", "Relasi"], [
      ["Cattle", "earTag, breed, birthDate, farmId", "Belongs to Farm; Has many HalalBatch"],
      ["Farm", "name, location, address", "Has many Cattle"], ["Slaughterhouse", "name, location", "Has many HalalBatch"],
      ["Transporter", "name, vehicleNumber, vehicleType", "Referenced by HalalBatch"],
      ["ProcessingPlant", "name, location, productionType", "Referenced by HalalBatch"],
      ["Warehouse", "name, location, storageType", "Referenced by HalalBatch"],
      ["Distributor", "name, location, coverageArea", "Referenced by HalalBatch"],
      ["RetailOutlet", "name, location, outletType", "Referenced by HalalBatch"],
    ], [18, 38, 44]),
    spacer(80),
    heading3("d. CriticalPoint & CriteriaWeight (Fuzzy AHP)"),
    createTable(["Atribut", "Tipe", "Keterangan"], [
      ["CriticalPoint.id", "String (PK)", "CP1 sampai CP9"], ["CriticalPoint.name", "String", "Nama titik kritis"],
      ["CriticalPoint.globalWeight", "Float", "Bobot global dari Fuzzy AHP"], ["CriticalPoint.localRiskScore", "Float", "Skor risiko lokal"],
      ["CriticalPoint.globalWeightedRisk", "Float", "Bobot \u00D7 Risiko"], ["CriticalPoint.riskLevel", "String", "Low / Moderate / High / Critical"],
      ["CriteriaWeight.criteriaCode", "String", "Kode sub-kriteria (R1, F1, T1, dll.)"], ["CriteriaWeight.criteriaName", "String", "Nama sub-kriteria"],
      ["CriteriaWeight.weight", "Float", "Bobot sub-kriteria dari Fuzzy AHP Level 2"],
    ], [30, 18, 52]),
    spacer(80),
    heading3("e. PairwiseComparison (Matriks AHP)"),
    createTable(["Atribut", "Tipe", "Keterangan"], [
      ["id", "UUID (PK)", "Primary key"], ["matrixType", "String", "KU_LEVEL / LEVEL1_CP / LEVEL2_CPx"],
      ["rowCode / colCode", "String", "Kode baris/kolom (CP1, R1, F1, dll.)"], ["tfnLow / tfnMid / tfnUp", "Float", "Triangular Fuzzy Number [l, m, u]"],
      ["evaluatorId", "String (nullable)", "ID pakar yang mengisi"],
    ], [28, 22, 50]),
    spacer(80),
    heading3("f. QuestionnaireResponse (Data Kuesioner K1/K2/K3)"),
    createTable(["Atribut", "Tipe", "Keterangan"], [
      ["id", "UUID (PK)", "Primary key"], ["questionnaireType", "String", '"pembobotan" (K1), "risiko" (K2), atau "aktual" (K3)'],
      ["cpId", "String (nullable)", "null untuk KU/CP_LEVEL, atau CP1\u2013CP9"], ["respondentName", "String", "Nama responden/pakar/auditor"],
      ["respondentRole", "String", "Jabatan/posisi"], ["respondentOrg", "String", "Instansi/organisasi"],
      ["respondentInfo", "JSON", "Biodata lengkap (keahlian, pengalaman, sertifikat, dll.)"],
      ["answers", "JSON", "Data jawaban: perbandingan (K1), skor risiko (K2), ketersediaan bukti (K3)"],
      ["files", "JSON", "Daftar file bukti yang diupload (K3)"], ["notes", "JSON", "Catatan tambahan, info supervisor (K3)"],
      ["status", "String", "SUBMITTED / REVIEWED / APPROVED"],
    ], [22, 20, 58]),
    spacer(80),
    heading3("g. CP Detail Records (CP1\u2013CP9)"),
    createTable(["Tabel", "CP", "Jumlah Sub-Kriteria", "Contoh Field Risiko"], [
      ["CP1FarmRecord", "CP1 Farm/Kandang", "7", "asalUsulRisk, kesehatanRisk, kepatuhanPakanRisk, ..."],
      ["CP2FeedRecord", "CP2 Pakan & Kesehatan", "5", "halalFeedStatusRisk, supplierRisk, feedStorageRisk, ..."],
      ["CP3TransportRecord", "CP3 Transportasi", "5", "kelayakanRisk, kebersihanRisk, animalWelfareRisk, ..."],
      ["CP4SlaughterRecord", "CP4 RPH/Penyembelihan", "10", "sertifikatHalalRisk, kompetensiSembelihRisk, ..."],
      ["CP5PostSlaughterRecord", "CP5 Post-Slaughter", "5", "handlingRisk, sanitasiRisk, batchIdRisk, ..."],
      ["CP6ProcessingRecord", "CP6 Pengolahan", "7", "halalIngredientsRisk, equipmentRisk, ..."],
      ["CP7StorageRecord", "CP7 Cold Storage", "7", "temperatureRisk, segregasiRisk, hygieneRisk, ..."],
      ["CP8DistributionRecord", "CP8 Distribusi", "7", "dedicatedTransRisk, vehicleSanitasiRisk, ..."],
      ["CP9RetailRecord", "CP9 Retail", "7", "labelHalalRisk, displayRisk, storageTemRisk, ..."],
    ], [22, 20, 13, 45]),
    spacer(80),
    heading3("h. RAG / Chatbot"),
    createTable(["Tabel", "Deskripsi"], [
      ["HalalDocument", "Dokumen Knowledge Base lengkap (title, content, embedding vektor 384-dimensi, metadata)"],
      ["oai (items)", "Chunk dokumen beserta embedding vektor untuk pencarian semantik RAG"],
      ["ChatbotLog", "Log percakapan chatbot (query, intent, response, sourceType)"],
      ["IncidentLog", "Log insiden halal (tipe, severity, corrective action, status)"],
    ], [22, 78]),
    heading2("3.3 Penjelasan Relasi Antar Entitas"),
    createTable(["Relasi", "Penjelasan"], [
      ["User \u2192 QuestionnaireResponse", "Satu pengguna dapat mengisi banyak kuesioner (K1/K2/K3)"],
      ["QuestionnaireResponse \u2192 PairwiseComparison", "Jawaban K1 diagregatkan menjadi matriks perbandingan berpasangan"],
      ["PairwiseComparison \u2192 CriticalPoint", "Matriks diproses Fuzzy AHP untuk menghasilkan bobot global setiap CP"],
      ["CriticalPoint \u2192 CriteriaWeight", "Setiap CP memiliki sub-kriteria dengan bobot dari pembobotan"],
      ["Cattle \u2192 Farm", "Setiap sapi berasal dari satu peternakan"],
      ["HalalBatch \u2192 Cattle", "Setiap batch terkait satu sapi (earTag)"],
      ["HalalBatch \u2192 Slaughterhouse", "Setiap batch dipotong di satu RPH"],
      ["HalalBatch \u2192 CriticalPointRecord", "Satu batch memiliki 9 record penilaian CP"],
      ["CriticalPointRecord \u2192 CriticalPoint", "Mereferensi CP mana yang dinilai (CP1\u2013CP9)"],
      ["HalalBatch \u2192 CP1FarmRecord s.d. CP9RetailRecord", "Skor risiko detail per sub-kriteria per batch"],
    ], [35, 65]),
    imagePlaceholder("Gambar 3.2. Diagram Relasi Antar Tabel \u2014 HalalBatch sebagai Pusat Data"), captionText("Gambar 3.2. Diagram Relasi Antar Tabel"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 4: ACTIVITY DIAGRAM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab4() {
  return [
    heading1("4. ACTIVITY DIAGRAM"),
    para(text("Bab ini menggambarkan alur aktivitas (activity diagram) untuk setiap fitur utama sistem.")),

    heading2("4.1 Pengisian K1 \u2014 Pembobotan Fuzzy AHP (Pakar)"),
    para(text("Diagram berikut menggambarkan alur pengisian kuesioner pembobotan oleh Pakar K1, dari login hingga selesai.")),
    imagePlaceholder("Gambar 4.1. Activity Diagram \u2014 Pengisian K1 Pembobotan Fuzzy AHP"), captionText("Gambar 4.1. Activity Diagram \u2014 Pengisian K1"),
    heading3("Deskripsi Alur K1:"),
    numberedItem(1, "Pakar login menggunakan email dan password yang didaftarkan Admin."),
    numberedItem(2, "Sistem memvalidasi kredensial. Jika gagal, tampilkan error."),
    numberedItem(3, "Pakar mengisi biodata responden (nama, keahlian, instansi, pengalaman)."),
    numberedItem(4, "Sistem memuat tab pertama: Kriteria Umum (KU Level)."),
    numberedItem(5, "Pakar menggeser slider perbandingan berpasangan (Skala Saaty 1\u20139) untuk setiap pasangan."),
    numberedItem(6, "Pakar klik Simpan Pembobotan \u2192 muncul modal konfirmasi."),
    numberedItem(7, "Data dikirim ke API dan disimpan ke database (QuestionnaireResponse)."),
    numberedItem(8, "Sistem otomatis berpindah ke tab berikutnya (KU \u2192 CP Level \u2192 CP1 \u2192 CP2 \u2192 ... \u2192 CP9)."),
    numberedItem(9, "Setelah semua kategori selesai, muncul halaman Terima Kasih."),
    numberedItem(10, "Di backend: API /api/dss/recalculate menjalankan Fuzzy AHP \u2192 update bobot global."),
    spacer(100),

    heading2("4.2 Pengisian K2 \u2014 Pengukuran Risiko (Auditor)"),
    para(text("Diagram berikut menggambarkan alur penilaian tingkat risiko oleh Auditor K2.")),
    imagePlaceholder("Gambar 4.2. Activity Diagram \u2014 Pengisian K2 Pengukuran Risiko"), captionText("Gambar 4.2. Activity Diagram \u2014 Pengisian K2"),
    heading3("Deskripsi Alur K2:"),
    numberedItem(1, "Auditor login dengan akun PAKAR_K2 dan membuka halaman Kuesioner 2."),
    numberedItem(2, "Auditor memilih tab CP yang ingin dinilai (CP1\u2013CP9)."),
    numberedItem(3, "Auditor memilih Batch / Data Aktual K3 dari dropdown (cross-referencing)."),
    numberedItem(4, "Sistem menampilkan data latar belakang K3 yang dipilih (read-only)."),
    numberedItem(5, "Auditor mengisi identitas (nama, jabatan, instansi, nomor sertifikat)."),
    numberedItem(6, "Untuk setiap indikator: Auditor menilai kesesuaian dokumen (Sesuai/Tidak) dan memberi skor risiko (1\u20135)."),
    numberedItem(7, "Toast notification menampilkan deskripsi skala saat skor dipilih."),
    numberedItem(8, "Auditor mengisi catatan pada setiap sub-kriteria."),
    numberedItem(9, "Klik Simpan \u2192 data disimpan ke QuestionnaireResponse (type: risiko)."),
    numberedItem(10, "Sistem otomatis pindah ke CP berikutnya. Setelah CP9, selesai."),
    spacer(100),

    heading2("4.3 Pengisian K3 \u2014 Kondisi Aktual (Responden Lapangan)"),
    para(text("Diagram berikut menggambarkan alur pengisian form kondisi aktual oleh responden lapangan.")),
    imagePlaceholder("Gambar 4.3. Activity Diagram \u2014 Pengisian K3 Kondisi Aktual"), captionText("Gambar 4.3. Activity Diagram \u2014 Pengisian K3"),
    heading3("Deskripsi Alur K3:"),
    numberedItem(1, "Responden login dengan akun CP-specific (misal CP1_FARM) \u2192 hanya tab CP-nya yang muncul."),
    numberedItem(2, "Responden memilih Batch/Kode Ternak dari dropdown master data."),
    numberedItem(3, "Responden mengisi latar belakang (PIC, jabatan, farm/RPH, shift, tanggal)."),
    numberedItem(4, "Untuk setiap indikator: mengisi ketersediaan bukti (Ya/Tidak), upload file pendukung, dan kesesuaian (Sesuai/Tidak)."),
    numberedItem(5, "File diupload ke server (Google Drive API) secara otomatis."),
    numberedItem(6, "Supervisor mengisi bagian validasi: nama, hasil verifikasi, tingkat risiko (1\u20135), tindakan korektif."),
    numberedItem(7, "Sistem menghitung statistik kepatuhan (% Sesuai) secara otomatis."),
    numberedItem(8, "Klik Simpan \u2192 data disimpan ke QuestionnaireResponse (type: aktual)."),
    numberedItem(9, "Sistem otomatis pindah ke CP berikutnya (jika role memiliki akses multi-CP)."),
    spacer(100),

    heading2("4.4 Penggunaan Halal AI Chatbot (User)"),
    para(text("Diagram berikut menggambarkan alur interaksi pengguna dengan AI Chatbot.")),
    imagePlaceholder("Gambar 4.4. Activity Diagram \u2014 Penggunaan Halal AI Chatbot"), captionText("Gambar 4.4. Activity Diagram \u2014 Halal AI Chatbot"),
    heading3("Deskripsi Alur Chatbot:"),
    numberedItem(1, "User membuka halaman Chatbot (/chat) atau memindai QR Code (/chat?trace=TAG-xxx)."),
    numberedItem(2, "User mengetik pertanyaan dalam Bahasa Indonesia dan mengirim."),
    numberedItem(3, "Server menerima pesan \u2192 IndoBERT mengklasifikasikan intent (6 kategori)."),
    numberedItem(4, "Jika confidence \u2265 0.7: panggil tool spesifik (RAG / Risk / Trace / Operational)."),
    numberedItem(5, "Jika confidence < 0.7: fallback ke LLM Function Calling dengan semua 4 tools."),
    numberedItem(6, "Tool mengambil data dari database/vector store."),
    numberedItem(7, "LLM (GPT-4o-mini) menyusun data mentah menjadi jawaban terstruktur."),
    numberedItem(8, "Jawaban dikirim secara streaming ke layar pengguna."),
    numberedItem(9, "Percakapan tersimpan otomatis di localStorage browser."),
    spacer(100),

    heading2("4.5 Pengelolaan Dashboard & Rekap (Admin)"),
    para(text("Diagram berikut menggambarkan alur Admin dalam mengelola dan memantau sistem.")),
    imagePlaceholder("Gambar 4.5. Activity Diagram \u2014 Pengelolaan Dashboard oleh Admin"), captionText("Gambar 4.5. Activity Diagram \u2014 Dashboard Admin"),
    heading3("Deskripsi Alur Admin:"),
    numberedItem(1, "Admin login dan diarahkan ke halaman Dashboard utama."),
    numberedItem(2, "Dashboard menampilkan statistik ringkasan (total batch, risiko tinggi, pass rate, dll.)."),
    numberedItem(3, "Admin dapat membuka menu Rekap Pembobotan (K1) \u2192 melihat card per pakar, detail perbandingan, edit/hapus, export Excel."),
    numberedItem(4, "Admin dapat membuka menu Rekap Risiko (K2) \u2192 melihat ringkasan penilaian per CP."),
    numberedItem(5, "Admin dapat membuka menu Rekap Aktual (K3) \u2192 melihat kondisi lapangan per CP termasuk file bukti."),
    numberedItem(6, "Admin dapat membuka Tahapan Fuzzy AHP \u2192 melihat kalkulasi step-by-step (8 langkah)."),
    numberedItem(7, "Admin dapat mengelola User Management: menambah/edit/ban/hapus pengguna."),
    numberedItem(8, "Admin dapat mengelola Knowledge Base: upload dokumen untuk memperkaya chatbot."),
    numberedItem(9, "Admin dapat membuka Batch Management: membuat batch baru, menghubungkan earTag ke Farm/RPH."),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 5: ARSITEKTUR SISTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab5() {
  return [
    heading1("5. ARSITEKTUR SISTEM"),
    para(text("Sistem ini terdiri dari tiga modul utama yang saling terintegrasi. Detail database sudah dibahas pada Bab 3 (ERD).")),
    heading2("5.1 Modul Kuesioner Pembobotan (Fuzzy AHP)"),
    para(text("Modul ini menerima masukan dari Pakar melalui Kuesioner Perbandingan Berpasangan dalam "), bold("3 tahap bertingkat"), text(":")),
    bullet("Kriteria Umum (KU Level): Perbandingan antar dimensi utama (Kualitas Produk, Keamanan & Kepatuhan Halal, Operasional & Logistik)."),
    bullet("Level CP (CP Level): Perbandingan kepentingan antar 9 Titik Kritis (CP1 vs CP2, CP1 vs CP3, dst.)."),
    bullet("Sub-Kriteria (Sub-Level): Perbandingan antar sub-kriteria di setiap CP."),
    para(text("Sistem melakukan fuzzifikasi skala Saaty menjadi TFN, menghitung Fuzzy Synthetic Extent, defuzzifikasi (Center of Area), dan mengecek Consistency Ratio (CR). Hasil: "), bold("Bobot Global"), text(" dan "), bold("Bobot Lokal"), text(" untuk CP1\u2013CP9.")),
    imagePlaceholder("Gambar 5.1. Arsitektur Modul Fuzzy AHP \u2014 Alur Data Pembobotan"), captionText("Gambar 5.1. Arsitektur Modul Fuzzy AHP"),
    heading2("5.2 Modul Kuesioner Kondisi Aktual & Risiko (Traceability DSS)"),
    para(text("Terdapat dua kuesioner:")),
    bullet("Kuesioner 2 (K2): Diisi oleh Auditor/Pakar K2 untuk menilai tingkat risiko pada setiap indikator (Skala Likert 1\u20135)."),
    bullet("Kuesioner 3 (K3): Diisi oleh Responden Lapangan untuk melaporkan kondisi aktual lapangan."),
    imagePlaceholder("Gambar 5.2. Arsitektur Modul Traceability DSS \u2014 Alur K2 & K3"), captionText("Gambar 5.2. Arsitektur Modul Traceability DSS"),
    heading2("5.3 Modul Halal AI Chatbot (RAG & NLP)"),
    para(text("Asisten cerdas yang menggunakan:")),
    bullet("IndoBERT (model NurfauzanDaffa/indobert-intent) untuk klasifikasi intent pengguna ke dalam 6 kategori."),
    bullet("Retrieval-Augmented Generation (RAG) untuk menjawab berdasarkan dokumen Knowledge Base."),
    bullet("LLM (GPT-4o-mini via OpenRouter) untuk menyusun jawaban terstruktur."),
    imagePlaceholder("Gambar 5.3. Arsitektur Modul Chatbot \u2014 IndoBERT + RAG + LLM Pipeline"), captionText("Gambar 5.3. Arsitektur Modul Chatbot"),
    heading2("5.4 Struktur Database"),
    para(text("Sistem didukung oleh database relasional PostgreSQL yang dikelola dengan Prisma ORM. Lihat Bab 3 (ERD) untuk detail lengkap entitas dan relasi.")),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 6: KUESIONER 1 â€” PEMBOBOTAN FUZZY AHP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab6() {
  return [
    heading1("6. KUESIONER 1 \u2014 Pembobotan Fuzzy AHP (Pakar)"),
    para(text("Tahapan ini wajib dilakukan pada awal penyusunan sistem, atau ketika ada pembaruan prioritas kriteria halal. Kuesioner ini menggunakan metode "), bold("Fuzzy Analytic Hierarchy Process (Fuzzy AHP)"), text(" dengan Skala Saaty.")),
    heading2("6.1 Mengakses Kuesioner 1"),
    numberedItem(1, "Buka halaman utama aplikasi dan pilih Login."), numberedItem(2, "Masukkan kredensial (Email & Password) dengan akun role PAKAR_K1."), numberedItem(3, "Di Dashboard, pilih menu Kuesioner Pembobotan (Kuesioner 1)."),
    spacer(80), imagePlaceholder("Gambar 6.1. Navigasi ke Menu Kuesioner 1 \u2014 Pembobotan Model"), captionText("Gambar 6.1. Navigasi ke Menu Kuesioner 1"),
    heading2("6.2 Pengisian Profil Responden (Pakar)"),
    para(text("Sebelum memulai pengisian, lengkapi data diri pakar pada form Latar Belakang Responden:")),
    createTable(["No", "Field", "Keterangan"], [["1","Nama Lengkap","Nama lengkap pakar"],["2","Jenis Kelamin","Laki-laki / Perempuan"],["3","Jenis Keahlian","Dropdown: Ahli Halal/MUI, Veteriner, Logistik, Auditor, Akademisi, Praktisi"],["4","Posisi / Jabatan","Jabatan di instansi"],["5","Nama Instansi","Asal instansi/lembaga"],["6","Pengalaman (tahun)","Lama pengalaman di bidang terkait"],["7","Email","Alamat email pakar"],["8","Tanggal Pengisian","Otomatis terisi tanggal hari ini"]], [8, 22, 70]),
    spacer(80), imagePlaceholder("Gambar 6.2. Form Latar Belakang Responden Pakar"), captionText("Gambar 6.2. Form Latar Belakang Responden Pakar"),
    heading2("6.3 Tahap Pengisian Perbandingan Berpasangan"),
    para(text("Pengisian Kuesioner 1 dilakukan dalam "), bold("3 tahap bertingkat"), text(" menggunakan tab navigasi:")),
    heading3("Tahap A: Kriteria Umum (KU Level)"),
    para(text("Membandingkan dimensi-dimensi utama satu sama lain: Kualitas Produk, Keamanan & Kepatuhan Halal, Operasional & Logistik.")),
    imagePlaceholder("Gambar 6.3. Pengisian Kriteria Umum (KU Level) \u2014 Slider Skala Saaty"), captionText("Gambar 6.3. Pengisian Kriteria Umum (KU Level)"),
    heading3("Tahap B: Level CP (CP Level)"),
    para(text("Membandingkan kepentingan relatif antar 9 Critical Points (CP1\u2013CP9). Total: C(9,2) = 36 pasangan.")),
    imagePlaceholder("Gambar 6.4. Pengisian Perbandingan Antar CP (Level CP)"), captionText("Gambar 6.4. Pengisian Perbandingan Antar CP"),
    heading3("Tahap C: Sub-Kriteria Per CP"),
    para(text("Untuk setiap CP, membandingkan sub-kriteria di dalamnya. Contoh CP4 (RPH): 10 sub-kriteria \u2192 45 pasangan.")),
    imagePlaceholder("Gambar 6.5. Pengisian Sub-Kriteria CP4 \u2014 RPH/Penyembelihan"), captionText("Gambar 6.5. Pengisian Sub-Kriteria Per CP"),
    heading2("6.4 Cara Membaca Slider Skala Saaty"),
    para(text("Slider memiliki rentang -8 sampai +8, dipetakan ke Skala Saaty 1\u20139:")),
    createTable(["Posisi Slider", "Skala Saaty", "Interpretasi"], [["0","1","Sama Penting"],["-1 atau +1","2","Nilai Antara"],["-2 atau +2","3","Sedikit Lebih Penting"],["-3 atau +3","4","Nilai Antara"],["-4 atau +4","5","Lebih Penting"],["-5 atau +5","6","Nilai Antara"],["-6 atau +6","7","Sangat Lebih Penting"],["-7 atau +7","8","Nilai Antara"],["-8 atau +8","9","Mutlak Lebih Penting"]], [25, 20, 55]),
    para(bold("Geser ke KIRI"), text(" (negatif) \u2192 Kriteria sisi kiri lebih penting. "), bold("Geser ke KANAN"), text(" (positif) \u2192 Kriteria sisi kanan lebih penting.")),
    imagePlaceholder("Gambar 6.6. Detail Slider Skala Saaty dengan Tooltip"), captionText("Gambar 6.6. Detail Slider Skala Saaty"),
    heading2("6.5 Proses Submit dan Auto-Lanjut"),
    numberedItem(1, "Setelah seluruh perbandingan pada satu tahap diisi, klik tombol Simpan Pembobotan."),
    numberedItem(2, "Muncul dialog konfirmasi \u201CSimpan & Lanjutkan?\u201D \u2014 pilih \u201CYa, Simpan\u201D."),
    numberedItem(3, "Sistem otomatis melanjutkan ke tahap berikutnya: KU Level \u2192 CP Level \u2192 CP1 \u2192 CP2 \u2192 ... \u2192 CP9."),
    numberedItem(4, "Setelah seluruh tahap selesai (termasuk CP9), muncul halaman Terima Kasih."),
    spacer(80), imagePlaceholder("Gambar 6.7. Dialog Konfirmasi Submit Pembobotan"), captionText("Gambar 6.7. Dialog Konfirmasi Submit"),
    imagePlaceholder("Gambar 6.8. Halaman Terima Kasih Setelah Semua Tahap Selesai"), captionText("Gambar 6.8. Halaman Terima Kasih"),
    heading2("6.6 Hasil Kalkulasi Fuzzy AHP"),
    para(text("Setelah data tersimpan, sistem DSS secara otomatis melakukan:")),
    numberedItem(1, "Fuzzifikasi: Konversi Skala Saaty (1\u20139) menjadi TFN (l, m, u)."),
    numberedItem(2, "Fuzzy Synthetic Extent: Menghitung Si untuk setiap kriteria."),
    numberedItem(3, "Degree of Possibility: V(Si \u2265 Sj) untuk perbandingan antar kriteria."),
    numberedItem(4, "Normalisasi: Menghasilkan bobot prioritas ternormalisasi W = (w1, w2, ..., wn)."),
    numberedItem(5, "Consistency Ratio (CR): CR < 0.10 \u2192 Konsisten; CR \u2265 0.10 \u2192 Tidak Konsisten."),
    numberedItem(6, "Update Database: globalWeight pada CriticalPoint dan weight pada CriteriaWeight diperbarui."),
    warningBox("Jika Consistency Ratio (CR) \u2265 0.10, sistem menampilkan peringatan \u201CTidak Konsisten\u201D. Pakar diminta meninjau ulang penilaian perbandingan berpasangannya."),
    imagePlaceholder("Gambar 6.9. Tampilan Tahapan Fuzzy AHP (Admin \u2014 AHP Steps)"), captionText("Gambar 6.9. Tampilan Tahapan Fuzzy AHP"),
    heading2("6.7 Daftar Sub-Kriteria Per CP"),
    createTable(["CP", "Nama CP", "Kode Sub-Kriteria", "Jumlah"], [
      ["CP1","Farm / Kandang Sapi","F1\u2013F7 (Asal-usul, Kesehatan, Pakan, Obat/Vaksin, Dokumentasi, Kebersihan, Kesiapan)","7"],
      ["CP2","Pakan & Kesehatan Hewan","FD1\u2013FD5 (Status Halal Pakan, Supplier, Penyimpanan, Obat, Veteriner)","5"],
      ["CP3","Transportasi ke RPH","T1\u2013T5 (Kelayakan, Kebersihan, Animal Welfare, Traceability, Dokumentasi)","5"],
      ["CP4","RPH / Penyembelihan","R1\u2013R10 (Sertifikat, Juru Sembelih, Syariah, Pemeriksaan, Sanitasi, Segregasi, Dokumentasi, Pengawasan, Audit, Traceability)","10"],
      ["CP5","Post-Slaughter","PS1\u2013PS5 (Handling, Sanitasi, Batch ID, Segregasi, Dokumentasi)","5"],
      ["CP6","Pengolahan","P1\u2013P7 (Ingredients, Equipment, Dedicated Line, Batch Control, Packaging, Operator, Formulasi)","7"],
      ["CP7","Cold Storage","CS1\u2013CS7 (Temperature, Segregasi, Hygiene, Traceability, FIFO/FEFO, Dokumentasi, Incident)","7"],
      ["CP8","Distribusi","D1\u2013D7 (Dedicated Transport, Vehicle Sanitation, Temperature, Route, Loading, Dokumentasi, Kontaminasi)","7"],
      ["CP9","Retail / Pasar","RT1\u2013RT7 (Label Halal, Display, Storage Temp, Expiry, Consumer Info, Supplier Trace, Complaint)","7"],
    ], [8, 18, 62, 12]),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 7: KUESIONER 2 â€” PENGUKURAN TINGKAT RISIKO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab7() {
  return [
    heading1("7. KUESIONER 2 \u2014 Pengukuran Tingkat Risiko (Auditor)"),
    para(text("Kuesioner ini diisi oleh "), bold("Auditor / Tim Penilai"), text(" untuk menilai tingkat risiko dari setiap titik kritis berdasarkan observasi kelengkapan operasional.")),
    heading2("7.1 Mengakses Kuesioner 2"),
    numberedItem(1, "Login menggunakan akun dengan role PAKAR_K2 atau ADMIN."), numberedItem(2, "Di Dashboard, pilih menu Kuesioner Pengukuran Risiko (Kuesioner 2)."), numberedItem(3, "Halaman menampilkan judul: \u201CKuesioner 2 \u2014 Pengukuran Tingkat Risiko\u201D."),
    spacer(80), imagePlaceholder("Gambar 7.1. Halaman Utama Kuesioner 2 \u2014 Pengukuran Tingkat Risiko"), captionText("Gambar 7.1. Halaman Utama Kuesioner 2"),
    heading2("7.2 Skala Tingkat Risiko Kepatuhan Halal (Likert 1\u20135)"),
    para(text("Di bagian atas halaman terdapat tabel referensi skala risiko dan tombol Download Rubrik (PDF):")),
    createTable(["Skala", "Label", "Interpretasi"], [["1","Sangat Rendah","Risiko pelanggaran halal hampir tidak ada. Semua dokumen dan prosedur lengkap."],["2","Rendah","Risiko kecil dan mudah dikendalikan. Sebagian besar dokumen tersedia."],["3","Sedang","Risiko memerlukan pengawasan. Beberapa dokumen/prosedur belum lengkap."],["4","Tinggi","Risiko signifikan, perlu tindakan segera. Banyak kekurangan kepatuhan."],["5","Sangat Tinggi","Risiko kritis ketidakpatuhan serius. Hampir tidak ada dokumentasi memadai."]], [10, 18, 72]),
    imagePlaceholder("Gambar 7.2. Tabel Referensi Skala Risiko & Tombol Download Rubrik"), captionText("Gambar 7.2. Tabel Referensi Skala Risiko"),
    heading2("7.3 Memilih Tab CP (Titik Kritis)"),
    para(text("Tab navigasi CP1\u2013CP9 berupa tombol horizontal. Tab berwarna hijau dengan ikon centang (\u2713) menandakan CP sudah terisi lengkap.")),
    imagePlaceholder("Gambar 7.3. Tab Navigasi CP1\u2013CP9 pada Kuesioner 2"), captionText("Gambar 7.3. Tab Navigasi CP"),
    heading2("7.4 Memilih Batch / Data Aktual K3"),
    para(text("Sebelum melakukan penilaian, Auditor "), bold("wajib"), text(" memilih data kondisi aktual (K3) yang akan dinilai:")),
    numberedItem(1, "Pada bagian \u201CPilih Batch / Kode Ternak\u201D, pilih dropdown."), numberedItem(2, "Dropdown menampilkan daftar respons K3 yang sudah disubmit."), numberedItem(3, "Jika sudah pernah dinilai di K2, muncul tanda \u2705 (Sudah Diisi)."), numberedItem(4, "Setelah memilih, bagian \u201CData Latar Belakang Batch K3\u201D menampilkan info K3 secara read-only."),
    warningBox("Jika belum memilih Batch, tombol submit dinonaktifkan dan muncul pesan: \u201CHarap pilih data aktual terlebih dahulu.\u201D"),
    imagePlaceholder("Gambar 7.4. Dropdown Pemilihan Batch K3 untuk Penilaian"), captionText("Gambar 7.4. Dropdown Pemilihan Batch K3"),
    imagePlaceholder("Gambar 7.5. Data Latar Belakang Batch K3 (Read-Only)"), captionText("Gambar 7.5. Data Latar Belakang Batch K3"),
    heading2("7.5 Pengisian Identitas Auditor"),
    para(text("Lengkapi bagian Identitas Auditor / Penilai:")),
    createTable(["No", "Field", "Keterangan"], [["1","Tanggal Audit","Otomatis terisi hari ini, dapat diubah"],["2","Nama Auditor","Nama lengkap auditor"],["3","Jenis Kelamin","Laki-laki / Perempuan"],["4","Posisi / Jabatan","Jabatan di instansi"],["5","Nama Instansi","Nama instansi / lembaga"],["6","No Sertifikat Auditor","Nomor sertifikat (jika ada)"]], [8, 25, 67]),
    imagePlaceholder("Gambar 7.6. Form Identitas Auditor"), captionText("Gambar 7.6. Form Identitas Auditor"),
    heading2("7.6 Penilaian Indikator Per Sub-Kriteria"),
    para(text("Setiap CP memiliki sub-kriteria yang dapat di-expand. Di dalam setiap sub-kriteria terdapat tabel indikator:")),
    createTable(["Kolom", "Deskripsi"], [["No","Nomor urut indikator"],["Pernyataan","Deskripsi indikator yang harus dinilai"],["Bukti Pendukung","Jenis dokumen pendukung yang diharapkan tersedia"],["Dokumen Aktual","Tautan ke dokumen upload dari K3 (klik untuk lihat/download)"],["Kesesuaian","Tombol \u201CSesuai\u201D / \u201CTidak\u201D \u2014 Auditor menilai kesesuaian dokumen"],["Tingkat Risiko","5 tombol skala (1\u20135) \u2014 Auditor memberikan skor risiko"]], [20, 80]),
    para(text("Di bawah setiap sub-kriteria terdapat kolom "), bold("\u201CCatatan Auditor\u201D"), text(" untuk observasi tambahan.")),
    imagePlaceholder("Gambar 7.7. Tampilan Penilaian Indikator \u2014 Sub-Kriteria Terbuka"), captionText("Gambar 7.7. Tampilan Penilaian Indikator (Desktop)"),
    imagePlaceholder("Gambar 7.8. Toast Notification Deskripsi Skala Saat Memilih Skor"), captionText("Gambar 7.8. Toast Notification Deskripsi Skala"),
    imagePlaceholder("Gambar 7.9. Progress Bar dan Counter Pengisian K2"), captionText("Gambar 7.9. Progress Bar K2"),
    heading2("7.7 Submit Penilaian K2"),
    numberedItem(1, "Setelah seluruh indikator CP dinilai, klik tombol \u201CSimpan Penilaian Risiko\u201D."), numberedItem(2, "Muncul dialog konfirmasi \u2014 klik \u201CYa, Simpan\u201D."), numberedItem(3, "Data disimpan ke tabel QuestionnaireResponse (questionnaireType = \u201Crisiko\u201D)."), numberedItem(4, "Sistem otomatis melanjutkan ke CP berikutnya (CP1 \u2192 CP2 \u2192 ... \u2192 CP9)."), numberedItem(5, "Muncul notifikasi hijau \u201CData berhasil disimpan\u201D."),
    imagePlaceholder("Gambar 7.10. Dialog Konfirmasi Submit Penilaian K2"), captionText("Gambar 7.10. Dialog Konfirmasi Submit K2"),
    imagePlaceholder("Gambar 7.11. Notifikasi Sukses Setelah Submit K2"), captionText("Gambar 7.11. Notifikasi Sukses K2"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 8: KUESIONER 3 â€” FORM KONDISI AKTUAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab8() {
  return [
    heading1("8. KUESIONER 3 \u2014 Form Kondisi Aktual (Responden Lapangan)"),
    para(text("Kuesioner ini diisi oleh pelaku langsung di lapangan (Staff, Supervisor, QC, Penyelia Halal) pada setiap Titik Kritis (CP1\u2013CP9) sesuai role yang dimiliki.")),
    heading2("8.1 Mengakses Kuesioner 3"),
    numberedItem(1, "Login menggunakan akun Responden Lapangan (role: CP1_FARM, CP2_FEED, dst.)."), numberedItem(2, "Di Dashboard, pilih menu Kuesioner Aktual (Kuesioner 3)."), numberedItem(3, "Halaman menampilkan judul: \u201CKuesioner 3 \u2014 Kondisi Aktual\u201D."),
    noteBox("Catatan", "Jika role pengguna adalah CP-specific (misal: CP1_FARM), hanya tab CP1 yang tersedia. Jika role ADMIN, semua tab CP1\u2013CP9 tersedia."),
    spacer(80), imagePlaceholder("Gambar 8.1. Halaman Utama Kuesioner 3 \u2014 Kondisi Aktual"), captionText("Gambar 8.1. Halaman Utama Kuesioner 3"),
    heading2("8.2 Memilih Tab CP & Pengisian Latar Belakang"),
    para(text("Setelah memilih tab CP, isi bagian "), bold("\u201CLatar Belakang Pengisi Formulir\u201D"), text(".")),
    createTable(["Field", "Keterangan"], [["Batch / Kode Ternak","Dropdown otomatis dari master data \u2014 pilih earTag sapi. Jika sudah diisi, muncul \u2705"],["Nama PIC / Petugas","Nama penanggung jawab di lapangan"],["Posisi / Jabatan","Jabatan di peternakan / RPH / gudang"],["Nama Farm / Perusahaan","Nama organisasi"],["Shift","Dropdown: Pagi / Siang / Malam"],["Tanggal Pengisian","Otomatis hari ini, dapat diubah"]], [30, 70]),
    imagePlaceholder("Gambar 8.2. Form Latar Belakang Pengisi K3 \u2014 CP1 (Farm)"), captionText("Gambar 8.2. Form Latar Belakang K3"),
    imagePlaceholder("Gambar 8.3. Dropdown Batch / Kode Ternak dengan Status \u201CSudah Diisi\u201D"), captionText("Gambar 8.3. Dropdown Batch / Kode Ternak"),
    heading2("8.3 Pengisian Indikator Per Sub-Kriteria"),
    para(text("Setiap sub-kriteria dapat di-expand. Di dalam setiap indikator terdapat:")),
    createTable(["Kolom", "Deskripsi"], [["No","Nomor urut indikator"],["Pernyataan","Deskripsi aspek yang harus diperiksa"],["Bukti Pendukung","Jenis dokumen yang diharapkan"],["Tersedia?","Tombol \u201CYa\u201D / \u201CTidak\u201D \u2014 Apakah bukti dokumen tersedia secara fisik?"],["Upload","Tombol \u201CUpload\u201D \u2014 Mengunggah file bukti (PDF, TXT, Gambar)"],["Kesesuaian","Tombol \u201CSesuai\u201D / \u201CTidak\u201D \u2014 Verifikasi kesesuaian dokumen"]], [18, 82]),
    imagePlaceholder("Gambar 8.4. Tampilan Pengisian Indikator K3 \u2014 Sub-Kriteria Terbuka"), captionText("Gambar 8.4. Tampilan Pengisian Indikator K3"),
    imagePlaceholder("Gambar 8.5. Upload File Bukti Pendukung"), captionText("Gambar 8.5. Upload File Bukti Pendukung"),
    heading2("8.4 Validasi Supervisor"),
    para(text("Bagian penting di akhir formulir K3 \u2014 "), bold("wajib diisi oleh Supervisor"), text(":")),
    createTable(["No", "Field", "Keterangan"], [["1","Nama Supervisor","Nama supervisor yang memvalidasi"],["2","Hasil Verifikasi","Dropdown: Sesuai / Tidak Sesuai"],["3","Tingkat Risiko Keseluruhan","5 tombol skala (1\u20135): Rendah \u2013 Sedang \u2013 Tinggi"],["4","Tanggal Verifikasi","Otomatis hari ini, dapat diubah"],["5","Tindakan Korektif","Textarea untuk langkah perbaikan yang perlu dilakukan"]], [8, 25, 67]),
    imagePlaceholder("Gambar 8.6. Form Validasi Supervisor \u2014 Tingkat Risiko & Tindakan Korektif"), captionText("Gambar 8.6. Form Validasi Supervisor"),
    heading2("8.5 Submit Kondisi Aktual K3"),
    numberedItem(1, "Setelah semua indikator diisi dan Supervisor memvalidasi, klik \u201CSimpan Kondisi Aktual\u201D."), numberedItem(2, "Dialog konfirmasi muncul \u2014 pastikan supervisor telah memvalidasi."), numberedItem(3, "File diupload ke server secara otomatis (Google Drive API)."), numberedItem(4, "Data disimpan ke QuestionnaireResponse (questionnaireType = \u201Caktual\u201D)."), numberedItem(5, "Sistem otomatis melanjutkan ke CP berikutnya."),
    imagePlaceholder("Gambar 8.7. Dialog Konfirmasi Submit K3"), captionText("Gambar 8.7. Dialog Konfirmasi Submit K3"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 9: KALKULASI SKOR RISIKO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab9() {
  return [
    heading1("9. KALKULASI SKOR RISIKO (DSS)"),
    para(text("Setelah data K1, K2, dan K3 tersimpan, DSS Engine secara otomatis mengalkulasi skor risiko.")),
    heading2("Alur Kalkulasi"),
    numberedItem(1, "Ambil Bobot dari K1: globalWeight (Bobot Global) per CP dan weight (Bobot Lokal sub-kriteria)."),
    numberedItem(2, "Ambil Nilai Aktual dari K3: Konversi jawaban kesesuaian ke nilai numerik."),
    numberedItem(3, "Hitung riskValue = \u03A3(bobot_subkriteria \u00D7 nilai_aktual) per CP."),
    numberedItem(4, "Hitung weightedRisk = globalWeight \u00D7 riskValue per CP."),
    numberedItem(5, "Hitung totalRiskScore = \u03A3(weightedRisk) dari CP1\u2013CP9."),
    heading2("Klasifikasi Risiko"),
    createTable(["Rentang Skor", "Klasifikasi", "Warna", "Keterangan"], [
      ["< 0.26","Low (Rendah)","\uD83D\uDFE2 Hijau","Risiko sangat rendah, kepatuhan halal terjaga"],
      ["0.26 \u2013 0.50","Moderate (Sedang)","\uD83D\uDFE1 Kuning","Perlu perhatian pada beberapa aspek"],
      ["0.51 \u2013 0.75","High (Tinggi)","\uD83D\uDFE0 Oranye","Risiko signifikan, perlu tindakan korektif"],
      ["\u2265 0.76","Critical (Kritis)","\uD83D\uDD34 Merah","Risiko kritis, perlu penanganan segera"],
    ], [18, 18, 14, 50]),
    imagePlaceholder("Gambar 9.1. Tampilan Dashboard Skor Risiko Per CP dan Per Batch"), captionText("Gambar 9.1. Dashboard Skor Risiko"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 10: HALAL AI CHATBOT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab10() {
  return [
    heading1("10. HALAL AI CHATBOT"),
    para(text("Fitur asisten virtual cerdas yang terhubung dengan data Traceability serta Knowledge Base. Dibangun dengan arsitektur "), bold("IndoBERT + RAG + LLM"), text(".")),
    heading2("10.1 Mengakses Chatbot"),
    numberedItem(1, "Chatbot diakses melalui menu Halal AI Chatbot di navbar, atau URL langsung: /chat."), numberedItem(2, "Interaksi menggunakan Bahasa Indonesia sehari-hari."), numberedItem(3, "Terdapat 4 tombol saran cepat (Suggested Actions) di halaman awal."),
    spacer(80), imagePlaceholder("Gambar 10.1. Halaman Awal Chatbot dengan Suggested Actions"), captionText("Gambar 10.1. Halaman Awal Chatbot"),
    heading2("10.2 Fitur Antarmuka Chat"),
    bullet("Sidebar Riwayat Chat: Panel sisi kiri menampilkan riwayat sesi percakapan."), bullet("Auto-save Session: Percakapan otomatis tersimpan di localStorage."), bullet("Markdown Rendering: Jawaban chatbot ditampilkan dengan format Markdown (tabel, bullet, heading)."), bullet("QR Code Deep Link: URL format /chat?trace=TAG-A001 otomatis memicu pelacakan batch."), bullet("Streaming Response: Jawaban ditampilkan real-time (streaming)."),
    imagePlaceholder("Gambar 10.2. Sidebar Riwayat Chat \u2014 Daftar Sesi Percakapan"), captionText("Gambar 10.2. Sidebar Riwayat Chat"),
    imagePlaceholder("Gambar 10.3. Contoh Jawaban Chatbot dengan Tabel Markdown"), captionText("Gambar 10.3. Contoh Jawaban Chatbot"),
    heading2("10.3 Alur Kerja Chatbot (IndoBERT + RAG + LLM)"),
    para(text("Saat pengguna mengirim pertanyaan, sistem memproses melalui tahapan berikut:")),
    numberedItem(1, "Input Pengguna: Pertanyaan berbahasa Indonesia dikirim ke server."), numberedItem(2, "Intent Classification (IndoBERT): Model NurfauzanDaffa/indobert-intent mengklasifikasikan pertanyaan ke 6 kategori intent."), numberedItem(3, "Confidence Check: Jika confidence \u2265 0.7, panggil tool spesifik. Jika < 0.7, fallback ke LLM Function Calling."), numberedItem(4, "Retrieval: Tool yang terpilih mengambil data (dari RAG Vector Search / Database)."), numberedItem(5, "Generasi Jawaban: LLM (GPT-4o-mini) menyusun data mentah menjadi jawaban terstruktur, dikirim secara streaming."),
    imagePlaceholder("Gambar 10.4. Diagram Alur Kerja Chatbot \u2014 IndoBERT \u2192 Confidence \u2192 Tool \u2192 LLM"), captionText("Gambar 10.4. Diagram Alur Kerja Chatbot"),
    heading2("10.4 Kategori Intent & Tools"),
    heading3("6 Kategori Intent IndoBERT"),
    createTable(["Intent", "Trigger Contoh", "Tool yang Dipanggil"], [["knowledge_query","\u201CApa syarat pemotongan halal menurut MUI?\u201D","search_knowledge_base"],["risk_check","\u201CBerapa skor risiko CP1?\u201D","check_halal_risk"],["batch_trace","\u201CLacak batch TAG-A003\u201D","trace_halal_batch"],["operational_data","\u201CDaftar RPH di Jawa Timur\u201D","get_operational_data"],["greeting","\u201CHalo\u201D, \u201CTerima kasih\u201D","(Respons langsung, tanpa tool)"],["out_of_scope","\u201CSiapa presiden?\u201D","(Penolakan sopan)"]], [18, 42, 40]),
    heading3("4 Tools Chatbot"),
    createTable(["Tool", "Fungsi", "Sumber Data"], [["search_knowledge_base","Mencari dokumen, regulasi, fatwa, SOP di Knowledge Base menggunakan vector similarity search","Tabel oai & HalalDocument (RAG)"],["check_halal_risk","Mengambil bobot Fuzzy AHP, risk score, level risiko. Mendukung query per CP atau per Batch.","Tabel CriticalPoint & CriteriaWeight"],["trace_halal_batch","Melacak jejak lengkap batch dari Farm hingga Retail. Termasuk AUTO-RAG referensi untuk CP berisiko tinggi.","Tabel HalalBatch + semua relasi CP"],["get_operational_data","Mengambil daftar entitas operasional (Farm, RPH, Batch, Personel).","Tabel Farm, Slaughterhouse, Cattle"]], [22, 55, 23]),
    imagePlaceholder("Gambar 10.5. Contoh Chatbot \u2014 Cek Risiko Halal (check_halal_risk)"), captionText("Gambar 10.5. Contoh Cek Risiko Halal"),
    imagePlaceholder("Gambar 10.6. Contoh Chatbot \u2014 Lacak Batch (trace_halal_batch)"), captionText("Gambar 10.6. Contoh Lacak Batch"),
    imagePlaceholder("Gambar 10.7. Contoh Chatbot \u2014 Pertanyaan Regulasi (search_knowledge_base)"), captionText("Gambar 10.7. Contoh Pertanyaan Regulasi"),
    heading2("10.5 Knowledge Base & RAG (Khusus Admin)"),
    numberedItem(1, "Admin mengakses menu Knowledge Base di dashboard."), numberedItem(2, "Upload dokumen referensi (PDF / TXT) berisi undang-undang, jurnal, atau SOP halal."), numberedItem(3, "Sistem otomatis memecah dokumen (chunking) dan memproses menjadi vektor embedding 384-dimensi."), numberedItem(4, "Vektor disimpan di PostgreSQL. Saat pengguna bertanya, chatbot melakukan cosine similarity search."),
    imagePlaceholder("Gambar 10.8. Halaman Knowledge Base Admin \u2014 Upload & Daftar Dokumen"), captionText("Gambar 10.8. Halaman Knowledge Base Admin"),
    heading2("10.6 Contoh Prompt dan Respons"),
    createTable(["Jenis Pertanyaan", "Contoh Prompt", "Apa yang Terjadi"], [
      ["Regulasi/Teori","\u201CApa syarat pemotongan halal?\u201D","IndoBERT \u2192 knowledge_query \u2192 RAG search \u2192 LLM menyusun jawaban + referensi"],
      ["Cek Risiko","\u201CBerapa skor risiko CP2?\u201D","IndoBERT \u2192 risk_check \u2192 Query DB CriticalPoint \u2192 Tampilkan bobot & status"],
      ["Lacak Batch","\u201CLacak batch TAG-A003\u201D","IndoBERT \u2192 batch_trace \u2192 Query HalalBatch + relasi \u2192 Tabel compliance + AUTO-RAG"],
      ["Data Operasional","\u201CDaftar RPH\u201D","IndoBERT \u2192 operational_data \u2192 Query Slaughterhouse \u2192 Daftar nama & lokasi"],
      ["QR Code Scan","(Scan QR \u2192 /chat?trace=TAG-B004)","Auto-trigger trace_halal_batch tanpa user mengetik"],
      ["Sapaan","\u201CHalo\u201D","IndoBERT \u2192 greeting \u2192 Respons langsung tanpa tool"],
      ["Di Luar Konteks","\u201CSiapa presiden?\u201D","IndoBERT \u2192 out_of_scope \u2192 Penolakan sopan, arahkan ke domain halal"],
    ], [18, 30, 52]),
    imagePlaceholder("Gambar 10.9. QR Code pada Halaman Detail Batch \u2014 Scan untuk Lacak di Chatbot"), captionText("Gambar 10.9. QR Code untuk Lacak Batch"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 11: DASHBOARD ADMIN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab11() {
  return [
    heading1("11. DASHBOARD ADMIN"),
    para(text("Panel admin digunakan untuk memantau kesehatan ekosistem supply chain dan mengelola data sistem.")),
    heading2("11.1 Dashboard Utama"),
    para(text("Setelah login, pengguna diarahkan ke halaman Dashboard yang menampilkan:")),
    heading3("Kartu Statistik Ringkasan"),
    createTable(["Kartu", "Deskripsi"], [["Total Batch","Jumlah seluruh batch sapi terdaftar"],["Batch Risiko Tinggi","Jumlah batch dengan status HIGH atau CRITICAL"],["Rata-rata Skor Risiko","Rata-rata totalRiskScore dari semua batch"],["Pass Rate","Persentase batch dengan status LOW"],["Jumlah Farm / RPH / Sapi","Total entitas traceability terdaftar"],["K1 / K2 / K3 Count","Jumlah respons kuesioner masing-masing jenis"]], [30, 70]),
    imagePlaceholder("Gambar 11.1. Dashboard Utama \u2014 Kartu Statistik Ringkasan"), captionText("Gambar 11.1. Dashboard Utama \u2014 Kartu Statistik"),
    heading3("Tabel Risiko Per CP"),
    para(text("Menampilkan 9 titik kritis beserta Bobot Global, Risk Score Lokal, Global Weighted Risk, Status Risiko, dan sub-kriteria.")),
    imagePlaceholder("Gambar 11.2. Tabel Risiko Per CP \u2014 Critical Points"), captionText("Gambar 11.2. Tabel Risiko Per CP"),
    heading3("Tabel Batch Terbaru"),
    para(text("Daftar batch sapi dengan earTag, breed, farm, RPH, Total Risk Score, dan Risk Level. Setiap batch dapat di-expand untuk melihat detail CP Records.")),
    imagePlaceholder("Gambar 11.3. Tabel Batch Terbaru \u2014 Detail CP Records (Expanded)"), captionText("Gambar 11.3. Tabel Batch Terbaru"),
    heading2("11.2 Master Data & Pengguna"),
    bullet("User Management: Menambah, mengubah, menonaktifkan (ban), atau menghapus pengguna. Mengatur role."),
    bullet("Batch Management: Mengelola data batch sapi (membuat batch baru, menautkan earTag ke Farm dan RPH)."),
    imagePlaceholder("Gambar 11.4. Halaman User Management \u2014 Daftar Pengguna"), captionText("Gambar 11.4. Halaman User Management"),
    imagePlaceholder("Gambar 11.5. Halaman Batch Management \u2014 Detail Batch"), captionText("Gambar 11.5. Halaman Batch Management"),
    heading2("11.3 Laporan & Rekapitulasi"),
    createTable(["Menu", "Deskripsi"], [["Rekap Pembobotan","Ringkasan respons K1 dari pakar, termasuk matriks perbandingan dan bobot"],["Rekap Risiko","Ringkasan respons K2 dari auditor per CP"],["Rekap Aktual","Ringkasan respons K3 dari responden lapangan, termasuk file bukti"],["AHP Steps","Langkah-langkah detail perhitungan Fuzzy AHP (8 langkah)"],["Weighting","Visualisasi bobot global dan lokal CP1\u2013CP9"]], [25, 75]),
    imagePlaceholder("Gambar 11.6. Halaman Rekap Pembobotan \u2014 Data Per Pakar"), captionText("Gambar 11.6. Halaman Rekap Pembobotan"),
    imagePlaceholder("Gambar 11.7. Halaman Tahapan Fuzzy AHP \u2014 Step-by-Step"), captionText("Gambar 11.7. Halaman Tahapan Fuzzy AHP"),
    imagePlaceholder("Gambar 11.8. Halaman Rekap Aktual \u2014 Respons K3 dengan File Bukti"), captionText("Gambar 11.8. Halaman Rekap Aktual"),
    pageBreak(),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BAB 12: PENUTUP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function bab12() {
  return [
    heading1("12. PENUTUP"),
    para(text("Buku panduan ini merupakan acuan operasional lengkap untuk "), bold("Sistem Informasi Manajemen Halal Supply Chain Terintegrasi v2.0"), text(". Sistem ini mengintegrasikan tiga pilar utama:")),
    spacer(80),
    numberedItem(1, "Fuzzy AHP (Kuesioner 1) \u2014 Pembobotan prioritas kriteria risiko oleh pakar melalui perbandingan berpasangan 3 level."),
    numberedItem(2, "Pengukuran Risiko & Kondisi Aktual (Kuesioner 2 & 3) \u2014 Penilaian tingkat risiko oleh auditor dan pencatatan kondisi lapangan oleh responden."),
    numberedItem(3, "Halal AI Chatbot (IndoBERT + RAG + LLM) \u2014 Asisten cerdas yang mengklasifikasikan niat pengguna secara otomatis."),
    spacer(100),
    para(text("Dengan sinergi ketiga pilar di atas, diharapkan ekosistem halal dapat dipantau dan dievaluasi secara "), bold("akurat"), text(", "), bold("transparan"), text(", dan "), bold("real-time"), text(" dari hulu (Farm) hingga hilir (Retail).")),
    spacer(200), horizontalRule(),
    new Paragraph({ children: [new TextRun({ text: "Untuk pertanyaan teknis atau keluhan sistem, silakan hubungi tim administrator IT.", font: FONT, size: FONT_SIZE_BODY, italics: true, color: COLOR_GRAY })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
    new Paragraph({ children: [new TextRun({ text: "\u00A9 2026 \u2014 Sistem Informasi Manajemen Halal Supply Chain Terintegrasi (KMS & DSS)", font: FONT, size: FONT_SIZE_SMALL, color: COLOR_GRAY })], alignment: AlignmentType.CENTER, spacing: { before: 80 } }),
  ];
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN â€” ASSEMBLE & GENERATE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function main() {
  console.log("\uD83D\uDD04 Generating complete user manual DOCX...");
  const doc = new Document({
    creator: "Halal Supply Chain System", title: "Buku Panduan Pengguna \u2014 Sistem Halal Supply Chain Terintegrasi v2.0",
    description: "User Manual lengkap mencakup Use Case, ERD, Activity Diagram, K1\u2013K3, AI Chatbot, dan Dashboard Admin",
    styles: { default: { document: { run: { font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK } } } },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "Buku Panduan Pengguna v2.0 \u2014 Halal Supply Chain", font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY })], alignment: AlignmentType.RIGHT })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: FOOTER_TEXT, font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY })], alignment: AlignmentType.CENTER })] }) },
      children: [
        ...coverPage(), ...daftarIsi(),
        ...bab1(),   // 1. Pendahuluan
        ...bab2(),   // 2. Use Case Diagram
        ...bab3(),   // 3. ERD
        ...bab4(),   // 4. Activity Diagram
        ...bab5(),   // 5. Arsitektur Sistem
        ...bab6(),   // 6. Kuesioner 1 (K1)
        ...bab7(),   // 7. Kuesioner 2 (K2)
        ...bab8(),   // 8. Kuesioner 3 (K3)
        ...bab9(),   // 9. Kalkulasi DSS
        ...bab10(),  // 10. Chatbot
        ...bab11(),  // 11. Dashboard Admin
        ...bab12(),  // 12. Penutup
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "docs/Buku_Manual_Halal_Supply_Chain_v2.0_Lengkap_Baru.docx";
  fs.writeFileSync(outputPath, buffer);

  console.log(`\u2705 DOCX berhasil dibuat: ${outputPath}`);
  console.log(`\uD83D\uDCC4 Ukuran: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`\uD83D\uDCCB Konten: Cover, Daftar Isi, 12 Bab (Use Case + ERD + Activity + K1 + K2 + K3 + DSS + Chatbot + Dashboard)`);
}

main().catch(console.error);
