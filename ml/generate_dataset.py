import os
import json
import requests
from dotenv import load_dotenv

load_dotenv('../.env')

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

prompt = """
Kamu adalah AI asisten untuk membantu riset sistem peternakan.
Buatkan 100 pertanyaan sintetis untuk mengevaluasi chatbot peternakan berbahasa Indonesia.
Pertanyaan harus realistis, mencerminkan pengguna riil (peternak, masyarakat umum, petugas RPH).
Gunakan bahasa yang bervariasi: ada yang formal, ada yang informal (slang/gaul seperti 'bang', 'klo', 'yg', dll), beberapa ada typo, ada yang bertele-tele, ada yang ambigu/sulit dimengerti.

Aturan Data (Gunakan data ini di dalam pertanyaan):
- Eartag Sapi: TAG-A001 s/d TAG-A004, TAG-B001 s/d TAG-B004, TAG-C001 s/d TAG-C004
- Peternakan (Farm): Peternakan Berkah Mandiri (Jabar), Peternakan Sumber Rejeki (Jatim), Peternakan Nusantara Jaya (Jateng)
- RPH (Rumah Potong Hewan): RPH Syariah Al-Anam (Bogor), RPH Halal Surabaya, RPH Terpadu Semarang
- Supply Chain: PT Angkutan Ternak Sejahtera (Truk/Jabar), Cold Storage Halal Bandung, dll.
- Halal Batch: Batch 1 s/d Batch 10 (tanggal produksi Jan-Feb 2026)

Distribusi Kategori (Total 100):
1. 'knowledge_query' (20): Pertanyaan pengetahuan umum seputar RPH, aturan BPJPH, syarat juleha (juru sembelih halal), suhu cold storage, tata cara sembelih, dll.
2. 'risk_check' (20): Pertanyaan menanyakan skor risiko AHP atau tingkat keamanan pada CP tertentu (contoh: CP4 RPH, CP1 Kandang, dll).
3. 'batch_trace' (20): Melacak perjalanan daging dari eartag tertentu (contoh: sapi TAG-A001 asalnya darimana, dipotong dimana, statusnya apa).
4. 'operational_data' (20): Menanyakan data master/operasional seperti ada berapa peternakan, nama RPH di Jatim, distributor di Jabodetabek, fasilitas cold storage di Bandung, dll.
5. 'out_of_scope' (10): Topik di luar peternakan/halal. Contoh: cuaca, resep masakan, politik, saham, koding, kedokteran manusia.
6. 'edge_case' (10): Kueri yang sangat ambigu, sangat pendek, atau salah ketik parah (misal: "coba cek sapi", "aman ga", "bntu lacak", dll) tapi dengan intent ke 'knowledge_query' atau 'batch_trace' atau 'risk_check'. Atur 'category' nya sesuai intent yang paling mendekati (misal 'batch_trace' atau 'risk_check' atau 'knowledge_query').

Format Output: Jawab HANYA dengan array JSON valid tanpa markdown, tanpa penjelasan apapun, berbentuk list of dict dengan keys: "input" (string), "category" (string), "expected_output" (string singkat). Set 'retrieval_context' jadi array kosong [].

Contoh elemen JSON:
{
  "input": "bang, cekin sapi TAG-A001 donk asalnya dmn?",
  "category": "batch_trace",
  "expected_output": "Menjelaskan asal sapi TAG-A001.",
  "retrieval_context": []
}
"""

print("Generating 100 realistic questions via GPT-4o...")
response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "openai/gpt-4o",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 8000
    },
    timeout=180
)

try:
    content = response.json()["choices"][0]["message"]["content"]
    # clean up markdown if any
    content = content.replace("```json", "").replace("```", "").strip()
    dataset = json.loads(content)
    
    with open("dataset_100.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=4, ensure_ascii=False)
        
    print(f"Success! Generated {len(dataset)} questions saved to dataset_100.json")
except Exception as e:
    print("Failed to generate dataset:", e)
    print("Response payload:", response.text)
