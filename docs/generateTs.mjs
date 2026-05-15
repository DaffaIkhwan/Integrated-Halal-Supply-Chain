import fs from 'fs';

const text = fs.readFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/k2.txt', 'utf8');

const cps = [];
const cpMatches = text.matchAll(/CP(\d+)\.\s+([^\n]+)\s*\n([\s\S]*?)(?=CP\d+\.\s+[^\n]+|$)/g);

for (const match of cpMatches) {
    const cpId = `CP${match[1]}`;
    // Split name like "Rumah Potong Hewan (RPH) - Slaughterhouse"
    let rawName = match[2].trim();
    let cpName = rawName;
    let cpNameEn = rawName;
    if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        cpName = parts[0].trim();
        cpNameEn = parts[1].trim();
    }
    
    // Parse subcriteria
    const subCriteria = [];
    const subMatches = match[3].matchAll(/CP\d+\.\d+\.\s*\n([^\n]+)\s*\nKetersediaan Bukti Pendukung\s*\nCatatan Auditor\s*\n1\s*\n2\s*\n3\s*\n4\s*\n5\s*\n([\s\S]*?)(?=CP\d+\.\d+\.|$)/g);
    for (const subMatch of subMatches) {
        let rawSubName = subMatch[1].trim();
        let subName = rawSubName;
        let subNameEn = rawSubName;
        if (rawSubName.includes(' - ')) {
            const parts = rawSubName.split(' - ');
            subName = parts[0].trim();
            subNameEn = parts[1].trim();
        }
        
        const indicators = [];
        const lines = subMatch[2].split('\n').map(l => l.trim()).filter(l => l);
        
        let currentInd = null;
        for (let i = 0; i < lines.length; i++) {
            if (/^\d+$/.test(lines[i])) {
                if (currentInd && currentInd.statement && currentInd.evidence) {
                    indicators.push(currentInd);
                }
                currentInd = { no: parseInt(lines[i], 10), statement: '', evidence: '' };
            } else if (currentInd) {
                if (!currentInd.statement) {
                    currentInd.statement = lines[i];
                } else if (!currentInd.evidence) {
                    currentInd.evidence = lines[i];
                }
            }
        }
        if (currentInd && currentInd.statement && currentInd.evidence) {
            indicators.push(currentInd);
        }
        
        // Find code (e.g. CP1.1)
        const code = `${cpId}.${subCriteria.length + 1}`;
        subCriteria.push({ code, name: subName, nameEn: subNameEn, indicators });
    }
    
    cps.push({ cpId, cpName, cpNameEn, subCriteria });
}

fs.writeFileSync('c:/Users/Acer/Pictures/chatbot/NextRag/docs/parsed_cps.json', JSON.stringify(cps, null, 2));
console.log('Done parsing');
