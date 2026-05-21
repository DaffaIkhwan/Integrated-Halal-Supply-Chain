"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, KU_KRITERIA_UMUM } from "@/lib/data/questionnaire-index";
import { Info, Send, CheckCircle2, ListOrdered } from "lucide-react";

export default function KuesionerPembobotanV2Page() {
  const [expertBg, setExpertBg] = useState({
    tanggal: "", nama: "", jenisKelamin: "", posisi: "", namaInstansi: "", lamaBekerja: "",
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
  
  // State for rankings and weights
  // Structure: Record<mode, Record<itemId, number>>
  const [ranks, setRanks] = useState<Record<string, Record<string, number>>>({});
  const [bobots, setBobots] = useState<Record<string, Record<string, number>>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Generate items based on selected mode
  const currentItems = useMemo(() => {
    if (selectedMode === "KU_LEVEL") {
      return KU_KRITERIA_UMUM.map(ku => ({ id: ku.code, label: ku.name }));
    } else if (selectedMode === "CP_LEVEL") {
      return ALL_CP_QUESTIONNAIRES.map(cp => ({ id: cp.cpId, label: cp.cpName }));
    } else {
      const cp = ALL_CP_QUESTIONNAIRES.find(c => c.cpId === selectedMode);
      if (!cp) return [];
      return cp.subCriteria.map(sub => ({ id: sub.code, label: sub.name }));
    }
  }, [selectedMode]);

  const modeRanks = ranks[selectedMode] || {};
  const modeBobots = bobots[selectedMode] || {};

  const handleRankChange = (itemId: string, rankStr: string) => {
    setRanks((prev) => {
      const currentModeRanks = { ...(prev[selectedMode] || {}) };
      if (rankStr === "") {
        delete currentModeRanks[itemId];
      } else {
        currentModeRanks[itemId] = Number(rankStr);
      }
      return { ...prev, [selectedMode]: currentModeRanks };
    });
  };

  const handleBobotChange = (itemId: string, bobotStr: string) => {
    setBobots((prev) => {
      const currentModeBobots = { ...(prev[selectedMode] || {}) };
      if (bobotStr === "") {
        delete currentModeBobots[itemId];
      } else {
        currentModeBobots[itemId] = Number(bobotStr);
      }
      return { ...prev, [selectedMode]: currentModeBobots };
    });
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
          questionnaireType: "pembobotan-v2",
          cpId: selectedMode === "CP_LEVEL" || selectedMode === "KU_LEVEL" ? null : selectedMode,
          respondentName: expertBg.nama || "Anonim",
          respondentRole: expertBg.posisi || null,
          respondentOrg: expertBg.namaInstansi || null,
          respondentInfo: expertBg,
          answers: { type: selectedMode, rankings: modeRanks, bobots: modeBobots },
          notes: { version: "v2" },
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

  const answeredRanks = Object.keys(modeRanks).length;
  const answeredBobots = Object.keys(modeBobots).length;
  const totalCount = currentItems.length;
  const isComplete = answeredRanks === totalCount && answeredBobots === totalCount;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
            <ListOrdered className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Kuesioner 1 (V2)</span>
              {" "}— Pembobotan Model
            </h1>
            <p className="text-sm text-muted-foreground">Perangkingan & Pemberian Bobot Variabel Integrasi Halal Supply Chain</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 flex gap-4">
          <Info className="h-6 w-6 text-cyan-500 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-cyan-500">Cara Pengisian:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li>Pilih bagian yang ingin dinilai (Kriteria Umum, Antar CP atau Sub-Kriteria per CP).</li>
              <li>Pada kolom <strong>Urutan Skala Kepentingan</strong>, pilih ranking (1 adalah yang paling penting). Pilihan tidak boleh ada yang sama.</li>
              <li>Pada kolom <strong>Nilai Bobot Kepentingan</strong>, pilih bobot dari 1-9 untuk masing-masing variabel.</li>
            </ul>
          </div>
        </div>

        {/* Expert Background */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-bold mb-4">Latar Belakang Responden dan Perusahaan</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "tanggal", label: "Tanggal Pengisian", type: "date" },
              { key: "nama", label: "Nama Lengkap", type: "text" },
              { key: "jenisKelamin", label: "Jenis Kelamin", type: "select" },
              { key: "posisi", label: "Posisi", type: "text" },
              { key: "namaInstansi", label: "Nama Instansi/Perusahaan", type: "text" },
              { key: "lamaBekerja", label: "Lama Bekerja", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                {f.key === "jenisKelamin" ? (
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

        {/* Ranking & Weight Cards Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="font-bold text-lg">
              {selectedMode === "KU_LEVEL" ? "Perangkingan Kriteria Umum" : selectedMode === "CP_LEVEL" ? "Perangkingan Antar Critical Point (Level 1)" : `Perangkingan Sub-Kriteria ${selectedMode}`}
            </h2>
            <div className="flex flex-col items-end">
              <span className="text-sm font-mono text-muted-foreground">
                Rank Terisi: {answeredRanks}/{totalCount}
              </span>
              <span className="text-sm font-mono text-muted-foreground">
                Bobot Terisi: {answeredBobots}/{totalCount}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {currentItems.map((item, idx) => {
              const selectedRank = modeRanks[item.id];
              const selectedBobot = modeBobots[item.id];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-2xl border bg-card p-5 shadow-sm space-y-4"
                >
                  {/* Variable header */}
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg shrink-0">{idx + 1}</span>
                    <div>
                      <span className="text-xs text-emerald-500 font-bold">{item.id}</span>
                      <p className="font-semibold text-sm mt-0.5">{item.label}</p>
                    </div>
                  </div>

                  {/* Ranking buttons */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Urutan Skala Kepentingan (1-{totalCount})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalCount }).map((_, i) => {
                        const r = i + 1;
                        const isSelected = selectedRank === r;
                        const isUsedByOther = Object.entries(modeRanks).some(
                          ([key, val]) => val === r && key !== item.id
                        );
                        return (
                          <button
                            key={r}
                            onClick={() => handleRankChange(item.id, isSelected ? "" : String(r))}
                            disabled={isUsedByOther}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                              isSelected
                                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105 ring-2 ring-cyan-400/50"
                                : isUsedByOther
                                  ? "bg-muted/30 text-muted-foreground/30 cursor-not-allowed opacity-40 line-through"
                                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bobot buttons */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Nilai Bobot Kepentingan (1-9)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 9 }).map((_, i) => {
                        const b = i + 1;
                        const isSelected = selectedBobot === b;
                        return (
                          <button
                            key={b}
                            onClick={() => handleBobotChange(item.id, isSelected ? "" : String(b))}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                              isSelected
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400/50"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                            }`}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {currentItems.length === 0 && (
              <div className="text-center p-8 text-muted-foreground rounded-2xl border border-dashed">
                Kategori ini tidak memiliki variabel.
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 w-full">
          {submitted && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Data berhasil disimpan
            </motion.div>
          )}
          <button 
            onClick={handlePreSubmit} 
            disabled={submitting || !isComplete} 
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : <Send className="h-4 w-4" />}
            Simpan & Lanjutkan
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
                  <ListOrdered className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Simpan & Lanjutkan?</h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin semua nilai perangkingan dan bobot untuk <strong className="text-foreground">{selectedMode === "KU_LEVEL" ? "Kriteria Umum" : selectedMode === "CP_LEVEL" ? "Antar CP" : selectedMode}</strong> sudah sesuai?
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
