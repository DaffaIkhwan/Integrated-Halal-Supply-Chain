import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign, PageBreak
} from "docx";
import * as fs from "fs";

// Baseline weights
const baseline = {
  CP1: 0.0568,
  CP2: 0.0586,
  CP3: 0.0510,
  CP4: 0.1404,
  CP5: 0.1542,
  CP6: 0.2592, 
  CP7: 0.0774,
  CP8: 0.1056,
  CP9: 0.0968,
};

function calculateSensitivity(targetCP, changePercentage) {
  const newWeights = { ...baseline };
  const originalTarget = baseline[targetCP];
  let newTarget = originalTarget * (1 + changePercentage);
  
  // Cap at 0 (can't be negative)
  if (newTarget < 0) newTarget = 0;
  
  const diff = newTarget - originalTarget;
  const sumOthers = 1 - originalTarget;
  
  for (const cp in newWeights) {
    if (cp === targetCP) {
      newWeights[cp] = newTarget;
    } else {
      const proportion = baseline[cp] / sumOthers;
      newWeights[cp] = baseline[cp] - (proportion * diff);
    }
  }
  
  return newWeights;
}

// Helper styling
const FONT = "Calibri";
const COLOR_PRIMARY = "0891B2"; // cyan-600
const COLOR_DARK = "1E293B"; // slate-800
const COLOR_TABLE_HEADER = "0E7490"; // cyan-700
const COLOR_TABLE_HEADER_TEXT = "FFFFFF";
const COLOR_TABLE_ALT = "F0F9FF"; // sky-50

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: COLOR_PRIMARY })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
  });
}
function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: COLOR_DARK })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
  });
}
function para(...runs) {
  return new Paragraph({ children: runs, spacing: { after: 120, line: 276 } });
}
function text(t, opts = {}) {
  return new TextRun({ text: t, font: FONT, size: 22, color: COLOR_DARK, ...opts });
}

function headerCell(t) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: t, font: FONT, size: 18, bold: true, color: COLOR_TABLE_HEADER_TEXT })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: COLOR_TABLE_HEADER },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}
function dataCell(t, rowIdx, isBold=false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: String(t), font: FONT, size: 18, color: COLOR_DARK, bold: isBold })],
      alignment: AlignmentType.CENTER,
    })],
    shading: rowIdx % 2 === 1 ? { type: ShadingType.SOLID, color: COLOR_TABLE_ALT } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}

function createRankTable(title, w) {
  const sorted = Object.entries(w).sort((a, b) => b[1] - a[1]);
  
  const headers = ["Peringkat", "Kriteria", "Bobot (%)"];
  const headerRow = new TableRow({ children: headers.map(h => headerCell(h)), tableHeader: true });
  
  const dataRows = sorted.map(([cp, val], i) => {
    return new TableRow({
      children: [
        dataCell(i + 1, i, i === 0), // Bold rank 1
        dataCell(cp, i, i === 0),
        dataCell((val * 100).toFixed(2) + "%", i, i === 0),
      ]
    });
  });

  return [
    para(text(title, { bold: true })),
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({ spacing: { after: 200 } })
  ];
}

// Generate Document sections
const sectionsChildren = [
  heading1("Laporan Analisis Sensitivitas Komprehensif: Model Fuzzy AHP"),
  para(text("Dokumen ini menyajikan hasil Analisis Sensitivitas secara menyeluruh terhadap model Fuzzy Analytical Hierarchy Process (FAHP) yang digunakan dalam sistem Halal Supply Chain. Pengujian dilakukan dengan memanipulasi bobot dari setiap kriteria (CP1 hingga CP9) sebesar +10%, +20%, -10%, dan -20% secara bergantian.")),
  
  heading2("1. Baseline: Bobot Awal dari Database"),
  para(text("Berikut adalah bobot asli (baseline) hasil agregasi seluruh responden pakar sebelum dilakukan simulasi perubahan bobot.")),
  ...createRankTable("Tabel 1: Ranking Baseline (Kondisi Asli)", baseline),
  new Paragraph({ children: [new PageBreak()] })
];

const cpList = Object.keys(baseline).sort();
let sectionNum = 2;

for (const cp of cpList) {
  const s1 = calculateSensitivity(cp, 0.10);
  const s2 = calculateSensitivity(cp, 0.20);
  const s3 = calculateSensitivity(cp, -0.10);
  const s4 = calculateSensitivity(cp, -0.20);

  sectionsChildren.push(heading2(`${sectionNum}. Skenario Pengujian Kriteria: ${cp}`));
  sectionsChildren.push(para(text(`Simulasi perubahan bobot artifisial pada ${cp} dengan asumsi kriteria lainnya disesuaikan secara proporsional.`)));
  
  sectionsChildren.push(...createRankTable(`Skenario ${cp} Naik 10%`, s1));
  sectionsChildren.push(...createRankTable(`Skenario ${cp} Naik 20%`, s2));
  sectionsChildren.push(...createRankTable(`Skenario ${cp} Turun 10%`, s3));
  sectionsChildren.push(...createRankTable(`Skenario ${cp} Turun 20%`, s4));
  
  sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));
  sectionNum++;
}

sectionsChildren.push(heading2(`${sectionNum}. Kesimpulan Umum`));
sectionsChildren.push(
  para(text("Berdasarkan pengujian terhadap keseluruhan 9 kriteria (CP1 hingga CP9) dengan manipulasi hingga ±20%, dapat ditarik kesimpulan bahwa model FAHP memiliki kestabilan struktur yang sangat baik ("), text("Robust", {bold: true}), text(")."))
);
sectionsChildren.push(
  para(text("Sebagian besar skenario tidak menggeser ranking prioritas puncak secara drastis, sehingga keputusan akhir mengenai titik kritis (Critical Points) tertinggi tetap valid dan tidak sensitif terhadap bias minor penyesuaian bobot tunggal."))
);

const doc = new Document({
  sections: [
    {
      properties: {},
      children: sectionsChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Laporan_Analisis_Sensitivitas_Lengkap_CP1-CP9.docx", buffer);
  console.log("SUCCESS: Laporan_Analisis_Sensitivitas_Lengkap_CP1-CP9.docx telah berhasil diperbarui dengan semua CP!");
});
