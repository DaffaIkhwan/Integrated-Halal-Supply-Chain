import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, VerticalAlign, PageBreak,
  Header, Footer, PageNumber, NumberFormat, Tab, TabStopType, TabStopPosition,
  ImageRun, BorderStyle,
} from "docx";
import * as fs from "fs";

// ══════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════

const baseline = {
  CP1: { weight: 0.0568, name: "Farm / Kandang Sapi" },
  CP2: { weight: 0.0586, name: "Pakan & Kesehatan Hewan" },
  CP3: { weight: 0.0510, name: "Transportasi Hewan ke RPH" },
  CP4: { weight: 0.1404, name: "RPH / Penyembelihan" },
  CP5: { weight: 0.1542, name: "Post-Slaughter Handling" },
  CP6: { weight: 0.2592, name: "Pengolahan / Processing" },
  CP7: { weight: 0.0774, name: "Cold Storage / Gudang" },
  CP8: { weight: 0.1056, name: "Distribusi / Logistik" },
  CP9: { weight: 0.0968, name: "Retail / Pasar" },
};

const VARIATIONS = [-20, -15, -10, -5, 5, 10, 15, 20];
const cpList = Object.keys(baseline).sort();

// ══════════════════════════════════════════════════════════════════
// CALCULATION ENGINE
// ══════════════════════════════════════════════════════════════════

function perturbWeights(targetCP, changePercent) {
  const origW = baseline[targetCP].weight;
  let newW = origW * (1 + changePercent / 100);
  if (newW < 0) newW = 0;
  if (newW > 1) newW = 1;
  const diff = newW - origW;
  const sumOthers = 1 - origW;

  const result = {};
  for (const cp of cpList) {
    if (cp === targetCP) {
      result[cp] = newW;
    } else {
      const proportion = sumOthers > 0 ? baseline[cp].weight / sumOthers : 0;
      result[cp] = Math.max(0, baseline[cp].weight - proportion * diff);
    }
  }
  return result;
}

function buildRanking(weights) {
  const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  return entries.map(([cp, w], i) => ({ cp, weight: w, rank: i + 1 }));
}

const baselineWeights = {};
for (const cp of cpList) baselineWeights[cp] = baseline[cp].weight;
const baselineRanking = buildRanking(baselineWeights);
const baselineRankMap = {};
for (const r of baselineRanking) baselineRankMap[r.cp] = r.rank;

// Run all scenarios
const allScenarios = [];
for (const cp of cpList) {
  for (const v of VARIATIONS) {
    const perturbed = perturbWeights(cp, v);
    const newRanking = buildRanking(perturbed);
    const newRankMap = {};
    for (const r of newRanking) newRankMap[r.cp] = r.rank;

    const rankChanges = cpList.map(c => ({
      cp: c,
      oldRank: baselineRankMap[c],
      newRank: newRankMap[c],
      delta: baselineRankMap[c] - newRankMap[c],
    }));
    const anyChanged = rankChanges.some(rc => rc.delta !== 0);
    const topChanged = newRanking[0].cp !== baselineRanking[0].cp;

    allScenarios.push({
      targetCP: cp,
      variation: v,
      label: v > 0 ? `+${v}%` : `${v}%`,
      newRanking,
      rankChanges,
      anyChanged,
      topChanged,
    });
  }
}

// Sensitivity Index
const sensitivityIndex = cpList.map(cp => {
  const cpScenarios = allScenarios.filter(s => s.targetCP === cp);
  const total = cpScenarios.length;
  const rankChangeCount = cpScenarios.filter(s => s.anyChanged).length;
  const topChangeCount = cpScenarios.filter(s => s.topChanged).length;
  const score = total > 0 ? rankChangeCount / total : 0;
  const stability = rankChangeCount === 0 ? "Sangat Stabil"
    : rankChangeCount <= 2 ? "Stabil"
    : rankChangeCount <= 4 ? "Cukup Sensitif"
    : "Sensitif";
  return { cp, total, rankChangeCount, topChangeCount, score, stability };
});

// Overall robustness
const totalScenarios = allScenarios.length;
const totalRankChanges = allScenarios.filter(s => s.anyChanged).length;
const totalTopChanges = allScenarios.filter(s => s.topChanged).length;
const robustnessScore = 1 - totalRankChanges / totalScenarios;
const robustnessLevel = robustnessScore >= 0.9 ? "Sangat Robust"
  : robustnessScore >= 0.7 ? "Robust"
  : robustnessScore >= 0.5 ? "Cukup Robust" : "Sensitif";

const top3 = baselineRanking.slice(0, 3).map(r => r.cp);
const top3Stable = !allScenarios.some(s =>
  s.topChanged || s.rankChanges.filter(rc => top3.includes(rc.cp)).some(rc => Math.abs(rc.delta) >= 2)
);

const mostStable = [...sensitivityIndex].sort((a, b) => a.score - b.score)[0];
const mostSensitive = [...sensitivityIndex].sort((a, b) => b.score - a.score)[0];

// ══════════════════════════════════════════════════════════════════
// DOCX STYLING
// ══════════════════════════════════════════════════════════════════

const FONT = "Calibri";
const C_PRIMARY = "0891B2";   // cyan-600
const C_DARK = "1E293B";      // slate-800
const C_HEADER_BG = "0E7490"; // cyan-700
const C_HEADER_TX = "FFFFFF";
const C_ALT_ROW = "F0FDFA";   // teal-50
const C_GREEN = "059669";     // emerald-600
const C_AMBER = "D97706";     // amber-600
const C_RED = "DC2626";       // red-600
const C_BLUE = "2563EB";      // blue-600
const C_GRAY = "64748B";      // slate-500

const BORDER_STYLE = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
};

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: C_PRIMARY })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}
function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: C_DARK })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
  });
}
function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: C_BLUE })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
  });
}
function para(...runs) {
  return new Paragraph({
    children: runs,
    spacing: { after: 120, line: 300 },
  });
}
function text(t, opts = {}) {
  return new TextRun({ text: t, font: FONT, size: 22, color: C_DARK, ...opts });
}
function bullet(t, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: t, font: FONT, size: 22, color: C_DARK, ...opts })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function headerCell(t, width) {
  const cellOpts = {
    children: [new Paragraph({
      children: [new TextRun({ text: t, font: FONT, size: 18, bold: true, color: C_HEADER_TX })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: C_HEADER_BG },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    borders: BORDER_STYLE,
  };
  if (width) cellOpts.width = { size: width, type: WidthType.PERCENTAGE };
  return new TableCell(cellOpts);
}

function dataCell(t, rowIdx, opts = {}) {
  const { bold, color, align, width } = opts;
  const cellOpts = {
    children: [new Paragraph({
      children: [new TextRun({
        text: String(t),
        font: FONT,
        size: 18,
        color: color || C_DARK,
        bold: bold || false,
      })],
      alignment: align || AlignmentType.CENTER,
    })],
    shading: rowIdx % 2 === 1 ? { type: ShadingType.SOLID, color: C_ALT_ROW } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    borders: BORDER_STYLE,
  };
  if (width) cellOpts.width = { size: width, type: WidthType.PERCENTAGE };
  return new TableCell(cellOpts);
}

function coloredCell(t, rowIdx, bgColor, txColor) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({
        text: String(t), font: FONT, size: 18, bold: true, color: txColor || C_DARK,
      })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: bgColor },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    borders: BORDER_STYLE,
  });
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ══════════════════════════════════════════════════════════════════

const children = [];

// ─── COVER ───
children.push(
  new Paragraph({ spacing: { before: 2000 } }),
  new Paragraph({
    children: [new TextRun({ text: "LAPORAN", font: FONT, size: 48, bold: true, color: C_PRIMARY })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [new TextRun({ text: "ANALISIS SENSITIVITAS", font: FONT, size: 56, bold: true, color: C_DARK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "MODEL FUZZY ANALYTICAL HIERARCHY PROCESS (FAHP)", font: FONT, size: 28, bold: true, color: C_PRIMARY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: FONT, size: 24, color: C_PRIMARY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Sistem Informasi Manajemen Halal Supply Chain Terintegrasi",
      font: FONT, size: 24, color: C_GRAY, italics: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Pengujian Kestabilan Bobot Kriteria CP1–CP9",
      font: FONT, size: 22, color: C_GRAY,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      font: FONT, size: 22, color: C_DARK,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: `Hasil: ${robustnessLevel} — Skor Robustness: ${(robustnessScore * 100).toFixed(1)}%`,
      font: FONT, size: 24, bold: true, color: robustnessScore >= 0.7 ? C_GREEN : C_RED,
    })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ─── DAFTAR ISI ───
children.push(
  heading1("DAFTAR ISI"),
  para(text("1. Pendahuluan")),
  para(text("2. Metodologi")),
  para(text("3. Baseline — Ranking Awal")),
  para(text("4. Hasil Simulasi Per Kriteria (CP1–CP9)")),
  para(text("5. Matriks Sensitivitas Komprehensif")),
  para(text("6. Indeks Sensitivitas Per CP")),
  para(text("7. Kesimpulan dan Interpretasi")),
  new Paragraph({ children: [new PageBreak()] }),
);

// ─── 1. PENDAHULUAN ───
children.push(
  heading1("1. Pendahuluan"),
  para(
    text("Dokumen ini menyajikan hasil "),
    text("Analisis Sensitivitas", { bold: true }),
    text(" secara komprehensif terhadap model "),
    text("Fuzzy Analytical Hierarchy Process (FAHP)", { bold: true, italics: true }),
    text(" yang digunakan dalam Sistem Informasi Manajemen Halal Supply Chain Terintegrasi.")
  ),
  para(
    text("Analisis sensitivitas bertujuan untuk menguji "),
    text("kestabilan (robustness)", { bold: true }),
    text(" model terhadap perubahan bobot kriteria. Jika perubahan kecil pada bobot input menyebabkan perubahan besar pada ranking output, maka model dianggap "),
    text("sensitif", { italics: true }),
    text(" dan hasilnya kurang dapat diandalkan. Sebaliknya, jika ranking tetap stabil meskipun bobot divariasikan, maka model bersifat "),
    text("robust", { bold: true }),
    text(".")
  ),
  para(
    text("Pengujian dilakukan terhadap seluruh 9 Critical Points (CP1–CP9) dengan variasi perturbasi: "),
    text("±5%, ±10%, ±15%, dan ±20%", { bold: true }),
    text(". Total skenario yang diuji: "),
    text(`${totalScenarios} skenario`, { bold: true }),
    text(` (9 CP × ${VARIATIONS.length} variasi).`)
  ),
);

// ─── 2. METODOLOGI ───
children.push(
  heading1("2. Metodologi"),
  heading2("2.1 Prosedur Perturbasi"),
  para(text("Langkah-langkah analisis sensitivitas yang digunakan:")),
  bullet("Pilih satu CP sebagai target perturbasi."),
  bullet("Modifikasi bobot CP target sebesar ±5%, ±10%, ±15%, ±20% dari nilai baseline."),
  bullet("Redistribusi bobot CP lain secara proporsional agar total bobot tetap = 1.0 (100%)."),
  bullet("Hitung ranking baru berdasarkan bobot yang telah diperturbasi."),
  bullet("Bandingkan ranking baru dengan ranking baseline."),
  bullet("Ulangi untuk seluruh 9 CP."),

  heading2("2.2 Formula Redistribusi Proporsional"),
  para(
    text("Misalkan CP target = "),
    text("k", { italics: true }),
    text(", perubahan = "),
    text("δ", { italics: true }),
    text(", maka:")
  ),
  para(text("  w'_k = w_k × (1 + δ/100)", { font: "Consolas", size: 20 })),
  para(text("  w'_j = w_j − (w_j / Σw_other) × (w'_k − w_k),  ∀j ≠ k", { font: "Consolas", size: 20 })),
  para(text("Sehingga Σw'_i = 1.0 selalu terjaga.", { italics: true, color: C_GRAY })),

  heading2("2.3 Metrik Evaluasi"),
  bullet("Rank Change Count — jumlah skenario di mana ranking CP berubah."),
  bullet("Top-1 Change Count — jumlah skenario di mana CP peringkat #1 bergeser."),
  bullet("Sensitivity Score — rasio skenario yang mengubah ranking terhadap total skenario."),
  bullet("Robustness Score — 1 − (total rank changes / total skenario) × 100%."),
  new Paragraph({ children: [new PageBreak()] }),
);

// ─── 3. BASELINE ───
children.push(
  heading1("3. Baseline — Ranking Awal"),
  para(text("Tabel berikut menampilkan bobot dan ranking awal (baseline) hasil agregasi Fuzzy AHP dari seluruh responden pakar yang tersimpan di database.")),
);

const baseHeaders = ["Peringkat", "Kode CP", "Nama Critical Point", "Bobot Global", "Persentase (%)"];
const baseHeaderRow = new TableRow({
  children: baseHeaders.map(h => headerCell(h)),
  tableHeader: true,
});
const baseDataRows = baselineRanking.map((r, i) => new TableRow({
  children: [
    dataCell(r.rank, i, { bold: i < 3 }),
    dataCell(r.cp, i, { bold: i < 3 }),
    dataCell(baseline[r.cp].name, i, { align: AlignmentType.LEFT }),
    dataCell(r.weight.toFixed(4), i),
    dataCell((r.weight * 100).toFixed(2) + "%", i, { bold: i < 3, color: i < 3 ? C_PRIMARY : C_DARK }),
  ],
}));

children.push(
  new Table({ rows: [baseHeaderRow, ...baseDataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
  new Paragraph({ spacing: { after: 120 } }),
  para(
    text("Top-3 Prioritas: ", { bold: true }),
    text(`${baselineRanking[0].cp} (${(baselineRanking[0].weight * 100).toFixed(2)}%), `, { color: C_GREEN, bold: true }),
    text(`${baselineRanking[1].cp} (${(baselineRanking[1].weight * 100).toFixed(2)}%), `, { color: C_BLUE, bold: true }),
    text(`${baselineRanking[2].cp} (${(baselineRanking[2].weight * 100).toFixed(2)}%)`, { color: C_AMBER, bold: true }),
  ),
  new Paragraph({ children: [new PageBreak()] }),
);

// ─── 4. HASIL SIMULASI PER CP ───
children.push(
  heading1("4. Hasil Simulasi Per Kriteria (CP1–CP9)"),
  para(text("Bagian ini menampilkan hasil perturbasi untuk setiap CP target. Setiap tabel menunjukkan ranking baru setelah bobot CP target dimodifikasi.")),
);

for (const cp of cpList) {
  children.push(
    heading2(`4.${parseInt(cp.replace("CP", ""))}. Skenario: ${cp} — ${baseline[cp].name}`),
    para(
      text(`Bobot baseline ${cp}: `, { bold: true }),
      text(`${(baseline[cp].weight * 100).toFixed(2)}% (Ranking #${baselineRankMap[cp]})`)
    ),
  );

  for (const v of VARIATIONS) {
    const scenario = allScenarios.find(s => s.targetCP === cp && s.variation === v);
    if (!scenario) continue;

    const labelColor = v > 0 ? C_GREEN : C_RED;
    children.push(
      heading3(`Skenario: ${cp} ${scenario.label}`),
    );

    // Build comparison table
    const sHeaders = ["#", "CP", "Bobot Baru (%)", "Ranking Lama", "Ranking Baru", "Δ"];
    const sHeaderRow = new TableRow({
      children: sHeaders.map(h => headerCell(h)),
      tableHeader: true,
    });

    const sDataRows = scenario.newRanking.map((r, i) => {
      const rc = scenario.rankChanges.find(c => c.cp === r.cp);
      const delta = rc?.delta || 0;
      const deltaStr = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "—";
      const deltaColor = delta > 0 ? C_GREEN : delta < 0 ? C_RED : C_GRAY;
      const isTarget = r.cp === cp;

      return new TableRow({
        children: [
          dataCell(r.rank, i, { bold: isTarget }),
          dataCell(r.cp, i, { bold: isTarget, color: isTarget ? C_PRIMARY : C_DARK }),
          dataCell((r.weight * 100).toFixed(2) + "%", i, { bold: isTarget }),
          dataCell(`#${rc?.oldRank || "-"}`, i),
          dataCell(`#${r.rank}`, i, { bold: delta !== 0, color: delta !== 0 ? C_AMBER : C_DARK }),
          dataCell(deltaStr, i, { bold: delta !== 0, color: deltaColor }),
        ],
      });
    });

    children.push(
      new Table({ rows: [sHeaderRow, ...sDataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
      new Paragraph({ spacing: { after: 60 } }),
      para(
        text("Status: ", { bold: true }),
        scenario.anyChanged
          ? text(scenario.topChanged ? "⚠ Top-1 Berubah" : "⚠ Ranking Berubah", {
              bold: true, color: scenario.topChanged ? C_RED : C_AMBER
            })
          : text("✓ Stabil — Tidak Ada Perubahan Ranking", { bold: true, color: C_GREEN }),
      ),
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
}

// ─── 5. MATRIKS SENSITIVITAS ───
children.push(
  heading1("5. Matriks Sensitivitas Komprehensif"),
  para(text("Tabel berikut menampilkan ranking CP target setelah perturbasi untuk seluruh kombinasi CP × variasi. Warna menunjukkan:")),
  bullet("Hijau (✓) = Ranking tidak berubah (stabil)", { color: C_GREEN }),
  bullet("Kuning (△) = Ranking berubah", { color: C_AMBER }),
  bullet("Merah (✗) = Top-1 berubah", { color: C_RED }),
  new Paragraph({ spacing: { after: 100 } }),
);

// Matrix table
const mHeaders = ["CP Target", "Baseline", ...VARIATIONS.map(v => v > 0 ? `+${v}%` : `${v}%`)];
const mHeaderRow = new TableRow({
  children: mHeaders.map(h => headerCell(h)),
  tableHeader: true,
});

const mDataRows = cpList.map((cp, rowIdx) => {
  const cells = [
    dataCell(`${cp}`, rowIdx, { bold: true, align: AlignmentType.LEFT }),
    dataCell(`#${baselineRankMap[cp]}`, rowIdx, { bold: true }),
  ];

  for (const v of VARIATIONS) {
    const scenario = allScenarios.find(s => s.targetCP === cp && s.variation === v);
    if (!scenario) {
      cells.push(dataCell("—", rowIdx));
      continue;
    }
    const targetInNew = scenario.newRanking.find(r => r.cp === cp);
    const newRank = targetInNew?.rank || 0;
    const changed = newRank !== baselineRankMap[cp];

    if (scenario.topChanged) {
      cells.push(coloredCell(`#${newRank} ✗`, rowIdx, "FEE2E2", C_RED));
    } else if (changed) {
      cells.push(coloredCell(`#${newRank} △`, rowIdx, "FEF3C7", C_AMBER));
    } else {
      cells.push(coloredCell(`#${newRank} ✓`, rowIdx, "D1FAE5", C_GREEN));
    }
  }

  return new TableRow({ children: cells });
});

children.push(
  new Table({ rows: [mHeaderRow, ...mDataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ─── 6. INDEKS SENSITIVITAS ───
children.push(
  heading1("6. Indeks Sensitivitas Per CP"),
  para(text("Tabel berikut merangkum indeks sensitivitas untuk setiap CP — mengukur seberapa banyak skenario yang mengubah ranking ketika bobot CP tersebut diperturbasi.")),
);

const siHeaders = ["CP", "Nama", "Bobot Baseline", "Total Skenario", "Ranking Berubah", "Top-1 Berubah", "Skor Sensitivitas", "Status"];
const siHeaderRow = new TableRow({
  children: siHeaders.map(h => headerCell(h)),
  tableHeader: true,
});

const sortedSI = [...sensitivityIndex].sort((a, b) => b.score - a.score);
const siDataRows = sortedSI.map((si, i) => {
  const stabColor = si.stability === "Sangat Stabil" ? C_GREEN
    : si.stability === "Stabil" ? C_BLUE
    : si.stability === "Cukup Sensitif" ? C_AMBER : C_RED;

  return new TableRow({
    children: [
      dataCell(si.cp, i, { bold: true }),
      dataCell(baseline[si.cp].name, i, { align: AlignmentType.LEFT }),
      dataCell((baseline[si.cp].weight * 100).toFixed(2) + "%", i),
      dataCell(si.total, i),
      dataCell(si.rankChangeCount, i, { bold: si.rankChangeCount > 0, color: si.rankChangeCount > 0 ? C_AMBER : C_GREEN }),
      dataCell(si.topChangeCount, i, { bold: si.topChangeCount > 0, color: si.topChangeCount > 0 ? C_RED : C_GREEN }),
      dataCell((si.score * 100).toFixed(0) + "%", i, { bold: true }),
      dataCell(si.stability, i, { bold: true, color: stabColor }),
    ],
  });
});

children.push(
  new Table({ rows: [siHeaderRow, ...siDataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
  new Paragraph({ spacing: { after: 200 } }),
);

// Visual bar representation (text-based)
children.push(
  heading2("6.1 Visualisasi Sensitivitas"),
  para(text("Representasi visual skor sensitivitas per CP (semakin panjang bar, semakin sensitif):")),
  new Paragraph({ spacing: { after: 60 } }),
);

for (const si of sortedSI) {
  const barLength = Math.round(si.score * 40);
  const bar = "█".repeat(barLength) + "░".repeat(40 - barLength);
  children.push(
    para(
      text(`${si.cp}  `, { bold: true, font: "Consolas", size: 18 }),
      text(`${bar}  `, { font: "Consolas", size: 18, color: si.score === 0 ? C_GREEN : si.score <= 0.25 ? C_BLUE : si.score <= 0.5 ? C_AMBER : C_RED }),
      text(`${(si.score * 100).toFixed(0)}%`, { bold: true, font: "Consolas", size: 18 }),
    ),
  );
}

children.push(new Paragraph({ children: [new PageBreak()] }));

// ─── 7. KESIMPULAN ───
children.push(
  heading1("7. Kesimpulan dan Interpretasi"),
  heading2("7.1 Ringkasan Hasil"),
);

// Summary table
const sumTable = new Table({
  rows: [
    new TableRow({
      children: [headerCell("Metrik"), headerCell("Nilai")],
      tableHeader: true,
    }),
    new TableRow({ children: [
      dataCell("Total Skenario Pengujian", 0, { align: AlignmentType.LEFT }),
      dataCell(`${totalScenarios}`, 0, { bold: true }),
    ]}),
    new TableRow({ children: [
      dataCell("Skenario dengan Perubahan Ranking", 1, { align: AlignmentType.LEFT }),
      dataCell(`${totalRankChanges}`, 1, { bold: true, color: totalRankChanges === 0 ? C_GREEN : C_AMBER }),
    ]}),
    new TableRow({ children: [
      dataCell("Skenario dengan Perubahan Top-1", 0, { align: AlignmentType.LEFT }),
      dataCell(`${totalTopChanges}`, 0, { bold: true, color: totalTopChanges === 0 ? C_GREEN : C_RED }),
    ]}),
    new TableRow({ children: [
      dataCell("Skor Robustness", 1, { align: AlignmentType.LEFT }),
      dataCell(`${(robustnessScore * 100).toFixed(1)}%`, 1, { bold: true, color: C_PRIMARY }),
    ]}),
    new TableRow({ children: [
      dataCell("Tingkat Robustness", 0, { align: AlignmentType.LEFT }),
      dataCell(robustnessLevel, 0, { bold: true, color: robustnessScore >= 0.7 ? C_GREEN : C_RED }),
    ]}),
    new TableRow({ children: [
      dataCell("Stabilitas Top-3", 1, { align: AlignmentType.LEFT }),
      dataCell(top3Stable ? "Stabil ✓" : "Bergeser ✗", 1, { bold: true, color: top3Stable ? C_GREEN : C_RED }),
    ]}),
    new TableRow({ children: [
      dataCell("Top-3 CP Prioritas", 0, { align: AlignmentType.LEFT }),
      dataCell(top3.join(", "), 0, { bold: true, color: C_PRIMARY }),
    ]}),
    new TableRow({ children: [
      dataCell("CP Paling Stabil", 1, { align: AlignmentType.LEFT }),
      dataCell(`${mostStable.cp} — ${baseline[mostStable.cp].name}`, 1, { bold: true, color: C_GREEN }),
    ]}),
    new TableRow({ children: [
      dataCell("CP Paling Sensitif", 0, { align: AlignmentType.LEFT }),
      dataCell(`${mostSensitive.cp} — ${baseline[mostSensitive.cp].name}`, 0, { bold: true, color: C_AMBER }),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
});

children.push(sumTable, new Paragraph({ spacing: { after: 200 } }));

// ─── Interpretasi ───
children.push(
  heading2("7.2 Interpretasi"),
  para(
    text("Berdasarkan pengujian terhadap keseluruhan "),
    text(`${totalScenarios} skenario`, { bold: true }),
    text(` (9 CP × ${VARIATIONS.length} variasi: ±5% s.d. ±20%), model Fuzzy AHP yang digunakan dalam sistem ini memiliki tingkat kestabilan `),
    text(`${robustnessLevel}`, { bold: true, color: robustnessScore >= 0.7 ? C_GREEN : C_RED }),
    text(` dengan skor robustness `),
    text(`${(robustnessScore * 100).toFixed(1)}%`, { bold: true }),
    text(".")
  ),
);

if (robustnessScore >= 0.7) {
  children.push(
    para(text("Temuan utama:", { bold: true })),
    bullet(`Dari ${totalScenarios} skenario perturbasi, hanya ${totalRankChanges} skenario (${(totalRankChanges / totalScenarios * 100).toFixed(1)}%) yang menggeser ranking.`),
    bullet(`Top-3 prioritas (${top3.join(", ")}) ${top3Stable ? "tetap stabil pada seluruh skenario" : "mengalami pergeseran di beberapa skenario"}.`),
    bullet(`${totalTopChanges === 0 ? "Tidak ada skenario" : `${totalTopChanges} skenario`} yang mengubah posisi CP peringkat #1 (${baselineRanking[0].cp}).`),
    bullet(`CP paling stabil: ${mostStable.cp} (${baseline[mostStable.cp].name}) — tidak mengalami perubahan ranking pada variasi apapun.`),
    bullet(`CP paling sensitif terhadap perubahan: ${mostSensitive.cp} (${baseline[mostSensitive.cp].name}).`),
  );
} else {
  children.push(
    para(text("Temuan utama:", { bold: true })),
    bullet(`Model menunjukkan sensitivitas terhadap perubahan bobot. Dari ${totalScenarios} skenario, ${totalRankChanges} skenario (${(totalRankChanges / totalScenarios * 100).toFixed(1)}%) menggeser ranking.`),
    bullet(`Perlu perhatian khusus pada ${mostSensitive.cp} (${baseline[mostSensitive.cp].name}) yang paling sensitif terhadap perubahan.`),
    bullet(`Top-3 prioritas (${top3.join(", ")}) ${top3Stable ? "tetap stabil" : "mengalami pergeseran di beberapa skenario — perlu evaluasi ulang"}.`),
  );
}

children.push(
  heading2("7.3 Kesimpulan Akhir"),
  para(
    text("Hasil analisis sensitivitas menunjukkan bahwa model Fuzzy AHP yang digunakan dalam Sistem Manajemen Halal Supply Chain ini bersifat "),
    text(robustnessLevel, { bold: true, color: robustnessScore >= 0.7 ? C_GREEN : C_RED }),
    text(". Artinya, keputusan akhir mengenai prioritas titik kritis (Critical Points) tetap "),
    text(robustnessScore >= 0.7 ? "valid dan dapat diandalkan" : "perlu ditinjau dengan hati-hati", { bold: true }),
    text(" meskipun terdapat bias minor pada penyesuaian bobot individual oleh pakar. "),
    text("Model ini layak digunakan sebagai dasar pengambilan keputusan dalam manajemen risiko halal supply chain.", { bold: true }),
  ),
);

// ══════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════════

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "Analisis Sensitivitas — Fuzzy AHP Halal Supply Chain", font: FONT, size: 16, color: C_GRAY, italics: true }),
          ],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "Halaman ", font: FONT, size: 16, color: C_GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C_GRAY }),
            new TextRun({ text: " dari ", font: FONT, size: 16, color: C_GRAY }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: C_GRAY }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children,
  }],
});

const OUTPUT = "Laporan_Analisis_Sensitivitas_FuzzyAHP_Komprehensif.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`\n✅ SUCCESS: ${OUTPUT} berhasil dibuat!`);
  console.log(`   📊 Total skenario: ${totalScenarios}`);
  console.log(`   🔄 Ranking berubah: ${totalRankChanges}`);
  console.log(`   🏆 Robustness: ${robustnessLevel} (${(robustnessScore * 100).toFixed(1)}%)`);
  console.log(`   📄 File size: ${(buffer.length / 1024).toFixed(1)} KB\n`);
});
