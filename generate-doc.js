const fs = require('fs');
const path = require('path');

const mdPath = path.resolve('C:/Users/Acer/.gemini/antigravity-ide/brain/a5a3848c-e8bd-4d9b-8b3c-6fd0486143cf/raw-data-changes.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// A very basic markdown to HTML converter for our specific format
function convertMdToHtml(md) {
  let html = '<html><head><meta charset="utf-8"><style>';
  html += 'body { font-family: Arial, sans-serif; line-height: 1.6; }';
  html += 'table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }';
  html += 'th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }';
  html += 'th { background-color: #f2f2f2; }';
  html += 'h1 { color: #333; font-size: 24px; }';
  html += 'h2 { color: #444; font-size: 20px; margin-top: 20px; }';
  html += 'p { margin-bottom: 10px; }';
  html += '</style></head><body>';

  const lines = md.split('\n');
  let inTable = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inTable) {
        html += '</tbody></table>';
        inTable = false;
      }
      continue;
    }

    if (line.startsWith('# ')) {
      html += `<h1>${line.substring(2)}</h1>`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${line.substring(3)}</h2>`;
    } else if (line.startsWith('|')) {
      if (!inTable) {
        html += '<table><thead>';
        inTable = true;
      }
      
      if (line.includes('---')) {
        html += '</thead><tbody>';
        continue;
      }

      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const tag = html.includes('<tbody>') ? 'td' : 'th';
      html += '<tr>';
      for (const cell of cells) {
        // Convert **text** to <strong>text</strong>
        const formattedCell = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<${tag}>${formattedCell}</${tag}>`;
      }
      html += '</tr>';
    } else {
      // Normal paragraph
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<p>${formattedLine}</p>`;
    }
  }

  if (inTable) {
    html += '</tbody></table>';
  }

  html += '</body></html>';
  return html;
}

const htmlDoc = convertMdToHtml(mdContent);

// Include the other table as well
const extraHtml = `
<h2>Ringkasan Perbandingan Bobot</h2>

<h3>1. Perbandingan Bobot Irdha Mirdayati</h3>
<p>Pakar ini menganggap CP5 dan CP6 sebagai yang paling penting, dan CP1 & CP2 sebagai yang paling tidak penting.</p>
<table>
<thead>
<tr><th>Kriteria / Critical Point</th><th>Bobot LAMA (CR: 0.34) ❌</th><th>Bobot BARU (CR: 0.00) ✅</th><th>Selisih</th></tr>
</thead>
<tbody>
<tr><td>CP6 (Production Facility)</td><td>17.71%</td><td>16.79%</td><td>-0.92%</td></tr>
<tr><td>CP5 (Products)</td><td>17.11%</td><td>16.79%</td><td>-0.32%</td></tr>
<tr><td>CP7 (Written Procedures)</td><td>15.90%</td><td>15.31%</td><td>-0.59%</td></tr>
<tr><td>CP8 (Traceability)</td><td>13.79%</td><td>14.39%</td><td>+0.60%</td></tr>
<tr><td>CP9 (Handling Non-conforming)</td><td>13.79%</td><td>14.39%</td><td>+0.60%</td></tr>
<tr><td>CP4 (Materials)</td><td>6.75%</td><td>7.06%</td><td>+0.31%</td></tr>
<tr><td>CP3 (Training)</td><td>6.18%</td><td>7.06%</td><td>+0.88%</td></tr>
<tr><td>CP2 (Halal Team)</td><td>4.67%</td><td>4.11%</td><td>-0.56%</td></tr>
<tr><td>CP1 (Halal Policy)</td><td>4.09%</td><td>4.11%</td><td>+0.02%</td></tr>
</tbody>
</table>

<h3>2. Perbandingan Bobot Muhammad Rizki</h3>
<p>Pakar ini menganggap CP4 dan CP6 sebagai yang paling penting, serta CP3 dan CP1 sebagai yang relatif kurang penting.</p>
<table>
<thead>
<tr><th>Kriteria / Critical Point</th><th>Bobot LAMA (CR: 0.20) ❌</th><th>Bobot BARU (CR: 0.01) ✅</th><th>Selisih</th></tr>
</thead>
<tbody>
<tr><td>CP4 (Materials)</td><td>15.33%</td><td>13.78%</td><td>-1.55%</td></tr>
<tr><td>CP6 (Production Facility)</td><td>14.83%</td><td>13.78%</td><td>-1.05%</td></tr>
<tr><td>CP5 (Products)</td><td>13.63%</td><td>12.77%</td><td>-0.86%</td></tr>
<tr><td>CP8 (Traceability)</td><td>11.41%</td><td>10.92%</td><td>-0.49%</td></tr>
<tr><td>CP2 (Halal Team)</td><td>10.43%</td><td>9.44%</td><td>-0.99%</td></tr>
<tr><td>CP9 (Handling Non-conforming)</td><td>9.49%</td><td>10.92%</td><td>+1.43%</td></tr>
<tr><td>CP7 (Written Procedures)</td><td>9.01%</td><td>10.92%</td><td>+1.91%</td></tr>
<tr><td>CP1 (Halal Policy)</td><td>8.37%</td><td>8.74%</td><td>+0.37%</td></tr>
<tr><td>CP3 (Training)</td><td>7.49%</td><td>8.74%</td><td>+1.25%</td></tr>
</tbody>
</table>
`;

const finalHtml = htmlDoc.replace('</body>', extraHtml + '</body>');

const docPath = path.resolve('public/docs/Dokumentasi_Perubahan_Kuesioner.doc');
fs.writeFileSync(docPath, finalHtml);
console.log('Saved word document to:', docPath);
