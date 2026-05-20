"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import {
  Table2, Search, Filter, Eye, FileText, X,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  Scale, ClipboardCheck, FileCheck, Calendar, User, Building2,
  Download, ExternalLink,
} from "lucide-react";

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

const TYPE_META: Record<string, { label: string; labelShort: string; color: string; icon: React.ReactNode }> = {
  pembobotan: { label: "Kuesioner 1 — Pembobotan Model", labelShort: "K1", color: "from-cyan-500 to-blue-500", icon: <Scale className="h-4 w-4" /> },
  risiko: { label: "Kuesioner 2 — Pengukuran Risiko", labelShort: "K2", color: "from-amber-500 to-orange-500", icon: <ClipboardCheck className="h-4 w-4" /> },
  aktual: { label: "Kuesioner 3 — Kondisi Aktual", labelShort: "K3", color: "from-teal-500 to-cyan-500", icon: <FileCheck className="h-4 w-4" /> },
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  REVIEWED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

// ─── Detail Modal ───
function DetailModal({ item, onClose }: { item: QResponse; onClose: () => void }) {
  const meta = TYPE_META[item.questionnaireType] || TYPE_META.risiko;
  const respondentInfo = item.respondentInfo || {};
  const files = item.files || [];

  // State for linked K3 (actual) response
  const [actualResponse, setActualResponse] = useState<QResponse | null>(null);
  const [actualLoading, setActualLoading] = useState(false);

  useEffect(() => {
    const actualId = item.notes?.aktualResponseId;
    if (!actualId) return;
    setActualLoading(true);
    fetch(`/api/dss/questionnaire-response/${actualId}?bypassEmailFilter=true`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json().catch(() => { throw new Error("Invalid JSON"); });
      })
      .then(data => {
        setActualResponse(data);
        setActualLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch actual response', err);
        setActualLoading(false);
      });
  }, [item.notes?.aktualResponseId]);



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 bg-gradient-to-r ${meta.color} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">{meta.icon}</div>
            <div>
              <h3 className="font-bold text-lg">{meta.label}</h3>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(respondentInfo).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm font-medium">{val || "—"}</p>
                </div>
              ))}
              {item.respondentRole && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Jabatan</p>
                  <p className="text-sm font-medium">{item.respondentRole}</p>
                </div>
              )}
              {item.respondentOrg && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Instansi</p>
                  <p className="text-sm font-medium">{item.respondentOrg}</p>
                </div>
              )}
            </div>
          </div>

          {/* Answers Table */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jawaban / Hasil Penilaian</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Kode Indikator</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Kesesuaian Bukti</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Tingkat Risiko (1-5)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const evidenceCheck = (item.answers as any).evidenceCheck || {};
                    const riskRatings = (item.answers as any).riskRatings || {};
                    // Fallback for older flat structures
                    const isLegacy = !item.answers.riskRatings && !item.answers.evidenceCheck;
                    const keys = isLegacy
                      ? Object.keys(item.answers)
                      : Array.from(new Set([...Object.keys(evidenceCheck), ...Object.keys(riskRatings)])).sort();

                    if (keys.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground text-xs italic">Tidak ada data jawaban</td>
                        </tr>
                      );
                    }

                    return keys.map((key) => {
                      const ev = isLegacy ? null : evidenceCheck[key];
                      const risk = isLegacy ? item.answers[key] : riskRatings[key];
                      const subCode = key.split('_')[0];
                      const sameSubKeys = keys.filter(k => k.startsWith(subCode + '_')).sort();
                      const isFirstOfSub = sameSubKeys[0] === key;
                      const note = item.notes?.[key] || (isFirstOfSub ? item.notes?.[subCode] : null);
                      
                      return (
                        <tr key={key} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                          <td className="py-2 px-3">
                            <span className="font-mono text-xs font-semibold text-primary">{key}</span>
                            {note && (
                              <p className="text-[11px] text-amber-400/90 mt-1 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 max-w-xs break-words">
                                <span className="font-semibold text-amber-400">Catatan:</span> {note}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-3 text-sm">
                            {ev === "sesuai" ? (
                              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Sesuai</span>
                            ) : ev === "tidak_sesuai" ? (
                              <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Tidak Sesuai</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2 px-3 text-sm">
                            {risk ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                Number(risk) <= 2 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : Number(risk) === 3 ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-red-500/15 text-red-400 border-red-500/30"
                              }`}>
                                Skala {String(risk)}
                              </span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {item.notes && Object.keys(item.notes).filter(k => k !== "aktualResponseId").length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Catatan Auditor</p>
              <div className="space-y-2">
                {Object.entries(item.notes)
                  .filter(([key]) => key !== "aktualResponseId")
                  .map(([key, val]) => (
                  <div key={key} className="flex gap-3 py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-xs font-mono font-bold text-primary shrink-0 w-20">{key}</span>
                    <span className="text-sm text-muted-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files from K2 */}
          {files.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> File Bukti Pendukung K2 ({files.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {files.map((f, i) => {
                  const isCloudinary = f.url?.includes("res.cloudinary.com");
                  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.url || '') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.filename || '');
                  const isPdf = /\.(pdf)$/i.test(f.url || '') || /\.(pdf)$/i.test(f.filename || '');
                  
                  let previewUrl = '';
                  if (f.thumbnailUrl) {
                    previewUrl = f.thumbnailUrl;
                  } else if (isImage) {
                    if (isCloudinary) {
                      previewUrl = f.url.replace('/upload/', '/upload/w_400,c_limit/');
                    } else {
                      previewUrl = f.url;
                    }
                  } else if (isPdf && isCloudinary) {
                    previewUrl = f.url
                      .replace('/raw/upload/', '/image/upload/')
                      .replace('/upload/', '/upload/w_400,h_300,c_fill,pg_1/')
                      .replace(/\.[^/.]+$/, '.jpg');
                  }

                  return (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group overflow-hidden"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted relative flex items-center justify-center border border-border/50">
                        <div className="flex flex-col items-center gap-1 z-0 absolute">
                          <FileText className="h-10 w-10 text-muted-foreground/25" />
                          <span className="text-[10px] text-muted-foreground/40 font-mono uppercase">{f.filename?.split('.').pop() || 'file'}</span>
                        </div>
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt={f.filename}
                            className="object-cover w-full h-full relative z-10 opacity-0 transition-opacity duration-300"
                            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          <ExternalLink className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" title={f.filename}>{f.filename}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{f.key}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {/* Files from linked K3 (actual) response */}
          {actualLoading && (
            <div className="py-2 text-sm text-muted-foreground">Loading file bukti K3…</div>
          )}
          {actualResponse && actualResponse.files && actualResponse.files.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4 mt-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> File Bukti Pendukung K3 ({actualResponse.files.length})
                </p>
                <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/40">
                  Terhubung: {actualResponse.respondentName} — {actualResponse.cpId} ({new Date(actualResponse.createdAt).toLocaleDateString("id-ID")})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actualResponse.files.map((f, i) => {
                  const isCloudinary = f.url?.includes("res.cloudinary.com");
                  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.url || '') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.filename || '');
                  const isPdf = /\.(pdf)$/i.test(f.url || '') || /\.(pdf)$/i.test(f.filename || '');
                  
                  let previewUrl = '';
                  if (f.thumbnailUrl) {
                    previewUrl = f.thumbnailUrl;
                  } else if (isImage) {
                    if (isCloudinary) {
                      previewUrl = f.url.replace('/upload/', '/upload/w_400,c_limit/');
                    } else {
                      previewUrl = f.url;
                    }
                  } else if (isPdf && isCloudinary) {
                    previewUrl = f.url
                      .replace('/raw/upload/', '/image/upload/')
                      .replace('/upload/', '/upload/w_400,h_300,c_fill,pg_1/')
                      .replace(/\.[^/.]+$/, '.jpg');
                  }

                  return (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors group overflow-hidden"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted relative flex items-center justify-center border border-border/50">
                        <div className="flex flex-col items-center gap-1 z-0 absolute">
                          <FileText className="h-10 w-10 text-muted-foreground/25" />
                          <span className="text-[10px] text-muted-foreground/40 font-mono uppercase">{f.filename?.split('.').pop() || 'file'}</span>
                        </div>
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt={f.filename}
                            className="object-cover w-full h-full relative z-10 opacity-0 transition-opacity duration-300"
                            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          <ExternalLink className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" title={f.filename}>{f.filename}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{f.key}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function RekapRisikoPage() {
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeType = "risiko";
  const [batchFilesMap, setBatchFilesMap] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<QResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType) params.set("type", activeType);
      if (searchTerm) params.set("search", searchTerm);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/dss/questionnaire-responses?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [activeType, searchTerm, page]);

  // Fetch files from related K3 (actual) responses
  useEffect(() => {
    if (!data) return;
    const ids = data.responses
      .map(r => r.notes?.aktualResponseId)
      .filter(id => id);
    if (ids.length === 0) return;
    Promise.all(
      ids.map(id => fetch(`/api/dss/questionnaire-response/${id}?bypassEmailFilter=true`).then(res => {
        if (!res.ok) return {};
        return res.json().catch(() => ({}));
      }))
    ).then(results => {
      const map: Record<string, any[]> = {};
      results.forEach((res: any, idx) => {
        const actualId = ids[idx];
        if (res && res.files) {
          const parent = data.responses.find(r => r.notes?.aktualResponseId === actualId);
          if (parent) {
            map[parent.id] = res.files;
          }
        }
      });
      setBatchFilesMap(map);
    }).catch(console.error);
  }, [data]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = (val: string) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchTerm(val);
      setPage(1);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
            <Table2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Rekap</span>
              {" "}Kuesioner 2 — Risiko
            </h1>
            <p className="text-sm text-muted-foreground">Tabel data isian kuesioner 2 (pengukuran risiko) dari responden</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama, instansi, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Stats Summary */}
        {data && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Total: <strong className="text-foreground">{data.total}</strong> respons
            </span>
            <span>Halaman {data.page} / {data.totalPages || 1}</span>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : data && data.responses.length > 0 ? (
          <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">No</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">CP</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Responden</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instansi</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">File</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.responses.map((r, i) => {
                    const meta = TYPE_META[r.questionnaireType] || TYPE_META.pembobotan;
                    const rowNum = (data.page - 1) * 20 + i + 1;
                    const fileCount = r.files?.length || 0;
                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{rowNum}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r ${meta.color} text-white`}>
                            {meta.icon} {meta.labelShort}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-primary">{r.cpId || "—"}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{r.respondentName}</p>
                          {r.respondentEmail && <p className="text-[10px] text-muted-foreground">{r.respondentEmail}</p>}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{r.respondentOrg || "—"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[r.status] || STATUS_COLORS.SUBMITTED}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const batchFiles = batchFilesMap[r.id] || [];
                            const count = fileCount > 0 ? fileCount : batchFiles.length;
                            if (count > 0) {
                              return (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                                  <FileText className="h-3.5 w-3.5" /> {count}
                                </span>
                              );
                            }
                            return <span className="text-xs text-muted-foreground">—</span>;
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedItem(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detail
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Table2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Belum ada data kuesioner yang disubmit.</p>
            <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah responden mengisi kuesioner.</p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </div>
  );
}
