"use client";

import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  QrCode,
  MapPin,
  Calendar,
  Beef,
  Factory,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function TracePageClient({ data }: { data: TraceData }) {
  const riskColors = getRiskColor(data.riskLevel);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 py-8 md:py-12">
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <QrCode className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Halal Traceability
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.15 }}
            className="text-2xl md:text-3xl font-bold tracking-tight"
          >
            Lacak Produk{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
              {data.earTag}
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            Informasi lengkap rantai pasok halal dari peternakan hingga retail
          </motion.p>

          {/* Risk Score Badge */}
          <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="mt-5">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${riskColors.bg} ${riskColors.border}`}>
              {data.riskLevel.toUpperCase().includes("HIGH") ? (
                <ShieldAlert className={`h-5 w-5 ${riskColors.text}`} />
              ) : (
                <ShieldCheck className={`h-5 w-5 ${riskColors.text}`} />
              )}
              <div>
                <p className={`text-xs font-bold ${riskColors.text}`}>
                  Risk Level: {data.riskLevel}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Total Risk Score: {data.totalRiskScore}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Batch Info Cards */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {/* Cattle Card */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Beef className="h-4 w-4 text-cyan-500" />
              Informasi Sapi
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Eartag:{" "}
                <span className="font-mono font-bold text-foreground">{data.earTag}</span>
              </p>
              <p>
                Jenis:{" "}
                <span className="font-semibold text-foreground">{data.breed || "-"}</span>
              </p>
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {data.farmName}{data.farmLocation ? `, ${data.farmLocation}` : ""}
              </p>
            </div>
          </div>

          {/* RPH Card */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Factory className="h-4 w-4 text-emerald-500" />
              Pemotongan (RPH)
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                RPH:{" "}
                <span className="font-semibold text-foreground">{data.rphName}</span>
              </p>
              {data.butcherName && (
                <p>
                  Juru Sembelih:{" "}
                  <span className="font-semibold text-foreground">{data.butcherName}</span>
                </p>
              )}
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(data.productionDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Batch ID */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border/30 bg-muted/30 px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Batch ID</p>
            <p className="font-mono text-xs font-bold text-foreground mt-0.5">{data.id}</p>
          </div>
          <Shield className="h-5 w-5 text-muted-foreground/40" />
        </motion.div>

        {/* CP Timeline */}
        {data.cpRecords.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
            <h2 className="text-sm font-bold tracking-tight mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-500" />
              Status Compliance (9 Titik Kritis)
            </h2>
            <div className="space-y-2">
              {data.cpRecords.map((cp, i) => {
                const colors = getRiskColor(cp.riskLevel);
                return (
                  <motion.div
                    key={cp.cpId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className={`rounded-xl border ${colors.border} ${colors.bg} px-4 py-3 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(cp.status)}
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {cp.cpId}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{cp.cpName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold ${colors.text} px-2 py-0.5 rounded-md ${colors.bg} border ${colors.border}`}>
                        {cp.riskLevel}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Score: {cp.riskValue}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CTA: Chat */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.8 }}
          className="pt-2 pb-8"
        >
          <Link
            href={`/chat?trace=${data.id}`}
            className="group flex items-center justify-center gap-3 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-5 py-3.5 text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
          >
            <MessageCircle className="h-5 w-5" />
            Tanya Chatbot untuk Analisis Lengkap
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            AI akan menganalisis seluruh data compliance dan memberikan rekomendasi
          </p>
        </motion.div>
      </div>
    </div>
  );
}
