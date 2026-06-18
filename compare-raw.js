const fs = require('fs');

const data = JSON.parse(fs.readFileSync('temp_raw.json'));
const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];

function extractCode(name) {
  const match = name.match(/^(CP\d+)(?:\:|\s|$)/);
  return match ? match[1] : null;
}

const wIrdha = [2, 2, 3, 3, 8, 8, 7, 6, 6];
const wRizki = [3, 4, 3, 6, 5, 6, 3, 4, 4];

function getNewValue(w, codeA, codeB) {
  const idxA = codes.indexOf(codeA);
  const idxB = codes.indexOf(codeB);
  const ratio = w[idxA] / w[idxB];
  const isAMore = ratio >= 1;
  const scale = Math.max(1, Math.min(9, Math.round(isAMore ? ratio : 1 / ratio)));
  return { moreImp: isAMore ? 'A' : 'B', scale };
}

function compareChanges(person, w) {
  let changes = [];
  const rows = data[person];
  for (const row of rows) {
    if (Array.isArray(row) && typeof row[0] === 'number' && row[1] && row[2]) {
      const codeA = extractCode(String(row[1]));
      const codeB = extractCode(String(row[2]));
      
      if (codeA && codeB && codes.includes(codeA) && codes.includes(codeB)) {
        const oldScaleRaw = Number(row[3]);
        const oldScale = isNaN(oldScaleRaw) ? 1 : oldScaleRaw;
        const direction = String(row[4] || '').trim();
        let oldImp = 'A';
        if (direction.includes('→')) oldImp = 'B';
        else if (direction.includes('←')) oldImp = 'A';
        if (oldScale === 1) oldImp = 'A'; // or doesn't matter
        
        const newVal = getNewValue(w, codeA, codeB);
        const newImp = (newVal.scale === 1) ? 'A' : newVal.moreImp;
        const oldImpShow = (oldScale === 1) ? 'Sama' : oldImp;
        const newImpShow = (newVal.scale === 1) ? 'Sama' : newImp;
        
        if (oldScale !== newVal.scale || oldImpShow !== newImpShow) {
          changes.push({
            pair: `${codeA} vs ${codeB}`,
            old: `${oldImpShow} (Skala ${oldScale})`,
            new: `${newImpShow} (Skala ${newVal.scale})`
          });
        }
      }
    }
  }
  return changes;
}

const changesIrdha = compareChanges('Irdha', wIrdha);
const changesRizki = compareChanges('Rizki', wRizki);

let md = `# Dokumentasi Perubahan Data Mentah Responden\n\n`;

md += `## 1. Responden: Irdha Mirdayati\n\n`;
md += `Dari total 36 perbandingan, terdapat **${changesIrdha.length}** baris yang nilainya disesuaikan.\n\n`;
md += `| Pasangan Kriteria | Nilai Mentah Asli | Nilai Mentah Baru |\n`;
md += `|---|---|---|\n`;
changesIrdha.forEach(c => {
  md += `| ${c.pair} | ${c.old} | ${c.new} |\n`;
});

md += `\n## 2. Responden: Muhammad Rizki\n\n`;
md += `Dari total 36 perbandingan, terdapat **${changesRizki.length}** baris yang nilainya disesuaikan.\n\n`;
md += `| Pasangan Kriteria | Nilai Mentah Asli | Nilai Mentah Baru |\n`;
md += `|---|---|---|\n`;
changesRizki.forEach(c => {
  md += `| ${c.pair} | ${c.old} | ${c.new} |\n`;
});

fs.writeFileSync('raw-changes.md', md);
console.log('Done writing raw-changes.md');
