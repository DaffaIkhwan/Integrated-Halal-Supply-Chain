"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Target,
  Gauge,
  Zap,
  Info,
} from "lucide-react";

// ─── Types ───
interface RankEntry {
  cpId: string;
  cpName: string;
  weight: number;
  percentage: string;
  rank: number;
}

interface RankChange {
  cpId: string;
  oldRank: number;
  newRank: number;
  delta: number;
}

interface ScenarioResult {
  targetCP: string;
  changePercent: number;
  changeLabel: string;
  newRanking: RankEntry[];
  rankChanges: RankChange[];
  topChanged: boolean;
  anyRankChanged: boolean;
}

interface SensitivityIndexItem {
  cpId: string;
  cpName: string;
  baselineWeight: number;
  totalScenarios: number;
  rankChangeCount: number;
  topChangeCount: number;
  sensitivityScore: number;
  stability: string;
}

interface Conclusion {
  robustnessLevel: string;
  robustnessScore: number;
  totalScenarios: number;
  totalRankChanges: number;
  totalTopChanges: number;
  top3Stable: boolean;
  top3CPs: string[];
  mostStableCPId: string;
  mostStableCPName: string;
  mostSensitiveCPId: string;
  mostSensitiveCPName: string;
  summary: string;
}

interface SensitivityData {
  baseline: RankEntry[];
  scenarios: ScenarioResult[];
  sensitivityIndex: SensitivityIndexItem[];
  conclusion: Conclusion;
  variations: number[];
}

// ─── CP Color Palette ───
const CP_COLORS: Record<string, string> = {
  CP1: "#10b981", CP2: "#06b6d4", CP3: "#3b82f6",
  CP4: "#f59e0b", CP5: "#ef4444", CP6: "#8b5cf6",
  CP7: "#ec4899", CP8: "#f97316", CP9: "#14b8a6",
};

const CP_BG: Record<string, string> = {
  CP1: "bg-emerald-500/10 border-emerald-500/30",
  CP2: "bg-cyan-500/10 border-cyan-500/30",
  CP3: "bg-blue-500/10 border-blue-500/30",
  CP4: "bg-amber-500/10 border-amber-500/30",
  CP5: "bg-red-500/10 border-red-500/30",
  CP6: "bg-violet-500/10 border-violet-500/30",
  CP7: "bg-pink-500/10 border-pink-500/30",
  CP8: "bg-orange-500/10 border-orange-500/30",
  CP9: "bg-teal-500/10 border-teal-500/30",
};

const STABILITY_COLORS: Record<string, string> = {
  "Sangat Stabil": "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  "Stabil": "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
  "Cukup Sensitif": "text-amber-400 bg-amber-500/15 border-amber-500/30",
  "Sensitif": "text-red-400 bg-red-500/15 border-red-500/30",
};

const ROBUSTNESS_CONFIG: Record<string, { color: string; icon: any; bg: string }> = {
  "Sangat Robust": { color: "text-emerald-400", icon: Shield, bg: "from-emerald-500/20 to-emerald-600/5" },
  "Robust": { color: "text-cyan-400", icon: CheckCircle2, bg: "from-cyan-500/20 to-cyan-600/5" },
  "Cukup Robust": { color: "text-amber-400", icon: AlertTriangle, bg: "from-amber-500/20 to-amber-600/5" },
  "Sensitif": { color: "text-red-400", icon: Zap, bg: "from-red-500/20 to-red-600/5" },
};

// ─── Utility: local perturbation for slider (client-side) ───
function perturbLocal(
  baseline: RankEntry[],
  targetId: string,
  changePct: number
): RankEntry[] {
  const target = baseline.find((r) => r.cpId === targetId);
  if (!target) return baseline;
  const origW = target.weight;
  let newW = origW * (1 + changePct / 100);
  if (newW < 0) newW = 0;
  if (newW > 1) newW = 1;
  const diff = newW - origW;
  const sumOthers = 1 - origW;

  const adjusted = baseline.map((r) => {
    if (r.cpId === targetId) return { ...r, weight: newW };
    const prop = sumOthers > 0 ? r.weight / sumOthers : 0;
    return { ...r, weight: Math.max(0, r.weight - prop * diff) };
  });

  const sorted = [...adjusted].sort((a, b) => b.weight - a.weight);
  return sorted.map((r, i) => ({
    ...r,
    rank: i + 1,
    percentage: (r.weight * 100).toFixed(2) + "%",
  }));
}

// ─── Page Component ───
export default function SensitivityAnalysisPage() {
  const [data, setData] = useState<SensitivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulator state
  const [selectedCP, setSelectedCP] = useState("CP6");
  const [sliderValue, setSliderValue] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    methodology: false,
    baseline: true,
    simulator: true,
    matrix: true,
    index: true,
    conclusion: true,
  });

  useEffect(() => {
    setLoading(true);
    fetch("/api/dss/ahp/sensitivity?t=" + Date.now())
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Compute local simulation for slider
  const sliderResult = useMemo(() => {
    if (!data) return null;
    return perturbLocal(data.baseline, selectedCP, sliderValue);
  }, [data, selectedCP, sliderValue]);

  // Build matrix data (CP × variation)
  const matrixData = useMemo(() => {
    if (!data) return null;
    const cpIds = data.baseline.map((b) => b.cpId).sort();
    const variations = data.variations;
    const grid: Record<string, Record<number, { rank: number; changed: boolean; topChanged: boolean }>> = {};

    for (const cpId of cpIds) {
      grid[cpId] = {};
      for (const v of variations) {
        const scenario = data.scenarios.find(
          (s) => s.targetCP === cpId && s.changePercent === v
        );
        if (scenario) {
          const targetInNew = scenario.newRanking.find(
            (r) => r.cpId === cpId
          );
          const targetInBase = data.baseline.find(
            (r) => r.cpId === cpId
          );
          grid[cpId][v] = {
            rank: targetInNew?.rank || 0,
            changed:
              (targetInNew?.rank || 0) !== (targetInBase?.rank || 0),
            topChanged: scenario.topChanged,
          };
        }
      }
    }
    return { cpIds, variations, grid };
  }, [data]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 blur-xl animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Menghitung Analisis Sensitivitas...
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full p-6 rounded-2xl border border-red-500/30 bg-red-500/5 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </motion.div>
        </div>
      </>
    );
  }

  if (!data) return null;

  const robustCfg = ROBUSTNESS_CONFIG[data.conclusion.robustnessLevel] ||
    ROBUSTNESS_CONFIG["Robust"];
  const RobustIcon = robustCfg.icon;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* ═══ HEADER ═══ */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center border border-cyan-500/20">
                    <Activity className="h-5 w-5 text-cyan-400" />
                  </div>
                  Analisis Sensitivitas
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Pengujian kestabilan model Fuzzy AHP terhadap perubahan bobot
                  kriteria CP1–CP9
                </p>
              </div>

              {/* Robustness Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border bg-gradient-to-r ${robustCfg.bg} backdrop-blur-sm`}
              >
                <RobustIcon className={`h-6 w-6 ${robustCfg.color}`} />
                <div>
                  <p className={`text-sm font-bold ${robustCfg.color}`}>
                    {data.conclusion.robustnessLevel}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Skor: {data.conclusion.robustnessScore}%
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ═══ STAT CARDS ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            {[
              {
                label: "Total Skenario",
                value: data.conclusion.totalScenarios,
                icon: BarChart3,
                color: "text-cyan-400",
                bg: "from-cyan-500/10 to-cyan-600/5",
              },
              {
                label: "Ranking Berubah",
                value: data.conclusion.totalRankChanges,
                icon: ArrowUpDown,
                color: "text-amber-400",
                bg: "from-amber-500/10 to-amber-600/5",
              },
              {
                label: "Top-1 Berubah",
                value: data.conclusion.totalTopChanges,
                icon: Target,
                color: data.conclusion.totalTopChanges === 0 ? "text-emerald-400" : "text-red-400",
                bg: data.conclusion.totalTopChanges === 0 ? "from-emerald-500/10 to-emerald-600/5" : "from-red-500/10 to-red-600/5",
              },
              {
                label: "Top-3 Stabil",
                value: data.conclusion.top3Stable ? "Ya ✓" : "Tidak ✗",
                icon: Shield,
                color: data.conclusion.top3Stable ? "text-emerald-400" : "text-red-400",
                bg: data.conclusion.top3Stable ? "from-emerald-500/10 to-emerald-600/5" : "from-red-500/10 to-red-600/5",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`p-4 rounded-2xl border bg-gradient-to-br ${stat.bg} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {stat.label}
                  </span>
                </div>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ SECTION: METHODOLOGY ═══ */}
          <CollapsibleSection
            id="methodology"
            title="Metodologi Analisis Sensitivitas"
            icon={<Info className="h-5 w-5 text-blue-400" />}
            isOpen={openSections.methodology}
            onToggle={() => toggleSection("methodology")}
            delay={0.15}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Perturbasi Bobot",
                  desc: "Bobot setiap CP dimodifikasi secara artifisial (±5%, ±10%, ±15%, ±20%) untuk menguji dampaknya terhadap peringkat.",
                },
                {
                  step: "2",
                  title: "Redistribusi Proporsional",
                  desc: "Bobot CP lain disesuaikan secara proporsional agar total bobot tetap = 1.0 (100%).",
                },
                {
                  step: "3",
                  title: "Evaluasi Kestabilan",
                  desc: "Peringkat baru dibandingkan dengan baseline. Dihitung berapa skenario yang menggeser posisi ranking.",
                },
              ].map((m) => (
                <div
                  key={m.step}
                  className="p-4 rounded-xl border bg-muted/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                      {m.step}
                    </span>
                    <h4 className="text-sm font-semibold">{m.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* ═══ SECTION: BASELINE ═══ */}
          <CollapsibleSection
            id="baseline"
            title="Baseline — Ranking Awal (dari Database)"
            icon={<BarChart3 className="h-5 w-5 text-cyan-400" />}
            isOpen={openSections.baseline}
            onToggle={() => toggleSection("baseline")}
            delay={0.2}
          >
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left font-semibold text-muted-foreground w-16">
                      #
                    </th>
                    <th className="p-3 text-left font-semibold text-muted-foreground">
                      Critical Point
                    </th>
                    <th className="p-3 text-right font-semibold text-muted-foreground w-28">
                      Bobot
                    </th>
                    <th className="p-3 text-left font-semibold text-muted-foreground min-w-[200px]">
                      Distribusi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {data.baseline.map((r, i) => {
                    const maxW = data.baseline[0]?.weight || 1;
                    const barPct = (r.weight / maxW) * 100;
                    return (
                      <motion.tr
                        key={r.cpId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              i === 0
                                ? "bg-amber-500/20 text-amber-400"
                                : i === 1
                                  ? "bg-slate-400/20 text-slate-300"
                                  : i === 2
                                    ? "bg-orange-700/20 text-orange-500"
                                    : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: CP_COLORS[r.cpId] }}
                            />
                            <span className="font-medium text-sm">
                              {r.cpId}
                            </span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {r.cpName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-sm">
                          {r.percentage}
                        </td>
                        <td className="p-3">
                          <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{
                                delay: 0.1 * i,
                                duration: 0.6,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: CP_COLORS[r.cpId],
                                opacity: 0.7,
                              }}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          {/* ═══ SECTION: INTERACTIVE SIMULATOR ═══ */}
          <CollapsibleSection
            id="simulator"
            title="Simulator Perturbasi Interaktif"
            icon={<Sliders className="h-5 w-5 text-emerald-400" />}
            isOpen={openSections.simulator}
            onToggle={() => toggleSection("simulator")}
            delay={0.25}
          >
            <div className="space-y-5">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                    Pilih CP Target
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {data.baseline
                      .map((b) => b.cpId)
                      .sort()
                      .map((cpId) => (
                        <button
                          key={cpId}
                          onClick={() => {
                            setSelectedCP(cpId);
                            setSliderValue(0);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            selectedCP === cpId
                              ? `${CP_BG[cpId]} text-foreground`
                              : "bg-muted/20 text-muted-foreground hover:bg-muted/40 border-transparent"
                          }`}
                        >
                          {cpId}
                        </button>
                      ))}
                  </div>
                </div>
                <div className="sm:w-64">
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                    Perturbasi: <span className={`font-bold ${sliderValue === 0 ? 'text-muted-foreground' : sliderValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sliderValue > 0 ? `+${sliderValue}` : sliderValue}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min={-25}
                    max={25}
                    step={1}
                    value={sliderValue}
                    onChange={(e) =>
                      setSliderValue(parseInt(e.target.value))
                    }
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-cyan-500
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500
                      [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/30
                      bg-gradient-to-r from-red-500/30 via-muted/40 to-emerald-500/30"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>-25%</span>
                    <span>0%</span>
                    <span>+25%</span>
                  </div>
                </div>
              </div>

              {/* Simulator Results Table */}
              {sliderResult && (
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 text-left font-semibold text-muted-foreground w-16">
                          #
                        </th>
                        <th className="p-3 text-left font-semibold text-muted-foreground">
                          CP
                        </th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">
                          Bobot Baru
                        </th>
                        <th className="p-3 text-center font-semibold text-muted-foreground w-24">
                          Perubahan
                        </th>
                        <th className="p-3 text-left font-semibold text-muted-foreground min-w-[180px]">
                          Distribusi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <AnimatePresence mode="popLayout">
                        {sliderResult.map((r) => {
                          const baseRank =
                            data.baseline.find(
                              (b) => b.cpId === r.cpId
                            )?.rank || 0;
                          const delta = baseRank - r.rank;
                          const maxW = sliderResult[0]?.weight || 1;
                          const barPct = (r.weight / maxW) * 100;
                          return (
                            <motion.tr
                              key={r.cpId}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className={`transition-colors ${
                                r.cpId === selectedCP
                                  ? "bg-cyan-500/5"
                                  : "hover:bg-muted/20"
                              }`}
                            >
                              <td className="p-3">
                                <span className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-bold">
                                  {r.rank}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: CP_COLORS[r.cpId],
                                    }}
                                  />
                                  <span
                                    className={`font-medium ${
                                      r.cpId === selectedCP
                                        ? "text-cyan-400"
                                        : ""
                                    }`}
                                  >
                                    {r.cpId}
                                  </span>
                                  {r.cpId === selectedCP && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-medium">
                                      TARGET
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono font-semibold">
                                {r.percentage}
                              </td>
                              <td className="p-3 text-center">
                                {delta > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    +{delta}
                                  </span>
                                ) : delta < 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    {delta}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Minus className="h-3.5 w-3.5" />
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${barPct}%`,
                                    }}
                                    transition={{
                                      duration: 0.4,
                                      ease: "easeOut",
                                    }}
                                    className="h-full rounded-full"
                                    style={{
                                      backgroundColor:
                                        CP_COLORS[r.cpId],
                                      opacity: 0.7,
                                    }}
                                  />
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ═══ SECTION: SENSITIVITY MATRIX ═══ */}
          <CollapsibleSection
            id="matrix"
            title="Matriks Sensitivitas Seluruh CP"
            icon={<Gauge className="h-5 w-5 text-amber-400" />}
            isOpen={openSections.matrix}
            onToggle={() => toggleSection("matrix")}
            delay={0.3}
          >
            {matrixData && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Setiap cell menunjukkan peringkat baru CP target setelah
                  perturbasi. <span className="text-emerald-400 font-semibold">Hijau</span> = stabil,{" "}
                  <span className="text-amber-400 font-semibold">Kuning</span> = ranking berubah,{" "}
                  <span className="text-red-400 font-semibold">Merah</span> = Top-1 berubah.
                </p>
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 text-left font-semibold text-muted-foreground sticky left-0 bg-muted/50 z-10">
                          CP Target
                        </th>
                        {matrixData.variations.map((v) => (
                          <th
                            key={v}
                            className={`p-3 text-center font-semibold ${
                              v > 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {v > 0 ? `+${v}%` : `${v}%`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {matrixData.cpIds.map((cpId, rowIdx) => {
                        const baseRank =
                          data.baseline.find((b) => b.cpId === cpId)
                            ?.rank || 0;
                        return (
                          <tr
                            key={cpId}
                            className="hover:bg-muted/10"
                          >
                            <td className="p-3 font-bold sticky left-0 bg-background z-10">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CP_COLORS[cpId],
                                  }}
                                />
                                {cpId}
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  (#{baseRank})
                                </span>
                              </div>
                            </td>
                            {matrixData.variations.map((v) => {
                              const cell =
                                matrixData.grid[cpId]?.[v];
                              if (!cell) {
                                return (
                                  <td
                                    key={v}
                                    className="p-3 text-center text-muted-foreground"
                                  >
                                    —
                                  </td>
                                );
                              }
                              const bg = cell.topChanged
                                ? "bg-red-500/15 text-red-400"
                                : cell.changed
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-emerald-500/10 text-emerald-400";
                              return (
                                <td key={v} className="p-2 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${bg}`}
                                  >
                                    #{cell.rank}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* ═══ SECTION: SENSITIVITY INDEX ═══ */}
          <CollapsibleSection
            id="index"
            title="Indeks Sensitivitas Per CP"
            icon={<Sparkles className="h-5 w-5 text-violet-400" />}
            isOpen={openSections.index}
            onToggle={() => toggleSection("index")}
            delay={0.35}
          >
            <div className="space-y-4">
              {/* Horizontal Bar Chart */}
              <div className="space-y-2.5">
                {data.sensitivityIndex
                  .sort((a, b) => b.sensitivityScore - a.sensitivityScore)
                  .map((si, i) => (
                    <motion.div
                      key={si.cpId}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-12 text-xs font-bold flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: CP_COLORS[si.cpId],
                          }}
                        />
                        {si.cpId}
                      </div>
                      <div className="flex-1 bg-muted/20 rounded-full h-6 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${si.sensitivityScore * 100}%`,
                          }}
                          transition={{
                            delay: 0.1 * i,
                            duration: 0.5,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: CP_COLORS[si.cpId],
                            opacity: 0.6,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-[10px] font-semibold">
                          {si.rankChangeCount}/{si.totalScenarios}{" "}
                          skenario berubah
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-lg border font-semibold whitespace-nowrap ${
                          STABILITY_COLORS[si.stability] || ""
                        }`}
                      >
                        {si.stability}
                      </span>
                    </motion.div>
                  ))}
              </div>

              {/* Detail Table */}
              <div className="overflow-x-auto rounded-xl border border-border/50 mt-4">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 text-left font-semibold text-muted-foreground">
                        CP
                      </th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">
                        Bobot Baseline
                      </th>
                      <th className="p-3 text-center font-semibold text-muted-foreground">
                        Total Skenario
                      </th>
                      <th className="p-3 text-center font-semibold text-amber-400">
                        Ranking Berubah
                      </th>
                      <th className="p-3 text-center font-semibold text-red-400">
                        Top-1 Berubah
                      </th>
                      <th className="p-3 text-center font-semibold text-muted-foreground">
                        Skor Sensitivitas
                      </th>
                      <th className="p-3 text-center font-semibold text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {data.sensitivityIndex.map((si) => (
                      <tr
                        key={si.cpId}
                        className="hover:bg-muted/10"
                      >
                        <td className="p-3 font-bold">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: CP_COLORS[si.cpId],
                              }}
                            />
                            {si.cpId}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {(si.baselineWeight * 100).toFixed(2)}%
                        </td>
                        <td className="p-3 text-center">
                          {si.totalScenarios}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold ${
                              si.rankChangeCount > 0
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {si.rankChangeCount}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold ${
                              si.topChangeCount > 0
                                ? "text-red-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {si.topChangeCount}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {(si.sensitivityScore * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${
                              STABILITY_COLORS[si.stability] || ""
                            }`}
                          >
                            {si.stability}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>

          {/* ═══ SECTION: CONCLUSION ═══ */}
          <CollapsibleSection
            id="conclusion"
            title="Kesimpulan Analisis"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            isOpen={openSections.conclusion}
            onToggle={() => toggleSection("conclusion")}
            delay={0.4}
          >
            <div className="space-y-4">
              {/* Main conclusion card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border bg-gradient-to-br ${robustCfg.bg} backdrop-blur-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center flex-shrink-0">
                    <RobustIcon className={`h-6 w-6 ${robustCfg.color}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${robustCfg.color}`}>
                      Model {data.conclusion.robustnessLevel}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {data.conclusion.summary}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Detail cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">
                      Paling Stabil
                    </span>
                  </div>
                  <p className="text-sm font-bold">
                    {data.conclusion.mostStableCPId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.conclusion.mostStableCPName}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">
                      Paling Sensitif
                    </span>
                  </div>
                  <p className="text-sm font-bold">
                    {data.conclusion.mostSensitiveCPId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.conclusion.mostSensitiveCPName}
                  </p>
                </div>
              </div>

              {/* Top-3 stability indicator */}
              <div
                className={`p-4 rounded-xl border ${
                  data.conclusion.top3Stable
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.conclusion.top3Stable ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      Top-3 Prioritas:{" "}
                      {data.conclusion.top3CPs.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.conclusion.top3Stable
                        ? "Posisi Top-3 tetap stabil pada seluruh skenario perturbasi ±5% s.d. ±20%."
                        : "Terdapat pergeseran pada posisi Top-3 di beberapa skenario. Perlu evaluasi lebih lanjut."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </main>
    </>
  );
}

// ─── Collapsible Section Component ───
function CollapsibleSection({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
  delay = 0,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="mb-6"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 rounded-t-2xl border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
        style={{
          borderRadius: isOpen ? "1rem 1rem 0 0" : "1rem",
        }}
      >
        {icon}
        <h2 className="text-sm sm:text-base font-bold flex-1 text-left">
          {title}
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 border border-t-0 rounded-b-2xl bg-card/30 backdrop-blur-sm">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
