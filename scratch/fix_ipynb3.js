const fs = require('fs');
const path = require('path');

const filepath = path.join('c:', 'Users', 'Acer', 'Pictures', 'chatbot', 'NextRag', 'ml', 'evaluasi_deepeval_openrouter.ipynb');
const raw = fs.readFileSync(filepath, 'utf8');
const nb = JSON.parse(raw);
const cells = nb.cells;

for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('tc = LLMTestCase(')) {
        // Kita tambahkan context=item.get("retrieval_context") or None,
        let newSource = source.replace(
            /retrieval_context=item\.get\("retrieval_context"\) or None,/g, 
            "retrieval_context=item.get(\"retrieval_context\") or None,\n        context=item.get(\"retrieval_context\") or None,"
        );
        cells[i].source = newSource.split(/(?<=\n)/);
    }
}

fs.writeFileSync(filepath, JSON.stringify(nb, null, 1), 'utf8');
console.log('Notebook berhasil diperbaiki: Menambahkan parameter context untuk HallucinationMetric.');
