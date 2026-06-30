const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const excelPath = path.resolve('K1V1_Perhitungan_Manual_Lengkap_2026-06-10T15-41-19.xlsx');
  console.log(`Reading Excel file: ${excelPath}`);
  
  const wb = xlsx.readFile(excelPath);
  
  // Clear existing K1V1 data
  console.log('Clearing old K1V1 data...');
  await prisma.questionnaireResponse.deleteMany({
    where: { questionnaireType: 'pembobotan' }
  });
  
  const skipSheets = ['RINGKASAN', 'HASIL_AKHIR'];
  let totalInserted = 0;
  
  for (const sheetName of wb.SheetNames) {
    if (skipSheets.includes(sheetName)) continue;
    
    console.log(`\nProcessing Sheet: ${sheetName}`);
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    
    let currentType = sheetName;
    if (sheetName.startsWith('SUB_')) {
      currentType = sheetName.replace('SUB_', '');
    }
    
    let daftarRespondenStart = -1;
    let sliderDataStart = -1;
    
    for (let i = 0; i < data.length; i++) {
      const row0 = String(data[i][0] || '').trim();
      if (row0 === 'DAFTAR RESPONDEN:') {
        daftarRespondenStart = i + 1;
      }
      if (row0.includes('DATA SLIDER RESPONDEN')) {
        sliderDataStart = i + 1; // Header row
        break;
      }
    }
    
    if (daftarRespondenStart === -1 || sliderDataStart === -1) {
      console.log(`Skipping sheet ${sheetName}: Cannot find data boundaries.`);
      continue;
    }
    
    // Parse Responden
    const respondenMap = {};
    for (let i = daftarRespondenStart; i < sliderDataStart - 1; i++) {
      const row = data[i];
      if (!row || row.length === 0) break;
      if (!row[0]) continue; // Empty row
      
      const rId = String(row[0]).trim();
      if (!rId.startsWith('R')) break;
      
      const name = String(row[1] || 'Anonim').trim();
      let role = String(row[2] || '-').trim();
      
      respondenMap[rId] = {
        name,
        instansi: '-',
        jabatan: role,
        comparisons: {}
      };
    }
    
    // Parse Slider Data
    const headerRow = data[sliderDataStart];
    // Map column index to R-id
    const colToRId = {};
    for (let col = 2; col < headerRow.length; col++) {
      const rId = String(headerRow[col] || '').trim();
      if (rId.startsWith('R') && respondenMap[rId]) {
        colToRId[col] = rId;
      }
    }
    
    for (let i = sliderDataStart + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[1]) break; // End of data
      
      const pasangan = String(row[1]).trim();
      if (!pasangan.includes('_vs_')) continue;
      
      for (const col in colToRId) {
        const rId = colToRId[col];
        const val = row[col];
        if (val !== undefined && val !== null) {
          respondenMap[rId].comparisons[pasangan] = Number(val);
        }
      }
    }
    
    // Insert to DB
    for (const rId in respondenMap) {
      const resp = respondenMap[rId];
      if (Object.keys(resp.comparisons).length === 0) continue; // Skip if no data
      
      const cpId = currentType.startsWith('CP') && currentType !== 'CP_LEVEL' ? currentType : null;
      const cleanEmailName = resp.name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.');
      
      await prisma.questionnaireResponse.create({
        data: {
          questionnaireType: 'pembobotan',
          cpId: cpId,
          respondentName: resp.name,
          respondentOrg: resp.instansi,
          respondentRole: resp.jabatan,
          respondentEmail: `${cleanEmailName || 'anonim'}@example.com`,
          respondentInfo: {
            nama: resp.name,
            namaInstansi: resp.instansi,
            posisi: resp.jabatan,
          },
          answers: {
            type: currentType,
            comparisons: resp.comparisons,
          },
          notes: { version: 'v1', importedFrom: 'K1V1_Perhitungan_Manual' },
          files: [],
          status: 'SUBMITTED',
        },
      });
      totalInserted++;
    }
    
    console.log(`Inserted records for ${Object.keys(respondenMap).length} respondents in ${currentType}`);
  }
  
  console.log(`\nTotal QuestionnaireResponse records inserted: ${totalInserted}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
