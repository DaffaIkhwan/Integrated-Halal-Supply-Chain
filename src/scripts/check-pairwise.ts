import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.pairwiseComparison.count();
    console.log(`Total rows: ${count}`);

    const byType = await prisma.pairwiseComparison.groupBy({
        by: ['matrixType'],
        _count: true,
        orderBy: { matrixType: 'asc' },
    });
    console.log('');
    console.log('Per matrixType:');
    for (const g of byType) {
        console.log(`  ${g.matrixType.padEnd(15)}: ${g._count} rows`);
    }

    console.log('');
    console.log('Sample LEVEL1_CP:');
    const sample = await prisma.pairwiseComparison.findMany({
        where: { matrixType: 'LEVEL1_CP' },
        take: 5,
        orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
    });
    for (const s of sample) {
        const tfn = `(${s.tfnLow.toFixed(4)}, ${s.tfnMid.toFixed(4)}, ${s.tfnUp.toFixed(4)})`;
        console.log(`  ${s.rowCode} -> ${s.colCode}: ${tfn}`);
    }

    // Expected matrix sizes
    console.log('');
    console.log('Validation:');
    const expected: Record<string, number> = {
        LEVEL1_CP: 81,    // 9x9
        LEVEL2_CP1: 49,   // 7x7
        LEVEL2_CP2: 25,   // 5x5
        LEVEL2_CP3: 25,   // 5x5
        LEVEL2_CP4: 100,  // 10x10
        LEVEL2_CP5: 25,   // 5x5
        LEVEL2_CP6: 49,   // 7x7
        LEVEL2_CP7: 49,   // 7x7
        LEVEL2_CP8: 49,   // 7x7
        LEVEL2_CP9: 49,   // 7x7

    };
    let allOk = true;
    for (const [mt, exp] of Object.entries(expected)) {
        const found = byType.find(g => g.matrixType === mt);
        const actual = found ? found._count : 0;
        const ok = actual === exp;
        if (!ok) allOk = false;
        console.log(`  ${mt.padEnd(15)}: ${actual}/${exp} ${ok ? 'OK' : 'MISMATCH!'}`);
    }
    console.log(allOk ? '\nAll matrices valid!' : '\nSome matrices have issues!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
