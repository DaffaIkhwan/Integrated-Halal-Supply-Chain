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
  Truck,
  Warehouse,
  Store,
  Package,
} from "lucide-react";

interface CpRecord {
  cpId: string;
  cpName: string;
  status: string;
  riskValue: number;
  weightedRisk: number;
  riskLevel: string;
  highestSubCp?: string;
  highestSubCpValue?: number;
}

interface TraceData {
  id: string;
  productionDate: string;
  totalRiskScore: number;
  riskLevel: string;
  earTag: string;
  breed: string | null;
  birthDate?: string | null;
  farmName: string;
  farmLocation: string | null;
  rphName: string;
  rphLocation: string | null;
  butcherName: string | null;
  cpRecords: CpRecord[];
  transport?: { name: string; vehicleNumber?: string; origin?: string; destination?: string; animalCount?: number } | null;
  processing?: { name: string; location?: string } | null;
  storage?: { name: string; location?: string } | null;
  distribution?: { name: string; location?: string; coverageArea?: string } | null;
  retail?: { name: string; location?: string; outletType?: string } | null;
}

function getRiskColor(level: string) {
  const l = level.toUpperCase();
  if (l === "LOW" || l === "VERY LOW") return { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" };
  if (l === "MEDIUM" || l === "MODERATE") return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30" };
  if (l === "HIGH") return { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30" };
  if (l === "VERY HIGH" || l === "CRITICAL") return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/30" };
  return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
}

function getStatusIcon(status: string) {
  switch (status.toUpperCase()) {
    case "PASS": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "FAIL": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    default: return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  }
}

export function TraceSummaryUI({ data }: { data: TraceData }) {
  const riskColors = getRiskColor(data.riskLevel);

  return (
    <div className="w-full max-w-2xl mx-auto mb-4 bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
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
            <h2 className="text-lg font-bold tracking-tight">
              Lacak <span className="text-cyan-600 dark:text-cyan-400">{data.earTag}</span>
            </h2>
          </div>

          <div className="flex flex-col items-end">
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
      <div className="p-4 space-y-3">
        {/* Info Cards: Sapi & RPH */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
              <Beef className="h-3.5 w-3.5 text-cyan-500" />
              Info Sapi
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p>Eartag: <span className="font-mono font-bold text-foreground">{data.earTag}</span></p>
              <p>Breed: <span className="font-semibold text-foreground">{data.breed || "-"}</span></p>
              {data.birthDate && (
                <p>Lahir: <span className="font-semibold text-foreground">{new Date(data.birthDate).toLocaleDateString("id-ID")}</span></p>
              )}
              <p className="truncate flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {data.farmName}{data.farmLocation ? `, ${data.farmLocation}` : ""}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
              <Factory className="h-3.5 w-3.5 text-emerald-500" />
              Pemotongan (RPH)
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p className="truncate font-semibold text-foreground">{data.rphName}</p>
              {data.butcherName && <p>Juru Sembelih: <span className="font-semibold text-foreground">{data.butcherName}</span></p>}
              <p className="flex items-center gap-1"><Calendar className="h-3 w-3 shrink-0" /> {new Date(data.productionDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              {data.rphLocation && <p className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {data.rphLocation}</p>}
            </div>
          </div>
        </div>

        {/* Supply Chain Entities (if available) */}
        {(data.transport || data.processing || data.storage || data.distribution || data.retail) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.transport && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] font-bold flex items-center gap-1 mb-1"><Truck className="h-3 w-3 text-blue-500" /> Transport</p>
                <p className="text-[10px] text-muted-foreground truncate">{data.transport.name}</p>
                {data.transport.vehicleNumber && <p className="text-[10px] font-mono text-foreground">{data.transport.vehicleNumber}</p>}
              </div>
            )}
            {data.processing && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] font-bold flex items-center gap-1 mb-1"><Package className="h-3 w-3 text-indigo-500" /> Processing</p>
                <p className="text-[10px] text-muted-foreground truncate">{data.processing.name}</p>
              </div>
            )}
            {data.storage && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] font-bold flex items-center gap-1 mb-1"><Warehouse className="h-3 w-3 text-teal-500" /> Storage</p>
                <p className="text-[10px] text-muted-foreground truncate">{data.storage.name}</p>
              </div>
            )}
            {data.distribution && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] font-bold flex items-center gap-1 mb-1"><Truck className="h-3 w-3 text-orange-500" /> Distribusi</p>
                <p className="text-[10px] text-muted-foreground truncate">{data.distribution.name}</p>
                {data.distribution.coverageArea && <p className="text-[10px] text-muted-foreground">{data.distribution.coverageArea}</p>}
              </div>
            )}
            {data.retail && (
              <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                <p className="text-[10px] font-bold flex items-center gap-1 mb-1"><Store className="h-3 w-3 text-pink-500" /> Retail</p>
                <p className="text-[10px] text-muted-foreground truncate">{data.retail.name}</p>
                {data.retail.outletType && <p className="text-[10px] text-muted-foreground">{data.retail.outletType}</p>}
              </div>
            )}
          </div>
        )}

        {/* Batch ID */}
        <div className="rounded-lg border border-border/30 bg-muted/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Batch ID</span>
          <span className="font-mono text-[11px] font-bold text-foreground">{data.id.split("-")[0]}</span>
        </div>

        {/* CP Records Table */}
        {data.cpRecords.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
              Rekaman Kepatuhan (CP1-CP9)
            </p>

            {/* Table */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/30">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Titik Kritis</th>
                      <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Risk</th>
                      <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Weighted</th>
                      <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Sub-CP Tertinggi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cpRecords.map((cp, i) => {
                      const colors = getRiskColor(cp.riskLevel);
                      return (
                        <motion.tr
                          key={cp.cpId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 * i }}
                          className="border-b border-border/20 last:border-0"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(cp.status)}
                              <div>
                                <span className="font-bold text-foreground">{cp.cpId}</span>
                                <span className="text-muted-foreground ml-1 hidden sm:inline">{cp.cpName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-right px-2 py-2">
                            <span className={`font-mono font-bold ${colors.text}`}>
                              {cp.riskValue}
                            </span>
                          </td>
                          <td className="text-right px-2 py-2 font-mono text-muted-foreground">
                            {cp.weightedRisk}
                          </td>
                          <td className="px-2 py-2 text-muted-foreground">
                            {cp.highestSubCp || "-"}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
