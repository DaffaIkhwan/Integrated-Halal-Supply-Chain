import KnowledgeForm from "./knowledge-form";
import { Database, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DocsPage() {
  // if (session?.user?.role !== "ADMIN") {
  //   redirect("/dashboard");
  // }

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
          <Database className="h-7 w-7 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tambah Knowledge <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">RAG</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fasilitas khusus Admin untuk memperkaya basis pengetahuan chatbot Halal Supply Chain.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 flex gap-4">
        <ShieldAlert className="h-6 w-6 text-cyan-500 shrink-0" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-cyan-500">Panduan RAG (Retrieval-Augmented Generation):</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
            <li>Masukkan teks dari dokumen resmi (UU, Fatwa MUI, Panduan HAS 23000, dll).</li>
            <li>Sistem akan secara otomatis <strong>memecah teks (chunking)</strong> menjadi potongan-potongan kecil.</li>
            <li>Sistem akan membuat <strong>vektor embedding</strong> secara lokal (all-MiniLM) lalu menyimpannya ke database PostgreSQL (pgvector).</li>
            <li>Data yang berhasil disimpan akan langsung bisa dijawab oleh Chatbot AI.</li>
          </ul>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full">
        <KnowledgeForm />
      </div>
    </div>
  );
}
