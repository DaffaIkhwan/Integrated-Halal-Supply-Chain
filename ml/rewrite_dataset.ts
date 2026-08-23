import fs from 'fs';
import path from 'path';

const datasetPath = path.join(process.cwd(), 'ml', 'dataset_100.json');

async function rewriteText(text: string) {
  if (!text.toLowerCase().startsWith('menjelaskan') && 
      !text.toLowerCase().startsWith('memberikan') &&
      !text.toLowerCase().startsWith('menyebutkan')) {
    return text;
  }

  const prompt = `Ubah kalimat instruksi meta ini menjadi pernyataan fakta definitif (jawaban yang diharapkan dari ensiklopedia/dokumen resmi).
Contoh 1:
Input: Menjelaskan peran BPJPH dalam industri peternakan.
Output: BPJPH (Badan Penyelenggara Jaminan Produk Halal) berperan menyelenggarakan Jaminan Produk Halal di Indonesia termasuk bagi industri peternakan.
Contoh 2:
Input: Menjelaskan syarat menjadi juru sembelih halal.
Output: Syarat menjadi juru sembelih halal adalah beragama Islam, dewasa (baligh), berakal sehat, dan memahami tata cara syariat penyembelihan.
Contoh 3:
Input: Memberikan informasi suhu ideal untuk cold storage daging.
Output: Suhu ideal untuk cold storage daging beku adalah di bawah -18 derajat Celcius untuk mencegah pertumbuhan bakteri.
Contoh 4:
Input: Menyebutkan nama RPH yang ada di Jatim.
Output: Nama-nama RPH yang ada di Jawa Timur.

Input: ${text}
Output:`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (e) {
    console.error('Error generating text:', e);
    return text;
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Loaded ${data.length} items. Rewriting...`);
  let count = 0;
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const eo = item.expected_output || '';
    if (eo && (eo.toLowerCase().startsWith('menjelaskan') || eo.toLowerCase().startsWith('memberikan') || eo.toLowerCase().startsWith('menyebutkan'))) {
      const newEo = await rewriteText(eo);
      if (newEo !== eo) {
        console.log(`[${i}] ${eo} -> ${newEo}`);
        item.expected_output = newEo;
        count++;
      }
    }
  }

  fs.writeFileSync(datasetPath, JSON.stringify(data, null, 4), 'utf8');
  console.log(`Done! Rewrote ${count} items.`);
}

main().catch(console.error);
