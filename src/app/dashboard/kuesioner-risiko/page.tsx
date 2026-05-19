"use client";

import { toast } from "sonner";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, RISK_SCALE_LIKERT } from "@/lib/data/questionnaire-index";
import { SCALE_DESCRIPTIONS } from "@/lib/data/scale-descriptions";
import type { CPQuestionnaire, SubCriteria, BackgroundField } from "@/lib/data/questionnaire-index";
import {
  Shield, ChevronDown, ChevronUp, Send, ClipboardCheck,
  AlertTriangle, CheckCircle2, Info, FileText, Download
} from "lucide-react";

type Answers = Record<string, number>; // { "CP1.1_1": riskValue, ... }
type AuditorNotes = Record<string, string>;
type UploadedFiles = Record<string, File | null>;
type EvidenceCheck = Record<string, "sesuai" | "tidak_sesuai">;

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

function DocumentViewButton({ fileKey, filesMap }: { fileKey: string; filesMap: Record<string, { url: string; filename: string }> }) {
  const file = filesMap[fileKey];
  if (!file) {
    return <span className="text-[10px] text-muted-foreground italic bg-muted px-2 py-1 rounded-md">Tidak ada dokumen</span>;
  }
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-400 hover:bg-cyan-500/20 max-w-[110px] transition-colors" title={file.filename}>
      <FileText className="h-3 w-3 shrink-0" />
      <span className="truncate">{file.filename}</span>
    </a>
  );
}

function SubCriteriaSection({
  cp, sub, answers, notes, aktualFilesMap, evidenceCheck, onAnswer, onNote, onEvidenceCheck
}: {
  cp: CPQuestionnaire; sub: SubCriteria;
  answers: Answers; notes: AuditorNotes; aktualFilesMap: Record<string, { url: string; filename: string }>; evidenceCheck: EvidenceCheck;
  onAnswer: (key: string, val: number) => void;
  onNote: (key: string, val: string) => void;
  onEvidenceCheck: (key: string, val: "sesuai" | "tidak_sesuai") => void;
}) {
  const [open, setOpen] = useState(false);
  const answered = sub.indicators.filter(ind => answers[`${sub.code}_${ind.no}`]).length;
  const total = sub.indicators.length;
  const allAnswered = answered === total;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <div onClick={() => setOpen(!open)} role="button" tabIndex={0} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
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
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[auto_1fr_120px_140px_110px_270px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2">
                <span className="w-6">No</span>
                <span>Pernyataan</span>
                <span className="text-center">Bukti Pendukung</span>
                <span className="text-center">Dokumen Aktual</span>
                <span className="text-center">Kesesuaian</span>
                <span className="w-[280px] text-center">Tingkat Ketersediaan / Risiko</span>
              </div>

              {sub.indicators.map(ind => {
                const key = `${sub.code}_${ind.no}`;
                const val = answers[key] as number | undefined;
                const evCheck = evidenceCheck[key];
                return (
                  <div key={key} className="flex flex-col md:grid md:grid-cols-[auto_1fr_120px_140px_110px_270px] gap-3 md:gap-2 items-start md:items-center px-3 py-4 md:px-2 md:py-2 rounded-xl md:rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/40 md:border-transparent">
                    {/* Number & Statement */}
                    <div className="flex gap-2 w-full md:contents items-start">
                      <span className="shrink-0 w-6 text-xs font-mono font-bold text-muted-foreground pt-0.5">{ind.no}</span>
                      <div className="flex-1">
                        <p className="text-sm leading-snug">{ind.statement}</p>
                      </div>
                    </div>

                    {/* Evidence */}
                    <div className="w-full md:w-auto text-left md:text-center mt-1 md:mt-0 pl-8 md:pl-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground block mb-0.5">Bukti Pendukung:</span>
                      <span className="text-[11px] text-muted-foreground italic">{ind.evidence}</span>
                    </div>

                    {/* Dokumen Aktual */}
                    <div className="w-full flex flex-col items-end md:items-center justify-center mt-2 md:mt-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground">Dokumen</span>
                      <DocumentViewButton fileKey={key} filesMap={aktualFilesMap} />
                    </div>

                    {/* Kesesuaian (Sesuai / Tidak Sesuai) */}
                    <div className="w-full flex flex-col md:items-center gap-1 mt-2 md:mt-0 pl-8 md:pl-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground">Kesesuaian</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onEvidenceCheck(key, "sesuai")}
                          className={`px-2.5 py-1.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-[10px] font-semibold transition-all ${
                            evCheck === "sesuai" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          Sesuai
                        </button>
                        <button
                          onClick={() => onEvidenceCheck(key, "tidak_sesuai")}
                          className={`px-2.5 py-1.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-[10px] font-semibold transition-all ${
                            evCheck === "tidak_sesuai" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>

                    {/* Tingkat Ketersediaan / Risiko */}
                    <div className="w-full md:w-[270px] flex flex-col items-center gap-2 justify-center mt-3 md:mt-0 pt-3 md:pt-0 border-t border-border/50 md:border-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground mb-1">Tingkat Ketersediaan / Risiko</span>
                      <div className="flex items-start justify-center gap-1 w-full md:w-auto">
                        {RISK_SCALE_LIKERT.map(scale => (
                          <button
                            key={scale.value}
                            onClick={() => {
                              onAnswer(key, scale.value);
                              const desc = SCALE_DESCRIPTIONS[sub.code]?.[scale.value - 1];
                              if (desc) {
                                const colorMap: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
                                  1: { bg: "bg-emerald-950/90", border: "border-emerald-500/40", badge: "bg-emerald-500", icon: "🟢" },
                                  2: { bg: "bg-sky-950/90", border: "border-sky-500/40", badge: "bg-sky-500", icon: "🔵" },
                                  3: { bg: "bg-amber-950/90", border: "border-amber-500/40", badge: "bg-amber-500", icon: "🟡" },
                                  4: { bg: "bg-orange-950/90", border: "border-orange-500/40", badge: "bg-orange-500", icon: "🟠" },
                                  5: { bg: "bg-red-950/90", border: "border-red-500/40", badge: "bg-red-500", icon: "🔴" },
                                };
                                const c = colorMap[scale.value] || colorMap[3];
                                toast.custom((t) => (
                                  <div className={`${c.bg} ${c.border} border rounded-xl p-4 shadow-2xl backdrop-blur-sm max-w-md w-full animate-in slide-in-from-top-2 duration-300`}>
                                    <div className="flex items-start gap-3">
                                      <span className="text-xl mt-0.5">{c.icon}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-xs font-mono font-bold text-white/90">{sub.code}</span>
                                          <span className={`${c.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>Skala {scale.value} — {scale.label}</span>
                                        </div>
                                        <p className="text-[12px] leading-relaxed text-white/80">{desc}</p>
                                      </div>
                                      <button onClick={() => toast.dismiss(t)} className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none shrink-0">✕</button>
                                    </div>
                                  </div>
                                ), { duration: 5000, position: "top-center" });
                              }
                            }}
                            className={`flex-1 md:flex-none md:w-[52px] flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              val === scale.value
                                ? scale.value <= 2 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                  : scale.value === 3 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                                  : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                            title={`${scale.value} - ${scale.label}:\n${SCALE_DESCRIPTIONS[sub.code]?.[scale.value - 1] || scale.interpretation}`}
                          >
                            <span className="text-sm md:text-xs">{scale.value}</span>
                            <span className="text-[8px] font-medium leading-tight opacity-80">{scale.label.split(' ').pop()}</span>
                          </button>
                        ))}
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
                  suppressHydrationWarning
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BgFieldInput({ field, value, onChange }: { field: BackgroundField; value: string; onChange: (v: string) => void }) {
  if (field.type === "select") {
    return (
      <select suppressHydrationWarning value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
        <option value="">— Pilih —</option>
        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input
      type={field.type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      placeholder={field.label}
      suppressHydrationWarning
    />
  );
}

export default function KuesionerRisikoPage() {
  const { data: session } = useSession();

  const availableCPs = useMemo(() => {
    const role = session?.user?.role;
    if (!role || role === "ADMIN" || role.toUpperCase().startsWith("PAKAR")) {
      return ALL_CP_QUESTIONNAIRES;
    }
    const rolePrefix = role.split("_")[0];
    return ALL_CP_QUESTIONNAIRES.filter((cp) => cp.cpId === rolePrefix);
  }, [session?.user?.role]);

  const [selectedCPIndex, setSelectedCPIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [notes, setNotes] = useState<AuditorNotes>({});
  const [evidenceCheck, setEvidenceCheck] = useState<EvidenceCheck>({});
  const [bgData, setBgData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Data Aktual
  const [aktualBatches, setAktualBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [aktualFilesMap, setAktualFilesMap] = useState<Record<string, { url: string; filename: string }>>({});

  // Auditor background
  const [auditorBg, setAuditorBg] = useState({
    tanggalAudit: "", nama: "", jenisKelamin: "", posisi: "", namaInstansi: "", noSertifikat: "",
  });

  const cp = availableCPs[selectedCPIndex] || availableCPs[0];
  const selectedBatch = useMemo(() => aktualBatches.find(b => b.id === selectedBatchId), [aktualBatches, selectedBatchId]);


  useEffect(() => {
    if (!cp) return;
    setAktualBatches([]);
    setSelectedBatchId("");
    setAktualFilesMap({});
    fetch(`/api/dss/questionnaire-responses?type=aktual&cpId=${cp.cpId}&limit=100`)
      .then(res => res.json())
      .then(data => {
        if (data.responses) {
          setAktualBatches(data.responses);
        }
      })
      .catch(console.error);
  }, [cp?.cpId]);

  useEffect(() => {
    if (selectedBatchId) {
      const batch = aktualBatches.find(b => b.id === selectedBatchId);
      if (batch && batch.files) {
        const map: Record<string, { url: string; filename: string }> = {};
        batch.files.forEach((f: any) => {
          if (f.key) map[f.key] = { url: f.url, filename: f.filename };
        });
        setAktualFilesMap(map);
      } else {
        setAktualFilesMap({});
      }
    } else {
      setAktualFilesMap({});
    }
  }, [selectedBatchId, aktualBatches]);

  // Prevent crash if role doesn't have any mapped CPs
  if (!cp) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 flex flex-col items-center justify-center">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h2 className="font-bold">Akses Ditolak</h2>
              <p className="text-sm">Role Anda ({session?.user?.role}) tidak memiliki akses ke kuesioner risiko untuk titik kritis mana pun.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleAnswer = useCallback((key: string, value: number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNote = useCallback((key: string, value: string) => {
    setNotes(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEvidenceCheck = useCallback((k: string, v: "sesuai" | "tidak_sesuai") => {
    setEvidenceCheck(p => ({ ...p, [k]: v }));
  }, []);

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
          respondentInfo: { ...auditorBg },
          answers: { riskRatings: answers, evidenceCheck },
          notes: { ...notes, aktualResponseId: selectedBatchByCP[cp.cpId] || "" },
          files: [],
        }),
      });
    } catch (e) { console.error(e); }
    setSubmitted(true);
    setSubmitting(false);

    // Auto next CP
    if (selectedCPIndex < availableCPs.length - 1) {
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

        {/* Info banner & Download */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Petunjuk Pengisian</p>
              <p>Kuesioner ini diisi oleh <strong>Auditor / Tim Penilai</strong>. Berikan penilaian tingkat risiko (1-5) berdasarkan ketersediaan bukti pendukung dari masing-masing indikator.</p>
            </div>
          </div>
          <a
            href="/docs/RUBRIK_PENGUKURAN_TINGKAT_RESIKO_HALAL.pdf"
            download="Rubrik_Risiko_Halal.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <Download className="h-4 w-4" />
            Download Rubrik
          </a>
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

        {/* CP Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {availableCPs.map((cpItem, idx) => {
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

        {/* Batch Selector */}
        <div className="rounded-xl border bg-card p-5 border-cyan-500/30">
          <p className="text-sm font-bold mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-cyan-400" /> Pilih Batch / Kode Ternak (Data Kondisi Aktual K3) yang Akan Dinilai
          </p>
          <select 
            value={selectedBatchId} 
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full max-w-lg rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            suppressHydrationWarning
          >
            <option value="">— Pilih Batch / Kode Ternak —</option>
            {aktualBatches.map(b => {
              const batchCode = b.respondentInfo?.[`${cp.cpId}_batch`] || b.respondentInfo?.[`${cp.cpId}_kodeTernak`] || "";
              const labelPrefix = batchCode ? `[${batchCode}] ` : "";
              return (
              <option key={b.id} value={b.id}>
                {labelPrefix}{new Date(b.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {b.respondentName} ({b.respondentOrg || 'Anonim'})
              </option>
              );
            })}
          </select>
          {!selectedBatchId && (
            <p className="text-xs text-amber-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Harap pilih data aktual terlebih dahulu sebelum melakukan penilaian.</p>
          )}
        </div>

        {/* Identitas Auditor — from Rubrik */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-bold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Identitas Auditor / Penilai
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tanggal Audit</label>
              <input suppressHydrationWarning type="date" value={auditorBg.tanggalAudit} onChange={e => setAuditorBg(p => ({ ...p, tanggalAudit: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Auditor</label>
              <input suppressHydrationWarning type="text" value={auditorBg.nama} onChange={e => setAuditorBg(p => ({ ...p, nama: e.target.value }))} placeholder="Nama lengkap auditor" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Jenis Kelamin</label>
              <select suppressHydrationWarning value={auditorBg.jenisKelamin} onChange={e => setAuditorBg(p => ({ ...p, jenisKelamin: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— Pilih —</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Posisi / Jabatan</label>
              <input suppressHydrationWarning type="text" value={auditorBg.posisi} onChange={e => setAuditorBg(p => ({ ...p, posisi: e.target.value }))} placeholder="Posisi di instansi" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Instansi</label>
              <input suppressHydrationWarning type="text" value={auditorBg.namaInstansi} onChange={e => setAuditorBg(p => ({ ...p, namaInstansi: e.target.value }))} placeholder="Nama instansi / lembaga" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">No Sertifikat Auditor (Jika Ada)</label>
              <input suppressHydrationWarning type="text" value={auditorBg.noSertifikat} onChange={e => setAuditorBg(p => ({ ...p, noSertifikat: e.target.value }))} placeholder="Nomor sertifikat auditor" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        {/* Background Form — Read Only from Selected Batch */}
        {selectedBatch && (
          <div className="rounded-xl border bg-emerald-500/5 p-5 border-emerald-500/20">
            <p className="text-sm font-bold mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="h-4 w-4" /> Data Latar Belakang Batch K3
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cp.backgroundFields.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-0.5">{f.label}</label>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedBatch.respondentInfo?.[`${cp.cpId}_${f.key}`] || "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                answers={answers} notes={notes} aktualFilesMap={aktualFilesMap} evidenceCheck={evidenceCheck}
                onAnswer={handleAnswer} onNote={handleNote}
                onEvidenceCheck={handleEvidenceCheck}
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
            disabled={submitting || !selectedBatchId}
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
