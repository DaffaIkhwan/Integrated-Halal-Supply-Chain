const fs = require('fs');
global.DOMMatrix = class DOMMatrix { };
const pdf = require('pdf-parse');
const path = require('path');

const ragDir = path.join(process.cwd(), 'public', 'RAG');
const files = ['Fuzzy AHP DSS Halal Suuply Chain (1).pdf', 'Analisis Fuzzy AHP .pdf'];

async function processFiles() {
    for (const file of files) {
        const pdfPath = path.join(ragDir, file);
        const txtPath = pdfPath + '.txt';
        if (fs.existsSync(pdfPath)) {
            console.log('Reading ' + file);
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            fs.writeFileSync(txtPath, data.text);
            console.log('Converted ' + file + ' to txt');
        } else {
            console.log('Not found: ' + file);
        }
    }
}
processFiles().catch(console.error);
