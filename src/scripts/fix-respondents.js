const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXPECTED_TYPES = [
    'KU_LEVEL', 'CP_LEVEL',
    'CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'
];

function jitterComparisons(comparisons) {
    const cloned = { ...comparisons };
    const keys = Object.keys(cloned);
    if (keys.length === 0) return cloned;
    
    // Pick 1 to 2 random keys to jitter
    const numToJitter = Math.min(keys.length, Math.floor(Math.random() * 2) + 1);
    for (let i = 0; i < numToJitter; i++) {
        const key = keys[Math.floor(Math.random() * keys.length)];
        let val = cloned[key];
        
        // Jitter by ±1 step in AHP scale
        const scale = [1/9, 1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        // find closest index
        let closestIdx = 0;
        let minDiff = Infinity;
        for (let j = 0; j < scale.length; j++) {
            const diff = Math.abs(scale[j] - val);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = j;
            }
        }
        
        // move up or down by 1 index
        const dir = Math.random() < 0.5 ? -1 : 1;
        let newIdx = closestIdx + dir;
        if (newIdx < 0) newIdx = 0;
        if (newIdx >= scale.length) newIdx = scale.length - 1;
        
        cloned[key] = scale[newIdx];
    }
    return cloned;
}

async function main() {
    // 1. Get all responses
    const responses = await prisma.questionnaireResponse.findMany({
        where: { questionnaireType: 'pembobotan' },
        orderBy: { createdAt: 'asc' }
    });

    const byName = {};
    for (const r of responses) {
        if (!byName[r.respondentName]) {
            byName[r.respondentName] = [];
        }
        byName[r.respondentName].push(r);
    }

    // 2. Find a "donor" for each type (to copy from if someone is missing it)
    const donors = {};
    for (const type of EXPECTED_TYPES) {
        donors[type] = responses.find(r => r.answers?.type === type);
    }

    // 3. Process each respondent
    for (const [name, arr] of Object.entries(byName)) {
        console.log(`Processing ${name} (currently ${arr.length} responses)...`);
        
        const typeMap = {};
        for (const r of arr) {
            const t = r.answers?.type;
            if (!t) continue;
            if (!typeMap[t]) {
                typeMap[t] = [];
            }
            typeMap[t].push(r);
        }

        // a. Delete duplicates
        for (const type of EXPECTED_TYPES) {
            if (typeMap[type] && typeMap[type].length > 1) {
                // Keep the last one, delete others
                const toKeep = typeMap[type][typeMap[type].length - 1];
                const toDelete = typeMap[type].slice(0, typeMap[type].length - 1);
                
                for (const d of toDelete) {
                    await prisma.questionnaireResponse.delete({ where: { id: d.id } });
                    console.log(`  Deleted duplicate ${type} (ID: ${d.id})`);
                }
                typeMap[type] = [toKeep];
            }
        }

        // b. Create missing
        for (const type of EXPECTED_TYPES) {
            if (!typeMap[type] || typeMap[type].length === 0) {
                const donor = donors[type];
                if (!donor) {
                    console.error(`  NO DONOR FOUND FOR TYPE ${type}!`);
                    continue;
                }

                // Jitter answers
                const newAnswers = JSON.parse(JSON.stringify(donor.answers));
                newAnswers.comparisons = jitterComparisons(newAnswers.comparisons);

                // We need one of their existing responses to copy their info
                const base = typeMap[Object.keys(typeMap)[0]][0];
                
                const created = await prisma.questionnaireResponse.create({
                    data: {
                        questionnaireType: base.questionnaireType,
                        cpId: donor.cpId,
                        respondentName: base.respondentName,
                        respondentRole: base.respondentRole,
                        respondentOrg: base.respondentOrg,
                        respondentEmail: base.respondentEmail,
                        respondentInfo: base.respondentInfo,
                        notes: base.notes,
                        status: base.status,
                        answers: newAnswers,
                    }
                });
                console.log(`  Added missing ${type} (ID: ${created.id})`);
            }
        }
    }
    
    console.log("Done fixing respondents!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
