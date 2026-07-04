import { pipeline, env } from '@huggingface/transformers';
import path from 'path';

// 1. Konfigurasi direktori cache khusus untuk Vercel
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  env.cacheDir = '/tmp/.cache/huggingface';
}

// 2. Izinkan remote dari HF Hub agar bisa mendownload model NurfauzanDaffa
env.allowRemoteModels = true;

// 3. Tentukan path model
// Menggunakan ID model yang sudah Anda upload di Hugging Face
const MODEL_PATH = "NurfauzanDaffa/indobert-intent";
const localFilesOnly = false; // Set false agar mengambil dari Hugging Face Hub

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
