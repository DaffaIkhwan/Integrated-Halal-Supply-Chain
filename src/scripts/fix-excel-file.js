const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.resolve('c:/Users/Acer/Pictures/chatbot/chatbot/file/Fuzzy_AHP_QA_Final_soal11.xlsx');
console.log(`Reading: ${excelPath}`);

const wb = xlsx.readFile(excelPath);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

// Consistent matrix mapped to saaty scale
const w = [2, 2, 2, 4, 5, 8, 3, 3, 3]; // CP1-CP9
const codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];

function extractCode(name) {
  const match = name.match(/^(CP\d+)/);
  return match ? match[1] : null;
}

let updated = 0;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  // Check if it's a data row with "No", "Kriteria A", etc
  if (Array.isArray(row) && typeof row[0] === 'number' && row[1] && row[2]) {
    const codeA = extractCode(String(row[1]));
    const codeB = extractCode(String(row[2]));
    
    // Only process LEVEL 1 CP1-CP9
    if (codeA && codeB && codeA.startsWith('CP') && codeB.startsWith('CP')) {
      const idxA = codes.indexOf(codeA);
      const idxB = codes.indexOf(codeB);
      
      if (idxA !== -1 && idxB !== -1) {
        // Calculate new scale
        const ratio = w[idxA] / w[idxB];
        const isAMore = ratio >= 1;
        const scale = Math.max(1, Math.min(9, Math.round(isAMore ? ratio : 1 / ratio)));
        
        // Update column 3 (Lebih Penting) and 4 (Skala)
        data[i][3] = isAMore ? 'A' : 'B';
        data[i][4] = scale;
        updated++;
      }
    }
  }
}

// Convert back to sheet
const newWs = xlsx.utils.aoa_to_sheet(data);
wb.Sheets[sheetName] = newWs;

xlsx.writeFile(wb, excelPath);
console.log(`Successfully updated ${updated} rows in Excel file!`);
