const xlsx = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\Acer\\Pictures\\chatbot\\NextRag\\K1V1_Perhitungan_Manual_Lengkap_2026-06-10T15-41-19.xlsx';
const workbook = xlsx.readFile(filePath);

console.log('Sheets in workbook:');
console.log(workbook.SheetNames);

// Let's print the first few rows of the first sheet
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`\nData in sheet "${firstSheetName}" (first 20 rows):`);
for (let i = 0; i < Math.min(20, data.length); i++) {
  console.log(data[i]);
}
