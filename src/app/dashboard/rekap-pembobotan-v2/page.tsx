"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import {
  Table2, Search, Filter, Eye, FileText, X,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  ListOrdered, User, ExternalLink,
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
  "pembobotan-v2": { label: "Kuesioner 1 (V2) — Pembobotan Model", labelShort: "K1V2", color: "from-cyan-500 to-blue-500", icon: <ListOrdered className="h-4 w-4" /> },
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  REVIEWED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

// ─── Detail Modal ───
function DetailModal({ item, onClose }: { item: QResponse; onClose: () => void }) {
  const meta = TYPE_META[item.questionnaireType] || TYPE_META["pembobotan-v2"];
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

export default function RekapPembobotanV2Page() {
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeType = "pembobotan-v2";
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
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Rekap V2</span>
              {" "}Kuesioner 1 — Pembobotan
            </h1>
            <p className="text-sm text-muted-foreground">Tabel data isian kuesioner 1 (pembobotan perangkingan) dari responden</p>
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
              defaultValue={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Stats Summary */}
        {data && (
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Total: <strong className="text-foreground">{data.total}</strong> respons
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted border border-border/40">
              Halaman {data.page} / {data.totalPages || 1}
            </span>
            <span className="text-xs">Menampilkan {data.responses.length} dari {data.total} data</span>
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
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Responden</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instansi</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.responses.map((r, i) => {
                    const no = (page - 1) * 20 + i + 1;
                    const meta = TYPE_META[r.questionnaireType] || TYPE_META["pembobotan-v2"];
                    const color = STATUS_COLORS[r.status] || STATUS_COLORS.SUBMITTED;
                    
                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{no}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${meta.color} text-white`}>
                            {meta.labelShort}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">{r.cpId || "—"}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{r.respondentName}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{r.respondentEmail || "No Email"}</div>
                        </td>
                        <td className="py-3 px-4 text-sm truncate max-w-[150px]">{r.respondentOrg || "—"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedItem(r)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center justify-center text-muted-foreground">
            <Table2 className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm opacity-70">Belum ada yang mengisi kuesioner ini</p>
          </div>
        )}

        {/* Pagination Info & Controls */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-muted-foreground">Halaman {page} dari {data.totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="p-2 rounded-lg border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} 
                disabled={page === data.totalPages}
                className="p-2 rounded-lg border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedItem && (
          <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
