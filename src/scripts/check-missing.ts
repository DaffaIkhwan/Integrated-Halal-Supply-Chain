import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const entries = await prisma.pairwiseComparison.findMany({ where: { matrixType: 'LEVEL1_CP' } });
    const allCodes = Array.from(new Set(entries.map(e => e.rowCode))).sort();
    
    console.log("Codes:", allCodes);

    for (const r of allCodes) {
        for (const c of allCodes) {
            const exists = entries.find(e => e.rowCode === r && e.colCode === c);
            if (!exists) {
                console.log(`Missing: ${r} vs ${c}`);
            }
        }
    }
}

check().finally(() => prisma.$disconnect());
