"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  ChevronLeft,
  RotateCcw
} from "lucide-react";
import { CP_OPTIONS_MAP } from "@/lib/data";

const ALL_CPS = ["CP1", "CP2", "CP3", "CP4", "CP5", "CP6", "CP7", "CP8", "CP9", "CP10"];

const ROLE_TO_CP: Record<string, string[]> = {
  ADMIN: ALL_CPS,
  CP1_FARM: ["CP1"],
  CP2_FEED: ["CP2"],
  CP3_TRANSPORT: ["CP3"],
  CP4_SLAUGHTER: ["CP4"],
  CP5_POST_SLAUGHTER: ["CP5"],
  CP6_PROCESSING: ["CP6"],
  CP7_STORAGE: ["CP7"],
  CP8_DISTRIBUTION: ["CP8"],
  CP9_RETAIL: ["CP9"],
  CP10_CONSUMER: ["CP10"],
};

// ─── Saaty Scale Helper ───
// Nilai slider dari -8 (Kiri mutlak) ke +8 (Kanan mutlak). 0 = Sama Penting (1).
const SAATY_LABELS: Record<number, string> = {
  9: "Mutlak Lebih Penting",
  7: "Sangat Lebih Penting",
  5: "Lebih Penting",
  3: "Sedikit Lebih Penting",
  1: "Sama Penting",
};

function getSaatyText(val: number, leftLabel: string, rightLabel: string) {
  if (val === 0) return "Kedua kriteria sama penting (1)";
  const abs = Math.abs(val) + 1; // map 1..8 to 2..9
  const side = val < 0 ? leftLabel : rightLabel;
  const desc = SAATY_LABELS[abs] || "Nilai Antara";
  return `${side} ${desc} (${abs})`;
}

export default function WeightingPage() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role || "ADMIN";

  const allowedCPs = useMemo(() => {
    return ROLE_TO_CP[userRole] || ALL_CPS;
  }, [userRole]);

  const [selectedCp, setSelectedCp] = useState<string>(allowedCPs[0] || "CP1");
  const [comparisons, setComparisons] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Auto select first allowed CP if selectedCp is not in allowedCPs
  useEffect(() => {
    if (allowedCPs.length > 0 && !allowedCPs.includes(selectedCp)) {
      setSelectedCp(allowedCPs[0]);
    }
  }, [allowedCPs, selectedCp]);

  // Generate pairs for the selected CP
  const pairs = useMemo(() => {
    const cpData = CP_OPTIONS_MAP[selectedCp];
    if (!cpData) return [];
    const crits = cpData.criteria;
    const p = [];
    for (let i = 0; i < crits.length; i++) {
      for (let j = i + 1; j < crits.length; j++) {
        p.push({
          id: `${crits[i].criteriaCode}_vs_${crits[j].criteriaCode}`,
          left: crits[i],
          right: crits[j],
        });
      }
    }
    return p;
  }, [selectedCp]);

  // Init empty state when pairs change
  useEffect(() => {
    const init: Record<string, number> = {};
    pairs.forEach((p) => {
      init[p.id] = 0; // Default to 0 (Equal / 1)
    });
    setComparisons(init);
    setSuccess(false);
  }, [pairs]);

  const handleSliderChange = (pairId: string, val: number) => {
    setComparisons((prev) => ({ ...prev, [pairId]: val }));
  };

  const handleReset = () => {
    const init: Record<string, number> = {};
    pairs.forEach((p) => {
      init[p.id] = 0;
    });
    setComparisons(init);
    setSuccess(false);
  };

  const handlePreSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setSuccess(false);
    
    // Simulate API call delay for saving pairwise matrix
    await new Promise((r) => setTimeout(r, 1500));
    
    setSubmitting(false);
    setSuccess(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check progress
  const answeredCount = Object.values(comparisons).filter((v) => v !== 0).length;
  const totalCount = pairs.length;
  const isComplete = totalCount > 0 && answeredCount === totalCount; // just a visual guide, usually they can submit 0

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Scale className="h-8 w-8 text-cyan-500" />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Pembobotan Kriteria
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tentukan tingkat kepentingan antar kriteria menggunakan skala Saaty (1-9).
            Hasil ini akan dikonversi menjadi matriks Triangular Fuzzy Number (TFN) untuk DSS.
          </p>
        </div>

        {/* CP Selector (Only show if multiple CPs allowed) */}
        {allowedCPs.length > 1 && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
            <h2 className="font-bold">Pilih Critical Point (CP)</h2>
            <div className="flex flex-wrap gap-2">
              {allowedCPs.map((cp) => (
                <button
                  key={cp}
                  onClick={() => setSelectedCp(cp)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCp === cp
                      ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/20"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {CP_OPTIONS_MAP[cp]?.cpLabel.split("—")[0].trim() || cp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-5 flex gap-4">
          <Info className="h-6 w-6 text-blue-500 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-blue-500">Cara Pengisian (Skala Saaty):</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li>Geser slider ke arah kriteria yang Anda anggap lebih penting.</li>
              <li>Angka <strong className="text-foreground">1</strong> berarti Sama Penting.</li>
              <li>Angka <strong className="text-foreground">3, 5, 7, 9</strong> menunjukkan tingkat kepentingan yang semakin tinggi.</li>
              <li>Angka genap (2,4,6,8) digunakan jika ragu di antara dua nilai ganjil.</li>
            </ul>
          </div>
        </div>

        {/* Pairwise Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="font-bold text-lg">
              {CP_OPTIONS_MAP[selectedCp]?.cpLabel}
            </h2>
            <span className="text-sm font-mono text-muted-foreground">
              {pairs.length} Pertanyaan
            </span>
          </div>

          <div className="space-y-8">
            {pairs.map((pair, idx) => {
              const val = comparisons[pair.id] || 0;
              const absVal = Math.abs(val) + 1;
              const isLeft = val < 0;
              const isRight = val > 0;
              const isCenter = val === 0;

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
                        {pair.left.criteriaCode}
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
                        {pair.right.criteriaCode}
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
                    
                    <input
                      type="range"
                      min="-8"
                      max="8"
                      step="1"
                      value={val}
                      onChange={(e) => handleSliderChange(pair.id, parseInt(e.target.value))}
                      className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-300 dark:[&::-webkit-slider-runnable-track]:bg-gray-700 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-gray-300 dark:[&::-moz-range-track]:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-2 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-none cursor-pointer relative z-10"
                    />

                    {/* Active Track Highlight */}
                    <div className="absolute top-6 h-2 rounded-full pointer-events-none -z-0 opacity-50
                      bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-200"
                      style={{
                        left: val < 0 ? `${(8 + val) * (100 / 16)}%` : '50%',
                        right: val > 0 ? `${100 - ((8 + val) * (100 / 16))}%` : '50%',
                        width: val === 0 ? '0' : `${(Math.abs(val) / 16) * 100}%`
                      }}
                    />
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
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/20 text-center"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                Bobot berhasil disimpan!
              </p>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                Nilai matriks TFN Fuzzy AHP telah diperbarui.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" /> Reset Semua
          </button>
          <button
            onClick={handlePreSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitting ? "Menyimpan Bobot..." : "Simpan Bobot Saaty (AHP)"}
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
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <Scale className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Simpan Bobot Saaty?</h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin semua nilai perbandingan untuk <strong className="text-foreground">{selectedCp}</strong> sudah sesuai?
                </p>
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
                  className="flex-1 py-4 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
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
