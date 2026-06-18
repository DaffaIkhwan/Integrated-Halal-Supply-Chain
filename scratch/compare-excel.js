const xlsx = require('xlsx');

const filePath = 'c:\\Users\\Acer\\Pictures\\chatbot\\NextRag\\K1V1_Perhitungan_Manual_Lengkap_2026-06-10T15-41-19.xlsx';
const workbook = xlsx.readFile(filePath);

const finalSheet = workbook.Sheets['HASIL_AKHIR'];
const finalData = xlsx.utils.sheet_to_json(finalSheet, { header: 1, defval: null });

for (let i = 0; i < 50; i++) {
  if (finalData[i] && finalData[i].length > 0) {
    console.log(`Row ${i}:`, JSON.stringify(finalData[i]));
  }
}
