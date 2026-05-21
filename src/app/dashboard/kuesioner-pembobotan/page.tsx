"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, EXPERT_TYPES, KU_KRITERIA_UMUM } from "@/lib/data/questionnaire-index";
import { Scale, Info, Send, CheckCircle2, Users, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

// ─── Saaty Scale Helper ───
const SAATY_LABELS: Record<number, string> = {
  9: "Mutlak Lebih Penting",
  7: "Sangat Lebih Penting",
  5: "Lebih Penting",
  3: "Sedikit Lebih Penting",
  1: "Sama Penting",
};

function getSaatyText(val: number, leftLabel: string, rightLabel: string) {
  if (val === 0) return "Kedua elemen sama penting (1)";
  const abs = Math.abs(val) + 1; // map 1..8 to 2..9
  const side = val < 0 ? leftLabel : rightLabel;
  const desc = SAATY_LABELS[abs] || "Nilai Antara";
  return `${side} ${desc} (${abs})`;
}

export default function KuesionerPembobotanPage() {
  const [expertBg, setExpertBg] = useState({
    nama: "", jenisKelamin: "", posisi: "", namaInstansi: "", jenisKeahlian: "",
    pengalaman: "", email: "", tanggal: "",
  });

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    setExpertBg(prev => ({ ...prev, tanggal: today }));
  }, []);

  const [selectedMode, setSelectedMode] = useState<string>("KU_LEVEL");
  const [comparisons, setComparisons] = useState<Record<string, Record<string, number>>>({
    "KU_LEVEL": {},
    "CP_LEVEL": {}
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Generate pairs based on selected mode
  const pairs = useMemo(() => {
    if (selectedMode === "KU_LEVEL") {
      const p = [];
      for (let i = 0; i < KU_KRITERIA_UMUM.length; i++) {
        for (let j = i + 1; j < KU_KRITERIA_UMUM.length; j++) {
          p.push({
            id: `${KU_KRITERIA_UMUM[i].code}_vs_${KU_KRITERIA_UMUM[j].code}`,
            left: { code: KU_KRITERIA_UMUM[i].code, label: KU_KRITERIA_UMUM[i].name },
            right: { code: KU_KRITERIA_UMUM[j].code, label: KU_KRITERIA_UMUM[j].name },
          });
        }
      }
      return p;
    } else if (selectedMode === "CP_LEVEL") {
      const p = [];
      for (let i = 0; i < ALL_CP_QUESTIONNAIRES.length; i++) {
        for (let j = i + 1; j < ALL_CP_QUESTIONNAIRES.length; j++) {
          p.push({
            id: `${ALL_CP_QUESTIONNAIRES[i].cpId}_vs_${ALL_CP_QUESTIONNAIRES[j].cpId}`,
            left: { code: ALL_CP_QUESTIONNAIRES[i].cpId, label: ALL_CP_QUESTIONNAIRES[i].cpName },
            right: { code: ALL_CP_QUESTIONNAIRES[j].cpId, label: ALL_CP_QUESTIONNAIRES[j].cpName },
          });
        }
      }
      return p;
    } else {
      const cp = ALL_CP_QUESTIONNAIRES.find(c => c.cpId === selectedMode);
      if (!cp) return [];
      const subs = cp.subCriteria;
      const p = [];
      for (let i = 0; i < subs.length; i++) {
        for (let j = i + 1; j < subs.length; j++) {
          p.push({
            id: `${subs[i].code}_vs_${subs[j].code}`,
            left: { code: subs[i].code, label: subs[i].name },
            right: { code: subs[j].code, label: subs[j].name },
          });
        }
      }
      return p;
    }
  }, [selectedMode]);

  // Initialize empty comparisons for the current mode if not exist
  useEffect(() => {
    if (!comparisons[selectedMode]) {
      const init: Record<string, number> = {};
      pairs.forEach((p) => {
        init[p.id] = 0;
      });
      setComparisons(prev => ({ ...prev, [selectedMode]: init }));
    }
  }, [selectedMode, pairs, comparisons]);

  const currentComparisons = comparisons[selectedMode] || {};

  const handleSliderChange = (pairId: string, val: number) => {
    setComparisons((prev) => ({
      ...prev,
      [selectedMode]: {
        ...(prev[selectedMode] || {}),
        [pairId]: val
      }
    }));
  };

  const handlePreSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await fetch("/api/dss/questionnaire-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireType: "pembobotan",
          cpId: selectedMode === "CP_LEVEL" || selectedMode === "KU_LEVEL" ? null : selectedMode,
          respondentName: expertBg.nama || "Anonim",
          respondentRole: expertBg.posisi || null,
          respondentOrg: expertBg.namaInstansi || null,
          respondentEmail: expertBg.email || null,
          respondentInfo: expertBg,
          answers: { type: selectedMode, comparisons: currentComparisons },
          notes: { version: "v1" },
          files: [],
        }),
      });
    } catch (e) { console.error(e); }
    setSubmitted(true);
    setSubmitting(false);

    // Auto lanjut ke tab berikutnya
    if (selectedMode === "KU_LEVEL") {
      setTimeout(() => {
        setSelectedMode("CP_LEVEL");
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1200);
    } else if (selectedMode === "CP_LEVEL") {
      setTimeout(() => {
        setSelectedMode(ALL_CP_QUESTIONNAIRES[0].cpId);
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1200);
    } else {
      const currentIndex = ALL_CP_QUESTIONNAIRES.findIndex(cp => cp.cpId === selectedMode);
      if (currentIndex !== -1 && currentIndex < ALL_CP_QUESTIONNAIRES.length - 1) {
        setTimeout(() => {
          setSelectedMode(ALL_CP_QUESTIONNAIRES[currentIndex + 1].cpId);
          setSubmitted(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 1200);
      }
    }
  };

  const answeredCount = Object.values(currentComparisons).filter(v => v !== undefined).length;
  const totalCount = pairs.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
            <Scale className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Kuesioner 1</span>
              {" "}— Pembobotan Model
            </h1>
            <p className="text-sm text-muted-foreground">Pembobotan Model Integrasi Halal Supply Chain — Metode Fuzzy AHP</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 flex gap-4">
          <Info className="h-6 w-6 text-cyan-500 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-cyan-500">Cara Pengisian (Skala Saaty):</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li>Pilih bagian yang ingin dinilai (Kriteria Umum, Antar CP atau Sub-Kriteria per CP).</li>
              <li>Geser slider ke arah kriteria yang Anda anggap lebih penting.</li>
              <li>Angka <strong className="text-foreground">1</strong> berarti Sama Penting.</li>
              <li>Angka <strong className="text-foreground">3, 5, 7, 9</strong> menunjukkan tingkat kepentingan yang semakin tinggi.</li>
            </ul>
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
                ) : f.key === "jenisKelamin" ? (
                  <select
                    value={expertBg.jenisKelamin}
                    onChange={e => setExpertBg(p => ({ ...p, jenisKelamin: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Pilih —</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
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

        {/* Tab / CP Selector */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
          <h2 className="font-bold">Pilih Kategori Pembobotan</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMode("KU_LEVEL")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedMode === "KU_LEVEL"
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/20"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              Kriteria Umum
            </button>
            <button
              onClick={() => setSelectedMode("CP_LEVEL")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedMode === "CP_LEVEL"
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/20"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              Antar CP (Level 1)
            </button>
            {ALL_CP_QUESTIONNAIRES.map((cp) => (
              <button
                key={cp.cpId}
                onClick={() => setSelectedMode(cp.cpId)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedMode === cp.cpId
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/20"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                }`}
              >
                {cp.cpId}
              </button>
            ))}
          </div>
        </div>

        {/* Pairwise Comparison Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="font-bold text-lg">
              {selectedMode === "KU_LEVEL" ? "Perbandingan Kriteria Umum" : selectedMode === "CP_LEVEL" ? "Perbandingan Antar Critical Point (Level 1)" : `Perbandingan Sub-Kriteria ${selectedMode}`}
            </h2>
            <span className="text-sm font-mono text-muted-foreground">
              Terisi: {answeredCount}/{totalCount}
            </span>
          </div>

          <div className="space-y-8 w-full">
            {pairs.map((pair, idx) => {
              const val = currentComparisons[pair.id] || 0;
              const isLeft = val < 0;
              const isRight = val > 0;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={pair.id}
                  className="rounded-2xl border bg-card p-6 shadow-sm space-y-6"
                >
                  {/* Pair labels */}
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-3 md:gap-4 relative text-center md:text-left">
                    <div className={`flex-1 w-full md:w-auto ${isLeft ? "opacity-100" : "opacity-70"}`}>
                      <span className="text-xs font-mono font-bold text-cyan-500 block mb-1">
                        {pair.left.code}
                      </span>
                      <h3 className={`font-semibold ${isLeft ? "text-cyan-500" : ""}`}>
                        {pair.left.label}
                      </h3>
                    </div>

                    <div className="shrink-0 pb-1">
                      <span className="text-xs font-bold text-muted-foreground px-3 py-1 rounded-full bg-muted">
                        VS
                      </span>
                    </div>

                    <div className={`flex-1 w-full md:w-auto text-center md:text-right ${isRight ? "opacity-100" : "opacity-70"}`}>
                      <span className="text-xs font-mono font-bold text-emerald-500 block mb-1">
                        {pair.right.code}
                      </span>
                      <h3 className={`font-semibold ${isRight ? "text-emerald-500" : ""}`}>
                        {pair.right.label}
                      </h3>
                    </div>
                  </div>

                  {/* Custom Slider Track */}
                  <div className="relative pt-6 pb-2 px-2">
                    {/* Tick marks & numbers */}
                    <div className="flex justify-between absolute w-full top-0 left-0 px-2 text-[10px] text-muted-foreground font-mono">
                      <span>9</span><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span>
                      <span className="font-bold text-foreground">1</span>
                      <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                    </div>
                    
                    <div className="relative w-full h-6 flex items-center mt-2">
                      {/* Base Gray Track */}
                      <div className="absolute left-0 right-0 h-2 rounded-full bg-gray-200 dark:bg-gray-800 pointer-events-none" />
                      
                      {/* Active Track Highlight */}
                      <div className="absolute h-2 rounded-full pointer-events-none bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        style={{
                          left: val < 0 ? `calc(${((val + 8) / 16) * 100}% - ${((val + 8) / 16) * 24}px + 12px)` : '50%',
                          right: val > 0 ? `calc(${100 - ((val + 8) / 16) * 100}% - ${(1 - ((val + 8) / 16)) * 24}px + 12px)` : '50%',
                          width: val === 0 ? '0' : 'auto'
                        }}
                      />

                      <input
                        type="range"
                        min="-8"
                        max="8"
                        step="1"
                        value={val}
                        onChange={(e) => handleSliderChange(pair.id, parseInt(e.target.value))}
                        className="w-full absolute appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-2 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-none cursor-pointer z-10"
                      />
                    </div>
                  </div>

                  {/* Selected Value Text */}
                  <div className="text-center text-sm font-medium min-h-[20px] transition-colors">
                    {val < 0 && (
                      <span className="text-cyan-500 flex items-center justify-center gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        {getSaatyText(val, pair.left.label, pair.right.label)}
                      </span>
                    )}
                    {val > 0 && (
                      <span className="text-emerald-500 flex items-center justify-center gap-1">
                        {getSaatyText(val, pair.left.label, pair.right.label)}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                    {val === 0 && (
                      <span className="text-muted-foreground">
                        {getSaatyText(val, pair.left.label, pair.right.label)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {pairs.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                Kategori ini tidak memiliki kriteria untuk dibandingkan.
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 w-full">
          {submitted && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Data pembobotan berhasil disimpan
            </motion.div>
          )}
          <button onClick={handlePreSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : <Send className="h-4 w-4" />}
            Simpan Pembobotan {selectedMode === "KU_LEVEL" ? "Kriteria Umum" : selectedMode === "CP_LEVEL" ? "Antar CP" : selectedMode}
          </button>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-cyan-500/10 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Scale className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Simpan & Lanjutkan?</h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin semua nilai pembobotan untuk <strong className="text-foreground">{selectedMode === "KU_LEVEL" ? "Kriteria Umum" : selectedMode === "CP_LEVEL" ? "Antar CP" : selectedMode}</strong> sudah sesuai?
                </p>
                <p className="text-xs text-amber-500 font-medium">Setelah disimpan, Anda akan otomatis diarahkan ke tab berikutnya.</p>
              </div>
              <div className="flex border-t bg-muted/30">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border-r"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmSubmit}
                  className="flex-1 py-4 text-sm font-bold text-cyan-500 hover:bg-cyan-500/10 transition-colors"
                >
                  Ya, Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

