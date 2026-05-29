"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import {
  Table2, Search, Eye, X, Loader2, AlertTriangle,
  ListOrdered, User, ExternalLink, FileText,
  Download, ChevronDown, ChevronUp, Users, FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

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
  if (type === "KU_LEVEL") return "Kriteria Umum";
  if (type === "CP_LEVEL") return "Antar CP (Level 1)";
  return `Sub-Kriteria ${type}`;
}

// ─── Detail Modal ───
function DetailModal({ item, onClose }: { item: QResponse; onClose: () => void }) {
  const answers = item.answers as Record<string, unknown>;
  const respondentInfo = item.respondentInfo || {};
  const files = item.files || [];

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
        <div className="p-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20"><ListOrdered className="h-4 w-4" /></div>
            <div>
              <h3 className="font-bold text-lg">Kuesioner 1 (V2) — Pembobotan Model</h3>
              <p className="text-sm opacity-90">
                {item.cpId && <span className="font-mono font-bold mr-2">{item.cpId}</span>}
                {item.respondentName} — {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
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

          {/* Mode / Category */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Kategori Pembobotan</p>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {getModeLabel(String(answers.type || ""))}
            </span>
          </div>

          {/* Answers Table */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jawaban Kuesioner (Rangking & Bobot)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Variabel</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground w-40">Rangking</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground w-40">Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.rankings && typeof answers.rankings === "object" ? (
                    Object.entries(answers.rankings as Record<string, number>).map(([key, rank]) => {
                      const bobot = (answers.bobots as Record<string, number>)?.[key] || "-";
                      return (
                        <tr key={key} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-primary">{key}</td>
                          <td className="py-3 px-3 text-center text-cyan-600 font-bold">{rank}</td>
                          <td className="py-3 px-3 text-center text-emerald-600 font-bold">{bobot}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-muted-foreground">Data tidak sesuai format V2</td>
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

          {/* Files */}
          {files.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> File Bukti Pendukung ({files.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {files.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.filename}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{f.key}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
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

  // === Single Sheet: Semua Pakar ===
  const rows: (string | number | null)[][] = [];

  // Title row
  rows.push(["REKAP DATA KUESIONER 1 (V2) — PEMBOBOTAN MODEL"]);
  rows.push(["Dikelompokkan Per Pakar / Responden"]);
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`]);
  rows.push([]);

  for (const group of groups) {
    // Expert header
    rows.push([`PAKAR: ${group.name}`]);
    rows.push([`Instansi: ${group.org || "-"}`, "", `Jabatan: ${group.role || "-"}`]);

    // Additional respondent info
    const infoEntries = Object.entries(group.info).filter(([k]) => !["nama", "posisi", "namaInstansi"].includes(k));
    if (infoEntries.length > 0) {
      const infoRow: (string | null)[] = [];
      for (const [k, v] of infoEntries) {
        infoRow.push(`${k}: ${v || "-"}`);
      }
      rows.push(infoRow);
    }

    rows.push([]);

    // Sort responses by mode order
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
      const rankings = (answers.rankings || {}) as Record<string, number>;
      const bobots = (answers.bobots || {}) as Record<string, number>;
      const tanggal = new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

      rows.push([`  Kategori: ${getModeLabel(type)}`, "", `Tanggal: ${tanggal}`, "", `Status: ${r.status}`]);

      // Table header
      rows.push(["  No", "  Variabel", "  Rangking", "  Bobot"]);

      const keys = Object.keys(rankings).sort();
      keys.forEach((key, idx) => {
        rows.push([`  ${idx + 1}`, `  ${key}`, rankings[key] ?? null, bobots[key] ?? null]);
      });

      // If no data
      if (keys.length === 0) {
        rows.push(["  ", "  (Tidak ada data)", null, null]);
      }

      rows.push([]);
    }

    // Separator between experts
    rows.push(["─".repeat(60)]);
    rows.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 8 },   // No
    { wch: 30 },  // Variabel
    { wch: 12 },  // Rangking
    { wch: 12 },  // Bobot
    { wch: 20 },  // Extra
  ];

  // Merge title rows
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Rekap K1 V2 Per Pakar");

  // === Per-Expert Sheets ===
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
      const rankings = (answers.rankings || {}) as Record<string, number>;
      const bobots = (answers.bobots || {}) as Record<string, number>;
      const tanggal = new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

      expertRows.push([`Kategori: ${getModeLabel(type)}`, `Tanggal: ${tanggal}`, `Status: ${r.status}`]);
      expertRows.push(["No", "Variabel", "Rangking", "Bobot"]);

      const keys = Object.keys(rankings).sort();
      keys.forEach((key, idx) => {
        expertRows.push([idx + 1, key, rankings[key] ?? null, bobots[key] ?? null]);
      });

      if (keys.length === 0) {
        expertRows.push([null, "(Tidak ada data)", null, null]);
      }

      expertRows.push([]);
    }

    const expertWs = XLSX.utils.aoa_to_sheet(expertRows);
    expertWs["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
    ];

    // Sheet name max 31 chars
    const sheetName = group.name.substring(0, 28).replace(/[\\/*?[\]:]/g, "_");
    XLSX.utils.book_append_sheet(wb, expertWs, sheetName);
  }

  XLSX.writeFile(wb, `Rekap_K1_V2_Pembobotan_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Expert Card Component ───
function ExpertCard({ group, onViewDetail }: { group: ExpertGroup; onViewDetail: (r: QResponse) => void }) {
  const [expanded, setExpanded] = useState(true);

  const modeOrder: Record<string, number> = { KU_LEVEL: 0, CP_LEVEL: 1 };
  const sorted = [...group.responses].sort((a, b) => {
    const aType = String((a.answers as any)?.type || "");
    const bType = String((b.answers as any)?.type || "");
    const aOrder = modeOrder[aType] ?? 2;
    const bOrder = modeOrder[bType] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return aType.localeCompare(bType);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card shadow-lg overflow-hidden"
    >
      {/* Expert Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/15 hover:to-blue-500/15 transition-colors text-left"
      >
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shrink-0">
          <User className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{group.name}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {group.org && <span className="flex items-center gap-1">🏢 {group.org}</span>}
            {group.role && <span className="flex items-center gap-1">💼 {group.role}</span>}
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30">
              {group.responses.length} respons
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
      </button>

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
                const rankings = (answers.rankings || {}) as Record<string, number>;
                const bobots = (answers.bobots || {}) as Record<string, number>;
                const keys = Object.keys(rankings).sort();

                return (
                  <div key={r.id} className="rounded-xl border bg-muted/20 overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                          K1V2
                        </span>
                        <span className="text-sm font-semibold">{getModeLabel(type)}</span>
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

                    {/* Rankings & Bobots Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/20">
                            <th className="text-left py-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12">No</th>
                            <th className="text-left py-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Variabel</th>
                            <th className="text-center py-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-28">Rangking</th>
                            <th className="text-center py-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-28">Bobot</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keys.length > 0 ? keys.map((key, idx) => (
                            <tr key={key} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-4 text-xs font-mono text-muted-foreground">{idx + 1}</td>
                              <td className="py-2 px-4 font-mono font-bold text-primary text-xs">{key}</td>
                              <td className="py-2 px-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 font-bold text-sm">
                                  {rankings[key]}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-sm">
                                  {bobots[key] ?? "-"}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-muted-foreground text-xs italic">Tidak ada data</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
export default function RekapPembobotanV2Page() {
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
      params.set("type", "pembobotan-v2");
      params.set("page", "1");
      params.set("limit", "500"); // Fetch all at once

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
    // Small delay for UI feedback
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
                <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Rekap V2</span>
                {" "}Kuesioner 1 — Pembobotan
              </h1>
              <p className="text-sm text-muted-foreground">Data isian kuesioner 1 (pembobotan perangkingan) dikelompokkan per pakar</p>
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
              <ListOrdered className="h-3.5 w-3.5" /> Respons: <strong className="text-foreground">{totalResponses}</strong>
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
          <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
