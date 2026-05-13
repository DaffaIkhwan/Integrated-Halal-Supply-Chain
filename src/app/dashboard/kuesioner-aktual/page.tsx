"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ALL_CP_QUESTIONNAIRES, RISK_SCALE_LIKERT } from "@/lib/data/questionnaire-index";
import type { CPQuestionnaire, SubCriteria, BackgroundField } from "@/lib/data/questionnaire-index";
import {
  FileCheck, ChevronDown, ChevronUp, Send, Upload, X,
  CheckCircle2, Info, Building2, FileText
} from "lucide-react";

type RiskAnswers = Record<string, number>;
type EvidenceAvail = Record<string, boolean>;
type UploadedFiles = Record<string, File | null>;

function BgFieldInput({ field, value, onChange }: { field: BackgroundField; value: string; onChange: (v: string) => void }) {
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
      type={field.type === "date" ? "date" : "text"}
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
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 max-w-[140px]">
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
  onRisk: (k: string, v: number) => void;
  onEvidence: (k: string, v: boolean) => void;
  onUpload: (k: string, f: File) => void;
  onRemoveFile: (k: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const answered = sub.indicators.filter(ind => risks[`${sub.code}_${ind.no}`]).length;
  const total = sub.indicators.length;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
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
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[24px_1fr_140px_80px_60px_200px] gap-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2">
                <span>No</span><span>Pernyataan</span><span className="text-center">Bukti Pendukung</span><span className="text-center">Tersedia?</span><span className="text-center">Upload</span><span className="text-center">Kondisi Aktual (1-5)</span>
              </div>

              {sub.indicators.map(ind => {
                const key = `${sub.code}_${ind.no}`;
                const val = risks[key];
                const hasEvidence = evidence[key];
                return (
                  <div key={key} className="grid grid-cols-[24px_1fr_140px_80px_60px_200px] gap-2 items-center px-2 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-xs font-mono font-bold text-muted-foreground">{ind.no}</span>
                    <p className="text-[13px] leading-snug">{ind.statement}</p>
                    <p className="text-[10px] text-muted-foreground italic text-center">{ind.evidence}</p>
                    <div className="flex justify-center gap-2">
                      {["Ya", "Tidak"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => onEvidence(key, opt === "Ya")}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                            hasEvidence === (opt === "Ya")
                              ? opt === "Ya" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                              : hasEvidence === undefined ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center">
                      <FileUploadButton fileKey={key} files={files} onUpload={onUpload} onRemove={onRemoveFile} />
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      {RISK_SCALE_LIKERT.map(scale => (
                        <button
                          key={scale.value}
                          onClick={() => onRisk(key, scale.value)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            val === scale.value
                              ? scale.value <= 2 ? "bg-emerald-500 text-white shadow-lg"
                                : scale.value === 3 ? "bg-amber-500 text-white shadow-lg"
                                : "bg-red-500 text-white shadow-lg"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                          title={scale.label}
                        >
                          {scale.value}
                        </button>
                      ))}
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

export default function KuesionerAktualPage() {
  const [selectedCPIndex, setSelectedCPIndex] = useState(0);
  const [risks, setRisks] = useState<RiskAnswers>({});
  const [evidence, setEvidence] = useState<EvidenceAvail>({});
  const [files, setFiles] = useState<UploadedFiles>({});
  const [bgData, setBgData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validation
  const [validasiSupervisor, setValidasiSupervisor] = useState({
    namaSupervisor: "", hasilVerifikasi: "", tingkatRisiko: "", tindakanKorektif: "", tanggalVerifikasi: "",
  });

  const cp = ALL_CP_QUESTIONNAIRES[selectedCPIndex];
  const totalQ = cp.subCriteria.reduce((a, s) => a + s.indicators.length, 0);
  const answeredQ = cp.subCriteria.reduce((a, s) => a + s.indicators.filter(i => risks[`${s.code}_${i.no}`]).length, 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Build FormData for file uploads
    const formData = new FormData();
    formData.append("cpId", cp.cpId);
    formData.append("background", JSON.stringify(bgData));
    formData.append("risks", JSON.stringify(risks));
    formData.append("evidence", JSON.stringify(evidence));
    formData.append("validation", JSON.stringify(validasiSupervisor));
    Object.entries(files).forEach(([key, file]) => { if (file) formData.append(`file_${key}`, file); });

    // TODO: API call with formData
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
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
            <p>Centang ketersediaan bukti dukung (Ya/Tidak), upload bukti pendukung, dan berikan penilaian kondisi aktual (1-5) berdasarkan keberadaan aktual dari masing-masing indikator.</p>
          </div>
        </div>

        {/* CP Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {ALL_CP_QUESTIONNAIRES.map((cpItem, idx) => (
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
                <BgFieldInput field={f} value={bgData[`${cp.cpId}_${f.key}`] || ""} onChange={v => setBgData(prev => ({ ...prev, [`${cp.cpId}_${f.key}`]: v }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Risk Scale */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skala Kondisi Aktual</p>
          <div className="grid grid-cols-5 gap-2">
            {RISK_SCALE_LIKERT.map(s => (
              <div key={s.value} className={`rounded-lg p-2 text-center border ${
                s.value === 1 ? "border-emerald-500/30 bg-emerald-500/5" :
                s.value === 2 ? "border-sky-500/30 bg-sky-500/5" :
                s.value === 3 ? "border-amber-500/30 bg-amber-500/5" :
                s.value === 4 ? "border-orange-500/30 bg-orange-500/5" :
                "border-red-500/30 bg-red-500/5"
              }`}>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] font-semibold">{s.label}</p>
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
                onRisk={(k, v) => setRisks(p => ({ ...p, [k]: v }))}
                onEvidence={(k, v) => setEvidence(p => ({ ...p, [k]: v }))}
                onUpload={(k, f) => setFiles(p => ({ ...p, [k]: f }))}
                onRemoveFile={k => setFiles(p => ({ ...p, [k]: null }))}
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tingkat Risiko Keseluruhan</label>
              <select value={validasiSupervisor.tingkatRisiko} onChange={e => setValidasiSupervisor(p => ({ ...p, tingkatRisiko: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— Pilih —</option>
                {RISK_SCALE_LIKERT.map(s => <option key={s.value} value={s.label}>{s.label}</option>)}
              </select>
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
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : <Send className="h-4 w-4" />}
            Simpan Kondisi Aktual
          </button>
        </div>
      </main>
    </div>
  );
}
