const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const amrul = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan', respondentName: 'Amrul Hidayat' }
    });

    const nulls = amrul.filter(r => r.cpId === null);
    for (let i = 0; i < nulls.length; i++) {
        console.log(`Null ${i} type:`, nulls[i].answers.type);
    }
    
    const cp1 = amrul.find(r => r.cpId === 'CP1');
    if (cp1) {
        console.log(`CP1 type:`, cp1.answers.type);
        console.log(`CP1 comparisons:`, Object.entries(cp1.answers.comparisons || {}).slice(0, 3));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
