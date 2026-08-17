"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { useEffect, useState, useCallback } from "react";
import { 
  Calculator, 
  Scale, 
  ChevronRight,
  ChevronDown,
  Loader2,
  BookOpen,
  FileText,
  Layers,
  Shield,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

const CP_LIST = [
  { code: 'CP1', label: 'CP1 — Kandang Sapi / Farm' },
  { code: 'CP2', label: 'CP2 — Pakan dan Kesehatan Ternak' },
  { code: 'CP3', label: 'CP3 — Transportasi Hewan' },
  { code: 'CP4', label: 'CP4 — RPH dan Penyembelihan' },
  { code: 'CP5', label: 'CP5 — Penanganan Karkas / Post-Slaughter' },
  { code: 'CP6', label: 'CP6 — Produksi / Pengolahan' },
  { code: 'CP7', label: 'CP7 — Penyimpanan / Cold Storage' },
  { code: 'CP8', label: 'CP8 — Distribusi Produk' },
  { code: 'CP9', label: 'CP9 — Retail' },
];

const RISK_COLORS: Record<number, string> = {
  1: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  2: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  3: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  4: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  5: 'text-red-500 bg-red-500/10 border-red-500/30',
};

const RISK_BADGE_COLORS: Record<number, string> = {
  1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  4: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  5: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function RuleBasedPage() {
  const [ruleBaseOverview, setRuleBaseOverview] = useState<any>(null);
  const [ruleBaseLoading, setRuleBaseLoading] = useState(false);
  const [ruleBaseError, setRuleBaseError] = useState<string | null>(null);
  
  // Default to having them all open since this is a dedicated page
  const [openRBSections, setOpenRBSections] = useState<Record<string, boolean>>({
    logika: true,
    perhitungan: true,
    detail: true
  });
  
  const [selectedCP, setSelectedCP] = useState('CP1');
  const [cpConstructData, setCpConstructData] = useState<any>(null);
  const [cpLoading, setCpLoading] = useState(false);
  const [expandedConstructs, setExpandedConstructs] = useState<Record<string, boolean>>({});
  const [expandedIndicators, setExpandedIndicators] = useState<Record<string, boolean>>({});

  const toggleRBSection = (key: string) => {
    setOpenRBSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchRuleBaseOverview = useCallback(() => {
    if (ruleBaseOverview) return;
    setRuleBaseLoading(true);
    setRuleBaseError(null);
    fetch('/api/dss/rule-base?section=overview&t=' + Date.now())
      .then(res => res.json())
      .then(resData => {
        if (resData.error) throw new Error(resData.error);
        setRuleBaseOverview(resData);
      })
      .catch(err => setRuleBaseError(err.message))
      .finally(() => setRuleBaseLoading(false));
  }, [ruleBaseOverview]);

  const fetchCPData = useCallback((cp: string) => {
    setCpLoading(true);
    fetch(`/api/dss/rule-base?section=construct&cp=${cp}&t=` + Date.now())
      .then(res => res.json())
      .then(resData => {
        if (resData.error) throw new Error(resData.error);
        setCpConstructData(resData);
      })
      .catch(err => setRuleBaseError(err.message))
      .finally(() => setCpLoading(false));
  }, []);

  useEffect(() => {
    if (openRBSections['logika'] || openRBSections['perhitungan'] || openRBSections['detail']) {
      fetchRuleBaseOverview();
    }
  }, [openRBSections, fetchRuleBaseOverview]);

  useEffect(() => {
    if (openRBSections['detail']) {
      fetchCPData(selectedCP);
    }
  }, [selectedCP, openRBSections, fetchCPData]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-[1000px] mx-auto w-full px-4 py-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="mx-auto bg-gradient-to-br from-rose-500/20 to-amber-500/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-4">
              <Shield className="h-8 w-8 text-rose-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Rule-Based{" "}
              <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                Risk Assessment
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Logika, perhitungan, dan detail indikator Rule-Based yang digunakan untuk mengevaluasi tingkat risiko kehalalan pada setiap titik kritis supply chain.
            </p>
          </div>

          {/* ─── DROPDOWN 1: Logika Rule-Based ─── */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => toggleRBSection('logika')}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-rose-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold">Logika Rule-Based</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Skala risiko, aturan agregasi, dan metodologi IF-THEN</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openRBSections['logika'] ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {openRBSections['logika'] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-border/50">
                    {ruleBaseLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                      </div>
                    ) : ruleBaseError ? (
                      <div className="py-6 text-center text-red-500 text-sm">{ruleBaseError}</div>
                    ) : ruleBaseOverview ? (
                      <>
                        {/* Metadata */}
                        <div className="mt-4 bg-muted/30 rounded-xl p-4 border border-border/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">📋 Metadata Rule Base</p>
                          <p className="text-sm font-bold text-foreground/90">{ruleBaseOverview.metadata.title}</p>
                          <div className="flex flex-wrap gap-3 mt-3">
                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg border">
                              <span className="text-muted-foreground">Konstruk:</span>{" "}
                              <span className="font-bold text-rose-400">{ruleBaseOverview.metadata.construct_count}</span>
                            </span>
                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg border">
                              <span className="text-muted-foreground">Indikator:</span>{" "}
                              <span className="font-bold text-amber-400">{ruleBaseOverview.metadata.indicator_count}</span>
                            </span>
                            <span className="text-xs bg-muted px-2.5 py-1 rounded-lg border">
                              <span className="text-muted-foreground">Total Rule:</span>{" "}
                              <span className="font-bold text-blue-400">{ruleBaseOverview.metadata.indicator_rule_count}</span>
                            </span>
                          </div>
                        </div>

                        {/* Risk Scale Table */}
                        <div>
                          <p className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Scale className="h-4 w-4 text-rose-400" /> Skala Risiko (5 Level)
                          </p>
                          <div className="overflow-x-auto rounded-xl border border-border/50">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Level</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Label (ID)</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Label (EN)</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Interpretasi</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Recommended Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {ruleBaseOverview.risk_scale.map((rs: any) => (
                                  <tr key={rs.level} className="hover:bg-muted/20">
                                    <td className="p-3">
                                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${RISK_BADGE_COLORS[rs.level] || ''}`}>
                                        {rs.level}
                                      </span>
                                    </td>
                                    <td className={`p-3 font-bold ${RISK_COLORS[rs.level]?.split(' ')[0] || ''}`}>{rs.label_id}</td>
                                    <td className="p-3 text-foreground/70">{rs.label_en}</td>
                                    <td className="p-3 text-foreground/80 max-w-[200px]">{rs.interpretation}</td>
                                    <td className="p-3 text-foreground/70 max-w-[250px] text-[11px]">{rs.recommended_action}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Aggregation Flow */}
                        <div>
                          <p className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Layers className="h-4 w-4 text-amber-400" /> Aturan Agregasi (Weakest-Link / MAX)
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { label: 'Indikator', rule: ruleBaseOverview.aggregation_rules.indicator, color: 'text-emerald-400', bgColor: 'from-emerald-500/10 to-emerald-500/5' },
                              { label: 'Konstruk', rule: ruleBaseOverview.aggregation_rules.construct, color: 'text-blue-400', bgColor: 'from-blue-500/10 to-blue-500/5' },
                              { label: 'Stage / CP', rule: ruleBaseOverview.aggregation_rules.stage, color: 'text-amber-400', bgColor: 'from-amber-500/10 to-amber-500/5' },
                              { label: 'Overall', rule: ruleBaseOverview.aggregation_rules.overall, color: 'text-rose-400', bgColor: 'from-rose-500/10 to-rose-500/5' },
                            ].map((item, i) => (
                              <div key={i} className={`rounded-xl bg-gradient-to-b ${item.bgColor} border border-border/50 p-3.5`}>
                                <p className={`text-xs font-bold ${item.color} mb-1.5`}>{item.label}</p>
                                <p className="text-[11px] text-foreground/70 font-mono leading-relaxed">{item.rule}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold">Indikator</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-semibold">Konstruk</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-semibold">Stage</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-semibold">Overall</span>
                          </div>
                        </div>

                        {/* Construct-Level Rules */}
                        <div>
                          <p className="text-sm font-bold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-400" /> Aturan Level Konstruk (Condition → Output)
                          </p>
                          <div className="overflow-x-auto rounded-xl border border-border/50">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Level</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Condition</th>
                                  <th className="p-3 text-center font-semibold text-muted-foreground">Kombinasi</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Output Label</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {ruleBaseOverview.aggregation_rules.construct_level_rules?.map((cr: any) => (
                                  <tr key={cr.level} className="hover:bg-muted/20">
                                    <td className="p-3">
                                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${RISK_BADGE_COLORS[cr.level] || ''}`}>
                                        {cr.level}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono text-foreground/80">{cr.condition}</td>
                                    <td className="p-3 text-center font-bold text-foreground/70">{cr.combination_count?.toLocaleString()}</td>
                                    <td className={`p-3 font-bold ${RISK_COLORS[cr.level]?.split(' ')[0] || ''}`}>{cr.output_label}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── DROPDOWN 2: Perhitungan Rule-Based ─── */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => toggleRBSection('perhitungan')}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold">Perhitungan Rule-Based</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Ringkasan konstruk, jumlah rule, dan mapping CP</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openRBSections['perhitungan'] ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {openRBSections['perhitungan'] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border/50">
                    {ruleBaseLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                      </div>
                    ) : ruleBaseOverview ? (
                      <>
                        {/* Explanation */}
                        <div className="mt-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-xl p-4 border border-amber-500/20">
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            <span className="font-bold text-amber-400">Cara Kerja:</span> Setiap konstruk (misal CP1.1) memiliki 5 indikator (I1–I5). 
                            Masing-masing indikator dinilai pada skala 1–5 berdasarkan <em>performance descriptor</em> yang cocok. 
                            Risiko konstruk ditentukan oleh <span className="font-mono font-bold text-amber-400">MAX(I1,I2,I3,I4,I5)</span> — prinsip weakest-link, 
                            di mana satu indikator terburuk menentukan risiko keseluruhan konstruk.
                          </p>
                        </div>

                        {/* Construct Summary Table */}
                        <div>
                          <p className="text-sm font-bold mb-3 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-amber-400" /> Daftar Konstruk ({ruleBaseOverview.metadata.construct_count} total)
                          </p>
                          <div className="overflow-x-auto rounded-xl border border-border/50">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Group (CP)</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Kode</th>
                                  <th className="p-3 text-left font-semibold text-muted-foreground">Nama Konstruk</th>
                                  <th className="p-3 text-center font-semibold text-muted-foreground">Indikator</th>
                                  <th className="p-3 text-center font-semibold text-muted-foreground">Rules</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {ruleBaseOverview.construct_summary.map((cs: any, i: number) => (
                                  <tr key={i} className="hover:bg-muted/20">
                                    <td className="p-3">
                                      <span className="text-xs bg-muted px-2 py-1 rounded-lg border font-bold">{cs.group_code}</span>
                                    </td>
                                    <td className="p-3 font-mono font-bold text-amber-400">{cs.construct_code}</td>
                                    <td className="p-3 text-foreground/80 max-w-[280px]">{cs.construct_name}</td>
                                    <td className="p-3 text-center font-bold">{cs.indicator_count}</td>
                                    <td className="p-3 text-center font-bold text-blue-400">{cs.rule_count}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-muted rounded-xl p-4 text-center border border-border/50">
                            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Total CP</p>
                            <p className="text-xl font-bold text-rose-400">9</p>
                          </div>
                          <div className="bg-muted rounded-xl p-4 text-center border border-border/50">
                            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Konstruk</p>
                            <p className="text-xl font-bold text-amber-400">{ruleBaseOverview.metadata.construct_count}</p>
                          </div>
                          <div className="bg-muted rounded-xl p-4 text-center border border-border/50">
                            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Indikator</p>
                            <p className="text-xl font-bold text-blue-400">{ruleBaseOverview.metadata.indicator_count}</p>
                          </div>
                          <div className="bg-muted rounded-xl p-4 text-center border border-border/50">
                            <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Total Rules</p>
                            <p className="text-xl font-bold text-emerald-400">{ruleBaseOverview.metadata.indicator_rule_count}</p>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── DROPDOWN 3: Detail Indikator Rule-Based per CP ─── */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => toggleRBSection('detail')}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold">Detail Indikator & Performance Rules per CP</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Lihat semua indikator, performance descriptor, dan IF-THEN rules</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openRBSections['detail'] ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {openRBSections['detail'] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border/50">
                    {/* CP Selector Tabs */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      {CP_LIST.map(cp => (
                        <button
                          key={cp.code}
                          onClick={() => {
                            setSelectedCP(cp.code);
                            setExpandedConstructs({});
                            setExpandedIndicators({});
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCP === cp.code
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                              : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {cp.code}
                        </button>
                      ))}
                    </div>

                    {/* CP Label */}
                    <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-xl p-3 border border-blue-500/20">
                      <p className="text-sm font-bold text-blue-400">
                        {CP_LIST.find(c => c.code === selectedCP)?.label || selectedCP}
                      </p>
                    </div>

                    {cpLoading ? (
                      <div className="py-10 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                      </div>
                    ) : cpConstructData ? (
                      <div className="space-y-3">
                        {cpConstructData.constructs?.map((construct: any) => (
                          <div key={construct.construct_code} className="rounded-xl border border-border/50 overflow-hidden">
                            {/* Construct Header */}
                            <button
                              onClick={() => setExpandedConstructs(prev => ({
                                ...prev,
                                [construct.construct_code]: !prev[construct.construct_code]
                              }))}
                              className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/30 font-mono font-bold">
                                  {construct.construct_code}
                                </span>
                                <span className="text-sm font-semibold text-left">{construct.construct_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                  {construct.indicators.length} indikator
                                </span>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedConstructs[construct.construct_code] ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {/* Construct Rules */}
                            <AnimatePresence>
                              {expandedConstructs[construct.construct_code] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-border/30">
                                    {/* Construct-level Rules */}
                                    <div className="mt-3">
                                      <p className="text-xs font-bold text-muted-foreground mb-2">🔹 Construct-Level Rules</p>
                                      <div className="overflow-x-auto rounded-lg border border-border/40">
                                        <table className="w-full text-[11px]">
                                          <thead className="bg-muted/40 border-b">
                                            <tr>
                                              <th className="p-2 text-left text-muted-foreground font-semibold">Rule ID</th>
                                              <th className="p-2 text-left text-muted-foreground font-semibold">Condition</th>
                                              <th className="p-2 text-center text-muted-foreground font-semibold">Output</th>
                                              <th className="p-2 text-left text-muted-foreground font-semibold">Recommended Action</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border/30">
                                            {construct.construct_rules?.map((cr: any) => (
                                              <tr key={cr.rule_id} className="hover:bg-muted/10">
                                                <td className="p-2 font-mono text-foreground/70">{cr.rule_id}</td>
                                                <td className="p-2 font-mono text-foreground/80">{cr.condition}</td>
                                                <td className="p-2 text-center">
                                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${RISK_BADGE_COLORS[cr.output_level] || ''}`}>
                                                    L{cr.output_level} — {cr.output_label}
                                                  </span>
                                                </td>
                                                <td className="p-2 text-foreground/60 max-w-[250px] text-[10px]">{cr.recommended_action}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Indicators */}
                                    <div>
                                      <p className="text-xs font-bold text-muted-foreground mb-2">🔹 Indikator & Performance Rules</p>
                                      <div className="space-y-2">
                                        {construct.indicators?.map((ind: any) => {
                                          const indKey = `${construct.construct_code}-I${ind.indicator_no}`;
                                          return (
                                            <div key={indKey} className="rounded-lg border border-border/30 overflow-hidden">
                                              <button
                                                onClick={() => setExpandedIndicators(prev => ({
                                                  ...prev,
                                                  [indKey]: !prev[indKey]
                                                }))}
                                                className="w-full flex items-center justify-between p-2.5 hover:bg-muted/10 transition-colors"
                                              >
                                                <div className="flex items-center gap-2 text-left">
                                                  <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-500/20">
                                                    I{ind.indicator_no}
                                                  </span>
                                                  <span className="text-xs font-medium text-foreground/80">{ind.indicator_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded hidden sm:inline-block">
                                                    {ind.supporting_evidence}
                                                  </span>
                                                  <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${expandedIndicators[indKey] ? 'rotate-90' : ''}`} />
                                                </div>
                                              </button>

                                              <AnimatePresence>
                                                {expandedIndicators[indKey] && (
                                                  <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden"
                                                  >
                                                    <div className="px-2.5 pb-3 border-t border-border/20">
                                                      <p className="text-[10px] text-muted-foreground mt-2 mb-1">
                                                        <span className="font-semibold">Bukti Pendukung:</span> {ind.supporting_evidence}
                                                      </p>
                                                      <div className="space-y-1.5 mt-2">
                                                        {ind.performance_rules?.map((pr: any) => (
                                                          <div key={pr.rule_id} className={`rounded-lg p-2.5 border ${RISK_COLORS[pr.level] || 'border-border/30'}`}>
                                                            <div className="flex items-start gap-2">
                                                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold border shrink-0 mt-0.5 ${RISK_BADGE_COLORS[pr.level] || ''}`}>
                                                                {pr.level}
                                                              </span>
                                                              <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold">
                                                                  {pr.label_id} <span className="font-normal text-foreground/50">({pr.label_en})</span>
                                                                </p>
                                                                <p className="text-[10px] text-foreground/70 mt-0.5 leading-relaxed">{pr.performance_descriptor}</p>
                                                                <p className="text-[9px] text-muted-foreground mt-1 font-mono bg-muted/30 px-1.5 py-1 rounded italic">{pr.if_then}</p>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
