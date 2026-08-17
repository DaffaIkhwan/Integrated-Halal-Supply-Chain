"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
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
  { id: 'LEVEL2_CP8', label: 'Sub-Kriteria CP8' },
  { id: 'LEVEL2_CP9', label: 'Sub-Kriteria CP9' },
];

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

export default function AHPStepsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('LEVEL1_CP');
  const [matrixView, setMatrixView] = useState<'tfn' | 'crisp'>('crisp');



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
      title: "1 & 2. Matriks Perbandingan Berpasangan",
      icon: <TableProperties className="h-6 w-6 text-cyan-400" />,
      description: matrixView === 'tfn'
        ? "Tabel berikut adalah matriks skala pakar yang sudah dikonversi ke format Triangular Fuzzy Number (TFN) [Lower, Middle, Upper]."
        : "Tabel berikut adalah matriks perbandingan berpasangan (Pairwise Comparison) dengan nilai crisp (defuzzified) dari rata-rata geometris pakar.",
      details: `Matriks ini didapat dari database (${selectedLabel}). Ukuran matriks: ${data?.n || '-'}×${data?.n || '-'}.`,
      formula: matrixView === 'tfn' ? "M = (l, m, u)" : "Crisp = (l+m+u)/3",
      content: data ? (
        <div className="space-y-3 mt-4">
          {/* Toggle TFN / Crisp */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMatrixView(matrixView === 'tfn' ? 'crisp' : 'tfn')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-muted/50 hover:bg-muted"
            >
              {matrixView === 'tfn' ? (
                <><ToggleRight className="h-4 w-4 text-cyan-500" /> Tampilan: TFN [l, m, u]</>
              ) : (
                <><ToggleLeft className="h-4 w-4 text-emerald-500" /> Tampilan: Crisp (Defuzzified)</>
              )}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {matrixView === 'tfn' ? 'Klik untuk beralih ke nilai tunggal' : 'Klik untuk beralih ke format TFN'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground bg-muted">Kriteria</th>
                  {data.codes.map((c: string) => (
                    <th key={c} className="p-3 font-semibold text-muted-foreground text-center">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(matrixView === 'tfn' ? data.pairwiseTable : data.crispPairwiseTable)?.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-3 font-bold bg-muted/20">{row.code}</td>
                    {data.codes.map((c: string) => {
                      if (matrixView === 'tfn') {
                        return (
                          <td key={c} className="p-3 font-mono text-[11px] text-foreground/80 text-center">{row[c]}</td>
                        );
                      }
                      const val = typeof row[c] === 'number' ? row[c] : parseFloat(row[c]);
                      const isDiag = row.code === c;
                      const isHigh = val > 1.5;
                      const isLow = val < 0.67;
                      return (
                        <td
                          key={c}
                          className={`p-3 font-mono text-[12px] font-semibold text-center ${
                            isDiag
                              ? 'text-muted-foreground bg-muted/30'
                              : isHigh
                                ? 'text-amber-500'
                                : isLow
                                  ? 'text-blue-400'
                                  : 'text-foreground/70'
                          }`}
                        >
                          {isDiag ? '1.00' : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null
    },
    {
      title: "3. Penjumlahan Baris (Row Sum)",
      icon: <Sigma className="h-6 w-6 text-amber-400" />,
      description: "Menjumlahkan seluruh TFN pada setiap baris matriks perbandingan berpasangan. Ini adalah langkah pertama dalam menghitung Fuzzy Synthetic Extent (FSE).",
      details: "Setiap baris dijumlahkan secara element-wise: R_i = Σⱼ M_ij = (Σl, Σm, Σu).",
      formula: "Rᵢ = Σⱼ Mᵢⱼ",
      content: data && data.rowSumsTable ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground">Kriteria</th>
                <th className="p-3 font-semibold text-amber-500">Row Sum [l, m, u]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.rowSumsTable.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="p-3 font-bold">{row.code}</td>
                  <td className="p-3 font-mono text-[11px] text-amber-500 font-semibold">{row.rowSum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null
    },
    {
      title: "4. Total Sum & Invers",
      icon: <Sigma className="h-6 w-6 text-orange-400" />,
      description: "Menjumlahkan seluruh Row Sum untuk mendapatkan Total Sum, lalu menghitung inversnya. Invers digunakan untuk mengalikan dengan Row Sum di langkah FSE.",
      details: "Invers TFN: jika T = (l, m, u), maka T⁻¹ = (1/u, 1/m, 1/l).",
      formula: "T⁻¹ = (1/u, 1/m, 1/l)",
      content: data ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted p-4 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Total Sum = Σ Row Sum</p>
            <p className="text-base font-mono font-bold text-orange-400">{data.totalSum}</p>
          </div>
          <div className="bg-muted p-4 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Invers Total Sum = T⁻¹</p>
            <p className="text-base font-mono font-bold text-orange-400">{data.inversTotal}</p>
          </div>
        </div>
      ) : null
    },
    {
      title: "5 & 6. Fuzzy Synthetic Extent & Defuzzifikasi",
      icon: <BrainCircuit className="h-6 w-6 text-emerald-400" />,
      description: "Menghitung Fuzzy Synthetic Extent (FSE) dengan mengalikan Row Sum × Invers Total Sum, lalu defuzzifikasi ke nilai crisp menggunakan metode Center of Area (CoA).",
      details: "Semakin tinggi nilai FSE dan Crisp, semakin krusial titik tersebut.",
      formula: "Sᵢ = Rᵢ ⊗ T⁻¹ ; Crisp = (l+m+u)/3",
      content: data ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground">Kriteria</th>
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
      title: "7. Normalisasi Bobot Global",
      icon: <Scale className="h-6 w-6 text-pink-400" />,
      description: "Nilai crisp dinormalisasi agar total keseluruhan bobot berjumlah 100%.",
      details: `Inilah bobot final Fuzzy AHP untuk ${selectedLabel}.`,
      formula: "Wᵢ = Crispᵢ / Σ Crisp",
      content: data ? (
        <div className="overflow-x-auto mt-4 rounded-xl border border-border/50">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground">Kriteria</th>
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
      title: "8. Uji Konsistensi (CR)",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
      description: "Mengecek apakah perbandingan matriks awal konsisten. Matriks dianggap konsisten jika CR < 0.10.",
      details: "Jika tidak konsisten (merah), disarankan pakar mengisi ulang kuesioner.",
      formula: "CR = CI / RI",
      content: data ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">n (Ukuran Matriks)</p>
              <p className="text-lg font-mono font-bold">{data.n}</p>
            </div>
            <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">λ Max</p>
              <p className="text-lg font-mono font-bold">{data.cr.lambdaMax}</p>
            </div>
            <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">CI = (λmax − n) / (n − 1)</p>
              <p className="text-lg font-mono font-bold">{data.cr.ci}</p>
            </div>
            <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Random Index (RI)</p>
              <p className="text-lg font-mono font-bold text-blue-400">{data.ri}</p>
            </div>
            <div className="bg-muted p-4 rounded-xl text-center border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">CR = CI / RI</p>
              <p className={`text-lg font-mono font-bold ${data.cr.isConsistent ? "text-emerald-500" : "text-red-500"}`}>{data.cr.cr}</p>
            </div>
          </div>
          <div className={`p-4 rounded-xl text-center border font-bold ${data.cr.isConsistent ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-red-500/10 border-red-500/30 text-red-600"}`}>
            {data.cr.isConsistent ? "KONSISTEN ✅ — CR < 0.10" : "TIDAK KONSISTEN ❌ — CR ≥ 0.10, disarankan revisi penilaian"}
          </div>

          {/* RI Reference Table */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 border-b">Tabel Random Index (RI) — Saaty (1990)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <th key={n} className={`p-2 text-center font-mono ${n === data.n ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-muted-foreground'}`}>n={n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49].map((ri, i) => (
                      <td key={i} className={`p-2 text-center font-mono ${(i+1) === data.n ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-foreground/70'}`}>{ri.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null
    },
    {
      title: "9. Ringkasan Konsistensi (CR) Keseluruhan",
      icon: <CheckCircle2 className="h-6 w-6 text-blue-500" />,
      description: "Rekapitulasi uji konsistensi (CR) untuk seluruh matriks (Kriteria Umum, Antar CP Level 1, dan seluruh Sub-Kriteria CP1–CP9).",
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
