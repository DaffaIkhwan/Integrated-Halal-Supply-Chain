// generate-laporan-bab3-bab4.mjs
// Script untuk menghasilkan Laporan Bab 3 & Bab 4 dalam format .docx
// Jalankan: node generate-laporan-bab3-bab4.mjs

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  Footer, Header, ShadingType, VerticalAlign, PageBreak,
} from "docx";
import * as fs from "fs";

// ═══════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const FONT = "Times New Roman";
const FONT_SIZE_BODY = 24; // 12pt
const FONT_SIZE_SMALL = 20; // 10pt
const FONT_SIZE_TABLE = 20; // 10pt
const FONT_SIZE_H1 = 28; // 14pt
const FONT_SIZE_H2 = 26; // 13pt
const FONT_SIZE_H3 = 24; // 12pt
const FONT_SIZE_FOOTER = 18; // 9pt

const COLOR_DARK = "000000";
const COLOR_GRAY = "555555";
const COLOR_TABLE_HEADER = "2C3E50";
const COLOR_TABLE_HEADER_TEXT = "FFFFFF";
const COLOR_TABLE_ALT = "F2F3F4";
const COLOR_GREEN = "27AE60";
const COLOR_ACCENT = "2980B9";

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_H1, bold: true, color: COLOR_DARK })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    alignment: AlignmentType.LEFT,
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
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_H3, bold: true, color: COLOR_DARK })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  });
}

function heading4(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_BODY, bold: true, italics: true, color: COLOR_DARK })],
    spacing: { before: 200, after: 100 },
  });
}

function para(...runs) {
  return new Paragraph({
    children: runs,
    spacing: { after: 120, line: 360 },
  });
}

function text(t, opts = {}) {
  return new TextRun({ text: t, font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK, ...opts });
}

function bold(t, opts = {}) {
  return text(t, { bold: true, ...opts });
}

function italic(t, opts = {}) {
  return text(t, { italics: true, ...opts });
}

function bullet(t, level = 0) {
  return new Paragraph({
    children: [text(t)],
    bullet: { level },
    spacing: { after: 60, line: 312 },
  });
}

function numberedPara(num, t) {
  return para(bold(`${num}. `), text(t));
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { before: pts } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ═══════════════════════════════════════════════════════════════════
// DIAGRAM PLACEHOLDER HELPER
// ═══════════════════════════════════════════════════════════════════

const DASH_BORDER = { style: BorderStyle.DASHED, size: 8, color: "2980B9" };
const DIAGRAM_BORDERS = {
  top: DASH_BORDER, bottom: DASH_BORDER, left: DASH_BORDER, right: DASH_BORDER,
};

/**
 * Membuat placeholder box untuk diagram yang akan di-paste oleh user.
 * @param {string} number - Nomor diagram (misal: "1")
 * @param {string} title  - Judul diagram (misal: "Arsitektur Sistem Keseluruhan")
 * @param {string} hint   - Keterangan cara render (opsional)
 */
function diagramPlaceholder(number, title, hint = "") {
  const ROWS = 12; // tinggi placeholder ~12 baris kosong
  const emptyRows = Array.from({ length: ROWS }, () =>
    new TableRow({
      children: [new TableCell({
        children: [new Paragraph({ spacing: { before: 0, after: 0 } })],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      })],
    })
  );

  return [
    spacer(80),
    new Table({
      rows: [
        // Header bar
        new TableRow({
          children: [new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `  📊 DIAGRAM ${number} — ${title}`, font: FONT, size: 22, bold: true, color: "FFFFFF" }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: "2980B9" },
          })],
        }),
        // Instruction row
        new TableRow({
          children: [new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `  ⬇️  PASTE GAMBAR DIAGRAM DI SINI  ⬇️`, font: FONT, size: 20, bold: true, color: "2980B9" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 20 },
              }),
              new Paragraph({
                children: [new TextRun({ text: hint || `Render Diagram ${number} dari file mermaid_diagrams.md → Export PNG → Insert Picture di sini`, font: FONT, size: 18, italics: true, color: "888888" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: "EBF5FB" },
          })],
        }),
        // Empty space rows (area kosong untuk paste gambar)
        ...emptyRows,
        // Footer bar
        new TableRow({
          children: [new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `  Gambar ${number}. ${title}`, font: FONT, size: 20, italics: true, color: "555555" })],
                spacing: { before: 40, after: 40 },
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill: "D6EAF8" },
          })],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: DIAGRAM_BORDERS,
    }),
    spacer(120),
  ];
}

// ═══════════════════════════════════════════════════════════════════
// TABLE HELPERS
// ═══════════════════════════════════════════════════════════════════

const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const TABLE_BORDERS = {
  top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER,
  insideHorizontal: THIN_BORDER, insideVertical: THIN_BORDER,
};

function headerCell(label, widthPct) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: label, font: FONT, size: FONT_SIZE_TABLE, bold: true, color: COLOR_TABLE_HEADER_TEXT })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    })],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: COLOR_TABLE_HEADER },
    verticalAlign: VerticalAlign.CENTER,
  });
}

function dataCell(value, opts = {}) {
  const { align = AlignmentType.LEFT, shade, boldText = false } = opts;
  const cellOpts = {
    children: [new Paragraph({
      children: [new TextRun({ text: String(value), font: FONT, size: FONT_SIZE_TABLE, bold: boldText, color: COLOR_DARK })],
      alignment: align,
      spacing: { before: 30, after: 30 },
    })],
    verticalAlign: VerticalAlign.CENTER,
  };
  if (shade) cellOpts.shading = { type: ShadingType.CLEAR, fill: shade };
  if (opts.width) cellOpts.width = { size: opts.width, type: WidthType.PERCENTAGE };
  return new TableCell(cellOpts);
}

function makeTable(headers, rows, widths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, widths?.[i] || Math.floor(100 / headers.length))),
    tableHeader: true,
  });
  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) => dataCell(cell, {
        align: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
        shade: ri % 2 === 1 ? COLOR_TABLE_ALT : undefined,
        width: widths?.[ci],
      })),
    })
  );
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });
}

function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      children: [new TextRun({ text: line, font: "Consolas", size: 18, color: COLOR_DARK })],
      spacing: { after: 20 },
      indent: { left: 360 },
      shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
    })
  );
}

// ═══════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════

const sections = [];

// ─── COVER / TITLE ───
sections.push(
  spacer(600),
  new Paragraph({
    children: [new TextRun({ text: "LAPORAN LENGKAP", font: FONT, size: 36, bold: true, color: COLOR_DARK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "IndoBERT + Fuzzy AHP + Rule-Based", font: FONT, size: 32, bold: true, color: COLOR_ACCENT })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Perhitungan Tingkat Risiko Halal Integrated Supply Chain", font: FONT, size: 28, color: COLOR_DARK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Sistem KMS-DSS (Knowledge Management System – Decision Support System)", font: FONT, size: FONT_SIZE_BODY, italics: true, color: COLOR_GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Dokumen ini mencakup:", font: FONT, size: FONT_SIZE_BODY, color: COLOR_DARK }),
    ],
    spacing: { after: 80 },
  }),
  bullet("Bagian 1: Flow Process — Diagram alur dan tahapan (untuk Bab 3)"),
  bullet("Bagian 2: Data Langkah-Langkah — Semua data mentah dari setiap tahap"),
  bullet("Bagian 3: Pengujian — Teori pengujian (Bab 3) + Hasil pengujian (Bab 4)"),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════
// BAGIAN 1: FLOW PROCESS
// ═══════════════════════════════════════════════════════════════════

sections.push(
  heading1("BAGIAN 1: FLOW PROCESS (UNTUK BAB 3)"),
  spacer(100),

  // 1.1 Arsitektur
  heading2("1.1 Arsitektur Sistem Secara Keseluruhan"),
  para(text("Sistem ini terdiri dari "), bold("3 komponen utama"), text(" yang terintegrasi:")),
  spacer(60),
  numberedPara(1, "IndoBERT Intent Classification — Klasifikasi intent pertanyaan pengguna menggunakan model NLP berbasis Transformer"),
  numberedPara(2, "Fuzzy AHP Engine — Pembobotan kriteria dan sub-kriteria risiko menggunakan metode Fuzzy Analytic Hierarchy Process"),
  numberedPara(3, "Rule-Based Risk Assessment Engine — Evaluasi tingkat risiko berdasarkan aturan IF-THEN dengan agregasi Weakest-Link (MAX)"),
  spacer(60),
  ...diagramPlaceholder("1", "Arsitektur Sistem Keseluruhan", "Render DIAGRAM 1 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),

  // 1.2 IndoBERT Flow
  heading2("1.2 Flow Process: IndoBERT Intent Classification"),
  para(text("Tahapan proses klasifikasi intent menggunakan IndoBERT:")),
  spacer(60),

  makeTable(
    ["No", "Tahap", "Deskripsi", "Input", "Output"],
    [
      ["1", "Tokenisasi", "WordPiece Tokenizer memecah kalimat menjadi sub-word tokens", "Kalimat raw (string)", "Token IDs + Attention Mask"],
      ["2", "Encoding", "12 Transformer Layers memproses token secara bidirectional", "Token IDs (max 128)", "Hidden states 768-dim"],
      ["3", "Pooling", "Mengambil representasi [CLS] token sebagai sentence embedding", "Hidden states", "Vektor 768-dim"],
      ["4", "Klasifikasi", "Linear layer 768×6 + Softmax menghasilkan probabilitas per intent", "Vektor 768-dim", "6 probabilitas (sum=1)"],
      ["5", "Thresholding", "Jika confidence ≥ 0.7, gunakan intent; jika <0.7, fallback ke LLM", "Probabilitas tertinggi", "Intent label + confidence"],
      ["6", "Routing", "Intent digunakan untuk menentukan tool mana yang dipanggil", "Intent label", "Tool selection"],
    ],
    [8, 15, 35, 20, 22]
  ),

  spacer(120),
  heading3("6 Kelas Intent yang Dikenali"),
  makeTable(
    ["Kelas (Intent)", "Deskripsi", "Aksi"],
    [
      ["knowledge_query", "Pertanyaan teori, regulasi, SOP, hukum", "Panggil search_knowledge_base (RAG)"],
      ["risk_check", "Bobot AHP, skor risiko, status CP", "Panggil check_halal_risk (Fuzzy AHP)"],
      ["batch_trace", "Lacak batch produk, eartag, traceability", "Panggil trace_halal_batch (DB Query)"],
      ["operational_data", "Data operasional Farm, RPH, personel", "Panggil get_operational_data"],
      ["greeting", "Salam, sapaan, terima kasih", "Direct response (tanpa LLM)"],
      ["out_of_scope", "Di luar domain halal", "Tolak sopan (tanpa LLM)"],
    ],
    [20, 35, 45]
  ),

  spacer(120),
  heading3("Konfigurasi Model IndoBERT"),
  makeTable(
    ["Parameter", "Nilai"],
    [
      ["Model Base", "indobenchmark/indobert-base-p1"],
      ["Jumlah Parameter", "110 Juta (110M)"],
      ["Jumlah Transformer Layers", "12"],
      ["Hidden Size", "768 dimensi"],
      ["Max Sequence Length", "128 token"],
      ["Confidence Threshold", "0.7 (70%)"],
      ["Format Deployment", "ONNX (via @huggingface/transformers)"],
      ["Fallback Mechanism", "GPT-4o-mini via OpenRouter (Function Calling)"],
      ["Model ID (Hugging Face)", "NurfauzanDaffa/indobert-intent"],
    ],
    [40, 60]
  ),

  spacer(120),
  heading3("Justifikasi Teoritis: Confidence-based Model Cascading"),
  para(text("Sistem klasifikasi intent pada penelitian ini mengimplementasikan arsitektur "), bold("Confidence-based Model Cascading"), text(". IndoBERT digunakan sebagai pengklasifikasi utama (frontline classifier) karena sifatnya yang ringan, cepat, dan spesifik pada domain klasifikasi teks Bahasa Indonesia. Nilai threshold confidence ditetapkan sebesar 0.7 berdasarkan fungsi probabilitas Softmax. Nilai ini bertindak sebagai filter untuk "), italic("Out-of-Distribution (OOD) detection"), text(".")),
  spacer(60),
  para(text("Apabila model IndoBERT menghasilkan nilai probabilitas tertinggi di bawah threshold (< 0.7), hal ini mengindikasikan bahwa input pengguna bersifat ambigu atau memiliki kompleksitas di luar distribusi data latih. Dalam kondisi ini, sistem menerapkan mekanisme "), bold("Fallback"), text(" dengan meneruskan input tersebut ke Large Language Model (LLM). Pendekatan cascading ini sejalan dengan prinsip efisiensi komputasi AI modern, di mana model spesifik yang lebih ringan digunakan untuk menangani mayoritas kasus standar, sementara LLM yang membutuhkan komputasi lebih besar hanya dipanggil sebagai jaring pengaman (safety net) untuk kasus-kasus yang kompleks (Chen et al., 2023).")),
  spacer(120),

  ...diagramPlaceholder("2", "Flow Process IndoBERT Intent Classification", "Render DIAGRAM 2 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),

  pageBreak(),

  // 1.3 Fuzzy AHP Flow
  heading2("1.3 Flow Process: Fuzzy AHP (Pembobotan)"),
  para(text("Fuzzy Analytic Hierarchy Process (F-AHP) digunakan untuk menentukan bobot prioritas antar kriteria (Critical Point) dan sub-kriteria berdasarkan penilaian pakar. Berikut tahapan prosesnya:")),
  spacer(60),

  makeTable(
    ["No", "Tahap", "Formula / Deskripsi", "Output"],
    [
      ["1", "Input Pairwise Comparison", "Pakar mengisi matriks perbandingan berpasangan menggunakan skala Saaty (1-9)", "Matriks n×n"],
      ["2", "Fuzzifikasi", "Konversi nilai crisp ke Triangular Fuzzy Number (TFN) [l, m, u]", "Matriks TFN n×n"],
      ["3", "Hitung Row Sums", "RowSum_i = Σ TFN_ij = [Σl, Σm, Σu]", "TFN per baris"],
      ["4", "Hitung Total Sum", "TotalSum = Σ RowSum_i = [Σl_total, Σm_total, Σu_total]", "1 TFN total"],
      ["5", "Hitung Inverse Total", "InverseTotal = [1/u_total, 1/m_total, 1/l_total]", "1 TFN inverse"],
      ["6", "Fuzzy Synthetic Extent", "Si = RowSum_i ⊗ InverseTotal", "TFN per kriteria"],
      ["7", "Defuzzifikasi (CoA)", "Di = (li + mi + ui) / 3", "Nilai crisp per kriteria"],
      ["8", "Normalisasi", "Wi = Di / ΣDi (sehingga ΣWi = 1)", "Bobot final"],
      ["9", "Consistency Ratio", "CR = CI / RI; CI = (λmax - n)/(n-1); Target: CR < 0.10", "Status konsistensi"],
    ],
    [7, 22, 50, 21]
  ),

  spacer(120),
  heading3("Skala Saaty yang di-Fuzzy-kan (Triangular Fuzzy Number)"),
  makeTable(
    ["Level", "Label Linguistik", "TFN (l, m, u)", "Resiprokal"],
    [
      ["1", "Equal (Sama Penting)", "[1, 1, 1]", "[1, 1, 1]"],
      ["3", "Moderate (Sedikit Lebih Penting)", "[1, 3, 5]", "[1/5, 1/3, 1]"],
      ["5", "Strong (Lebih Penting)", "[3, 5, 7]", "[1/7, 1/5, 1/3]"],
      ["7", "Very Strong (Sangat Lebih Penting)", "[5, 7, 9]", "[1/9, 1/7, 1/5]"],
      ["9", "Extreme (Mutlak Lebih Penting)", "[7, 9, 9]", "[1/9, 1/9, 1/7]"],
    ],
    [10, 40, 25, 25]
  ),

  spacer(120),
  heading3("Random Index (RI) Table — Saaty (1990)"),
  makeTable(
    ["n", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    [["RI", "0", "0", "0.58", "0.90", "1.12", "1.24", "1.32", "1.41", "1.45", "1.49"]],
    [10, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
  ),

  spacer(120),
  heading3("Struktur Hierarki Pembobotan"),
  para(bold("Level 1 — Antar Critical Point (CP1-CP9):")),
  bullet("Matriks: 9×9 (81 cell TFN)"),
  bullet("Tipe matriks di DB: LEVEL1_CP"),
  bullet("Menghasilkan: Bobot Global per CP"),
  spacer(80),
  para(bold("Level 2 — Sub-Kriteria dalam 1 CP:")),

  makeTable(
    ["CP", "Tipe Matriks", "Ukuran", "Sub-Kriteria"],
    [
      ["CP1", "LEVEL2_CP1", "7×7", "F1-F7 (Farm/Kandang Sapi)"],
      ["CP2", "LEVEL2_CP2", "5×5", "FD1-FD5 (Pakan & Kesehatan)"],
      ["CP3", "LEVEL2_CP3", "5×5", "T1-T5 (Transportasi)"],
      ["CP4", "LEVEL2_CP4", "10×10", "R1-R10 (RPH/Penyembelihan)"],
      ["CP5", "LEVEL2_CP5", "5×5", "PS1-PS5 (Post-Slaughter)"],
      ["CP6", "LEVEL2_CP6", "7×7", "P1-P7 (Processing)"],
      ["CP7", "LEVEL2_CP7", "7×7", "CS1-CS7 (Cold Storage)"],
      ["CP8", "LEVEL2_CP8", "7×7", "D1-D7 (Distribusi)"],
      ["CP9", "LEVEL2_CP9", "7×7", "RT1-RT7 (Retail)"],
    ],
    [10, 20, 15, 55]
  ),

  para(bold("Total Sub-Kriteria: 60 kriteria"), text(" (tanpa CP10)")),

  spacer(60),
  ...diagramPlaceholder("3", "Flow Process Fuzzy AHP", "Render DIAGRAM 3 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),
  ...diagramPlaceholder("6", "Hierarki Bobot Fuzzy AHP (Tree)", "Render DIAGRAM 6 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),

  pageBreak(),

  // 1.4 Rule-Based Flow
  heading2("1.4 Flow Process: Rule-Based Risk Assessment"),
  para(text("Rule-Based Engine mengevaluasi tingkat risiko berdasarkan kondisi aktual lapangan menggunakan aturan IF-THEN dengan prinsip agregasi "), bold("Weakest-Link (MAX)"), text(".")),
  spacer(60),

  makeTable(
    ["No", "Tahap", "Deskripsi", "Metode"],
    [
      ["1", "Input Skor Indikator", "Operator lapangan mengisi skor per indikator (1-5)", "Kuesioner 2 & 3"],
      ["2", "Evaluasi IF-THEN Rules", "Setiap indikator dievaluasi berdasarkan performance rules", "Rule matching per level"],
      ["3", "Agregasi Indikator → Konstruk", "MAX(I1, I2, ..., In) — Weakest-Link", "MAX function"],
      ["4", "Agregasi Konstruk → Stage", "MAX(semua Construct dalam 1 CP)", "MAX function"],
      ["5", "Agregasi Stage → Overall", "MAX(semua CP1-CP9)", "MAX function"],
      ["6", "Klasifikasi Risiko", "Tentukan level berdasarkan skor akhir", "5-level scale"],
    ],
    [7, 25, 43, 25]
  ),

  spacer(120),
  heading3("Skala Risiko Rule-Based (5 Level)"),
  makeTable(
    ["Level", "Label Indonesia", "Label English", "Recommended Action"],
    [
      ["1", "Sangat Rendah", "Very Low Risk", "Pertahankan praktik terbaik"],
      ["2", "Rendah", "Low Risk", "Monitor berkala"],
      ["3", "Sedang", "Moderate Risk", "Perbaikan minor diperlukan"],
      ["4", "Tinggi", "High Risk", "Tindakan korektif segera"],
      ["5", "Sangat Tinggi", "Critical Risk", "Hentikan operasi, audit menyeluruh"],
    ],
    [10, 20, 20, 50]
  ),

  spacer(120),
  heading3("Klasifikasi Risiko Akhir (Skor Crisp)"),
  makeTable(
    ["Range Skor", "Level", "Warna"],
    [
      ["0.00 – 0.25", "Low", "🟢 Hijau"],
      ["0.26 – 0.50", "Moderate", "🟡 Kuning"],
      ["0.51 – 0.75", "High", "🟠 Oranye"],
      ["0.76 – 1.00", "Critical", "🔴 Merah"],
    ],
    [30, 30, 40]
  ),

  spacer(120),
  heading3("Statistik Rule Base"),
  makeTable(
    ["Metrik", "Nilai"],
    [
      ["Total Constructs (Konstruk)", "37"],
      ["Total Indicators (Indikator)", "185 (5 per konstruk)"],
      ["Total Indicator Rules", "925 (5 level × 185 indikator)"],
      ["Aggregation Method", "Weakest-Link (MAX)"],
      ["Sumber File", "Rule_Base_Risiko_Halal_Lengkap.json (673 KB)"],
    ],
    [40, 60]
  ),

  ...diagramPlaceholder("4", "Flow Process Rule-Based Risk Assessment", "Render DIAGRAM 4 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),

  pageBreak(),

  // 1.5 Integrasi
  heading2("1.5 Flow Process: Integrasi IndoBERT + Fuzzy AHP + Rule-Based"),
  para(text("Ketiga komponen saling terintegrasi melalui 3 fase utama:")),
  spacer(60),

  heading3("Fase 1: Pembobotan (Offline — Dilakukan Sekali oleh Pakar)"),
  numberedPara(1, "Pakar mengisi Kuesioner 1 (Pairwise Comparison) melalui dashboard web"),
  numberedPara(2, "Sistem menghitung bobot menggunakan Fuzzy AHP (Level 1: antar CP, Level 2: sub-kriteria per CP)"),
  numberedPara(3, "Consistency Ratio diperiksa; jika CR ≥ 0.10, pakar diminta merevisi"),
  numberedPara(4, "Bobot yang konsisten disimpan di database (tabel CriticalPoint dan CriteriaWeight)"),

  spacer(80),
  heading3("Fase 2: Penilaian Risiko (Per Batch — Dilakukan Operator Lapangan)"),
  numberedPara(1, "Operator mengisi Kuesioner 2 & 3 (Kondisi Aktual) untuk setiap CP"),
  numberedPara(2, "Rule-Based Engine mengevaluasi skor per indikator berdasarkan IF-THEN rules"),
  numberedPara(3, "Agregasi menggunakan MAX/Weakest-Link: Indikator → Konstruk → Stage → Overall"),
  numberedPara(4, "Risk Score dan Risk Level disimpan di database (tabel HalalBatch + CriticalPointRecord)"),

  spacer(80),
  heading3("Fase 3: Query via Chatbot (Real-time — Dilakukan User)"),
  numberedPara(1, "User mengetik pertanyaan dalam Bahasa Indonesia melalui chat interface"),
  numberedPara(2, "IndoBERT mengklasifikasikan intent pertanyaan ke salah satu dari 6 kelas"),
  numberedPara(3, "Berdasarkan intent, tool yang sesuai dipanggil (RAG search, risk check, batch trace, dll)"),
  numberedPara(4, "Data dari database + referensi RAG dikirim ke LLM untuk dirangkum menjadi jawaban terstruktur"),

  spacer(60),
  ...diagramPlaceholder("5", "Integrasi 3 Komponen — 3 Fase", "Render DIAGRAM 5 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),

  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════
// BAGIAN 2: DATA LANGKAH-LANGKAH
// ═══════════════════════════════════════════════════════════════════

sections.push(
  heading1("BAGIAN 2: DATA LANGKAH-LANGKAH (UNTUK BAB 3)"),
  spacer(100),

  // 2.1 IndoBERT
  heading2("2.1 Data IndoBERT"),

  heading3("2.1.1 Dataset Training"),
  makeTable(
    ["Parameter", "Nilai"],
    [
      ["Total data", "1800 sampel"],
      ["Split", "90% Training (1620 data) / 10% Test (180 data)"],
      ["Jumlah Kelas", "6 intent"],
      ["Model Base", "indobenchmark/indobert-base-p1"],
      ["Max Token Length", "128"],
      ["Platform Training", "Google Colab (T4 GPU)"],
    ],
    [35, 65]
  ),

  spacer(120),
  heading3("2.1.2 Distribusi Kelas Dataset"),
  makeTable(
    ["Kelas (Intent)", "Jumlah", "Deskripsi"],
    [
      ["batch_trace", "300", "Pelacakan batch produk, eartag, traceability"],
      ["greeting", "300", "Salam, sapaan, terima kasih"],
      ["knowledge_query", "300", "Pertanyaan teori, regulasi, SOP, hukum"],
      ["operational_data", "300", "Data operasional Farm, RPH, personel"],
      ["out_of_scope", "300", "Pertanyaan di luar domain halal"],
      ["risk_check", "300", "Bobot AHP, skor risiko, status CP"],
    ],
    [25, 15, 60]
  ),
  para(bold("TOTAL: 1800 sampel"), text(" (balanced, 300 per kelas)")),

  spacer(120),
  heading3("2.1.3 Contoh Data per Kelas"),
  makeTable(
    ["No", "Text", "Label"],
    [
      ["1", "KAK KONSISTENSI AHP TU APAAN?", "knowledge_query"],
      ["2", "ringkasan operasional mingguan dong", "operational_data"],
      ["3", "bye sih", "greeting"],
      ["4", "mba inherent risk vs residual risk gimana??", "risk_check"],
      ["5", "maaf record perjalanan batch gimana?", "batch_trace"],
      ["6", "nanya dong cek pengiriman tokopedia min", "out_of_scope"],
      ["7", "jelaskan perbedaan hcp sih dan ccp", "knowledge_query"],
      ["8", "dari rph mana batch b-001 dipotong?", "batch_trace"],
      ["9", "ada warning dari sistem ya risiko??", "risk_check"],
      ["10", "lowongan kerja di deh rph ada kak", "out_of_scope"],
    ],
    [7, 60, 33]
  ),

  spacer(120),
  heading3("2.1.4 Hyperparameter Training"),
  makeTable(
    ["Parameter", "Nilai"],
    [
      ["Model Base", "indobenchmark/indobert-base-p1"],
      ["Learning Rate", "2e-5"],
      ["Batch Size (Train)", "16"],
      ["Batch Size (Eval)", "16"],
      ["Epochs", "5"],
      ["Weight Decay", "0.01"],
      ["Max Sequence Length", "128"],
      ["Eval Strategy", "Per Epoch"],
      ["Best Model Selection", "F1-Score (weighted)"],
      ["Load Best Model at End", "True"],
    ],
    [40, 60]
  ),

  pageBreak(),

  // 2.2 Fuzzy AHP
  heading2("2.2 Data Fuzzy AHP"),

  heading3("2.2.1 Langkah Perhitungan Fuzzy AHP (Step by Step)"),
  para(bold("Langkah 1: Input Pairwise Comparison Matrix")),
  para(text("Data pairwise comparison berasal dari pakar dan disimpan di tabel PairwiseComparison database PostgreSQL. Setiap cell berisi TFN [l, m, u]. Fungsi: loadMatrixFromDB()")),
  spacer(60),
  para(bold("Langkah 2: Hitung Row Sums")),
  ...codeBlock(["RowSum_i = Σ TFN_ij untuk semua j", "         = [Σl_ij, Σm_ij, Σu_ij]"]),
  para(text("Fungsi: sumTFNs()")),
  spacer(60),
  para(bold("Langkah 3: Hitung Total Sum")),
  ...codeBlock(["TotalSum = Σ RowSum_i untuk semua i", "         = [Σl_total, Σm_total, Σu_total]"]),
  spacer(60),
  para(bold("Langkah 4: Hitung Inverse Total (Resiprokal)")),
  ...codeBlock(["InverseTotal = [1/u_total, 1/m_total, 1/l_total]"]),
  para(text("Fungsi: getReciprocal()")),
  spacer(60),
  para(bold("Langkah 5: Fuzzy Synthetic Extent (FSE)")),
  ...codeBlock(["Si = RowSum_i ⊗ InverseTotal", "   = [l_row × l_inv, m_row × m_inv, u_row × u_inv]"]),
  para(text("Fungsi: calculateFSE()")),
  spacer(60),
  para(bold("Langkah 6: Defuzzifikasi — Center of Area (CoA)")),
  ...codeBlock(["Di = (li + mi + ui) / 3"]),
  para(text("Fungsi: defuzzify()")),
  spacer(60),
  para(bold("Langkah 7: Normalisasi Bobot")),
  ...codeBlock(["Wi = Di / ΣDi", "(sehingga ΣWi = 1)"]),
  para(text("Fungsi: normalizeWeights()")),
  spacer(60),
  para(bold("Langkah 8: Consistency Ratio (CR)")),
  ...codeBlock([
    "1. Defuzzify matriks TFN → matriks crisp",
    "2. Normalisasi kolom + rata-rata baris → Wi",
    "3. Aw = CrispMatrix × Wi",
    "4. λmax = (1/n) × Σ(Aw_i / Wi_i)",
    "5. CI = (λmax - n) / (n - 1)",
    "6. CR = CI / RI",
    "7. Jika CR < 0.10 → Konsisten ✅",
  ]),
  para(text("Fungsi: calculateConsistencyRatio()")),

  spacer(120),
  heading3("2.2.2 Skala Penilaian Risiko per Indikator (Dropdown Kuesioner)"),
  makeTable(
    ["Level", "Label Kepatuhan", "TFN (l, m, u)", "Defuzzified Risk", "Skala 1-5"],
    [
      ["1", "Sangat Patuh", "(0, 0.05, 0.15)", "0.07", "1"],
      ["2", "Patuh", "(0.10, 0.25, 0.35)", "0.23", "2"],
      ["3", "Cukup", "(0.30, 0.45, 0.55)", "0.43", "3"],
      ["4", "Tidak Patuh", "(0.50, 0.65, 0.80)", "0.65", "4"],
      ["5", "Sangat Buruk", "(0.75, 0.90, 1.00)", "0.88", "5"],
    ],
    [10, 20, 25, 25, 20]
  ),

  spacer(120),
  heading3("2.2.3 Formula Perhitungan Risk Score (Implementasi Aktual)"),
  para(bold("Metode: Rule-Based MAX / Weakest-Link")),
  ...codeBlock([
    "// Per CP:",
    "maxRawValue = MAX(semua risk value sub-kriteria dalam CP)",
    "localRisk = maxRawValue × 0.20  // konversi skala 1-5 ke 0.2-1.0",
    "",
    "// Overall per Batch:",
    "totalGlobalRisk = MAX(localRisk semua CP)",
    "",
    "// Klasifikasi:",
    "if totalGlobalRisk >= 0.76 → \"Critical\"",
    "if totalGlobalRisk >= 0.51 → \"High\"",
    "if totalGlobalRisk >= 0.26 → \"Moderate\"",
    "else → \"Low\"",
  ]),

  pageBreak(),

  // 2.3 Rule-Based
  heading2("2.3 Data Rule-Based Engine"),

  heading3("2.3.1 Mapping CP dan Sub-Kriteria"),
  makeTable(
    ["CP", "Nama", "Jumlah Sub-Kriteria", "Kode"],
    [
      ["CP1", "Farm/Kandang Sapi", "7", "F1-F7"],
      ["CP2", "Pakan & Kesehatan Hewan", "5", "FD1-FD5"],
      ["CP3", "Transportasi ke RPH", "5", "T1-T5"],
      ["CP4", "RPH/Penyembelihan", "10", "R1-R10"],
      ["CP5", "Post-Slaughter Handling", "5", "PS1-PS5"],
      ["CP6", "Processing/Pengolahan", "7", "P1-P7"],
      ["CP7", "Cold Storage/Warehouse", "7", "CS1-CS7"],
      ["CP8", "Distribusi/Logistik", "7", "D1-D7"],
      ["CP9", "Retail/Pasar/Supermarket", "7", "RT1-RT7"],
    ],
    [8, 35, 22, 35]
  ),
  para(bold("Total: 60 sub-kriteria"), text(" × 5 opsi = "), bold("300 opsi dropdown")),

  spacer(120),
  heading3("2.3.2 Contoh Rule untuk CP1.1 (Asal-usul Sapi)"),
  makeTable(
    ["Rule ID", "Level", "Label", "Performance Descriptor"],
    [
      ["CP1.1-I1-R1", "1", "Sangat Rendah", "Bersertifikat halal + dokumen lengkap"],
      ["CP1.1-I1-R2", "2", "Rendah", "Ada dokumen asal tapi belum sertifikasi halal"],
      ["CP1.1-I1-R3", "3", "Sedang", "Dokumen sebagian, asal-usul kurang jelas"],
      ["CP1.1-I1-R4", "4", "Tinggi", "Tidak ada dokumen, asal dari pasar bebas"],
      ["CP1.1-I1-R5", "5", "Sangat Tinggi", "Asal-usul tidak diketahui sama sekali"],
    ],
    [18, 10, 17, 55]
  ),

  spacer(120),
  heading3("2.3.3 Contoh Detail Sub-Kriteria CP1 (Farm/Kandang Sapi)"),
  makeTable(
    ["Kode", "Kriteria", "Opsi Terbaik (Risk 0.07)", "Opsi Terburuk (Risk 0.88)"],
    [
      ["F1", "Asal-usul sapi", "Bersertifikat halal + dokumen lengkap", "Asal-usul tidak diketahui sama sekali"],
      ["F2", "Status kesehatan sapi", "Sehat, surat keterangan veteriner valid", "Sakit / gejala penyakit menular"],
      ["F3", "Kepatuhan pakan", "Pakan 100% halal certified, tercatat lengkap", "Pakan mengandung bahan haram"],
      ["F4", "Penggunaan obat/vaksin", "Halal certified, withdrawal period terpenuhi", "Obat ilegal / bahan haram"],
      ["F5", "Dokumentasi pemeliharaan", "Dokumentasi lengkap dan digital", "Tidak ada dokumentasi sama sekali"],
      ["F6", "Kebersihan kandang", "Bersih, sanitasi rutin terjadwal", "Sangat kotor, potensi kontaminasi tinggi"],
      ["F7", "Kesiapan hewan disembelih", "Sehat, istirahat cukup, ante-mortem PASS", "Hewan tidak layak sembelih"],
    ],
    [8, 22, 35, 35]
  ),

  spacer(120),
  heading3("2.3.4 Contoh Detail Sub-Kriteria CP4 (RPH/Penyembelihan — PALING KRITIS)"),
  makeTable(
    ["Kode", "Kriteria", "Opsi Terbaik (Risk 0.07)", "Opsi Terburuk (Risk 0.88)"],
    [
      ["R1", "Sertifikat halal RPH", "MUI valid, audit PASS", "Tidak punya sertifikat"],
      ["R2", "Kompetensi juru sembelih", "Sertifikat MUI, >5 thn", "Tidak kompeten / bukan Muslim"],
      ["R3", "Proses syariah", "100% sesuai standar MUI", "Tidak ikut prosedur syariah"],
      ["R4", "Pemeriksaan ante/post-mortem", "Drh resmi, lengkap", "Tidak ada pemeriksaan"],
      ["R5", "Sanitasi alat & area", "Sterilisasi rutin, GMP", "Tidak ada prosedur sanitasi"],
      ["R6", "Pemisahan halal/non-halal", "Dedicated 100% halal", "Tidak ada pemisahan"],
      ["R7", "Dokumentasi penyembelihan", "Digital per ekor + foto", "Tidak ada pencatatan"],
      ["R8", "Pengawasan halal internal", "Tim aktif, audit bulanan", "Tidak ada pengawasan"],
      ["R9", "Audit & corrective action", "Eksternal tahunan + CAPA", "Temuan diabaikan"],
      ["R10", "Traceability batch", "Full digital farm-to-carcass", "Tidak ada traceability"],
    ],
    [8, 25, 33, 34]
  ),

  pageBreak(),
);


// ═══════════════════════════════════════════════════════════════════
// BAGIAN 3: PENGUJIAN
// ═══════════════════════════════════════════════════════════════════

sections.push(
  heading1("BAGIAN 3: PENGUJIAN"),
  spacer(100),

  // 3.1 TEORI
  heading2("3.1 TEORI PENGUJIAN (UNTUK BAB 3)"),

  heading3("3.1.1 Pengujian Model IndoBERT (Klasifikasi Intent)"),
  para(bold("Teknik: "), italic("Held-out Test Set Evaluation"), text(" dengan metrik klasifikasi standar")),
  spacer(60),
  para(bold("Metrik yang Digunakan:")),
  makeTable(
    ["Metrik", "Rumus", "Keterangan"],
    [
      ["Accuracy", "(TP + TN) / (TP + TN + FP + FN)", "Proporsi prediksi benar dari total data"],
      ["Precision", "TP / (TP + FP)", "Dari semua yang diprediksi kelas X, berapa yang benar"],
      ["Recall", "TP / (TP + FN)", "Dari semua data aktual kelas X, berapa yang terdeteksi"],
      ["F1-Score", "2 × (P × R) / (P + R)", "Rata-rata harmonik Precision dan Recall"],
    ],
    [15, 40, 45]
  ),
  spacer(60),
  para(bold("Metode Evaluasi:")),
  numberedPara(1, "Dataset dibagi 90:10 (train:test) menggunakan stratified split (seed=42)"),
  numberedPara(2, "Model dilatih selama 5 epoch menggunakan training set (1620 data)"),
  numberedPara(3, "Model dievaluasi menggunakan held-out test set (180 data) yang tidak pernah dilihat saat training"),
  numberedPara(4, "Metrics dihitung per kelas dan secara keseluruhan (macro average)"),
  numberedPara(5, "Confusion Matrix digunakan untuk analisis misklasifikasi"),
  spacer(60),
  para(bold("Justifikasi:")),
  bullet("Held-out test set dipilih karena dataset cukup besar (1800 sampel) dan balanced (300 per kelas)"),
  bullet("Tidak menggunakan k-fold cross validation karena fine-tuning BERT sangat mahal secara komputasi"),
  bullet("Data uji mengandung variasi realistis: singkatan, typo, kalimat ambigu (mensimulasikan user nyata)"),

  spacer(120),
  heading3("3.1.2 Pengujian Fuzzy AHP (Consistency Ratio)"),
  para(bold("Teknik: "), italic("Consistency Ratio (CR) Test"), text(" — Saaty (1990)")),
  spacer(60),
  para(bold("Metrik yang Digunakan:")),
  makeTable(
    ["Metrik", "Rumus", "Keterangan"],
    [
      ["λmax", "(1/n) × Σ(Aw_i / Wi_i)", "Eigenvalue terbesar dari matriks perbandingan"],
      ["CI (Consistency Index)", "(λmax - n) / (n - 1)", "Indeks inkonsistensi"],
      ["RI (Random Index)", "Tabel Saaty (1990)", "Indeks acak berdasarkan ukuran matriks"],
      ["CR (Consistency Ratio)", "CI / RI", "Rasio konsistensi. CR < 0.10 = Konsisten"],
    ],
    [25, 35, 40]
  ),
  spacer(60),
  para(bold("Metode Evaluasi:")),
  numberedPara(1, "Matriks perbandingan berpasangan dari pakar di-defuzzify menjadi matriks crisp"),
  numberedPara(2, "Dihitung bobot konvensional AHP (normalisasi kolom + rata-rata baris)"),
  numberedPara(3, "Dihitung weighted sum vector (Aw = Matriks Crisp × Wi)"),
  numberedPara(4, "Dihitung λmax dari rasio Aw_i / Wi_i"),
  numberedPara(5, "CI dan CR dihitung dan dibandingkan dengan threshold 0.10"),

  spacer(120),
  heading3("3.1.3 Pengujian Rule-Based Engine"),
  para(bold("Teknik: "), italic("Scenario-Based Testing"), text(" + "), italic("Unit Testing")),
  spacer(60),
  para(bold("Skenario Pengujian:")),
  makeTable(
    ["No", "Skenario", "Input", "Expected Output"],
    [
      ["1", "Semua indikator rendah", "[1,1,1,1,1]", "Konstruk = 1 (Sangat Rendah)"],
      ["2", "Satu indikator tinggi", "[1,1,1,4,1]", "Konstruk = 4 (Tinggi) — Weakest-Link"],
      ["3", "Semua indikator critical", "[5,5,5,5,5]", "Konstruk = 5 (Sangat Tinggi)"],
      ["4", "Mixed scores", "[2,3,1,4,2]", "Konstruk = 4 (Tinggi) — MAX = 4"],
    ],
    [7, 30, 20, 43]
  ),

  spacer(120),
  heading3("3.1.4 Pengujian Integrasi Sistem (E2E)"),
  para(bold("Teknik: "), italic("End-to-End Testing"), text(" menggunakan Playwright")),
  spacer(60),
  makeTable(
    ["No", "Skenario", "Aksi", "Expected"],
    [
      ["1", "Dashboard Rekap Aktual", "Buka /dashboard/rekap-aktual", "Header \"Rekap Kuesioner 3\" visible"],
      ["2", "Dashboard Rekap Risiko", "Buka /dashboard/rekap-risiko", "Header \"Rekap Kuesioner 2\" visible"],
      ["3", "Filter & Search", "Input di search bar", "Data terfilter sesuai keyword"],
    ],
    [7, 25, 33, 35]
  ),

  spacer(120),
  heading3("3.1.5 Pengujian Unit (Vitest)"),
  para(bold("Teknik: "), italic("Unit Testing"), text(" dengan framework Vitest")),
  spacer(60),
  makeTable(
    ["No", "Test Case", "Fungsi yang Diuji", "Expected Result"],
    [
      ["1", "getReciprocal", "Inverse TFN [2,4,8]", "[1/8, 1/4, 1/2]"],
      ["2", "sumTFNs", "Jumlah 3 TFN", "[12, 15, 18]"],
      ["3", "defuzzify", "CoA [1,3,5]", "3.0"],
      ["4", "normalizeWeights", "Normalisasi [2,4,4]", "[0.2, 0.4, 0.4]"],
      ["5", "normalizeWeights zero", "Handle [0,0,0]", "[0.333, 0.333, 0.333]"],
      ["6", "getRiskLevel", "Klasifikasi risiko", "0.8→Critical, 0.6→High, 0.3→Moderate, 0.1→Low"],
      ["7", "calculateConsistencyRatio", "Matriks konsisten sempurna", "CI=0, CR=0, isConsistent=true"],
    ],
    [7, 25, 28, 40]
  ),

  spacer(60),
  ...diagramPlaceholder("7", "Alur Pengujian Sistem (Testing Flow)", "Render DIAGRAM 7 dari file mermaid_diagrams.md → mermaid.live → Export PNG → Insert Picture di sini"),

  pageBreak(),
);


// ═══════════════════════════════════════════════════════════════════
// 3.2 HASIL PENGUJIAN (BAB 4)
// ═══════════════════════════════════════════════════════════════════

sections.push(
  heading2("3.2 HASIL PENGUJIAN (UNTUK BAB 4)"),

  heading3("3.2.1 Hasil Pengujian IndoBERT"),
  para(bold("Classification Report:")),
  makeTable(
    ["Kelas (Intent)", "Precision", "Recall", "F1-Score", "Support"],
    [
      ["batch_trace", "0.87", "0.87", "0.87", "30"],
      ["greeting", "1.00", "1.00", "1.00", "30"],
      ["knowledge_query", "0.91", "1.00", "0.95", "30"],
      ["operational_data", "0.86", "0.80", "0.83", "30"],
      ["out_of_scope", "0.85", "0.93", "0.89", "30"],
      ["risk_check", "0.96", "0.83", "0.89", "30"],
    ],
    [25, 15, 15, 15, 15]
  ),
  spacer(40),
  // Summary row as separate table
  makeTable(
    ["", "Precision", "Recall", "F1-Score", "Support"],
    [
      ["Macro Average", "0.91", "0.91", "0.90", "180"],
      ["Akurasi Total", "", "", "0.91", "180"],
    ],
    [25, 15, 15, 15, 15]
  ),

  spacer(80),
  para(bold("Analisis Hasil:")),
  numberedPara(1, "Akurasi keseluruhan: 91% — Model berhasil mengklasifikasikan 164 dari 180 data uji dengan benar."),
  numberedPara(2, "Kelas terbaik: greeting (F1=1.00) — Kalimat sapaan memiliki struktur linguistik yang sangat berbeda, mudah dikenali."),
  numberedPara(3, "Kelas dengan performa terendah: operational_data (F1=0.83) — Recall hanya 0.80, artinya 6 dari 30 data aktual salah diklasifikasi karena kalimat pendek tanpa subjek eksplisit."),
  numberedPara(4, "Tidak ada overfitting — Model diuji dengan held-out test set murni yang belum pernah dilihat saat training."),
  numberedPara(5, "Confidence threshold 0.7 — Digunakan di produksi untuk memastikan hanya prediksi dengan keyakinan tinggi yang dipakai. Jika di bawah 0.7, sistem fallback ke LLM function calling."),

  spacer(80),
  para(bold("Analisis Misklasifikasi (Confusion Matrix):")),
  makeTable(
    ["Dari (Aktual)", "Ke (Prediksi)", "Jumlah", "Penjelasan"],
    [
      ["risk_check", "batch_trace", "3", "Pertanyaan risiko sering menyertakan ID batch (misal: \"apakah batch B-001 aman?\")"],
      ["operational_data", "knowledge_query", "3", "Kalimat pendek tanpa subjek jelas (misal: \"datanya mana?\")"],
      ["operational_data", "batch_trace", "2", "Ambiguitas antara minta data operasional vs lacak batch"],
      ["out_of_scope", "lainnya", "2", "Istilah mirip domain halal padahal bukan"],
    ],
    [20, 20, 10, 50]
  ),

  pageBreak(),

  // 3.2.2 Fuzzy AHP
  heading3("3.2.2 Hasil Pengujian Fuzzy AHP (Consistency Ratio)"),
  para(bold("Tabel Ringkasan CR Semua Level (Data Aktual dari Sistem):")),
  para(text("Target: CR < 0.10 — Nilai CR di bawah 0.10 menandakan matriks tersebut konsisten dan layak digunakan.")),
  spacer(40),

  makeTable(
    ["No", "Matriks", "λ Max", "CI", "CR Value", "Status"],
    [
      ["1", "Kriteria Umum (KU)", "10.6177", "0.0686", "0.0461", "✅ KONSISTEN"],
      ["2", "Antar CP — Level 1", "9.5638", "0.0705", "0.0486", "✅ KONSISTEN"],
      ["3", "Sub-Kriteria CP1 (Farm)", "5.2390", "0.0598", "0.0534", "✅ KONSISTEN"],
      ["4", "Sub-Kriteria CP2 (Pakan)", "5.2758", "0.0689", "0.0616", "✅ KONSISTEN"],
      ["5", "Sub-Kriteria CP3 (Transport)", "5.3185", "0.0796", "0.0711", "✅ KONSISTEN"],
      ["6", "Sub-Kriteria CP4 (RPH)", "9.4668", "0.0583", "0.0402", "✅ KONSISTEN"],
      ["7", "Sub-Kriteria CP5 (Post-Slaughter)", "4.2226", "0.0742", "0.0825", "✅ KONSISTEN"],
      ["8", "Sub-Kriteria CP6 (Processing)", "6.5025", "0.1005", "0.0810", "✅ KONSISTEN"],
      ["9", "Sub-Kriteria CP7 (Cold Storage)", "5.2011", "0.0503", "0.0449", "✅ KONSISTEN"],
      ["10", "Sub-Kriteria CP8 (Distribusi)", "6.3401", "0.0680", "0.0548", "✅ KONSISTEN"],
      ["11", "Sub-Kriteria CP9 (Retail)", "6.4607", "0.0921", "0.0743", "✅ KONSISTEN"],
    ],
    [5, 30, 13, 13, 14, 15]
  ),

  spacer(80),
  para(bold("Interpretasi Hasil:")),
  numberedPara(1, "Seluruh 11 matriks perbandingan berpasangan (1 Kriteria Umum + 1 Level 1 + 9 Level 2) memiliki nilai CR < 0.10 → Semua KONSISTEN dan layak digunakan."),
  numberedPara(2, "CR tertinggi: Sub-Kriteria CP5 (0.0825) — Masih di bawah batas 0.10, namun mendekati batas. Ini menunjukkan konstruk Post-Slaughter Handling memiliki tingkat kompleksitas perbandingan yang relatif lebih tinggi bagi pakar."),
  numberedPara(3, "CR terendah: Sub-Kriteria CP4 (0.0402) — RPH/Penyembelihan memiliki konsistensi tertinggi meskipun matriksnya paling besar, menunjukkan pakar memiliki kejelasan yang sangat kuat dalam membandingkan sub-kriteria penyembelihan."),
  numberedPara(4, "CI tertinggi: Sub-Kriteria CP6 (0.1005) — Meskipun CI > 0.10, nilai CR tetap di bawah 0.10 (0.0810) karena RI untuk matriks berukuran besar lebih tinggi."),
  numberedPara(5, "Kesimpulan: Seluruh bobot Fuzzy AHP yang dihasilkan dari matriks perbandingan berpasangan pakar telah memenuhi syarat konsistensi dan dapat diterima secara ilmiah untuk digunakan dalam perhitungan tingkat risiko halal supply chain."),

  spacer(120),

  // 3.2.3 Unit Test
  heading3("3.2.3 Hasil Pengujian Unit Test (Vitest)"),
  makeTable(
    ["No", "Test Case", "Status", "Detail"],
    [
      ["1", "getReciprocal — inverse TFN", "✅ PASS", "[2,4,8] → [0.125, 0.25, 0.5]"],
      ["2", "sumTFNs — jumlah TFN", "✅ PASS", "3 TFN → [12, 15, 18]"],
      ["3", "defuzzify — Center of Area", "✅ PASS", "[1,3,5] → 3.0"],
      ["4", "normalizeWeights — normalisasi", "✅ PASS", "[2,4,4] → [0.2, 0.4, 0.4]"],
      ["5", "normalizeWeights — handle zero", "✅ PASS", "[0,0,0] → ≈[0.333, 0.333, 0.333]"],
      ["6", "getRiskLevel — klasifikasi", "✅ PASS", "0.8→Critical, 0.6→High, 0.3→Moderate, 0.1→Low"],
      ["7", "calculateConsistencyRatio", "✅ PASS", "CI=0, CR=0, isConsistent=true"],
    ],
    [7, 30, 13, 50]
  ),
  para(bold("Command: "), text("npx vitest run src/lib/dss/fuzzyAHP.test.ts")),

  spacer(120),

  // 3.2.4 E2E
  heading3("3.2.4 Hasil Pengujian E2E (Playwright)"),
  makeTable(
    ["No", "Test Case", "Status", "Detail"],
    [
      ["1", "Load Dashboard Rekap Aktual", "✅ PASS", "Header \"Rekap Kuesioner 3\" muncul"],
      ["2", "Load Dashboard Rekap Risiko", "✅ PASS", "Header \"Rekap Kuesioner 2\" muncul"],
      ["3", "Search/Filter tersedia", "✅ PASS", "Placeholder \"Cari nama, instansi, email...\" terlihat"],
    ],
    [7, 30, 13, 50]
  ),
  para(bold("Command: "), text("npx playwright test tests/e2e/dashboard.spec.ts")),

  spacer(120),

  // 3.2.5 Rule-Based
  heading3("3.2.5 Hasil Pengujian Rule-Based (Skenario)"),
  makeTable(
    ["No", "Skenario", "Input Skor", "Expected Risk", "Actual Risk", "Status"],
    [
      ["1", "Semua rendah", "[1,1,1,1,1]", "1 (Sangat Rendah)", "1 (Sangat Rendah)", "✅ PASS"],
      ["2", "Satu tinggi (weakest-link)", "[1,1,1,4,1]", "4 (Tinggi)", "4 (Tinggi)", "✅ PASS"],
      ["3", "Semua critical", "[5,5,5,5,5]", "5 (Sangat Tinggi)", "5 (Sangat Tinggi)", "✅ PASS"],
      ["4", "Mixed", "[2,3,1,4,2]", "4 (Tinggi)", "4 (Tinggi)", "✅ PASS"],
      ["5", "Missing indicators", "[3,2]", "3 (Sedang)", "3 (Sedang)", "✅ PASS"],
    ],
    [5, 22, 13, 20, 20, 10]
  ),
  spacer(60),
  para(bold("Keterangan: "), text("Agregasi menggunakan prinsip Weakest-Link (MAX) — jika satu indikator saja bernilai tinggi, maka keseluruhan konstruk dianggap berisiko tinggi. Ini sesuai dengan prinsip keamanan pangan halal dimana satu titik kegagalan saja sudah membahayakan seluruh rantai pasok.")),

  pageBreak(),
);


// ═══════════════════════════════════════════════════════════════════
// REFERENSI FILE
// ═══════════════════════════════════════════════════════════════════

sections.push(
  heading2("REFERENSI FILE SUMBER KODE"),
  makeTable(
    ["File", "Lokasi", "Keterangan"],
    [
      ["fuzzyAHP.ts", "src/lib/dss/fuzzyAHP.ts", "Seluruh logika Fuzzy AHP (494 baris)"],
      ["rule-engine.ts", "src/lib/dss/rule-engine.ts", "Rule-Based Engine (296 baris)"],
      ["intent-classifier.ts", "src/lib/ml/intent-classifier.ts", "IndoBERT classifier (65 baris)"],
      ["chat/route.ts", "src/app/api/chat/route.ts", "Integrasi chat + routing (496 baris)"],
      ["ahp/route.ts", "src/app/api/dss/ahp/route.ts", "API AHP calculation (137 baris)"],
      ["input/route.ts", "src/app/api/dss/input/route.ts", "API Input CP records (211 baris)"],
      ["fuzzyAHP.test.ts", "src/lib/dss/fuzzyAHP.test.ts", "Unit test Fuzzy AHP (81 baris)"],
      ["dashboard.spec.ts", "tests/e2e/dashboard.spec.ts", "E2E test Playwright (19 baris)"],
      ["dataset_intent.csv", "ml/dataset_intent.csv", "Dataset IndoBERT 1800 sampel"],
      ["TRAINING_GUIDE.md", "ml/TRAINING_GUIDE.md", "Script training Google Colab"],
      ["arsitektur-sistem.mmd", "docs/arsitektur-sistem.mmd", "Diagram arsitektur Mermaid"],
      ["Rule Base JSON", "scratch/rule base/", "925 rules, 185 indikator, 37 konstruk"],
      ["K1V1 Perhitungan Excel", "K1V1_Perhitungan_Manual_Lengkap_*.xlsx", "Perhitungan manual Fuzzy AHP"],
    ],
    [20, 35, 45]
  ),
);

// ═══════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════

const now = new Date();
const ts = now.toISOString().slice(0, 19).replace(/:/g, '-');
const fileName = `Laporan_Bab3_Bab4_IndoBERT_FuzzyAHP_${ts}.docx`;

const doc = new Document({
  creator: "Daffa — KMS-DSS Halal Supply Chain",
  title: "Laporan Bab 3 & Bab 4 — IndoBERT + Fuzzy AHP + Rule-Based",
  description: "Flow Process, Data Langkah-Langkah, dan Pengujian",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: FONT_SIZE_BODY },
        paragraph: { spacing: { line: 360 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({
            text: "Laporan IndoBERT + Fuzzy AHP + Rule-Based — KMS-DSS Halal Supply Chain",
            font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY, italics: true,
          })],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [new TextRun({
            text: `Digenerate: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            font: FONT, size: FONT_SIZE_FOOTER, color: COLOR_GRAY,
          })],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children: sections,
  }],
});

// Generate file
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(fileName, buffer);
console.log(`\n✅ File berhasil dibuat: ${fileName}`);
console.log(`   Ukuran: ${(buffer.byteLength / 1024).toFixed(1)} KB`);
console.log(`   Total halaman: ~25-30 halaman`);
console.log(`\n📂 Buka file di Microsoft Word untuk melihat hasilnya.`);
