"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { useSession } from "next-auth/react";
import {
  Table2, Search, Eye, X, Loader2, AlertTriangle,
  Scale, User, ChevronDown, ChevronUp, Users, FileSpreadsheet,
  ArrowLeftRight, ArrowLeft, ArrowRight, Minus, Edit2, Save, Plus, Trash2
} from "lucide-react";
import * as XLSX from "xlsx";
import { ALL_CP_QUESTIONNAIRES, KU_KRITERIA_UMUM } from "@/lib/data/questionnaire-index";

// ─── Types ───
interface QResponse {
  id: string;
  questionnaireType: string;
  cpId: string | null;
  respondentName: string;
  respondentRole: string | null;
  respondentOrg: string | null;
  respondentEmail: string | null;
  respondentInfo: Record<string, string>;
  answers: Record<string, unknown>;
  notes: Record<string, string>;
  files: Array<{ key: string; filename: string; url: string; thumbnailUrl?: string }>;
  status: string;
  createdAt: string;
}

interface ApiResult {
  responses: QResponse[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ───
const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  REVIEWED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function getModeLabel(type: string): string {
  if (type === "KU_LEVEL") return "Kriteria Umum (KU)";
  if (type === "CP_LEVEL") return "Antar CP (Level 1)";
  return `Sub-Kriteria ${type}`;
}

function getModeBadgeColor(type: string): string {
  if (type === "KU_LEVEL") return "from-violet-500 to-indigo-500";
  if (type === "CP_LEVEL") return "from-cyan-500 to-blue-500";
  return "from-emerald-500 to-teal-500";
}

// Convert slider value (-8..8) to Saaty scale interpretation
function interpretComparison(pairKey: string, value: number): { left: string; right: string; scale: number; direction: "left" | "right" | "equal" } {
  const parts = pairKey.split("_vs_");
  const left = parts[0] || "?";
  const right = parts[1] || "?";
  const absVal = Math.abs(value) + 1; // 0 → 1, 1 → 2, ..., 8 → 9
  if (value === 0) return { left, right, scale: 1, direction: "equal" };
  if (value < 0) return { left, right, scale: absVal, direction: "left" };
  return { left, right, scale: absVal, direction: "right" };
}

const SAATY_LABELS: Record<number, string> = {
  1: "Sama Penting",
  2: "Mendekati Sedikit Lebih Penting",
  3: "Sedikit Lebih Penting",
  4: "Mendekati Lebih Penting",
  5: "Lebih Penting",
  6: "Mendekati Sangat Lebih Penting",
  7: "Sangat Lebih Penting",
  8: "Mendekati Mutlak Lebih Penting",
  9: "Mutlak Lebih Penting",
};

// ─── Detail Modal ───
function DetailModal({ item, isAdmin, onClose, onSaveSuccess }: { item: QResponse; isAdmin: boolean; onClose: () => void; onSaveSuccess: () => void }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedComparisons, setEditedComparisons] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const answers = item.answers as Record<string, unknown>;
  const respondentInfo = item.respondentInfo || {};
  const type = String(answers.type || "");

  useEffect(() => {
    setEditedComparisons((answers.comparisons || {}) as Record<string, number>);
  }, [answers.comparisons]);

  const comparisons = isEditMode ? editedComparisons : ((answers.comparisons || {}) as Record<string, number>);
  const compEntries = Object.entries(comparisons);

  const handleSliderChange = (pairId: string, val: number) => {
    setEditedComparisons(prev => ({ ...prev, [pairId]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedAnswers = {
        ...answers,
        comparisons: editedComparisons
      };
      
      const res = await fetch(`/api/dss/questionnaire-responses/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers })
      });
      
      if (!res.ok) {
        throw new Error("Failed to save");
      }
      
      onSaveSuccess();
      setIsEditMode(false);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data kuesioner ini secara permanen?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dss/questionnaire-responses/${item.id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
      
      onSaveSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 bg-gradient-to-r ${getModeBadgeColor(type)} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Kuesioner 1 (V1) — Pembobotan Pairwise</h3>
              <p className="text-sm opacity-90 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-bold">{getModeLabel(type)}</span>
                <span>{item.respondentName}</span>
                <span className="opacity-60">•</span>
                <span>{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isEditMode && (
              <>
                <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-sm font-semibold">
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-600 transition-colors text-sm font-semibold shadow-lg shadow-red-500/20 disabled:opacity-50">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Hapus
                </button>
              </>
            )}
            {isEditMode && (
              <>
                <button onClick={() => {
                  setIsEditMode(false);
                  setEditedComparisons((answers.comparisons || {}) as Record<string, number>);
                }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 transition-colors text-sm font-semibold" disabled={isSaving}>
                  <X className="h-4 w-4" /> Batal
                </button>
                <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors text-sm font-semibold shadow-lg shadow-emerald-500/20" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
                </button>
              </>
            )}
            {!isEditMode && (
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Respondent Info */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Data Responden
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(respondentInfo).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm font-medium">{val || "—"}</p>
                </div>
              ))}
              {item.respondentRole && !respondentInfo.posisi && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Jabatan</p>
                  <p className="text-sm font-medium">{item.respondentRole}</p>
                </div>
              )}
              {item.respondentOrg && !respondentInfo.namaInstansi && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Instansi</p>
                  <p className="text-sm font-medium">{item.respondentOrg}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-cyan-400">{compEntries.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Pasangan Perbandingan</p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {compEntries.filter(([, v]) => v !== 0).length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Sudah Dinilai</p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {compEntries.filter(([, v]) => v === 0).length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Sama Penting</p>
            </div>
          </div>

          {/* Pairwise Comparison Table */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <ArrowLeftRight className="h-3.5 w-3.5" /> Perbandingan Berpasangan (Pairwise)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[700px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[6%]">No</th>
                    <th className="text-right py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 w-[22%]">Kriteria A</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[22%]">Skala</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 w-[22%]">Kriteria B</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[28%]">Interpretasi</th>
                  </tr>
                </thead>
                <tbody>
                  {compEntries.length > 0 ? compEntries.map(([key, val], idx) => {
                    const comp = interpretComparison(key, val);
                    return (
                      <tr key={key} className="border-b border-border/30 hover:bg-muted/30 transition-colors group">
                        <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-mono font-bold text-xs ${comp.direction === "left" ? "text-cyan-400" : "text-muted-foreground"}`}>
                            {comp.left}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isEditMode ? (
                            <div className="flex flex-col items-center justify-center w-full min-w-[150px] relative px-2">
                               <input
                                type="range"
                                min="-8"
                                max="8"
                                step="1"
                                value={val}
                                onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                                className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {comp.direction === "left" && <ArrowLeft className="h-3 w-3 text-cyan-400" />}
                              <span className={`inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg font-bold text-xs ${
                                comp.direction === "equal"
                                  ? "bg-muted text-muted-foreground"
                                  : comp.direction === "left"
                                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              }`}>
                                {comp.scale}
                              </span>
                              {comp.direction === "right" && <ArrowRight className="h-3 w-3 text-emerald-400" />}
                              {comp.direction === "equal" && <Minus className="h-3 w-3 text-muted-foreground" />}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-left">
                          <span className={`font-mono font-bold text-xs ${comp.direction === "right" ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {comp.right}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1">
                            {comp.direction === "equal" ? (
                              <span>Sama Penting <strong className="text-foreground ml-0.5">(1)</strong></span>
                            ) : (
                              <span>{comp.direction === "left" ? comp.left : comp.right} &mdash; {SAATY_LABELS[comp.scale] || "Nilai Antara"} <strong className="text-foreground ml-0.5">({comp.scale})</strong></span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs italic">Tidak ada data perbandingan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {item.notes && Object.keys(item.notes).length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Catatan</p>
              <div className="space-y-2">
                {Object.entries(item.notes).map(([key, val]) => (
                  <div key={key} className="flex gap-3 py-1.5">
                    <span className="text-xs font-mono font-bold text-primary shrink-0 w-20">{key}</span>
                    <span className="text-sm text-muted-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Helper: group responses by respondent ───
interface ExpertGroup {
  name: string;
  org: string | null;
  role: string | null;
  email: string | null;
  info: Record<string, string>;
  responses: QResponse[];
}

function groupByExpert(responses: QResponse[]): ExpertGroup[] {
  const map = new Map<string, ExpertGroup>();
  for (const r of responses) {
    const key = r.respondentName.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        name: r.respondentName,
        org: r.respondentOrg,
        role: r.respondentRole,
        email: r.respondentEmail,
        info: r.respondentInfo || {},
        responses: [],
      });
    }
    map.get(key)!.responses.push(r);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Excel Export ───
function exportToExcel(groups: ExpertGroup[]) {
  const wb = XLSX.utils.book_new();

  const rows: (string | number | null)[][] = [];
  rows.push(["REKAP DATA KUESIONER 1 (V1) — PEMBOBOTAN PAIRWISE COMPARISON"]);
  rows.push(["Dikelompokkan Per Pakar / Responden"]);
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`]);
  rows.push([]);

  for (const group of groups) {
    rows.push([`PAKAR: ${group.name}`]);
    rows.push([`Instansi: ${group.org || "-"}`, "", `Jabatan: ${group.role || "-"}`]);

    const infoEntries = Object.entries(group.info).filter(([k]) => !["nama", "posisi", "namaInstansi"].includes(k));
    if (infoEntries.length > 0) {
      const infoRow: (string | null)[] = [];
      for (const [k, v] of infoEntries) {
        infoRow.push(`${k}: ${v || "-"}`);
      }
      rows.push(infoRow);
    }
    rows.push([]);

    const modeOrder: Record<string, number> = { KU_LEVEL: 0, CP_LEVEL: 1 };
    const sorted = [...group.responses].sort((a, b) => {
      const aType = String((a.answers as any)?.type || "");
      const bType = String((b.answers as any)?.type || "");
      const aOrder = modeOrder[aType] ?? 2;
      const bOrder = modeOrder[bType] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aType.localeCompare(bType);
    });

    for (const r of sorted) {
      const answers = r.answers as Record<string, unknown>;
      const type = String(answers.type || "");
      const comparisons = (answers.comparisons || {}) as Record<string, number>;
      const tanggal = new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

      rows.push([`  Kategori: ${getModeLabel(type)}`, "", `Tanggal: ${tanggal}`, "", `Status: ${r.status}`]);
      rows.push(["  No", "  Kriteria A", "  Kriteria B", "  Skala Saaty", "  Arah Lebih Penting", "  Interpretasi"]);

      const entries = Object.entries(comparisons);
      entries.forEach(([key, val], idx) => {
        const comp = interpretComparison(key, val);
        const dirLabel = comp.direction === "equal" ? "Sama Penting" : comp.direction === "left" ? `← ${comp.left}` : `→ ${comp.right}`;
        const desc = comp.direction === "equal" ? "Sama Penting" : `${comp.direction === "left" ? comp.left : comp.right} — ${SAATY_LABELS[comp.scale] || "Nilai Antara"}`;
        rows.push([`  ${idx + 1}`, `  ${comp.left}`, `  ${comp.right}`, comp.scale, `  ${dirLabel}`, `  ${desc}`]);
      });

      if (entries.length === 0) {
        rows.push(["  ", "  (Tidak ada data)", null, null, null, null]);
      }

      rows.push([]);
    }

    rows.push(["─".repeat(80)]);
    rows.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 },   // No
    { wch: 20 },  // Kriteria A
    { wch: 20 },  // Kriteria B
    { wch: 14 },  // Skala
    { wch: 25 },  // Arah
    { wch: 40 },  // Interpretasi
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Rekap K1 V1 Per Pakar");

  // Per-expert sheets
  for (const group of groups) {
    const expertRows: (string | number | null)[][] = [];
    expertRows.push([`PAKAR: ${group.name}`]);
    expertRows.push([`Instansi: ${group.org || "-"}`, `Jabatan: ${group.role || "-"}`]);
    expertRows.push([]);

    const modeOrder: Record<string, number> = { KU_LEVEL: 0, CP_LEVEL: 1 };
    const sorted = [...group.responses].sort((a, b) => {
      const aType = String((a.answers as any)?.type || "");
      const bType = String((b.answers as any)?.type || "");
      const aOrder = modeOrder[aType] ?? 2;
      const bOrder = modeOrder[bType] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aType.localeCompare(bType);
    });

    for (const r of sorted) {
      const answers = r.answers as Record<string, unknown>;
      const type = String(answers.type || "");
      const comparisons = (answers.comparisons || {}) as Record<string, number>;
      const tanggal = new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

      expertRows.push([`Kategori: ${getModeLabel(type)}`, `Tanggal: ${tanggal}`, `Status: ${r.status}`]);
      expertRows.push(["No", "Kriteria A", "Kriteria B", "Skala", "Arah", "Interpretasi"]);

      const entries = Object.entries(comparisons);
      entries.forEach(([key, val], idx) => {
        const comp = interpretComparison(key, val);
        const dirLabel = comp.direction === "equal" ? "=" : comp.direction === "left" ? `← ${comp.left}` : `→ ${comp.right}`;
        const desc = comp.direction === "equal" ? "Sama Penting" : `${comp.direction === "left" ? comp.left : comp.right} — ${SAATY_LABELS[comp.scale] || "Nilai Antara"}`;
        expertRows.push([idx + 1, comp.left, comp.right, comp.scale, dirLabel, desc]);
      });

      if (entries.length === 0) {
        expertRows.push([null, "(Tidak ada data)", null, null, null, null]);
      }

      expertRows.push([]);
    }

    const expertWs = XLSX.utils.aoa_to_sheet(expertRows);
    expertWs["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 8 },
      { wch: 20 },
      { wch: 35 },
    ];

    const sheetName = group.name.substring(0, 28).replace(/[\\/*?[\]:]/g, "_");
    XLSX.utils.book_append_sheet(wb, expertWs, sheetName);
  }

  XLSX.writeFile(wb, `Rekap_K1_V1_Pairwise_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Inline Comparison Row ───
function ComparisonMiniRow({ pairKey, value }: { pairKey: string; value: number }) {
  const comp = interpretComparison(pairKey, value);
  return (
    <div className="flex items-center gap-2 text-xs py-0.5">
      <span className={`font-mono font-bold w-16 text-right truncate ${comp.direction === "left" ? "text-cyan-400" : "text-muted-foreground"}`}>
        {comp.left}
      </span>
      <div className="flex items-center gap-1">
        {comp.direction === "left" && <ArrowLeft className="h-2.5 w-2.5 text-cyan-400" />}
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
          comp.direction === "equal"
            ? "bg-muted/80 text-muted-foreground"
            : comp.direction === "left"
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-emerald-500/20 text-emerald-400"
        }`}>
          {comp.scale}
        </span>
        {comp.direction === "right" && <ArrowRight className="h-2.5 w-2.5 text-emerald-400" />}
        {comp.direction === "equal" && <Minus className="h-2.5 w-2.5 text-muted-foreground" />}
      </div>
      <span className={`font-mono font-bold w-16 truncate ${comp.direction === "right" ? "text-emerald-400" : "text-muted-foreground"}`}>
        {comp.right}
      </span>
    </div>
  );
}

// ─── Expert Card Component ───
function ExpertCard({ group, isAdmin, onRefresh, onViewDetail }: { group: ExpertGroup; isAdmin: boolean; onRefresh: () => void; onViewDetail: (r: QResponse) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const existingTypes = new Set(group.responses.map(r => String((r.answers as any)?.type || "")));
  const expectedTypes = ["KU_LEVEL", "CP_LEVEL", ...ALL_CP_QUESTIONNAIRES.map(c => c.cpId)];
  const missingTypes = expectedTypes.filter(t => !existingTypes.has(t));

  const handleAddMissing = async (type: string) => {
    setIsAdding(true);
    setShowAddMenu(false);
    try {
      const defaultComparisons: Record<string, number> = {};
      
      if (type === "KU_LEVEL") {
        for (let i = 0; i < KU_KRITERIA_UMUM.length; i++) {
          for (let j = i + 1; j < KU_KRITERIA_UMUM.length; j++) {
            defaultComparisons[`${KU_KRITERIA_UMUM[i].code}_vs_${KU_KRITERIA_UMUM[j].code}`] = 0;
          }
        }
      } else if (type === "CP_LEVEL") {
        for (let i = 0; i < ALL_CP_QUESTIONNAIRES.length; i++) {
          for (let j = i + 1; j < ALL_CP_QUESTIONNAIRES.length; j++) {
            defaultComparisons[`${ALL_CP_QUESTIONNAIRES[i].cpId}_vs_${ALL_CP_QUESTIONNAIRES[j].cpId}`] = 0;
          }
        }
      } else {
        const cp = ALL_CP_QUESTIONNAIRES.find(c => c.cpId === type);
        if (cp) {
          for (let i = 0; i < cp.subCriteria.length; i++) {
            for (let j = i + 1; j < cp.subCriteria.length; j++) {
              defaultComparisons[`${cp.subCriteria[i].code}_vs_${cp.subCriteria[j].code}`] = 0;
            }
          }
        }
      }

      const res = await fetch("/api/dss/questionnaire-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireType: "pembobotan",
          cpId: type === "KU_LEVEL" || type === "CP_LEVEL" ? null : type,
          respondentName: group.name,
          respondentRole: group.role || "Admin Generated",
          respondentOrg: group.org || "Admin Generated",
          respondentEmail: group.email,
          respondentInfo: group.info,
          answers: { type, comparisons: defaultComparisons },
          notes: { version: "v1", createdVia: "admin_auto_generate" },
          files: [],
        }),
      });
      
      if (res.ok) {
        onRefresh();
      } else {
        alert("Gagal menambahkan data kosong");
      }
    } catch (e) {
      console.error(e);
      alert("Error menambahkan data");
    } finally {
      setIsAdding(false);
    }
  };

  const modeOrder: Record<string, number> = { KU_LEVEL: 0, CP_LEVEL: 1 };
  const sorted = [...group.responses].sort((a, b) => {
    const aType = String((a.answers as any)?.type || "");
    const bType = String((b.answers as any)?.type || "");
    const aOrder = modeOrder[aType] ?? 2;
    const bOrder = modeOrder[bType] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return aType.localeCompare(bType);
  });

  const handleDeleteAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus SELURUH data kuesioner (${group.responses.length} respons) milik ${group.name} secara permanen?`)) {
      return;
    }
    
    setIsDeletingAll(true);
    try {
      await Promise.all(
        group.responses.map(res => 
          fetch(`/api/dss/questionnaire-responses/${res.id}`, { method: "DELETE" })
        )
      );
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus seluruh data responden");
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card shadow-lg overflow-hidden"
    >
      {/* Expert Header */}
      <div className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 transition-colors text-left relative">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shrink-0 cursor-pointer hover:bg-cyan-500/30 transition-colors" onClick={() => setExpanded(!expanded)}>
          <User className="h-5 w-5 text-cyan-500" />
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h3 className="font-bold text-lg truncate hover:text-cyan-600 transition-colors">{group.name}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {group.org && <span className="flex items-center gap-1">🏢 {group.org}</span>}
            {group.role && <span className="flex items-center gap-1">💼 {group.role}</span>}
            {group.email && <span className="flex items-center gap-1">📧 {group.email}</span>}
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 font-semibold border border-cyan-500/30">
              {group.responses.length} respons
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <button 
              onClick={handleDeleteAll} 
              disabled={isDeletingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition-all border border-red-500/30 disabled:opacity-50"
            >
              {isDeletingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Hapus Responden
            </button>
          )}
          {isAdmin && missingTypes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                disabled={isAdding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-cyan-600 hover:bg-cyan-50 text-xs font-bold transition-all shadow-sm border border-cyan-200 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Tambah Data
              </button>
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-xl shadow-xl p-1 z-10 max-h-[300px] overflow-y-auto">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kategori Belum Terisi</div>
                  {missingTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => handleAddMissing(t)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-50 text-foreground rounded-lg transition-colors font-medium"
                    >
                      {t === "KU_LEVEL" ? "Kriteria Umum" : t === "CP_LEVEL" ? "Antar CP (L1)" : t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Responses */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {sorted.map((r) => {
                const answers = r.answers as Record<string, unknown>;
                const type = String(answers.type || "");
                const comparisons = (answers.comparisons || {}) as Record<string, number>;
                const compEntries = Object.entries(comparisons);
                const answeredCount = compEntries.filter(([, v]) => v !== 0).length;

                return (
                  <div key={r.id} className="rounded-xl border bg-muted/20 overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r ${getModeBadgeColor(type)} text-white`}>
                          {type === "KU_LEVEL" ? "KU" : type === "CP_LEVEL" ? "L1" : type}
                        </span>
                        <span className="text-sm font-semibold">{getModeLabel(type)}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {answeredCount}/{compEntries.length} perbandingan
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[r.status] || STATUS_COLORS.SUBMITTED}`}>
                          {r.status}
                        </span>
                        <button
                          onClick={() => onViewDetail(r)}
                          className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Compact Pairwise Preview */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                        {compEntries.slice(0, 15).map(([key, val]) => (
                          <ComparisonMiniRow key={key} pairKey={key} value={val} />
                        ))}
                      </div>
                      {compEntries.length > 15 && (
                        <button
                          onClick={() => onViewDetail(r)}
                          className="mt-3 text-xs text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
                        >
                          + {compEntries.length - 15} perbandingan lainnya →
                        </button>
                      )}
                      {compEntries.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-3">Tidak ada data perbandingan</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ───
export default function RekapPembobotanPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  
  const [allResponses, setAllResponses] = useState<QResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<QResponse | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("type", "pembobotan");
      params.set("page", "1");
      params.set("limit", "500");

      const res = await fetch(`/api/dss/questionnaire-responses?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAllResponses(json.responses || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // Filter by search
  const filtered = searchTerm
    ? allResponses.filter(r =>
        r.respondentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.respondentOrg || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.respondentEmail || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allResponses;

  const expertGroups = groupByExpert(filtered);
  const totalExperts = expertGroups.length;
  const totalResponses = filtered.length;

  const handleDownloadExcel = () => {
    if (expertGroups.length === 0) return;
    setDownloading(true);
    setTimeout(() => {
      exportToExcel(expertGroups);
      setDownloading(false);
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
              <Table2 className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Rekap</span>
                {" "}Kuesioner 1 — Pembobotan Pairwise
              </h1>
              <p className="text-sm text-muted-foreground">Data isian kuesioner 1 (perbandingan berpasangan Saaty) dikelompokkan per pakar</p>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={downloading || totalResponses === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {downloading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Download Excel
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama pakar, instansi, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Pakar: <strong className="text-foreground">{totalExperts}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Scale className="h-3.5 w-3.5" /> Respons: <strong className="text-foreground">{totalResponses}</strong>
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : expertGroups.length > 0 ? (
          <div className="space-y-6">
            {expertGroups.map((group) => (
              <ExpertCard
                key={group.name}
                group={group}
                isAdmin={isAdmin}
                onRefresh={fetchAllData}
                onViewDetail={(r) => setSelectedItem(r)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center justify-center text-muted-foreground">
            <Table2 className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm opacity-70">Belum ada yang mengisi kuesioner ini</p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal 
            item={selectedItem} 
            isAdmin={isAdmin}
            onClose={() => setSelectedItem(null)} 
            onSaveSuccess={() => {
              setSelectedItem(null);
              fetchAllData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
