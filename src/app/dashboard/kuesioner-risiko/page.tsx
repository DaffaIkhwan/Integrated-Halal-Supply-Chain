"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, RISK_SCALE_LIKERT } from "@/lib/data/questionnaire-index";
import type { CPQuestionnaire, SubCriteria } from "@/lib/data/questionnaire-index";
import {
  Shield, ChevronDown, ChevronUp, Send, ClipboardCheck,
  AlertTriangle, CheckCircle2, Info
} from "lucide-react";

type Answers = Record<string, Record<string, number>>; // { "CP1.1_1": riskValue, ... }
type AuditorNotes = Record<string, string>;

function RiskBadge({ value }: { value: number }) {
  const scale = RISK_SCALE_LIKERT.find(s => s.value === value);
  if (!scale) return null;
  const colors: Record<number, string> = {
    1: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    2: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    3: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    4: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    5: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${colors[value]}`}>
      {scale.label}
    </span>
  );
}

function SubCriteriaSection({
  cp, sub, answers, notes, onAnswer, onNote
}: {
  cp: CPQuestionnaire; sub: SubCriteria;
  answers: Answers; notes: AuditorNotes;
  onAnswer: (key: string, val: number) => void;
  onNote: (key: string, val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const answered = sub.indicators.filter(ind => answers[`${sub.code}_${ind.no}`]).length;
  const total = sub.indicators.length;
  const allAnswered = answered === total;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
        <span className="shrink-0 w-16 text-xs font-mono font-bold text-primary">{sub.code}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{sub.name}</p>
          <p className="text-[11px] text-muted-foreground italic">{sub.nameEn}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${allAnswered ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
            {answered}/{total}
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2">
                <span className="w-6">No</span>
                <span>Pernyataan</span>
                <span className="w-40 text-center">Bukti Pendukung</span>
                <span className="w-[220px] text-center">Tingkat Risiko (1-5)</span>
              </div>

              {sub.indicators.map(ind => {
                const key = `${sub.code}_${ind.no}`;
                const val = answers[key] as number | undefined;
                return (
                  <div key={key} className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto] gap-3 md:gap-2 items-start px-3 py-4 md:px-2 md:py-2 rounded-xl md:rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/40 md:border-transparent">
                    {/* Number & Statement (Mobile groups these) */}
                    <div className="flex gap-2 w-full md:contents items-start">
                      <span className="shrink-0 w-6 text-xs font-mono font-bold text-muted-foreground pt-0.5">{ind.no}</span>
                      <div className="flex-1">
                        <p className="text-sm leading-snug">{ind.statement}</p>
                      </div>
                    </div>

                    {/* Evidence */}
                    <div className="w-full md:w-40 text-left md:text-center mt-1 md:mt-0 pl-8 md:pl-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground block mb-0.5">Bukti Pendukung:</span>
                      <span className="text-[11px] text-muted-foreground italic">{ind.evidence}</span>
                    </div>

                    {/* Risk Rating */}
                    <div className="w-full md:w-[220px] flex flex-col md:flex-row items-center gap-2 md:gap-1 justify-center mt-3 md:mt-0 pt-3 md:pt-0 border-t border-border/50 md:border-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground mb-1">Tingkat Risiko (1-5)</span>
                      <div className="flex items-center justify-center gap-1 w-full md:w-auto">
                        {RISK_SCALE_LIKERT.map(scale => (
                          <button
                            key={scale.value}
                            onClick={() => onAnswer(key, scale.value)}
                            className={`flex-1 md:flex-none md:w-9 h-10 md:h-9 rounded-lg text-sm md:text-xs font-bold transition-all ${
                              val === scale.value
                                ? scale.value <= 2 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                  : scale.value === 3 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                                  : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                            title={scale.label}
                          >
                            {scale.value}
                          </button>
                        ))}
                      </div>
                      <div className="h-5 md:hidden">
                        {val && <RiskBadge value={val} />}
                      </div>
                      <div className="hidden md:block">
                        {val && <RiskBadge value={val} />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Auditor Notes */}
              <div className="mt-3 pt-3 border-t border-border/30">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Catatan Auditor — {sub.code}
                </label>
                <textarea
                  value={notes[sub.code] || ""}
                  onChange={e => onNote(sub.code, e.target.value)}
                  placeholder="Tulis catatan auditor untuk sub-kriteria ini..."
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KuesionerRisikoPage() {
  const [selectedCPIndex, setSelectedCPIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [notes, setNotes] = useState<AuditorNotes>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Auditor background
  const [auditorBg, setAuditorBg] = useState({
    tanggalAudit: "", nama: "", jenisKelamin: "", posisi: "", namaInstansi: "", noSertifikat: "",
  });

  const cp = ALL_CP_QUESTIONNAIRES[selectedCPIndex];

  const handleAnswer = (key: string, value: number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNote = (key: string, value: string) => {
    setNotes(prev => ({ ...prev, [key]: value }));
  };

  const totalQuestions = cp.subCriteria.reduce((acc, sub) => acc + sub.indicators.length, 0);
  const answeredQuestions = cp.subCriteria.reduce((acc, sub) =>
    acc + sub.indicators.filter(ind => answers[`${sub.code}_${ind.no}`]).length, 0);

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
          questionnaireType: "risiko",
          cpId: cp.cpId,
          respondentName: auditorBg.nama || "Anonim",
          respondentRole: auditorBg.posisi || null,
          respondentOrg: auditorBg.namaInstansi || null,
          respondentEmail: null,
          respondentInfo: auditorBg,
          answers,
          notes,
          files: [],
        }),
      });
    } catch (e) { console.error(e); }
    setSubmitted(true);
    setSubmitting(false);

    // Auto next CP
    if (selectedCPIndex < ALL_CP_QUESTIONNAIRES.length - 1) {
      setTimeout(() => {
        setSelectedCPIndex(selectedCPIndex + 1);
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
              <ClipboardCheck className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Kuesioner 2
                </span>{" "}— Pengukuran Tingkat Risiko
              </h1>
              <p className="text-sm text-muted-foreground">
                Pengukuran Tingkat Risiko Kepatuhan Halal Integrated Supply Chain pada Daging Sapi
              </p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Petunjuk Pengisian</p>
            <p>Kuesioner ini diisi oleh <strong>Auditor / Tim Penilai</strong>. Berikan penilaian tingkat risiko (1-5) berdasarkan ketersediaan bukti pendukung dari masing-masing indikator.</p>
          </div>
        </div>

        {/* Risk Scale Reference */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skala Tingkat Risiko Kepatuhan Halal</p>
          <div className="grid grid-cols-5 gap-2">
            {RISK_SCALE_LIKERT.map(s => (
              <div key={s.value} className={`rounded-lg p-3 text-center border ${
                s.value === 1 ? "border-emerald-500/30 bg-emerald-500/5" :
                s.value === 2 ? "border-sky-500/30 bg-sky-500/5" :
                s.value === 3 ? "border-amber-500/30 bg-amber-500/5" :
                s.value === 4 ? "border-orange-500/30 bg-orange-500/5" :
                "border-red-500/30 bg-red-500/5"
              }`}>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs font-semibold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.interpretation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auditor Background */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-bold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Latar Belakang Responden (Auditor)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "tanggalAudit", label: "Tanggal Audit", type: "date" },
              { key: "nama", label: "Nama", type: "text" },
              { key: "jenisKelamin", label: "Jenis Kelamin", type: "text" },
              { key: "posisi", label: "Posisi", type: "text" },
              { key: "namaInstansi", label: "Nama Instansi", type: "text" },
              { key: "noSertifikat", label: "No Sertifikat Auditor (Jika Ada)", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                {f.key === "jenisKelamin" ? (
                  <select
                    value={auditorBg.jenisKelamin}
                    onChange={e => setAuditorBg(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Pilih —</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={auditorBg[f.key as keyof typeof auditorBg]}
                    onChange={e => setAuditorBg(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CP Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {ALL_CP_QUESTIONNAIRES.map((cpItem, idx) => {
            const cpAnswered = cpItem.subCriteria.reduce((acc, sub) =>
              acc + sub.indicators.filter(ind => answers[`${sub.code}_${ind.no}`]).length, 0);
            const cpTotal = cpItem.subCriteria.reduce((acc, sub) => acc + sub.indicators.length, 0);
            const isComplete = cpAnswered === cpTotal && cpTotal > 0;
            return (
              <button
                key={cpItem.cpId}
                onClick={() => setSelectedCPIndex(idx)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  selectedCPIndex === idx
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : isComplete
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="font-mono font-bold">{cpItem.cpId}</span>
                {isComplete && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1.5" />}
              </button>
            );
          })}
        </div>

        {/* CP Content */}
        <div className="rounded-2xl border bg-card p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">{cp.cpId}. {cp.cpName}</h2>
              <p className="text-sm text-muted-foreground italic">{cp.cpNameEn}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono">{answeredQuestions}/{totalQuestions}</p>
              <p className="text-[10px] text-muted-foreground">Terisi</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-6">
            <motion.div
              animate={{ width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Sub-criteria */}
          <div className="space-y-3">
            {cp.subCriteria.map(sub => (
              <SubCriteriaSection
                key={sub.code} cp={cp} sub={sub}
                answers={answers} notes={notes}
                onAnswer={handleAnswer} onNote={handleNote}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          {submitted && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Data berhasil disimpan
            </motion.div>
          )}
          <button
            onClick={handlePreSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Simpan Penilaian Risiko
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
                  <ClipboardCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Simpan & Lanjutkan?</h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin semua nilai tingkat risiko untuk <strong className="text-foreground">{cp.cpId}</strong> sudah sesuai?
                </p>
                <p className="text-xs text-amber-500 font-medium">Setelah disimpan, Anda akan otomatis diarahkan ke CP berikutnya.</p>
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
