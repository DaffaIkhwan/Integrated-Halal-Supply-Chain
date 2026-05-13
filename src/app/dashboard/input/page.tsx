"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Beef,
  Save,
  RotateCcw,
  Info,
} from "lucide-react";
import { CP_OPTIONS_MAP, getRiskFromOption } from "@/lib/data";
import type { CriteriaDropdown } from "@/lib/data";
import { useSession } from "next-auth/react";

const ALL_CPS = ["CP1","CP2","CP3","CP4","CP5","CP6","CP7","CP8","CP9","CP10"];

const ROLE_TO_CP: Record<string, string[]> = {
  ADMIN: ALL_CPS,
  CP1_FARM: ["CP1"],
  CP2_FEED: ["CP2"],
  CP3_TRANSPORT: ["CP3"],
  CP4_SLAUGHTER: ["CP4"],
  CP5_POST_SLAUGHTER: ["CP5"],
  CP6_PROCESSING: ["CP6"],
  CP7_STORAGE: ["CP7"],
  CP8_DISTRIBUTION: ["CP8"],
  CP9_RETAIL: ["CP9"],
  CP10_CONSUMER: ["CP10"],
};

// ─── Types ───
interface BatchOption {
  id: string;
  earTag: string;
  farmName: string;
  rphName: string;
  totalRiskScore: number;
  riskLevel: string;
}

// ─── Risk Dropdown Component ───
function RiskDropdown({
  criteria,
  selectedValue,
  weight,
  onChange,
}: {
  criteria: CriteriaDropdown;
  selectedValue: string;
  weight: number;
  onChange: (optionValue: string) => void;
}) {
  const selectedOption = criteria.options.find((o) => o.value === selectedValue);
  const risk = selectedOption?.risk ?? 0;

  const color =
    risk <= 0.07
      ? "text-emerald-400"
      : risk <= 0.23
      ? "text-green-400"
      : risk <= 0.43
      ? "text-amber-400"
      : risk <= 0.65
      ? "text-orange-400"
      : "text-red-400";

  const borderColor =
    risk <= 0.07
      ? "border-emerald-500/30 focus:ring-emerald-500/30"
      : risk <= 0.23
      ? "border-green-500/30 focus:ring-green-500/30"
      : risk <= 0.43
      ? "border-amber-500/30 focus:ring-amber-500/30"
      : risk <= 0.65
      ? "border-orange-500/30 focus:ring-orange-500/30"
      : "border-red-500/30 focus:ring-red-500/30";

  const riskLabel =
    risk <= 0.07
      ? "Aman"
      : risk <= 0.23
      ? "Rendah"
      : risk <= 0.43
      ? "Sedang"
      : risk <= 0.65
      ? "Tinggi"
      : "Kritis";

  return (
    <div className="py-2.5 px-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-primary">
            {criteria.criteriaCode}
          </span>
          <span className="text-sm">{criteria.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            bobot: {(weight * 100).toFixed(1)}%
          </span>
          {selectedValue && (
            <span className={`text-xs font-bold ${color} min-w-[42px] text-right`}>
              {riskLabel} ({(risk * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      </div>
      <select
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-lg border ${borderColor} bg-background text-sm focus:outline-none focus:ring-2 transition-colors cursor-pointer`}
      >
        <option value="">— Pilih kondisi —</option>
        {criteria.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── CP Section (Accordion) ───
function CPSection({
  cpId,
  cpLabel,
  criteriaList,
  values,
  weights,
  onChange,
  index,
}: {
  cpId: string;
  cpLabel: string;
  criteriaList: CriteriaDropdown[];
  values: Record<string, string>;
  weights: Record<string, number>;
  onChange: (key: string, optionValue: string) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 2);

  // Calculate fill percentage
  const filled = criteriaList.filter((c) => values[c.key]).length;
  const total = criteriaList.length;
  const fillPct = total > 0 ? Math.round((filled / total) * 100) : 0;

  // Calculate avg risk from selected options
  const selectedRisks = criteriaList
    .map((c) => {
      if (!values[c.key]) return null;
      return getRiskFromOption(cpId, c.key, values[c.key]);
    })
    .filter((r): r is number => r !== null);

  const avg = selectedRisks.length > 0
    ? selectedRisks.reduce((a, b) => a + b, 0) / selectedRisks.length
    : 0;

  const sectionColor =
    filled === 0
      ? "border-border"
      : avg <= 0.23
      ? "border-emerald-500/30"
      : avg <= 0.43
      ? "border-amber-500/30"
      : avg <= 0.65
      ? "border-orange-500/30"
      : "border-red-500/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border-2 ${sectionColor} bg-card overflow-hidden shadow-sm`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
            {cpId}
          </span>
          <span className="font-semibold text-sm">
            {cpLabel.split("—")[1]?.trim() || cpLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            ({filled}/{total} terisi)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {filled > 0 && (
            <span
              className={`text-xs font-bold ${
                avg <= 0.23
                  ? "text-emerald-400"
                  : avg <= 0.43
                  ? "text-amber-400"
                  : avg <= 0.65
                  ? "text-orange-400"
                  : "text-red-400"
              }`}
            >
              {(avg * 100).toFixed(0)}% risk
            </span>
          )}
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
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
            <div className="px-5 pb-4 space-y-2">
              {criteriaList.map((criteria) => (
                <RiskDropdown
                  key={criteria.key}
                  criteria={criteria}
                  selectedValue={values[criteria.key] || ""}
                  weight={weights[criteria.criteriaCode] || 0}
                  onChange={(val) => onChange(criteria.key, val)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Input Page ───
export default function InputPage() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role || "ADMIN";
  
  const cpOrder = useMemo(() => {
    const allowedCPs = ROLE_TO_CP[userRole] || ALL_CPS;
    return ALL_CPS.filter((cp) => allowedCPs.includes(cp));
  }, [userRole]);

  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, Record<string, number>>>({});
  const [selectedBatchId, setSelectedBatchId] = useState("");
  // Values now store option value strings instead of numeric risk
  const [cpSelections, setCpSelections] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ totalRiskScore: number; riskLevel: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dss/input").then((r) => r.json()),
      fetch("/api/dss/dashboard").then((r) => r.json()),
    ])
      .then(([inputData, dashData]) => {
        setBatches(
          (dashData.batches || []).map((b: BatchOption & { id: string }) => ({
            id: b.id,
            earTag: b.earTag,
            farmName: b.farmName,
            rphName: b.rphName,
            totalRiskScore: b.totalRiskScore,
            riskLevel: b.riskLevel,
          }))
        );

        // Build criteria weights map
        const wMap: Record<string, Record<string, number>> = {};
        for (const cp of inputData.criticalPoints || []) {
          wMap[cp.id] = {};
          for (const cw of cp.criteriaWeights) {
            wMap[cp.id][cw.criteriaCode] = cw.weight;
          }
        }
        setCriteriaWeights(wMap);

        // Initialize empty selections
        const init: Record<string, Record<string, string>> = {};
        for (const cpId of cpOrder) {
          const cpOpts = CP_OPTIONS_MAP[cpId];
          if (cpOpts) {
            init[cpId] = {};
            for (const c of cpOpts.criteria) {
              init[cpId][c.key] = "";
            }
          }
        }
        setCpSelections(init);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [cpOrder]);

  const handleFieldChange = useCallback((cpId: string, key: string, optionValue: string) => {
    setCpSelections((prev) => ({
      ...prev,
      [cpId]: { ...prev[cpId], [key]: optionValue },
    }));
    setResult(null);
  }, []);

  const handleReset = useCallback(() => {
    setCpSelections((prev) => {
      const reset: Record<string, Record<string, string>> = {};
      for (const [cpId, fields] of Object.entries(prev)) {
        reset[cpId] = {};
        for (const key of Object.keys(fields)) {
          reset[cpId][key] = "";
        }
      }
      return reset;
    });
    setResult(null);
  }, []);

  const handleSubmit = async () => {
    if (!selectedBatchId) {
      setError("Pilih batch terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);

    // Convert dropdown selections to risk values for API
    const cpData: Record<string, Record<string, number>> = {};
    for (const [cpId, fields] of Object.entries(cpSelections)) {
      cpData[cpId] = {};
      for (const [key, optionValue] of Object.entries(fields)) {
        cpData[cpId][key] = optionValue ? getRiskFromOption(cpId, key, optionValue) : 0;
      }
    }

    try {
      const res = await fetch("/api/dss/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: selectedBatchId, cpData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ totalRiskScore: data.totalRiskScore, riskLevel: data.riskLevel });
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Input Data
            </span>{" "}
            Critical Points
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pilih kondisi aktual untuk setiap kriteria pada 10 Critical Point halal.
          </p>
        </div>

        {/* Batch Selector */}
        <div className="rounded-2xl border bg-card p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Beef className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Pilih Halal Batch</h2>
          </div>

          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">— Pilih batch —</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.earTag} — {b.farmName} → {b.rphName} (Risk: {(b.totalRiskScore * 100).toFixed(1)}% - {b.riskLevel})
              </option>
            ))}
          </select>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/10 rounded-xl p-3">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Pilih kondisi aktual dari dropdown untuk setiap kriteria.
              Setiap opsi memiliki <strong>nilai risiko</strong> yang dihitung
              menggunakan metode Fuzzy AHP (Triangular Fuzzy Number).
              Bobot sub-kriteria otomatis dari matriks pakar.
            </p>
          </div>
        </div>

        {/* CP Input Sections */}
        <div className="space-y-3">
          {cpOrder.map((cpId, i) => {
            const cpOpts = CP_OPTIONS_MAP[cpId];
            if (!cpOpts) return null;
            return (
              <CPSection
                key={cpId}
                cpId={cpId}
                cpLabel={cpOpts.cpLabel}
                criteriaList={cpOpts.criteria}
                values={cpSelections[cpId] || {}}
                weights={criteriaWeights[cpId] || {}}
                onChange={(key, val) => handleFieldChange(cpId, key, val)}
                index={i}
              />
            );
          })}
        </div>

        {/* Result Banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`rounded-2xl p-6 text-center ${
                result.riskLevel === "Low"
                  ? "bg-emerald-500/15 border-2 border-emerald-500/30"
                  : result.riskLevel === "Moderate"
                  ? "bg-amber-500/15 border-2 border-amber-500/30"
                  : result.riskLevel === "High"
                  ? "bg-orange-500/15 border-2 border-orange-500/30"
                  : "bg-red-500/15 border-2 border-red-500/30"
              }`}
            >
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-400" />
              <p className="font-bold text-lg">Data Berhasil Disimpan!</p>
              <p className="text-3xl font-mono font-bold mt-2">
                {(result.totalRiskScore * 100).toFixed(1)}% — {result.riskLevel}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total Risk Score dihitung berdasarkan bobot Fuzzy AHP
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" /> Reset Semua
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedBatchId}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitting ? "Menghitung Risk Score..." : "Simpan & Hitung Risk Score"}
          </button>
        </div>
      </main>
    </div>
  );
}
