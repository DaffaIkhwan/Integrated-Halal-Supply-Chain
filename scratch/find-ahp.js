"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Fetching all oai records...');
    const records = await prisma.oai.findMany();
    for (const record of records) {
        let metaStr = typeof record.metadata === 'string' ? record.metadata : JSON.stringify(record.metadata);
        let chunkStr = record.chunk || '';
        if (metaStr.toLowerCase().includes('ahp') || chunkStr.toLowerCase().includes('fuzzy ahp') || metaStr.toLowerCase().includes('note file')) {
            console.log(`Found record ${record.id}`);
            console.log(`Metadata: ${metaStr.substring(0, 100)}`);
            // console.log(`Chunk: ${chunkStr.substring(0, 100)}...`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
