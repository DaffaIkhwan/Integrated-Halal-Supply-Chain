"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { useEffect, useState } from "react";
import { 
  Calculator, 
  TableProperties, 
  Sigma, 
  Scale, 
  CheckCircle2, 
  BrainCircuit,
  Settings2,
  ChevronRight,
  Loader2,
  AlertTriangle
} from "lucide-react";

const MATRIX_TYPES = [
  { id: 'KU_LEVEL', label: 'Kriteria Umum (KU)' },
  { id: 'LEVEL1_CP', label: 'Antar CP — Level 1' },
  { id: 'LEVEL2_CP1', label: 'Sub-Kriteria CP1' },
  { id: 'LEVEL2_CP2', label: 'Sub-Kriteria CP2' },
  { id: 'LEVEL2_CP3', label: 'Sub-Kriteria CP3' },
  { id: 'LEVEL2_CP4', label: 'Sub-Kriteria CP4' },
  { id: 'LEVEL2_CP5', label: 'Sub-Kriteria CP5' },
  { id: 'LEVEL2_CP6', label: 'Sub-Kriteria CP6' },
  { id: 'LEVEL2_CP7', label: 'Sub-Kriteria CP7' },
];

export default function AHPStepsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('LEVEL1_CP');

  const fetchData = (type: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/dss/ahp?type=${type}&t=` + Date.now())
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) throw new Error(resData.error);
        setData(resData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(selectedType);
  }, [selectedType]);

  const selectedLabel = MATRIX_TYPES.find(m => m.id === selectedType)?.label || selectedType;

  const AHP_STEPS = [
    {
      title: "1 & 2. Matriks Perbandingan TFN",
      icon: <TableProperties className="h-6 w-6 text-cyan-400" />,
      description: "Tabel berikut adalah matriks skala pakar yang sudah dikonversi ke format Triangular Fuzzy Number (TFN) [Lower, Middle, Upper].",
      details: `Matriks ini didapat dari database (${selectedLabel}).`,
      formula: "M = (l, m, u)",
      content: data ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground bg-muted">Kriteria</th>
                {data.codes.map((c: string) => (
                  <th key={c} className="p-3 font-semibold text-muted-foreground">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.pairwiseTable.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-3 font-bold bg-muted/20">{row.code}</td>
                  {data.codes.map((c: string) => (
                    <td key={c} className="p-3 font-mono text-[11px] text-foreground/80">{row[c]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null
    },
    {
      title: "3 & 4. Fuzzy Synthetic Extent & Defuzzifikasi",
      icon: <BrainCircuit className="h-6 w-6 text-emerald-400" />,
      description: "Menghitung nilai ekstensi sintesis (FSE) lalu merubahnya menjadi bilangan tegas (Crisp) menggunakan metode Center of Area (CoA).",
      details: "Semakin tinggi nilai FSE dan Crisp, semakin krusial titik tersebut.",
      formula: "Crisp = (l + m + u) / 3",
      content: data ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground">Kriteria (CP)</th>
                <th className="p-3 font-semibold text-muted-foreground">Fuzzy Synthetic Extent (FSE)</th>
                <th className="p-3 font-semibold text-emerald-500">Nilai Crisp (CoA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.resultTable.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-3 font-bold">{row.code}</td>
                  <td className="p-3 font-mono text-[11px] text-foreground/70">{row.fse}</td>
                  <td className="p-3 font-mono text-emerald-500 font-bold">{row.crisp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null
    },
    {
      title: "5. Normalisasi Bobot Global",
      icon: <Scale className="h-6 w-6 text-pink-400" />,
      description: "Nilai crisp dinormalisasi agar total keseluruhan bobot berjumlah 100%.",
      details: `Inilah bobot final Fuzzy AHP untuk ${selectedLabel}.`,
      formula: "W_i = Crisp_i / Σ Crisp",
      content: data ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground">Kriteria (CP)</th>
                <th className="p-3 font-semibold text-muted-foreground">Nilai Crisp</th>
                <th className="p-3 font-semibold text-pink-500">Bobot Normalisasi (Global Weight)</th>
                <th className="p-3 font-semibold text-pink-500">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.resultTable.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-3 font-bold">{row.code}</td>
                  <td className="p-3 font-mono text-foreground/70">{row.crisp}</td>
                  <td className="p-3 font-mono text-pink-500 font-bold">{row.weight}</td>
                  <td className="p-3 font-bold">{row.percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null
    },
    {
      title: "6. Uji Konsistensi (CR)",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
      description: "Mengecek apakah perbandingan matriks awal konsisten (kurang dari 0.10).",
      details: "Jika tidak konsisten (merah), disarankan pakar mengisi ulang kuesioner.",
      formula: "CR = CI / RI",
      content: data ? (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">λ Max</p>
            <p className="text-lg font-mono font-bold">{data.cr.lambdaMax}</p>
          </div>
          <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Consistency Index (CI)</p>
            <p className="text-lg font-mono font-bold">{data.cr.ci}</p>
          </div>
          <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Consistency Ratio (CR)</p>
            <p className={`text-lg font-mono font-bold ${data.cr.isConsistent ? "text-emerald-500" : "text-red-500"}`}>{data.cr.cr}</p>
          </div>
          <div className={`p-4 rounded-xl text-center flex items-center justify-center border font-bold ${data.cr.isConsistent ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-red-500/10 border-red-500/30 text-red-600"}`}>
            {data.cr.isConsistent ? "KONSISTEN ✅" : "TIDAK KONSISTEN ❌"}
          </div>
        </div>
      ) : null
    },
    {
      title: "7. Ringkasan Konsistensi (CR) Keseluruhan",
      icon: <CheckCircle2 className="h-6 w-6 text-blue-500" />,
      description: "Rekapitulasi uji konsistensi (CR) untuk seluruh matriks (Kriteria Umum, Antar CP Level 1, dan seluruh Sub-Kriteria CP).",
      details: "Nilai CR < 0.10 menandakan matriks tersebut konsisten dan layak digunakan.",
      formula: "Target: CR < 0.10",
      content: data && data.allCRs ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground bg-muted">Level</th>
                <th className="p-3 font-semibold text-muted-foreground text-center">λ Max</th>
                <th className="p-3 font-semibold text-muted-foreground text-center">CI</th>
                <th className="p-3 font-semibold text-muted-foreground text-center">CR Value</th>
                <th className="p-3 font-semibold text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.allCRs.map((crRow: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-3 font-bold bg-muted/20">{crRow.level}</td>
                  {crRow.lambdaMax !== null ? (
                    <>
                      <td className="p-3 text-center font-mono text-[11px] text-foreground/80">{crRow.lambdaMax.toFixed(4)}</td>
                      <td className="p-3 text-center font-mono text-[11px] text-foreground/80">{crRow.ci.toFixed(4)}</td>
                      <td className="p-3 text-center font-mono font-bold text-[11px] text-foreground/80">{crRow.cr.toFixed(4)}</td>
                      <td className={`p-3 text-center font-bold text-[11px] ${crRow.isConsistent ? "text-emerald-500" : "text-red-500"}`}>
                        {crRow.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-center text-muted-foreground">-</td>
                      <td className="p-3 text-center text-muted-foreground">-</td>
                      <td className="p-3 text-center text-muted-foreground">-</td>
                      <td className="p-3 text-center text-muted-foreground">Belum ada data</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-[1000px] mx-auto w-full px-4 py-10 space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-4">
            <Calculator className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Tabel & Tahapan Perhitungan{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Fuzzy AHP
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Berikut adalah hasil kalkulasi aktual dari database. Pilih level matriks yang ingin dilihat, lalu klik tombol kalkulasi ulang jika diperlukan.
          </p>

          {/* Matrix Type Selector */}
          <div className="flex flex-wrap justify-center gap-2 pt-3 max-w-3xl mx-auto">
            {MATRIX_TYPES.map((mt) => (
              <button
                key={mt.id}
                onClick={() => setSelectedType(mt.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedType === mt.id
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/20"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>
          <div className="pt-2">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/dss/ahp/calculate-k1", { method: "POST" });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Gagal kalkulasi ulang");
                  
                  const parts: string[] = [];
                  if (json.kuLevel) parts.push(`Kriteria Umum (${json.kuLevel.respondents} responden)`);
                  if (json.cpLevel) parts.push(`Antar CP (${json.cpLevel.respondents} responden)`);
                  const subCount = Object.keys(json.subLevels || {}).length;
                  if (subCount > 0) parts.push(`${subCount} Sub-Kriteria`);
                  alert(`Kalkulasi sukses!\n${parts.join('\n') || `Diambil dari rata-rata ${json.respondents} responden pakar.`}`);
                  // Refetch the current selected type
                  fetchData(selectedType);
                } catch (e: any) {
                  alert(e.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
            >
              <Settings2 className="h-4 w-4" />
              Kalkulasi Ulang dari Data Kuesioner (K1 V1)
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <p className="text-sm text-muted-foreground">Menarik dan menghitung matriks dari database...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center flex flex-col items-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="font-bold text-red-600 mb-2">Gagal Menghitung Fuzzy AHP</h3>
            <p className="text-sm text-red-500/80">{error}</p>
          </div>
        ) : (
          <div className="mt-8 relative">
            <div className="space-y-12">
              {AHP_STEPS.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="relative flex flex-col items-start"
                >
                  <div className="flex-1 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm w-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-muted border border-border flex">
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-xl p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50">
                      <p className="text-[13px] text-foreground/80 flex-1">
                        <span className="font-semibold">Info:</span> {step.details}
                      </p>
                      <div className="shrink-0 bg-background border px-3 py-1.5 rounded-lg text-[13px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold shadow-inner">
                        {step.formula}
                      </div>
                    </div>

                    {/* The Data Table Content */}
                    {step.content}

                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
