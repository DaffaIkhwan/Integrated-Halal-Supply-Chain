"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { 
  Beef, 
  Factory, 
  Loader2, 
  PlusCircle, 
  Save, 
  DatabaseZap,
  CheckCircle2,
  AlertTriangle,
  QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { BatchQrModal } from "@/components/batch-qr-modal";

export default function BatchManagementPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "ADMIN";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [cattleForm, setCattleForm] = useState({ earTag: "", breed: "Brahman", farmId: "" });
  const [batchForm, setBatchForm] = useState({ cattleId: "", slaughterhouseId: "", butcherName: "" });

  const [submittingCattle, setSubmittingCattle] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // QR Modal state
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    batchId: string;
    earTag: string;
    rphName: string;
    productionDate?: string;
  }>({ isOpen: false, batchId: "", earTag: "", rphName: "" });

  useEffect(() => {
    setLoading(true);
    fetch("/api/dss/master-data")
      .then(res => res.json())
      .then(resData => {
        if (!resData.error) {
          setData(resData);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleCreateCattle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCattle(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dss/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_CATTLE", ...cattleForm })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({ text: "Sapi berhasil didaftarkan!", type: 'success' });
      setCattleForm({ ...cattleForm, earTag: "" });
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingCattle(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBatch(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dss/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_BATCH", ...batchForm })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({ text: "Halal Batch berhasil diterbitkan!", type: 'success' });
      setBatchForm({ cattleId: "", slaughterhouseId: "", butcherName: "" });
      setRefreshKey(k => k + 1);

      // Auto-show QR for newly created batch
      if (result.result) {
        const cattle = data?.cattle?.find((c: any) => c.id === batchForm.cattleId);
        const rph = data?.slaughterhouses?.find((s: any) => s.id === batchForm.slaughterhouseId);
        setQrModal({
          isOpen: true,
          batchId: result.result.id,
          earTag: cattle?.earTag || "",
          rphName: rph?.name || "",
          productionDate: result.result.productionDate,
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingBatch(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      </div>
    );
  }

  // Sapi yang belum punya batch
  const availableCattle = data?.cattle?.filter((c: any) => c.batches.length === 0) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <DatabaseZap className="h-8 w-8 text-cyan-500" />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Daftar Batch
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Menu untuk mendaftarkan identitas sapi (CP1) dan menerbitkan Halal Batch saat pemotongan di RPH (CP4).
          </p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}
            >
              {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <p className="font-semibold text-sm">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {userRole !== "ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* KOLOM KIRI: FORM SAPI */}
          {(userRole === "CP1_FARM") && (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Beef className="h-5 w-5 text-cyan-500" />
                  Registrasi Sapi Baru (CP1 FARM)
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Peternak mendaftarkan sapi ke dalam sistem berdasarkan eartag (Nomor Telinga) yang menempel pada fisik sapi.
                </p>
                
                <form onSubmit={handleCreateCattle} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nomor Eartag</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: TAG-8812"
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                      value={cattleForm.earTag}
                      onChange={e => setCattleForm({...cattleForm, earTag: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Jenis Sapi (Breed)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Contoh: Limousin"
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                        value={cattleForm.breed}
                        onChange={e => setCattleForm({...cattleForm, breed: e.target.value})}
                      />
                    </div>
                    {userRole === "ADMIN" && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Asal Peternakan (Farm)</label>
                        <select 
                          required
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                          value={cattleForm.farmId}
                          onChange={e => setCattleForm({...cattleForm, farmId: e.target.value})}
                        >
                          <option value="">-- Pilih Farm --</option>
                          {data?.farms?.map((f: any) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={submittingCattle}
                    className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white p-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {submittingCattle ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                    Daftarkan Sapi
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-bold text-sm">Daftar Sapi (Tabel Cattle)</h3>
                  <span className="text-xs font-mono bg-cyan-500/20 text-cyan-600 px-2 py-0.5 rounded-md">{data?.cattle?.length || 0} Sapi</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-4">
                  <div className="space-y-2">
                    {data?.cattle?.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 text-sm">
                        <div>
                          <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{c.earTag}</p>
                          <p className="text-xs text-muted-foreground">{c.breed} — {c.farm?.name}</p>
                        </div>
                        <div className="text-right">
                          {c.batches.length > 0 ? (
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md">Telah Dipotong</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md">Sapi Hidup</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {data?.cattle?.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4">Belum ada data sapi.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KOLOM KANAN: FORM BATCH */}
          {(userRole === "CP4_SLAUGHTER") && (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Factory className="h-5 w-5 text-emerald-500" />
                  Terbitkan Halal Batch (CP4 SLAUGHTER)
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Saat sapi disembelih di Rumah Potong Hewan, sistem membuatkan Batch ID daging yang menempel pada sapi tersebut.
                </p>
                
                <form onSubmit={handleCreateBatch} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pilih Sapi (Yang Belum Dipotong)</label>
                    <select 
                      required
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-emerald-500"
                      value={batchForm.cattleId}
                      onChange={e => setBatchForm({...batchForm, cattleId: e.target.value})}
                    >
                      <option value="">-- Pilih Eartag Sapi --</option>
                      {availableCattle.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.earTag} ({c.breed}) - dari {c.farm?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Juru Sembelih (Butcher)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-emerald-500"
                      value={batchForm.butcherName}
                      onChange={e => setBatchForm({...batchForm, butcherName: e.target.value})}
                    />
                  </div>
                  {userRole === "ADMIN" && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pilih Lokasi Pemotongan (RPH)</label>
                      <select 
                        required
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-emerald-500"
                        value={batchForm.slaughterhouseId}
                        onChange={e => setBatchForm({...batchForm, slaughterhouseId: e.target.value})}
                      >
                        <option value="">-- Pilih RPH --</option>
                        {data?.slaughterhouses?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={submittingBatch || availableCattle.length === 0}
                    className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {submittingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Terbitkan Halal Batch
                  </button>
                </form>
              </div>

              {/* DAFTAR BATCH (STANDALONE VIEW) */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <DatabaseZap className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Daftar Batch Berjalan (HalalBatch)</h3>
                      <p className="text-xs text-muted-foreground">Riwayat batch daging yang telah diterbitkan</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full shadow-sm">{data?.batches?.length || 0} Batch</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.batches?.map((b: any) => (
                    <div key={b.id} className="group relative flex flex-col p-5 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors"></div>
                      <div className="flex items-start justify-between mb-4 pl-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">ID Batch</p>
                          <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400 leading-none">
                            {b.id.split("-")[0]}
                          </p>
                        </div>
                        <button
                          onClick={() => setQrModal({
                            isOpen: true,
                            batchId: b.id,
                            earTag: b.cattle?.earTag || "",
                            rphName: b.slaughterhouse?.name || "",
                            productionDate: b.productionDate,
                          })}
                          className="flex items-center gap-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-3 py-2 rounded-xl hover:bg-cyan-500/20 hover:scale-105 transition-all shadow-sm"
                        >
                          <QrCode className="h-4 w-4" />
                          Lihat QR
                        </button>
                      </div>
                      
                      <div className="space-y-2 mt-auto pt-4 border-t border-border/50 text-sm pl-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Sapi
                          </span>
                          <span className="font-medium bg-secondary px-2 py-0.5 rounded-md text-xs">{b.cattle?.earTag}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                            <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                            RPH
                          </span>
                          <span className="font-medium text-xs truncate max-w-[150px]" title={b.slaughterhouse?.name}>{b.slaughterhouse?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                            <DatabaseZap className="h-3.5 w-3.5 text-muted-foreground" />
                            Tanggal
                          </span>
                          <span className="font-medium text-xs">{new Date(b.productionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {data?.batches?.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20">
                      <DatabaseZap className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">Belum ada batch yang diterbitkan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
        </div>
        )}

        {/* TAMPILAN ADMIN: FULL PAGE BATCH LIST */}
        {userRole === "ADMIN" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DatabaseZap className="h-5 w-5 text-emerald-500" />
                Daftar Seluruh Halal Batch
              </h2>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                {data?.batches?.length || 0} Batch Terdaftar
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.batches?.map((b: any) => (
                <div key={b.id} className="flex flex-col p-5 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">BATCH ID</p>
                      <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400 leading-none">
                        {b.id.split("-")[0]}
                      </p>
                    </div>
                    <button
                      onClick={() => setQrModal({
                        isOpen: true,
                        batchId: b.id,
                        earTag: b.cattle?.earTag || "",
                        rphName: b.slaughterhouse?.name || "",
                        productionDate: b.productionDate,
                      })}
                      className="flex items-center gap-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-3 py-2 rounded-xl hover:bg-cyan-500/20 transition-colors shadow-sm"
                    >
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-auto pt-4 border-t border-border/50 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">Tanggal Produksi</span>
                      <span className="font-medium">{new Date(b.productionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">Eartag Sapi</span>
                      <span className="font-medium bg-secondary px-2 py-0.5 rounded-md">{b.cattle?.earTag}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">RPH Pemotong</span>
                      <span className="font-medium truncate max-w-[150px]" title={b.slaughterhouse?.name}>{b.slaughterhouse?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {data?.batches?.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20">
                  <DatabaseZap className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Belum ada batch daging yang diterbitkan.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* QR Modal */}
      <BatchQrModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal((prev) => ({ ...prev, isOpen: false }))}
        batchId={qrModal.batchId}
        earTag={qrModal.earTag}
        rphName={qrModal.rphName}
        productionDate={qrModal.productionDate}
      />
    </div>
  );
}
