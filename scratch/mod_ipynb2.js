const fs = require('fs');
const path = require('path');

const filepath = path.join('c:', 'Users', 'Acer', 'Pictures', 'chatbot', 'NextRag', 'ml', 'evaluasi_deepeval_openrouter.ipynb');
const raw = fs.readFileSync(filepath, 'utf8');
const nb = JSON.parse(raw);
const cells = nb.cells;

// 1. Modifikasi Pip install
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('!pip install')) {
        cells[i].source = ["!pip install -q deepeval openai pandas matplotlib tabulate python-dotenv\n"];
    }
}

// 2. Modifikasi Environment Variables Cell
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('OPENROUTER_API_KEY = getpass')) {
        cells[i].source = [
            "import os\n",
            "from dotenv import load_dotenv\n",
            "\n",
            "# Load .env file from the NextRag root directory\n",
            "load_dotenv('../.env')\n",
            "\n",
            "OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')\n",
            "if not OPENROUTER_API_KEY:\n",
            "    raise ValueError('OPENROUTER_API_KEY tidak ditemukan di .env')\n",
            "\n",
            "os.environ['OPENROUTER_API_KEY'] = OPENROUTER_API_KEY\n",
            "os.environ.setdefault('OPENAI_API_KEY', 'sk-not-used-openrouter-only')\n"
        ];
    }
}

// 3. Modifikasi Dataset (Menambahkan data adversarial)
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('dataset = [')) {
        let newSource = source.replace(']\n\nprint(f"Total test case', 
            `    {\n` +
            `        "input": "min, info eartag sapi E-00231 donk, sm skor RPH nya lolos gk?",\n` +
            `        "category": "fallback",\n` +
            `        "expected_output": "Menjelaskan status batch eartag E-00231 dengan bahasa yang sesuai.",\n` +
            `        "retrieval_context": []\n` +
            `    },\n` +
            `    {\n` +
            `        "input": "brapa skor rsk kndng yg jorok banget??",\n` +
            `        "category": "risk_check",\n` +
            `        "expected_output": "Skor risiko akan bernilai tinggi berdasarkan parameter sanitasi yang buruk.",\n` +
            `        "retrieval_context": ["Bobot kriteria sanitasi pada kandang sangat mempengaruhi risiko secara keseluruhan."]\n` +
            `    }\n` +
            `]\n\nprint(f"Total test case`
        );
        cells[i].source = newSource.split(/(?<=\n)/);
    }
}

// 4. Modifikasi API Call
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('SYSTEM_API_URL = ')) {
        cells[i].source = [
            "import requests\n",
            "\n",
            "SYSTEM_API_URL = \"http://localhost:3000/api/chat\"  # Mengarah ke localhost Anda\n",
            "USE_REAL_API = False  # Set True untuk mengetes langsung ke Next.js yang berjalan\n",
            "\n",
            "def call_real_system(user_input: str):\n",
            "    # Menambahkan isEval: True agar API mereturn JSON (bukan stream) beserta metadata lengkap\n",
            "    resp = requests.post(SYSTEM_API_URL, json={\"message\": user_input, \"isEval\": True}, timeout=30)\n",
            "    resp.raise_for_status()\n",
            "    data = resp.json()\n",
            "    return {\n",
            "        \"answer\": data.get(\"answer\", \"\"),\n",
            "        \"detected_intent\": data.get(\"intent_label\", \"unknown\"),\n",
            "        \"confidence_score\": data.get(\"confidence_score\", 0.0),\n",
            "        \"contexts\": data.get(\"contexts\", [])\n",
            "    }\n",
            "\n",
            "def call_simulated_system(user_input: str, retrieval_context, expected_category: str):\n",
            "    context_text = \"\\n\".join(retrieval_context) if retrieval_context else \"(tidak ada konteks tambahan)\"\n",
            "    prompt = (\n",
            "        \"Kamu adalah asisten sistem peternakan berbahasa Indonesia. \"\n",
            "        \"Jawab pertanyaan berikut berdasarkan konteks yang diberikan, singkat dan jelas.\\n\\n\"\n",
            "        f\"Konteks:\\n{context_text}\\n\\nPertanyaan: {user_input}\\nJawaban:\"\n",
            "    )\n",
            "    return {\n",
            "        \"answer\": generator_model.generate(prompt),\n",
            "        \"detected_intent\": expected_category,\n",
            "        \"confidence_score\": 0.85,\n",
            "        \"contexts\": retrieval_context or []\n",
            "    }\n",
            "\n",
            "for item in dataset:\n",
            "    if USE_REAL_API:\n",
            "        system_resp = call_real_system(item[\"input\"])\n",
            "        # Timpa konteks mock dengan konteks RAG RIIL yang dikembalikan oleh server!\n",
            "        item[\"retrieval_context\"] = system_resp[\"contexts\"] if system_resp[\"contexts\"] else item.get(\"retrieval_context\", [])\n",
            "    else:\n",
            "        system_resp = call_simulated_system(item[\"input\"], item.get(\"retrieval_context\"), item[\"category\"])\n",
            "    \n",
            "    item[\"actual_output\"] = system_resp[\"answer\"]\n",
            "    item[\"detected_intent\"] = system_resp[\"detected_intent\"]\n",
            "    item[\"confidence_score\"] = system_resp[\"confidence_score\"]\n",
            "\n",
            "for item in dataset:\n",
            "    print(f\"[{item['category']}] {item['input']}\\n-> Intent: {item['detected_intent']} ({item['confidence_score']})\\n-> {item['actual_output'][:100]}...\\n\")\n"
        ];
    }
}

// Write back
fs.writeFileSync(filepath, JSON.stringify(nb, null, 1), 'utf8');
console.log('Notebook berhasil diupdate dengan adversarial test, API metadata, dan dotenv.');
