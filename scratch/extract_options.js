const fs = require('fs');

const text = fs.readFileSync('scratch/clean.txt', 'utf8');

const pattern = /(CP\d+\.\d+\.?.*?)(?=CP\d+\.\d+\.?|$)/gs;
const matches = text.match(pattern) || [];

const results = {};
for (const m of matches) {
    const cpMatch = m.match(/(CP\d+\.\d+)/);
    if (!cpMatch) continue;
    const cpId = cpMatch[1];
    
    // Extract the block between Indicator 2 and Indicator 3
    const blockMatch = m.match(/2.*?Ya\s*☐\s*Tidak\s*(.*?)\n\s*3\s+/s);
    if (blockMatch) {
        let block = blockMatch[1];
        // Clean up
        block = block.replace(/\n\s*/g, ' ');
        block = block.replace(/-\s+/g, '');
        block = block.replace(/\s+/g, ' ').trim();
        results[cpId] = block;
    }
}

fs.writeFileSync('scratch/extracted_options.json', JSON.stringify(results, null, 2));
