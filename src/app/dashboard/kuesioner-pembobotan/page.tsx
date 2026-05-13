"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, EXPERT_TYPES } from "@/lib/data/questionnaire-index";
import { Scale, Info, Send, CheckCircle2, Users } from "lucide-react";

const SAATY_SCALE = [
  { value: 1, label: "Sama Penting", desc: "Kedua elemen sama pentingnya" },
  { value: 2, label: "Mendekati Sedikit Lebih Penting", desc: "Nilai antara" },
  { value: 3, label: "Sedikit Lebih Penting", desc: "Elemen satu sedikit lebih penting" },
  { value: 4, label: "Mendekati Lebih Penting", desc: "Nilai antara" },
  { value: 5, label: "Lebih Penting", desc: "Elemen satu lebih penting" },
  { value: 6, label: "Mendekati Sangat Penting", desc: "Nilai antara" },
  { value: 7, label: "Sangat Penting", desc: "Elemen satu sangat lebih penting" },
  { value: 8, label: "Mendekati Mutlak", desc: "Nilai antara" },
  { value: 9, label: "Mutlak Lebih Penting", desc: "Elemen satu mutlak lebih penting" },
];

type PairwiseAnswers = Record<string, { value: number; direction: "left" | "right" }>;

function generatePairs(items: { id: string; label: string }[]) {
  const pairs: { left: typeof items[0]; right: typeof items[0] }[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push({ left: items[i], right: items[j] });
    }
  }
  return pairs;
}

export default function KuesionerPembobotanPage() {
  const [expertBg, setExpertBg] = useState({
    nama: "", jenisKelamin: "", posisi: "", namaInstansi: "", jenisKeahlian: "",
    pengalaman: "", email: "", tanggal: "",
  });
  const [answers, setAnswers] = useState<PairwiseAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // CP-level pairwise comparison
  const cpItems = ALL_CP_QUESTIONNAIRES.map(cp => ({ id: cp.cpId, label: `${cp.cpId} — ${cp.cpName}` }));
  const cpPairs = generatePairs(cpItems);

  const handleAnswer = (pairKey: string, value: number, direction: "left" | "right") => {
    setAnswers(prev => ({ ...prev, [pairKey]: { value, direction } }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Scale className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Kuesioner 1</span>
              {" "}— Pembobotan Model
            </h1>
            <p className="text-sm text-muted-foreground">Pembobotan Model Integrasi Halal Supply Chain — Metode Fuzzy AHP</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Petunjuk Pengisian</p>
            <p>Kuesioner ini diisi oleh <strong>Pakar/Expert</strong>. Bandingkan tingkat kepentingan antar Critical Point (CP) menggunakan skala Saaty 1-9. Pilih arah mana yang lebih penting, lalu pilih seberapa penting.</p>
          </div>
        </div>

        {/* Expert types */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Tipe Pakar yang Mengisi
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERT_TYPES.map(e => (
              <span key={e.id} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                {e.label}
              </span>
            ))}
          </div>
        </div>

        {/* Expert Background */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-bold mb-4">Latar Belakang Responden (Pakar)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "nama", label: "Nama Lengkap", type: "text" },
              { key: "jenisKelamin", label: "Jenis Kelamin", type: "text" },
              { key: "jenisKeahlian", label: "Jenis Keahlian", type: "select" },
              { key: "posisi", label: "Posisi / Jabatan", type: "text" },
              { key: "namaInstansi", label: "Nama Instansi", type: "text" },
              { key: "pengalaman", label: "Pengalaman (tahun)", type: "text" },
              { key: "email", label: "Email", type: "text" },
              { key: "tanggal", label: "Tanggal Pengisian", type: "date" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                {f.key === "jenisKeahlian" ? (
                  <select
                    value={expertBg.jenisKeahlian}
                    onChange={e => setExpertBg(p => ({ ...p, jenisKeahlian: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Pilih —</option>
                    {EXPERT_TYPES.map(et => <option key={et.id} value={et.id}>{et.label}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={expertBg[f.key as keyof typeof expertBg]}
                    onChange={e => setExpertBg(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Saaty Scale Reference */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skala Perbandingan Berpasangan (Saaty 1-9)</p>
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
            {SAATY_SCALE.filter(s => s.value % 2 !== 0).map(s => (
              <div key={s.value} className="rounded-lg p-2 text-center border border-border/50 bg-muted/30">
                <p className="text-lg font-bold text-amber-400">{s.value}</p>
                <p className="text-[10px] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pairwise Comparison Table */}
        <div className="rounded-2xl border bg-card p-5 shadow-lg">
          <h2 className="text-lg font-bold mb-1">Perbandingan Berpasangan antar Critical Point</h2>
          <p className="text-xs text-muted-foreground mb-6">Pilih CP mana yang lebih penting, lalu tentukan tingkat kepentingannya (1-9)</p>

          <div className="space-y-3">
            {cpPairs.map((pair, idx) => {
              const pairKey = `${pair.left.id}_vs_${pair.right.id}`;
              const answer = answers[pairKey];
              return (
                <motion.div
                  key={pairKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="rounded-xl border border-border/50 bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Left CP */}
                    <button
                      onClick={() => handleAnswer(pairKey, answer?.value || 1, "left")}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-center transition-all border ${
                        answer?.direction === "left"
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                          : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pair.left.label}
                    </button>

                    {/* Slider */}
                    <div className="shrink-0 w-[200px] flex flex-col items-center gap-1">
                      <input
                        type="range" min={1} max={9}
                        value={answer?.value || 1}
                        onChange={e => handleAnswer(pairKey, Number(e.target.value), answer?.direction || "left")}
                        className="w-full accent-amber-500"
                      />
                      <span className="text-lg font-bold font-mono text-amber-400">{answer?.value || 1}</span>
                    </div>

                    {/* Right CP */}
                    <button
                      onClick={() => handleAnswer(pairKey, answer?.value || 1, "right")}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-center transition-all border ${
                        answer?.direction === "right"
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                          : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pair.right.label}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Total perbandingan: {cpPairs.length} pasang • Terisi: {Object.keys(answers).length}/{cpPairs.length}
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          {submitted && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Data pembobotan berhasil disimpan
            </motion.div>
          )}
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : <Send className="h-4 w-4" />}
            Simpan Pembobotan
          </button>
        </div>
      </main>
    </div>
  );
}
