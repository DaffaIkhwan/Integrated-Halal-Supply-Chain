import { pipeline, env } from '@huggingface/transformers';
import path from 'path';

// 1. Konfigurasi direktori cache khusus untuk Vercel
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  env.cacheDir = '/tmp/.cache/huggingface';
}

// 2. Disable remote dari HF Hub (kita izinkan di production untuk fetch dari Vercel kita sendiri)
env.allowRemoteModels = isProduction;

// 3. Tentukan path model
let MODEL_PATH = '';
let localFilesOnly = true;

if (isProduction) {
  // Ambil ID Repositori dari Hugging Face (diset di Environment Variables Vercel)
  // Contoh format: "username-kamu/indobert-intent"
  MODEL_PATH = process.env.HF_MODEL_REPO || "ganti-dengan-username-hf-kamu/indobert-intent";
  localFilesOnly = false;
} else {
  // Mode Development (Lokal)
  MODEL_PATH = path.join(process.cwd(), 'public', 'models', 'indobert-intent');
  localFilesOnly = true;
}

class IntentClassifierSingleton {
  static task = 'text-classification';
  static model = MODEL_PATH;
  static instance: any = null;

  static async getInstance(progress_callback?: any) {
    if (this.instance === null) {
      try {
        console.log(`[IndoBERT] Loading model from: ${this.model}`);
        this.instance = await pipeline(this.task as any, this.model, { 
          progress_callback,
          local_files_only: localFilesOnly,
        });
      } catch (error) {
        console.warn("⚠️ [IndoBERT] Failed to load model from", this.model, error);
        console.warn("Falling back to implicit LLM intent routing.");
        return null;
      }
    }
    return this.instance;
  }
}

export interface IntentResult {
  label: string;
  score: number;
}

export async function classifyIntent(text: string): Promise<IntentResult | null> {
  const classifier = await IntentClassifierSingleton.getInstance();
  if (!classifier) return null;

  try {
    const output = await classifier(text);
    if (Array.isArray(output) && output.length > 0) {
      // transformers.js text-classification output looks like [{ label: 'risk_check', score: 0.98 }]
      return {
        label: output[0].label,
        score: output[0].score
      };
    }
  } catch (error) {
    console.error("Error classifying intent:", error);
  }
  
  return null;
}
