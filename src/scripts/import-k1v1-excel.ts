import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const excelPath = path.resolve('public/docs/Rekap_K1_V1_Pairwise_2026-06-07.xlsx');
  console.log(`Reading Excel file: ${excelPath}`);
  
  const wb = xlsx.readFile(excelPath);
  
  for (const sheetName of wb.SheetNames) {
    if (sheetName.startsWith('Rekap')) continue;
    
    console.log(`\nProcessing Sheet: ${sheetName}`);
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    
    let name = sheetName;
    let instansi = '';
    let jabatan = '';
    
    // Parse metadata
    for (let i = 0; i < Math.min(5, data.length); i++) {
      if (!data[i]) continue;
      const row0 = String(data[i][0] || '');
      if (row0.startsWith('PAKAR:')) {
        name = row0.replace('PAKAR:', '').trim();
      } else if (row0.startsWith('Instansi:')) {
        instansi = row0.replace('Instansi:', '').trim();
        const row1 = String(data[i][1] || '');
        if (row1.startsWith('Jabatan:')) {
            jabatan = row1.replace('Jabatan:', '').trim();
        }
      }
    }
    
    console.log(`Expert: ${name} | Instansi: ${instansi} | Jabatan: ${jabatan}`);
    
    let currentType: string | null = null;
    let currentComparisons: Record<string, number> = {};
    const recordsToInsert: any[] = [];
    
    const pushCurrentRecord = () => {
      if (currentType) {
        recordsToInsert.push({
          type: currentType,
          comparisons: currentComparisons,
        });
      }
    };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const col0 = String(row[0] || '').trim();
      
      if (col0.startsWith('Kategori:')) {
        pushCurrentRecord();
        
        const catStr = col0.replace('Kategori:', '').trim();
        if (catStr.includes('Kriteria Umum')) currentType = 'KU_LEVEL';
        else if (catStr.includes('Antar CP')) currentType = 'CP_LEVEL';
        else if (catStr.includes('Sub-Kriteria')) {
          const match = catStr.match(/CP\d+/);
          currentType = match ? match[0] : catStr;
        } else {
          currentType = catStr;
        }
        
        currentComparisons = {};
      } 
      else if (!isNaN(parseInt(col0)) && currentType) {
        // Data row
        // [0: No, 1: Kriteria A, 2: Kriteria B, 3: Skala, 4: Arah, 5: Interpretasi]
        const critA = String(row[1] || '').trim();
        const critB = String(row[2] || '').trim();
        let scale = parseInt(String(row[3] || '1'));
        if (isNaN(scale)) scale = 1;
        
        const arah = String(row[4] || '').trim();
        let value = 0;
        
        if (arah === '=' || arah === 'Sama Penting' || scale === 1) {
          value = 0;
        } else if (arah.includes('←')) {
          value = -(scale - 1);
        } else if (arah.includes('→')) {
          value = (scale - 1);
        } else {
            console.log(`Unknown direction ${arah} for ${critA} vs ${critB}`);
        }
        
        currentComparisons[`${critA}_vs_${critB}`] = value;
      }
    }
    
    pushCurrentRecord();
    
    // Check if the expert already exists in database
    await prisma.questionnaireResponse.deleteMany({
      where: {
        questionnaireType: 'pembobotan',
        respondentName: name
      }
    });
    
    // Insert to DB
    for (const record of recordsToInsert) {
      await prisma.questionnaireResponse.create({
        data: {
          questionnaireType: 'pembobotan', // Using 'pembobotan' as it is K1V1
          cpId: record.type.startsWith('CP') && record.type !== 'CP_LEVEL' ? record.type : null,
          respondentName: name,
          respondentOrg: instansi,
          respondentRole: jabatan,
          respondentEmail: `${name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\s+/g, '.')}@example.com`,
          respondentInfo: {
            nama: name,
            namaInstansi: instansi,
            posisi: jabatan,
          },
          answers: {
            type: record.type,
            comparisons: record.comparisons,
          },
          notes: { version: 'v1', importedFrom: 'excel' },
          files: [],
          status: 'SUBMITTED',
        },
      });
    }
    console.log(`Inserted ${recordsToInsert.length} records for ${name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
