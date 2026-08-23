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
  static loadAttempted = false;

  static async getInstance(progress_callback?: any) {
    // If previously failed, don't retry on every request
    if (this.loadAttempted && this.instance === null) {
      return null;
    }

    if (this.instance === null) {
      this.loadAttempted = true;
      try {
        console.log(`[IndoBERT] Loading model from: ${this.model}`);
        console.log(`[IndoBERT] Environment: NODE_ENV=${process.env.NODE_ENV}, localFilesOnly=${localFilesOnly}`);
        this.instance = await pipeline(this.task as any, this.model, { 
          progress_callback,
          local_files_only: localFilesOnly,
        });
        console.log(`[IndoBERT] ✅ Model loaded successfully`);
      } catch (error) {
        console.error("❌ [IndoBERT] Failed to load model:", error);
        console.error(`[IndoBERT] Model path: ${this.model}`);
        console.error("[IndoBERT] ⚠️ ALL requests will use LLM fallback until server restart!");
        this.instance = null;
        return null;
      }
    }
    return this.instance;
  }

  /** Reset to allow re-attempting model load (e.g., after fixing model path) */
  static reset() {
    this.instance = null;
    this.loadAttempted = false;
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
