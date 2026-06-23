"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Calendar,
  Beef,
  Factory,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Shield,
} from "lucide-react";

interface CpRecord {
  cpId: string;
  cpName: string;
  status: string;
  riskValue: number;
  weightedRisk: number;
  riskLevel: string;
}

interface TraceData {
  id: string;
  productionDate: string;
  totalRiskScore: number;
  riskLevel: string;
  earTag: string;
  breed: string | null;
  farmName: string;
  farmLocation: string | null;
  rphName: string;
  rphLocation: string | null;
  butcherName: string | null;
  cpRecords: CpRecord[];
}

function getRiskColor(level: string) {
  const l = level.toUpperCase();
  if (l === "LOW" || l === "VERY LOW") return { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500" };
  if (l === "MEDIUM" || l === "MODERATE") return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", dot: "bg-amber-500" };
  if (l === "HIGH") return { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" };
  if (l === "VERY HIGH" || l === "CRITICAL") return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/30", dot: "bg-red-500" };
  return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" };
}

function getStatusIcon(status: string) {
  switch (status.toUpperCase()) {
    case "PASS": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "FAIL": return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-amber-500" />;
  }
}

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function TraceSummaryUI({ data }: { data: TraceData }) {
  const riskColors = getRiskColor(data.riskLevel);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="relative px-5 py-4 border-b border-border/30 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="h-4 w-4 text-cyan-500" />
              <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                Halal Traceability
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Lacak <span className="text-cyan-600 dark:text-cyan-400">{data.earTag}</span>
            </h2>
          </div>
          
          <div className={`flex flex-col items-end`}>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${riskColors.bg} ${riskColors.border}`}>
              {data.riskLevel.toUpperCase().includes("HIGH") ? (
                <ShieldAlert className={`h-4 w-4 ${riskColors.text}`} />
              ) : (
                <ShieldCheck className={`h-4 w-4 ${riskColors.text}`} />
              )}
              <span className={`text-xs font-bold ${riskColors.text}`}>
                {data.riskLevel}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Score: {data.totalRiskScore}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
              <Beef className="h-3.5 w-3.5 text-cyan-500" />
              Info Sapi
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p>Breed: <span className="font-semibold text-foreground">{data.breed || "-"}</span></p>
              <p className="truncate flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.farmName}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
              <Factory className="h-3.5 w-3.5 text-emerald-500" />
              Pemotongan
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p className="truncate">{data.rphName}</p>
              <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(data.productionDate).toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        </div>

        {/* Batch ID */}
        <div className="rounded-xl border border-border/30 bg-muted/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Batch ID</span>
          <span className="font-mono text-xs font-bold text-foreground">{data.id.split("-")[0]}</span>
        </div>

        {/* Timeline */}
        {data.cpRecords.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Status Compliance (CP1-CP9)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {data.cpRecords.map((cp, i) => {
                const colors = getRiskColor(cp.riskLevel);
                return (
                  <motion.div
                    key={cp.cpId}
                    {...fadeUp}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`rounded-lg border ${colors.border} ${colors.bg} p-2 flex items-center gap-2`}
                  >
                    {getStatusIcon(cp.status)}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-foreground truncate">{cp.cpId}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{cp.cpName}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
