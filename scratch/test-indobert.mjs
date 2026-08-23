// Quick test: does IndoBERT model load and produce correct output?
import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = true;

async function test() {
  console.log('[TEST] Loading IndoBERT model...');
  const startTime = Date.now();
  
  try {
    const classifier = await pipeline('text-classification', 'NurfauzanDaffa/indobert-intent', {
      local_files_only: false,
    });
    console.log(`[TEST] Model loaded in ${Date.now() - startTime}ms`);
    
    const testCases = [
      'Apa itu AHP dalam sistem penilaian risiko ini?',
      'Berapa skor risiko untuk kandang dengan sanitasi buruk?',
      'Tampilkan riwayat batch dengan kode eartag E-00231',
      'Halo, selamat pagi',
      'Bisakah kamu bantu saya cari resep rendang?',
      'brapa skor rsk kndng yg jorok banget??',
    ];
    
    for (const text of testCases) {
      const result = await classifier(text);
      console.log(`Input: "${text}"`);
      console.log(`  -> Label: ${result[0].label}, Score: ${result[0].score.toFixed(4)}`);
      console.log();
    }
  } catch (error) {
    console.error('[TEST] FAILED:', error);
  }
}

test();
