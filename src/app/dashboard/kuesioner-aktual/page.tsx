"use client";

import { toast } from "sonner";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, RISK_SCALE_LIKERT } from "@/lib/data/questionnaire-index";
import type { CPQuestionnaire, SubCriteria, BackgroundField } from "@/lib/data/questionnaire-index";
import {
  FileCheck, ChevronDown, ChevronUp, Send, Upload, X,
  CheckCircle2, Info, Building2, FileText
} from "lucide-react";

type RiskAnswers = Record<string, string>;
type EvidenceAvail = Record<string, boolean>;
type UploadedFiles = Record<string, File | null>;

function BgFieldInput({ field, value, onChange, masterData, cpId }: { field: BackgroundField; value: string; onChange: (v: string) => void, masterData?: any, cpId?: string }) {
  if (field.key === "batch" || field.key === "kodeTernak") {
    let options: {label: string, value: string}[] = [];
    if (masterData) {
      if (cpId === "CP1" || cpId === "CP2" || cpId === "CP3") {
        options = masterData.cattle?.map((c: any) => ({ value: c.earTag, label: `${c.earTag} (${c.breed})` })) || [];
      } else {
        options = masterData.batches?.map((b: any) => ({ value: b.id.split('-')[0], label: `[Batch ${b.id.split('-')[0]}] Sapi: ${b.cattle?.earTag}` })) || [];
      }
    }
    return (
      <select suppressHydrationWarning value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
        <option value="">— Pilih Batch / Kode Ternak —</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    );
  }

  if (field.type === "select") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
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
    />
  );
}

function FileUploadButton({ fileKey, files, onUpload, onRemove }: {
  fileKey: string; files: UploadedFiles;
  onUpload: (key: string, file: File) => void;
  onRemove: (key: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const file = files[fileKey];

  return (
    <div className="flex items-center gap-1.5">
      {file ? (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 max-w-[110px]">
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{file.name}</span>
          <button onClick={() => onRemove(fileKey)} className="shrink-0 hover:text-red-400"><X className="h-3 w-3" /></button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-[10px] text-muted-foreground transition-colors"
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
      )}
      <input ref={ref} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) onUpload(fileKey, e.target.files[0]); }} />
    </div>
  );
}

function SubCriteriaForm({
  sub, risks, evidence, files,
  onRisk, onEvidence, onUpload, onRemoveFile
}: {
  sub: SubCriteria;
  risks: RiskAnswers; evidence: EvidenceAvail; files: UploadedFiles;
  onRisk: (k: string, v: string) => void;
  onEvidence: (k: string, v: boolean) => void;
  onUpload: (k: string, f: File) => void;
  onRemoveFile: (k: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const answered = sub.indicators.filter(ind => risks[`${sub.code}_${ind.no}`]).length;
  const total = sub.indicators.length;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <div onClick={() => setOpen(!open)} role="button" tabIndex={0} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
        <span className="shrink-0 w-16 text-xs font-mono font-bold text-primary">{sub.code}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{sub.name}</p>
          <p className="text-[11px] text-muted-foreground italic">{sub.nameEn}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${answered === total && total > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
            {answered}/{total}
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {/* Header */}
              <div className="hidden md:grid grid-cols-[auto_1fr_140px_80px_120px_100px] gap-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2">
                <span className="w-6">No</span><span>Pernyataan</span><span className="text-center">Bukti Pendukung</span><span className="text-center">Tersedia?</span><span className="text-center">Upload</span><span className="text-center">Kesesuaian</span>
              </div>

              {sub.indicators.map(ind => {
                const key = `${sub.code}_${ind.no}`;
                const val = risks[key];
                const hasEvidence = evidence[key];
                return (
                  <div key={key} className="flex flex-col md:grid md:grid-cols-[auto_1fr_140px_80px_120px_100px] gap-3 md:gap-2 items-start md:items-center px-3 py-4 md:px-2 md:py-2.5 rounded-xl md:rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/40 md:border-transparent">
                    {/* Number & Statement */}
                    <div className="flex gap-2 w-full md:contents items-start">
                      <span className="shrink-0 w-6 text-xs font-mono font-bold text-muted-foreground pt-0.5">{ind.no}</span>
                      <p className="flex-1 text-[13px] leading-snug">{ind.statement}</p>
                    </div>

                    {/* Evidence */}
                    <div className="w-full md:w-auto mt-1 md:mt-0 pl-8 md:pl-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground block mb-0.5">Bukti Pendukung:</span>
                      <p className="text-[10px] text-muted-foreground italic text-left md:text-center">{ind.evidence}</p>
                    </div>

                    {/* Yes/No & Upload (Mobile groups them) */}
                    <div className="flex w-full md:w-auto items-center justify-between md:contents mt-2 md:mt-0 pt-3 md:pt-0 border-t border-border/50 md:border-0 pl-8 md:pl-0">
                      <div className="flex flex-col md:items-center gap-1">
                        <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground">Tersedia?</span>
                        <div className="flex justify-center gap-2">
                          {["Ya", "Tidak"].map(opt => (
                            <button
                              key={opt}
                              onClick={() => onEvidence(key, opt === "Ya")}
                              className={`px-3 py-1.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-[10px] font-semibold transition-all ${
                                hasEvidence === (opt === "Ya")
                                  ? opt === "Ya" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-red-500 text-white shadow-md shadow-red-500/20"
                                  : hasEvidence === undefined ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end md:items-center gap-1">
                        <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground">File</span>
                        <div className="flex justify-center">
                          <FileUploadButton fileKey={key} files={files} onUpload={onUpload} onRemove={onRemoveFile} />
                        </div>
                      </div>
                    </div>

                    {/* Verifikasi Supervisor */}
                    <div className="w-full flex flex-col md:items-center gap-1 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-border/50 md:border-0 pl-8 md:pl-0">
                      <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground">Kesesuaian</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onRisk(key, "sesuai")}
                          className={`px-2.5 py-1.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-[10px] font-semibold transition-all ${
                            val === "sesuai" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          Sesuai
                        </button>
                        <button
                          onClick={() => onRisk(key, "tidak_sesuai")}
                          className={`px-2.5 py-1.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-[10px] font-semibold transition-all ${
                            val === "tidak_sesuai" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useSession } from "next-auth/react";
import { useMemo, useEffect } from "react";

export default function KuesionerAktualPage() {
  const { data: session } = useSession();

  const availableCPs = useMemo(() => {
    if (!session?.user?.role || session.user.role === "ADMIN") {
      return ALL_CP_QUESTIONNAIRES;
    }
    const rolePrefix = session.user.role.split("_")[0];
    return ALL_CP_QUESTIONNAIRES.filter((cp) => cp.cpId === rolePrefix);
  }, [session?.user?.role]);

  const [selectedCPIndex, setSelectedCPIndex] = useState(0);
  const [risks, setRisks] = useState<RiskAnswers>({});
  const [evidence, setEvidence] = useState<EvidenceAvail>({});
  const [files, setFiles] = useState<UploadedFiles>({});
  const [bgData, setBgData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [masterData, setMasterData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dss/master-data")
      .then(r => r.json())
      .then(d => {
        if (!d.error) setMasterData(d);
      });
  }, []);

  // Validation
  const [validasiSupervisor, setValidasiSupervisor] = useState({
    namaSupervisor: "", hasilVerifikasi: "", tingkatRisiko: "", tindakanKorektif: "", tanggalVerifikasi: "",
  });

  const cp = availableCPs[selectedCPIndex] || availableCPs[0];
  const totalQ = cp.subCriteria.reduce((a, s) => a + s.indicators.length, 0);
  const answeredQ = cp.subCriteria.reduce((a, s) => a + s.indicators.filter(i => risks[`${s.code}_${i.no}`]).length, 0);

  const handleRisk = useCallback((key: string, value: string) => {
    setRisks(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEvidence = useCallback((key: string, value: boolean) => {
    setEvidence(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleUpload = useCallback((k: string, f: File) => {
    setFiles(p => ({ ...p, [k]: f }));
  }, []);

  const handleRemoveFile = useCallback((k: string) => {
    setFiles(p => ({ ...p, [k]: null }));
  }, []);

  // Calculate compliance stats
  const answeredValues = Object.values(risks) as string[];
  const sesuaiCount = answeredValues.filter(v => v === "sesuai").length;
  const tidakSesuaiCount = answeredValues.filter(v => v === "tidak_sesuai").length;
  const totalAnsweredRisk = sesuaiCount + tidakSesuaiCount;
  const compliancePercent = totalAnsweredRisk > 0 ? Math.round((sesuaiCount / totalAnsweredRisk) * 100) : 0;
  
  const calculatedColor = compliancePercent >= 80 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    : compliancePercent >= 50 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    : 'text-red-400 bg-red-500/15 border-red-500/30';

  const handlePreSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    // Upload files to Google Drive (or fallback to mock)
    const fileList: any[] = [];
    for (const [key, f] of Object.entries(files)) {
      if (f) {
        const formData = new FormData();
        formData.append("file", f);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const json = await res.json();
          fileList.push({
            key,
            filename: f.name,
            url: json.url || `/uploads/${f.name}`,
            downloadUrl: json.downloadUrl
          });
        } catch (err) {
          console.error("Upload error:", err);
          fileList.push({ key, filename: f.name, url: `/uploads/${f.name}` });
        }
      }
    }

    // Get respondent name from background data
    const nameKey = Object.keys(bgData).find(k => k.includes("namaStaff") || k.includes("namaPIC") || k.includes("namaFarm"));
    const respName = (nameKey ? bgData[nameKey] : "") || "Anonim";

    try {
      await fetch("/api/dss/questionnaire-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireType: "aktual",
          cpId: cp.cpId,
          respondentName: respName,
          respondentRole: bgData[`${cp.cpId}_jabatan`] || null,
          respondentOrg: bgData[`${cp.cpId}_namaFarm`] || bgData[`${cp.cpId}_namaPerusahaan`] || null,
          respondentEmail: null,
          respondentInfo: bgData,
          answers: { risks, evidence },
          notes: { ...validasiSupervisor, tingkatRisiko: validasiSupervisor.tingkatRisiko, complianceStats: `${compliancePercent}% Kepatuhan (${sesuaiCount} Sesuai)` },
          files: fileList,
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
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
            <FileCheck className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Kuesioner 3</span>
              {" "}— Kondisi Aktual
            </h1>
            <p className="text-sm text-muted-foreground">Form Pengisian Kondisi Aktual Kepatuhan Halal — Diisi oleh masing-masing CP</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-teal-500/20 bg-teal-500/5">
          <Info className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Petunjuk Pengisian</p>
            <p>Centang ketersediaan bukti dukung (Ya/Tidak), upload bukti pendukung, dan berikan verifikasi supervisor (Sesuai/Tidak Sesuai) berdasarkan keberadaan aktual dari masing-masing indikator.</p>
          </div>
        </div>

        {/* CP Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {availableCPs.map((cpItem, idx) => (
            <button
              key={cpItem.cpId}
              onClick={() => setSelectedCPIndex(idx)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                selectedCPIndex === idx
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="font-mono font-bold">{cpItem.cpId}</span>
            </button>
          ))}
        </div>

        {/* Background Form */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-bold mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Latar Belakang Pengisi Formulir — {cp.cpId}. {cp.cpName}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cp.backgroundFields.map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                <BgFieldInput field={f} value={bgData[`${cp.cpId}_${f.key}`] || ""} onChange={v => setBgData(prev => ({ ...prev, [`${cp.cpId}_${f.key}`]: v }))} masterData={masterData} cpId={cp.cpId} />
              </div>
            ))}
          </div>
        </div>



        {/* CP Content */}
        <div className="rounded-2xl border bg-card p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{cp.cpId}. {cp.cpName} <span className="text-sm text-muted-foreground font-normal italic ml-2">{cp.cpNameEn}</span></h2>
            <p className="text-xl font-bold font-mono">{answeredQ}/{totalQ}</p>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-6">
            <motion.div animate={{ width: `${totalQ > 0 ? (answeredQ / totalQ) * 100 : 0}%` }} className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" transition={{ duration: 0.5 }} />
          </div>
          <div className="space-y-3">
            {cp.subCriteria.map(sub => (
              <SubCriteriaForm key={sub.code} sub={sub} risks={risks} evidence={evidence} files={files}
                onRisk={handleRisk}
                onEvidence={handleEvidence}
                onUpload={handleUpload}
                onRemoveFile={handleRemoveFile}
              />
            ))}
          </div>
        </div>

        {/* Supervisor Validation */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-bold mb-4">Validasi Supervisor — {cp.cpId}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Supervisor</label>
              <input value={validasiSupervisor.namaSupervisor} onChange={e => setValidasiSupervisor(p => ({ ...p, namaSupervisor: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasil Verifikasi</label>
              <select value={validasiSupervisor.hasilVerifikasi} onChange={e => setValidasiSupervisor(p => ({ ...p, hasilVerifikasi: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— Pilih —</option>
                <option value="sesuai">Sesuai</option>
                <option value="tidak_sesuai">Tidak Sesuai</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Tingkat Risiko Keseluruhan</label>
              <div className="flex gap-2">
                {[
                  { v: "1", l: "Rendah", c: "emerald" },
                  { v: "2", l: "Rendah", c: "emerald" },
                  { v: "3", l: "Sedang", c: "amber" },
                  { v: "4", l: "Tinggi", c: "red" },
                  { v: "5", l: "Tinggi", c: "red" }
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => {
                      setValidasiSupervisor(p => ({ ...p, tingkatRisiko: opt.v }));
                      const scaleData = RISK_SCALE_LIKERT.find(s => s.value === Number(opt.v));
                      if (scaleData) {
                        const colorMap: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
                          1: { bg: "bg-emerald-950/90", border: "border-emerald-500/40", badge: "bg-emerald-500", icon: "🟢" },
                          2: { bg: "bg-sky-950/90", border: "border-sky-500/40", badge: "bg-sky-500", icon: "🔵" },
                          3: { bg: "bg-amber-950/90", border: "border-amber-500/40", badge: "bg-amber-500", icon: "🟡" },
                          4: { bg: "bg-orange-950/90", border: "border-orange-500/40", badge: "bg-orange-500", icon: "🟠" },
                          5: { bg: "bg-red-950/90", border: "border-red-500/40", badge: "bg-red-500", icon: "🔴" },
                        };
                        const c = colorMap[Number(opt.v)] || colorMap[3];
                        toast.custom((t) => (
                          <div className={`${c.bg} ${c.border} border rounded-xl p-4 shadow-2xl backdrop-blur-sm max-w-md w-full animate-in slide-in-from-top-2 duration-300`}>
                            <div className="flex items-start gap-3">
                              <span className="text-xl mt-0.5">{c.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-mono font-bold text-white/90">RISK LEVEL</span>
                                  <span className={`${c.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>Skala {opt.v} — {scaleData.label}</span>
                                </div>
                                <p className="text-[12px] leading-relaxed text-white/80">{scaleData.interpretation}</p>
                              </div>
                              <button onClick={() => toast.dismiss(t)} className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none shrink-0">✕</button>
                            </div>
                          </div>
                        ), { duration: 5000, position: "top-center" });
                      }
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      validasiSupervisor.tingkatRisiko === opt.v
                        ? opt.c === "emerald" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                          : opt.c === "amber" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                          : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm">{opt.v}</span>
                    <span className="text-[9px] font-medium leading-tight opacity-80">{opt.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tanggal Verifikasi</label>
              <input type="date" value={validasiSupervisor.tanggalVerifikasi} onChange={e => setValidasiSupervisor(p => ({ ...p, tanggalVerifikasi: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tindakan Korektif</label>
              <textarea value={validasiSupervisor.tindakanKorektif} onChange={e => setValidasiSupervisor(p => ({ ...p, tindakanKorektif: e.target.value }))} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          {submitted && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Data berhasil disimpan
            </motion.div>
          )}
          <button onClick={handlePreSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : <Send className="h-4 w-4" />}
            Simpan Kondisi Aktual
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
                <div className="w-16 h-16 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Simpan & Lanjutkan?</h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin semua nilai kondisi aktual untuk <strong className="text-foreground">{cp.cpId}</strong> sudah sesuai dan supervisor telah memvalidasi?
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
                  className="flex-1 py-4 text-sm font-bold text-teal-500 hover:bg-teal-500/10 transition-colors"
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
