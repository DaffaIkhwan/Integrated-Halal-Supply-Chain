"use client";

import { useState, useRef } from "react";
import { Send, CheckCircle2, AlertCircle, UploadCloud, FileText, X } from "lucide-react";
import { motion } from "framer-motion";

export default function KnowledgeForm() {
  const [source, setSource] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{count: number} | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type === "application/pdf" || selectedFile.type === "text/plain") {
      setFile(selectedFile);
      if (!source) {
        setSource(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setContent(""); // Clear text content if file is selected
    } else {
      setError("Hanya mendukung file PDF atau TXT.");
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      setError("Harap isi sumber dokumen.");
      return;
    }
    if (!content.trim() && !file) {
      setError("Harap masukkan file atau teks dokumen.");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("source", source);
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("text", content);
      }

      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan knowledge");
      }

      setSuccess({ count: data.count });
      setContent("");
      setSource("");
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
      {success && (
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5" />
          Data berhasil dienkode dan dipecah menjadi {success.count} chunks ke dalam Vector DB!
        </motion.div>
      )}
      
      {error && (
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="h-5 w-5" />
          {error}
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-bold mb-2">Sumber / Judul Dokumen</label>
        <input 
          type="text"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Misal: Fatwa MUI No. 33 Tahun 2011"
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Nama dokumen ini akan muncul sebagai referensi (source) saat AI menjawab.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-bold">Isi Dokumen (Upload PDF/TXT atau Paste Teks)</label>
        
        {/* Upload Area */}
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-cyan-500/50 hover:bg-muted/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-full">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Tarik & lepas file dokumen ke sini, atau{" "}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-cyan-500 hover:underline">
                    Pilih File
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Mendukung file PDF atau TXT teks.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl border bg-cyan-500/5 border-cyan-500/20">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-cyan-500/20 text-cyan-500 rounded-lg shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button type="button" onClick={clearFile} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 border-t"></div>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">ATAU PASTE TEKS</span>
          <div className="flex-1 border-t"></div>
        </div>

        {/* Text Area */}
        <textarea 
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!!file}
          placeholder={file ? "Teks akan diekstrak otomatis dari file..." : "Paste seluruh isi teks dokumen di sini jika tidak mengupload file..."}
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow resize-y disabled:opacity-50 disabled:bg-muted"
          required={!file}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Teks/File akan otomatis dipotong (chunking) per-paragraf dan di-embed menggunakan model lokal sebelum disimpan ke vector database.
        </p>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
        {loading ? "Membaca & Memproses Embedding Lokal..." : "Simpan Knowledge ke RAG"}
      </button>
    </form>
  );
}
