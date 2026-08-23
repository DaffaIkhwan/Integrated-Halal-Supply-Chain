const fs = require('fs');

const path = 'evaluasi_deepeval_openrouter.ipynb';
const nb = JSON.parse(fs.readFileSync(path, 'utf8'));

let changed = false;

for (let cell of nb.cells) {
    if (cell.cell_type === 'code' && cell.source) {
        let inFunc = false;
        let newSource = [];
        
        for (let i = 0; i < cell.source.length; i++) {
            let line = cell.source[i];
            
            if (line.startsWith('def call_real_system(')) {
                inFunc = true;
                newSource.push('def call_real_system(user_input: str):\n');
                newSource.push('    try:\n');
                newSource.push('        resp = requests.post(SYSTEM_API_URL, json={"message": user_input, "isEval": True}, timeout=120)\n');
                newSource.push('        resp.raise_for_status()\n');
                newSource.push('        data = resp.json()\n');
                newSource.push('        return {\n');
                newSource.push('            "answer": data.get("answer", ""),\n');
                newSource.push('            "contexts": data.get("contexts", []),\n');
                newSource.push('            "metadata": data.get("metadata", {})\n');
                newSource.push('        }\n');
                newSource.push('    except Exception as e:\n');
                newSource.push('        print(f"API Error for input {user_input}: {e}")\n');
                newSource.push('        return {\n');
                newSource.push('            "answer": "Maaf, terjadi kesalahan internal pada server saat memproses permintaan ini.",\n');
                newSource.push('            "contexts": [],\n');
                newSource.push('            "metadata": {}\n');
                newSource.push('        }\n');
                changed = true;
            } else if (inFunc && (line.startsWith('    ') || line.trim() === '')) {
                // skip old function lines
                continue;
            } else {
                inFunc = false;
                newSource.push(line);
            }
        }
        cell.source = newSource;
    }
}

if (changed) {
    fs.writeFileSync(path, JSON.stringify(nb, null, 1));
    console.log("Notebook successfully updated to handle HTTP 500 errors gracefully.");
} else {
    console.log("Could not find call_real_system.");
}
