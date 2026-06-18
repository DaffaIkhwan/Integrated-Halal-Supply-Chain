/**
 * Seed Script: Membaca matriks perbandingan berpasangan dari Excel
 * dan memasukkannya ke tabel PairwiseComparison di PostgreSQL.
 * 
 * Sumber: Fuzzy_AHP_QA_Final_soal11.xlsx (Sheet 1: INPUT_PAKAR)
 */

import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Mapping CP name prefix → CP code
function extractCPCode(criteriaName: string): string {
    const match = criteriaName.match(/^(CP\d+)/);
    return match ? match[1] : criteriaName;
}

const CP_PREFIX_MAP: Record<string, string> = {
    'LEVEL2_CP1': 'F',
    'LEVEL2_CP2': 'FD',
    'LEVEL2_CP3': 'T',
    'LEVEL2_CP4': 'R',
    'LEVEL2_CP5': 'PS',
    'LEVEL2_CP6': 'P',
    'LEVEL2_CP7': 'CS',
    'LEVEL2_CP8': 'D',
    'LEVEL2_CP9': 'RT',
};

// Mapping sub-criteria code prefix → domain code (e.g., "K1" → "F1" for CP1)
function extractSubCode(criteriaName: string, matrixType: string): string {
    const match = criteriaName.match(/^([A-Z]+)(\d+)/);
    if (!match) return criteriaName;
    
    const prefix = CP_PREFIX_MAP[matrixType] || match[1];
    return `${prefix}${match[2]}`;
}

interface PairwiseRow {
    no: number;
    criteriaA: string;
    criteriaB: string;
    moreImportant: string; // "A" or "B"
    scale: number;
    label: string;
    l: number;
    m: number;
    u: number;
    defuzz: number;
}

function parsePairwiseRows(rows: any[]): PairwiseRow[] {
    const result: PairwiseRow[] = [];
    for (const row of rows) {
        if (!Array.isArray(row) || typeof row[0] !== 'number') continue;
        if (!row[1] || !row[2]) continue;

        result.push({
            no: row[0],
            criteriaA: String(row[1]).trim(),
            criteriaB: String(row[2]).trim(),
            moreImportant: String(row[3] || 'A').trim().toUpperCase(),
            scale: Number(row[4]) || 1,
            label: String(row[5] || ''),
            l: Number(row[6]) || 1,
            m: Number(row[7]) || 1,
            u: Number(row[8]) || 1,
            defuzz: Number(row[9]) || 1,
        });
    }
    return result;
}

// Deteksi section headers dalam sheet
function findSections(allRows: any[]): { title: string; startIdx: number; endIdx: number }[] {
    const sections: { title: string; startIdx: number; endIdx: number }[] = [];

    for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        if (Array.isArray(row) && typeof row[0] === 'string' && row[0].includes('INPUT PAKAR')) {
            // Find the header row (next row with "No" in first col)
            let headerIdx = -1;
            for (let j = i + 1; j < Math.min(i + 5, allRows.length); j++) {
                if (Array.isArray(allRows[j]) && allRows[j][0] === 'No') {
                    headerIdx = j;
                    break;
                }
            }
            if (headerIdx === -1) continue;

            sections.push({
                title: String(row[0]).trim(),
                startIdx: headerIdx + 1,
                endIdx: 0, // will be filled later
            });
        }
    }

    // Fill endIdx
    for (let i = 0; i < sections.length; i++) {
        sections[i].endIdx = i + 1 < sections.length
            ? sections[i + 1].startIdx - 3
            : allRows.length;
    }

    return sections;
}

// Map section title → matrixType
function getMatrixType(title: string): string {
    if (title.includes('LEVEL 1')) return 'LEVEL1_CP';
    const cpMatch = title.match(/CP(\d+)/);
    if (cpMatch) return `LEVEL2_CP${cpMatch[1]}`;
    return 'UNKNOWN';
}

// Map section → whether it uses CP codes or sub-criteria codes
function isLevel1(matrixType: string): boolean {
    return matrixType === 'LEVEL1_CP';
}

async function main() {
    const excelPath = path.resolve('c:/Users/Acer/Pictures/chatbot/chatbot/file/Fuzzy_AHP_QA_Final_soal11.xlsx');
    console.log(`📂 Reading: ${excelPath}`);

    const wb = xlsx.readFile(excelPath);
    const sheetName = wb.SheetNames[0]; // INPUT_PAKAR
    const allRows: any[] = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

    console.log(`📄 Sheet: ${sheetName} (${allRows.length} rows)`);

    const sections = findSections(allRows);
    console.log(`📊 Found ${sections.length} sections`);

    // Clear existing pairwise data
    await prisma.pairwiseComparison.deleteMany({});
    console.log('🗑️  Cleared existing PairwiseComparison data.');

    let totalInserted = 0;

    for (const section of sections) {
        const matrixType = getMatrixType(section.title);
        if (matrixType === 'UNKNOWN') {
            console.log(`⏭️  Skipping unknown section: ${section.title.substring(0, 60)}`);
            continue;
        }

        const sectionRows = allRows.slice(section.startIdx, section.endIdx);
        const pairs = parsePairwiseRows(sectionRows);

        console.log(`\n🔷 ${matrixType}: ${pairs.length} pairs`);

        for (const pair of pairs) {
            const rowCode = isLevel1(matrixType)
                ? extractCPCode(pair.criteriaA)
                : extractSubCode(pair.criteriaA, matrixType);
            const colCode = isLevel1(matrixType)
                ? extractCPCode(pair.criteriaB)
                : extractSubCode(pair.criteriaB, matrixType);

            // Determine TFN values based on which is more important
            let tfnLow: number, tfnMid: number, tfnUp: number;
            let tfnLowRecip: number, tfnMidRecip: number, tfnUpRecip: number;

            if (pair.moreImportant === 'A') {
                // A is more important: A→B gets (l,m,u), B→A gets reciprocal
                tfnLow = pair.l;
                tfnMid = pair.m;
                tfnUp = pair.u;
                tfnLowRecip = 1 / pair.u;
                tfnMidRecip = 1 / pair.m;
                tfnUpRecip = 1 / pair.l;
            } else {
                // B is more important: A→B gets reciprocal, B→A gets (l,m,u)
                tfnLow = 1 / pair.u;
                tfnMid = 1 / pair.m;
                tfnUp = 1 / pair.l;
                tfnLowRecip = pair.l;
                tfnMidRecip = pair.m;
                tfnUpRecip = pair.u;
            }

            // Insert A→B
            await prisma.pairwiseComparison.upsert({
                where: { matrixType_rowCode_colCode: { matrixType, rowCode, colCode } },
                update: { tfnLow, tfnMid, tfnUp },
                create: { matrixType, rowCode, colCode, tfnLow, tfnMid, tfnUp },
            });

            // Insert B→A (reciprocal)
            await prisma.pairwiseComparison.upsert({
                where: { matrixType_rowCode_colCode: { matrixType, rowCode: colCode, colCode: rowCode } },
                update: { tfnLow: tfnLowRecip, tfnMid: tfnMidRecip, tfnUp: tfnUpRecip },
                create: { matrixType, rowCode: colCode, colCode: rowCode, tfnLow: tfnLowRecip, tfnMid: tfnMidRecip, tfnUp: tfnUpRecip },
            });

            // Insert diagonal (A→A = 1,1,1 and B→B = 1,1,1)
            for (const code of [rowCode, colCode]) {
                await prisma.pairwiseComparison.upsert({
                    where: { matrixType_rowCode_colCode: { matrixType, rowCode: code, colCode: code } },
                    update: { tfnLow: 1, tfnMid: 1, tfnUp: 1 },
                    create: { matrixType, rowCode: code, colCode: code, tfnLow: 1, tfnMid: 1, tfnUp: 1 },
                });
            }

            totalInserted++;
        }
    }

    console.log(`\n✅ Total ${totalInserted} pairwise comparisons inserted (bidirectional + diagonal).`);

    // Count total rows in DB
    const count = await prisma.pairwiseComparison.count();
    console.log(`📊 Total rows in PairwiseComparison table: ${count}`);
    console.log('🎉 Seeding selesai!');
}

main()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
