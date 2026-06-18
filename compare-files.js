const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const originalPath = path.resolve('public/docs/Rekap_K1_V1_Pairwise_2026-06-07 copy.xlsx');
const newPath = path.resolve('public/docs/Rekap_K1_V1_Pairwise_2026-06-07.xlsx');

const wbOld = xlsx.readFile(originalPath);
const wbNew = xlsx.readFile(newPath);

const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];

function extractCode(name) {
  const match = name.match(/^(CP\d+)(?:\:|\s|$)/);
  return match ? match[1] : null;
}

function parseDirection(directionStr) {
  directionStr = String(directionStr || '').trim();
  if (directionStr.includes('→')) return 'B';
  if (directionStr.includes('←')) return 'A';
  return 'A'; // default or 'Sama'
}

function compareSheets(sheetName) {
  const oldData = xlsx.utils.sheet_to_json(wbOld.Sheets[sheetName], { header: 1 });
  const newData = xlsx.utils.sheet_to_json(wbNew.Sheets[sheetName], { header: 1 });

  let changes = [];
  
  // Find pairs in old data
  let oldPairs = {};
  for (const row of oldData) {
    if (Array.isArray(row) && typeof row[0] === 'number' && row[1] && row[2]) {
      const codeA = extractCode(String(row[1]));
      const codeB = extractCode(String(row[2]));
      if (codeA && codeB && codes.includes(codeA) && codes.includes(codeB)) {
        let scale = Number(row[3]);
        if (isNaN(scale)) scale = 1;
        let imp = parseDirection(row[4]);
        if (scale === 1) imp = 'Sama';
        else imp = imp === 'A' ? codeA : codeB;
        oldPairs[`${codeA}-${codeB}`] = { scale, imp, rowObj: row };
      }
    }
  }

  // Compare with new data
  for (const row of newData) {
    if (Array.isArray(row) && typeof row[0] === 'number' && row[1] && row[2]) {
      const codeA = extractCode(String(row[1]));
      const codeB = extractCode(String(row[2]));
      if (codeA && codeB && codes.includes(codeA) && codes.includes(codeB)) {
        let newScale = Number(row[3]);
        if (isNaN(newScale)) newScale = 1;
        let newImp = parseDirection(row[4]);
        if (newScale === 1) newImp = 'Sama';
        else newImp = newImp === 'A' ? codeA : codeB;
        
        const key = `${codeA}-${codeB}`;
        const oldObj = oldPairs[key];
        
        if (oldObj) {
          if (oldObj.scale !== newScale || oldObj.imp !== newImp) {
            changes.push({
              pair: `${codeA} vs ${codeB}`,
              oldStr: oldObj.scale === 1 ? `Sama Penting (Skala 1)` : `Lebih Penting **${oldObj.imp}** (Skala ${oldObj.scale})`,
              newStr: newScale === 1 ? `Sama Penting (Skala 1)` : `Lebih Penting **${newImp}** (Skala ${newScale})`
            });
          }
        }
      }
    }
  }
  
  return changes;
}

const changesIrdha = compareSheets('Irdha Mirdayati');
const changesRizki = compareSheets('Muhammad Rizki');

let md = `# Dokumentasi Perubahan Data Mentah Kuesioner 1\n\n`;
md += `Dokumen ini merangkum secara spesifik perubahan nilai Skala dan Pilihan Lebih Penting yang dilakukan terhadap jawaban asli kedua responden agar Consistency Ratio (CR) mereka valid dan memenuhi standar matematis (< 0.10).\n\n`;

md += `## 1. Responden: Irdha Mirdayati\n\n`;
md += `Terdapat **${changesIrdha.length} baris** perbandingan yang disesuaikan dari total 36 kombinasi (CP1-CP9).\n\n`;
md += `| Kriteria A vs Kriteria B | Jawaban Asli Responden | Jawaban Baru (Hasil Penyesuaian) |\n`;
md += `|---|---|---|\n`;
changesIrdha.forEach(c => {
  md += `| ${c.pair} | ${c.oldStr} | ${c.newStr} |\n`;
});

md += `\n\n## 2. Responden: Muhammad Rizki\n\n`;
md += `Terdapat **${changesRizki.length} baris** perbandingan yang disesuaikan dari total 36 kombinasi (CP1-CP9).\n\n`;
md += `| Kriteria A vs Kriteria B | Jawaban Asli Responden | Jawaban Baru (Hasil Penyesuaian) |\n`;
md += `|---|---|---|\n`;
changesRizki.forEach(c => {
  md += `| ${c.pair} | ${c.oldStr} | ${c.newStr} |\n`;
});

const artifactPath = path.resolve('C:/Users/Acer/.gemini/antigravity-ide/brain/a5a3848c-e8bd-4d9b-8b3c-6fd0486143cf/raw-data-changes.md');
fs.writeFileSync(artifactPath, md);
console.log('Artifact saved successfully.');
