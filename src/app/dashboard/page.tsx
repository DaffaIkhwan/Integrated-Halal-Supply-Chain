"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Beef,
  Factory,
  Truck,
  Search,
  Building2,
  Tractor,
  Scale,
  ClipboardCheck,
  FileCheck,
  Clock,
  ArrowRight,
  PieChart,
} from "lucide-react";

// ─── Types ───
interface CriteriaItem {
  code: string;
  name: string;
  weight: number;
}

interface CriticalPointData {
  id: string;
  name: string;
  globalWeight: number;
  localRiskScore: number;
  globalWeightedRisk: number;
  riskLevel: string;
  criteria: CriteriaItem[];
}

interface CPRecordItem {
  cpId: string;
  cpName: string;
  status: string;
  riskValue: number;
  weightedRisk: number;
}

interface BatchData {
  id: string;
  earTag: string;
  breed: string;
  farmName: string;
  rphName: string;
  productionDate: string;
  totalRiskScore: number;
  riskLevel: string;
  cpRecords: CPRecordItem[];
}

interface RecentResponse {
  id: string;
  questionnaireType: string;
  cpId: string | null;
  respondentName: string;
  respondentOrg: string | null;
  status: string;
  createdAt: string;
}

interface DashboardData {
  criticalPoints: CriticalPointData[];
  batches: BatchData[];
  stats: {
    totalBatches: number;
    highRiskBatches: number;
    passRate: number;
    avgRiskScore: number;
    totalCriticalPoints: number;
    farmsCount?: number;
    slaughterhousesCount?: number;
    cattleCount?: number;
    k1Count?: number;
    k2Count?: number;
    k3Count?: number;
  };
  riskDistribution?: Record<string, number>;
  recentResponses?: RecentResponse[];
}

// ─── Helpers ───
function getRiskColor(level: string) {
  const l = level.toUpperCase();
  if (l === "LOW") return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", bar: "bg-emerald-500" };
  if (l === "MODERATE") return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", bar: "bg-amber-500" };
  if (l === "HIGH") return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", bar: "bg-orange-500" };
  return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", bar: "bg-red-500" };
}

function getStatusIcon(status: string) {
  if (status === "PASS") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "FAIL") return <AlertTriangle className="h-4 w-4 text-red-400" />;
  return <Activity className="h-4 w-4 text-amber-400" />;
}

const QUESTIONNAIRE_META: Record<string, { label: string; short: string; color: string; icon: React.ReactNode }> = {
  pembobotan: { label: "K1 — Pembobotan", short: "K1", color: "from-cyan-500 to-blue-500", icon: <Scale className="h-4 w-4" /> },
  risiko: { label: "K2 — Risiko", short: "K2", color: "from-amber-500 to-orange-500", icon: <ClipboardCheck className="h-4 w-4" /> },
  aktual: { label: "K3 — Aktual", short: "K3", color: "from-teal-500 to-cyan-500", icon: <FileCheck className="h-4 w-4" /> },
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  REVIEWED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

// ─── Stat Card ───
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border ${color} bg-card p-5 shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5">{icon}</div>
      </div>
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5" />
    </motion.div>
  );
}

// ─── CP Weight Bar ───
function CPWeightBar({ cp, maxWeight, index }: { cp: CriticalPointData; maxWeight: number; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const rc = getRiskColor(cp.riskLevel);
  const pct = Math.round((cp.globalWeight / maxWeight) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 py-2">
          <span className={`shrink-0 w-12 text-xs font-mono font-bold ${rc.text}`}>{cp.id}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate pr-2">{cp.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${rc.bg} ${rc.text} font-medium`}>
                  {(cp.globalWeight * 100).toFixed(1)}%
                </span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
                className={`h-full rounded-full ${rc.bar}`}
              />
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-16 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {cp.criteria.map((c) => (
                <div key={c.code} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{c.code}</span> {c.name}
                  </span>
                  <span className="font-mono font-semibold">{(c.weight * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Batch Card ───
function BatchCard({ batch, index }: { batch: BatchData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const rc = getRiskColor(batch.riskLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border ${rc.border} bg-card overflow-hidden shadow-md`}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Beef className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg font-mono">{batch.earTag}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${rc.bg} ${rc.text}`}>
                {batch.riskLevel}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Factory className="h-3.5 w-3.5" />{batch.farmName}</span>
              <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{batch.rphName}</span>
              <span>{batch.breed}</span>
              <span>{new Date(batch.productionDate).toLocaleDateString("id-ID")}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono">{(batch.totalRiskScore * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Risk Score</p>
            {expanded ? <ChevronUp className="h-4 w-4 mt-1 ml-auto text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 ml-auto text-muted-foreground" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t px-5 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Compliance Check — 10 Critical Points
              </p>
              {batch.cpRecords.map((r) => (
                <div key={r.cpId} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    {getStatusIcon(r.status)}
                    <span className="text-xs font-mono font-semibold shrink-0">{r.cpId}</span>
                    <span className="text-xs text-muted-foreground truncate">{r.cpName}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Risk: {(r.riskValue * 100).toFixed(1)}% (W: {(r.weightedRisk * 100).toFixed(1)}%)
                    </span>
                    <span className={`text-xs font-bold ${
                      r.status === "PASS" ? "text-emerald-400" : r.status === "FAIL" ? "text-red-400" : "text-amber-400"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Risk Distribution Bar ───
function RiskDistributionBar({ distribution }: { distribution: Record<string, number> }) {
  // Normalize keys to uppercase to handle differences in DB vs API (e.g. "Low" vs "LOW")
  const normalizedDist: Record<string, number> = {};
  for (const [k, v] of Object.entries(distribution)) {
    const upperK = k.toUpperCase();
    normalizedDist[upperK] = (normalizedDist[upperK] || 0) + v;
  }

  const total = Object.values(normalizedDist).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const ordered = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

  return (
    <div className="space-y-4 mt-2">
      {ordered.map((level, index) => {
        const count = normalizedDist[level] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const rc = getRiskColor(level);
        
        return (
          <div key={level} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${rc.bar}`} />
                <span className="font-semibold tracking-wide">{level}</span>
              </div>
              <span className="text-muted-foreground">
                <strong className={rc.text}>{count}</strong> batch ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full ${rc.bar} rounded-full`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/dss/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-destructive">
          <AlertTriangle className="h-6 w-6 mr-2" /> {error || "Failed to load data"}
        </div>
      </div>
    );
  }

  const maxWeight = Math.max(...data.criticalPoints.map((cp) => cp.globalWeight));
  const sortedCPs = [...data.criticalPoints].sort((a, b) => b.globalWeight - a.globalWeight);

  const filteredBatches = data.batches.filter(
    (b) =>
      b.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.riskLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuestionnaires = (data.stats.k1Count || 0) + (data.stats.k2Count || 0) + (data.stats.k3Count || 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Integrated Halal Supply Chain
            </span>{" "}
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Decision Support System — Fuzzy AHP Risk Assessment
          </p>
        </div>

        {/* Stats Row 1: Primary metrics */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-blue-400" />}
              label="Total Batch"
              value={data.stats.totalBatches}
              sub="Halal production batches"
              color="border-blue-500/20"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
              label="High Risk"
              value={data.stats.highRiskBatches}
              sub="Perlu perhatian segera"
              color="border-red-500/20"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              label="Pass Rate"
              value={`${data.stats.passRate}%`}
              sub="Compliance keseluruhan"
              color="border-emerald-500/20"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
              label="Avg Risk"
              value={`${(data.stats.avgRiskScore * 100).toFixed(1)}%`}
              sub="Skor risiko rata-rata"
              color="border-amber-500/20"
            />
          </div>

          {/* Stats Row 2: Entity counts + Questionnaire counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Tractor className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">Farm</p>
                <p className="text-sm font-bold truncate">{data.stats.farmsCount ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">RPH</p>
                <p className="text-sm font-bold truncate">{data.stats.slaughterhousesCount ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Beef className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">Sapi</p>
                <p className="text-sm font-bold truncate">{data.stats.cattleCount ?? 0} Ekor</p>
              </div>
            </div>
            {/* Questionnaire response counts */}
            <Link href="/dashboard/rekap-pembobotan" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm hover:bg-muted/50 transition-colors group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                <Scale className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">K1 Pembobotan</p>
                <p className="text-sm font-bold truncate">{data.stats.k1Count ?? 0} <span className="text-xs font-normal text-muted-foreground">respons</span></p>
              </div>
            </Link>
            <Link href="/dashboard/rekap-risiko" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm hover:bg-muted/50 transition-colors group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">K2 Risiko</p>
                <p className="text-sm font-bold truncate">{data.stats.k2Count ?? 0} <span className="text-xs font-normal text-muted-foreground">respons</span></p>
              </div>
            </Link>
            <Link href="/dashboard/rekap-aktual" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm hover:bg-muted/50 transition-colors group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-400">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">K3 Aktual</p>
                <p className="text-sm font-bold truncate">{data.stats.k3Count ?? 0} <span className="text-xs font-normal text-muted-foreground">respons</span></p>
              </div>
            </Link>
          </div>
        </div>

        {/* Risk Distribution + Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          {data.riskDistribution && Object.keys(data.riskDistribution).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-card p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Distribusi Risiko Batch</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Persebaran tingkat risiko pada {data.stats.totalBatches} batch produksi halal.
              </p>
              <RiskDistributionBar distribution={data.riskDistribution} />
            </motion.div>
          )}

          {/* Recent Activity */}
          {data.recentResponses && data.recentResponses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border bg-card p-5 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-lg">Aktivitas Terbaru</h2>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">
                  {totalQuestionnaires} total kuesioner
                </span>
              </div>
              <div className="space-y-2">
                {data.recentResponses.map((r, i) => {
                  const meta = QUESTIONNAIRE_META[r.questionnaireType] || QUESTIONNAIRE_META.risiko;
                  const rekapHref = r.questionnaireType === "pembobotan"
                    ? "/dashboard/rekap-pembobotan"
                    : r.questionnaireType === "risiko"
                    ? "/dashboard/rekap-risiko"
                    : "/dashboard/rekap-aktual";
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`shrink-0 p-1.5 rounded-lg bg-gradient-to-br ${meta.color} text-white`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{meta.short}</span>
                          {r.cpId && <span className="text-[10px] font-mono text-primary">{r.cpId}</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[r.status] || STATUS_COLORS.SUBMITTED}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.respondentName}{r.respondentOrg ? ` — ${r.respondentOrg}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                        </p>
                        <Link href={rekapHref} className="text-[10px] text-primary hover:underline flex items-center gap-0.5 justify-end">
                          Lihat <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Two-Column Layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: CP Weights */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-card p-5 shadow-lg h-full">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Bobot Critical Points</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Global weights dihitung dari matriks Fuzzy AHP (FSE). Klik untuk melihat sub-kriteria.
              </p>
              <div className="divide-y divide-border">
                {sortedCPs.map((cp, i) => (
                  <CPWeightBar key={cp.id} cp={cp} maxWeight={maxWeight} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Batches */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg">Halal Batches</h2>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari ear tag, farm, risk level..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Beef className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada batch ditemukan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBatches.map((batch, i) => (
                  <BatchCard key={batch.id} batch={batch} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
