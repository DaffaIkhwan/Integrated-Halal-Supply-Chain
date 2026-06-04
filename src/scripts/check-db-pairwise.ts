import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const count = await prisma.pairwiseComparison.count({ where: { matrixType: 'LEVEL1_CP' } });
    console.log("LEVEL1_CP count:", count);
    
    if (count > 0) {
        const sample = await prisma.pairwiseComparison.findFirst({ where: { matrixType: 'LEVEL1_CP' } });
        console.log("Sample:", sample);
    }
}

check().finally(() => prisma.$disconnect());
