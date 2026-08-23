const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'K1V1_Perhitungan_Manual_Lengkap_2026-06-10T15-41-19.xlsx');
const wb = XLSX.readFile(filePath);

// Extract all respondent names from KU_LEVEL sheet (has the most respondents: 23)
const ws = wb.Sheets['KU_LEVEL'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

const respondents = [];
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    const cell0 = String(row[0] || '');
    // Match pattern: ▶ RESPONDEN N: Name
    const match = cell0.match(/RESPONDEN\s+(\d+):\s*(.+)/i);
    if (match) {
        respondents.push({
            no: parseInt(match[1]),
            name: match[2].trim()
        });
    }
}

console.log(`\n=== DAFTAR SEMUA RESPONDEN (${respondents.length} orang) ===\n`);
respondents.forEach(r => {
    console.log(`  ${r.no}. ${r.name}`);
});

// Also check RINGKASAN for respondent table
console.log('\n\n=== Cek RINGKASAN sheet untuk tabel responden ===\n');
const wsR = wb.Sheets['RINGKASAN'];
const dataR = XLSX.utils.sheet_to_json(wsR, { header: 1 });
let inRespondentSection = false;
for (let i = 0; i < dataR.length; i++) {
    const row = dataR[i];
    if (!row || row.length === 0) continue;
    const rowStr = row.map(c => String(c || '')).join(' | ');
    if (/DAFTAR SELURUH RESPONDEN/i.test(rowStr)) {
        inRespondentSection = true;
        continue;
    }
    if (inRespondentSection) {
        // Stop if we hit another major section
        if (/^[A-Z]{2,}/.test(String(row[0] || '')) && !/^\d/.test(String(row[0] || ''))) {
            // might be header, keep going
        }
        console.log(`Row ${i}: [${row.map(c => String(c || '')).join('] [')}]`);
        // Stop after 50 rows
        if (i > 100) break;
    }
}
