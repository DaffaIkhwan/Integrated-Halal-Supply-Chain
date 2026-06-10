const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.resolve('public/docs/Rekap_K1_V1_Pairwise_2026-06-07.xlsx');
console.log(`Reading: ${excelPath}`);

const wb = xlsx.readFile(excelPath);

const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];

function extractCode(name) {
  // Hanya ambil yang benar-benar CP1, CP2, dsb. TANPA titik atau sub-kriteria
  const match = name.match(/^(CP\d+)(?:\:|\s|$)/);
  return match ? match[1] : null;
}

function processSheet(sheetName, w) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.log(`Sheet ${sheetName} not found.`);
    return;
  }
  
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let updated = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (Array.isArray(row) && typeof row[0] === 'number' && row[1] && row[2]) {
      const codeA = extractCode(String(row[1]));
      const codeB = extractCode(String(row[2]));
      
      // Process LEVEL 1 CP1-CP9
      if (codeA && codeB && codes.includes(codeA) && codes.includes(codeB)) {
        const idxA = codes.indexOf(codeA);
        const idxB = codes.indexOf(codeB);
        
        const ratio = w[idxA] / w[idxB];
        const isAMore = ratio >= 1;
        const scale = Math.max(1, Math.min(9, Math.round(isAMore ? ratio : 1 / ratio)));
        
        const moreImpCode = isAMore ? codeA : codeB;
        const directionStr = isAMore ? `← ${codeA}` : `→ ${codeB}`;
        
        data[i][3] = scale;
        data[i][4] = directionStr;
        data[i][5] = `${moreImpCode} — Updated by System`; 
        
        updated++;
      }
    }
  }

  const newWs = xlsx.utils.aoa_to_sheet(data);
  wb.Sheets[sheetName] = newWs;
  console.log(`Updated ${updated} rows in sheet '${sheetName}'`);
}

const wIrdha = [2, 2, 3, 3, 8, 8, 7, 6, 6];
const wRizki = [3, 4, 3, 6, 5, 6, 3, 4, 4];

processSheet('Irdha Mirdayati', wIrdha);
processSheet('Muhammad Rizki', wRizki);

xlsx.writeFile(wb, excelPath);
console.log(`Successfully saved updated Excel file to ${excelPath}`);
