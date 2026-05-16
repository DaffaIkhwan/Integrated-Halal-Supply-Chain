const fs = require('fs');
const xml = fs.readFileSync('docs/temp_k2/word/document.xml', 'utf8');

// Find all table rows
const rows = xml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
let output = '';

rows.forEach((r, i) => {
  const cells = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
  const texts = cells.map(c => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(t => t.length > 0);
  
  // Look for rows with 5 cells that contain descriptive text (not just numbers/checkboxes)
  if (texts.length >= 5) {
    const hasLongText = texts.some(t => t.length > 20);
    if (hasLongText) {
      output += `\n=== ROW ${i} (${texts.length} cells) ===\n`;
      texts.forEach((t, j) => output += `  [${j}]: ${t}\n`);
    }
  }
});

fs.writeFileSync('docs/temp_k2/desc-rows.txt', output);
console.log('Done. Check desc-rows.txt');
