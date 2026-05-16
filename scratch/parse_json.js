const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/pdf.txt/KUESIONER 2 Latest Version OK.json', 'utf8'));
let text = '';
let lastY = -1;
data.Pages.forEach(page => {
    page.Texts.forEach(t => {
        const y = t.y;
        if (lastY !== -1 && Math.abs(y - lastY) > 0.5) {
            text += '\n';
        }
        text += decodeURIComponent(t.R[0].T) + ' ';
        lastY = y;
    });
    text += '\n\n';
});
fs.writeFileSync('scratch/clean.txt', text);
