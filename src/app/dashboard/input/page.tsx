"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Shield, X, Save,
  Tractor, Building2, Truck, Factory, Warehouse as WarehouseIcon, Package, Store, Beef, ClipboardList,
} from "lucide-react";

type TabKey = "farm" | "slaughterhouse" | "transporter" | "processingPlant" | "warehouse" | "distributor" | "retailOutlet" | "cattle" | "halalBatch";

type FieldConfig = { key: string; label: string; required?: boolean; type?: string; selectOptions?: readonly string[]; relation?: string };

type EntityTab = {
  key: TabKey;
  label: string;
  icon: any;
  cp: string;
  fields: FieldConfig[];
};

const ENTITY_TABS: EntityTab[] = [
  { key: "farm",            label: "Farm",          icon: Tractor,        cp: "CP1", fields: [
    { key: "name", label: "Nama Farm", required: true },
    { key: "location", label: "Lokasi" },
    { key: "address", label: "Alamat" },
  ]},
  { key: "slaughterhouse",  label: "RPH",           icon: Building2,      cp: "CP4", fields: [
    { key: "name", label: "Nama RPH", required: true },
    { key: "location", label: "Lokasi" },
    { key: "address", label: "Alamat" },
  ]},
  { key: "transporter",     label: "Transporter",   icon: Truck,          cp: "CP3", fields: [
    { key: "name", label: "Nama Transporter", required: true },
    { key: "vehicleNumber", label: "No. Kendaraan" },
    { key: "vehicleType", label: "Tipe Kendaraan", selectOptions: ["Truk", "Pickup", "Container", "Van"] },
    { key: "location", label: "Lokasi" },
  ]},
  { key: "processingPlant", label: "Pabrik Olahan", icon: Factory,        cp: "CP6", fields: [
    { key: "name", label: "Nama Pabrik", required: true },
    { key: "location", label: "Lokasi" },
    { key: "productionType", label: "Tipe Produksi", selectOptions: ["Pemotongan", "Olahan", "Marinade", "Frozen"] },
  ]},
  { key: "warehouse",       label: "Gudang",        icon: WarehouseIcon,  cp: "CP7", fields: [
    { key: "name", label: "Nama Gudang", required: true },
    { key: "location", label: "Lokasi" },
    { key: "storageType", label: "Tipe Penyimpanan", selectOptions: ["Frozen", "Chilled", "Ambient"] },
  ]},
  { key: "distributor",     label: "Distributor",   icon: Package,        cp: "CP8", fields: [
    { key: "name", label: "Nama Distributor", required: true },
    { key: "location", label: "Lokasi" },
    { key: "coverageArea", label: "Area Cakupan" },
  ]},
  { key: "retailOutlet",    label: "Retail",        icon: Store,          cp: "CP9", fields: [
    { key: "name", label: "Nama Outlet", required: true },
    { key: "location", label: "Lokasi" },
    { key: "outletType", label: "Tipe Outlet", selectOptions: ["Supermarket", "Pasar Tradisional", "Minimarket", "Online"] },
  ]},
  { key: "cattle",          label: "Sapi",          icon: Beef,           cp: "CP1", fields: [
    { key: "earTag", label: "Ear Tag", required: true },
    { key: "breed", label: "Ras/Breed" },
    { key: "farmId", label: "Farm", required: true, relation: "farm" },
    { key: "birthDate", label: "Tanggal Lahir", type: "date" },
  ]},
  { key: "halalBatch",      label: "Halal Batch",   icon: ClipboardList,  cp: "CP4", fields: [
    { key: "cattleId", label: "Sapi", required: true, relation: "cattle" },
    { key: "slaughterhouseId", label: "RPH", required: true, relation: "slaughterhouse" },
    { key: "butcherName", label: "Nama Juru Sembelih" },
    { key: "productionDate", label: "Tanggal Produksi", type: "date" },
  ]},
];

const CP_COLORS: Record<string, string> = {
  CP1: "from-green-500 to-emerald-600",
  CP3: "from-blue-500 to-cyan-600",
  CP4: "from-red-500 to-rose-600",
  CP6: "from-orange-500 to-amber-600",
  CP7: "from-sky-500 to-blue-600",
  CP8: "from-indigo-500 to-violet-600",
  CP9: "from-pink-500 to-rose-600",
};

// ─── Main Component ───
export default function ManajemenCPPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("farm");
  const [allData, setAllData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeConfig = useMemo(() => ENTITY_TABS.find((t) => t.key === activeTab)!, [activeTab]);
  const currentItems = useMemo(() => allData[activeTab === "halalBatch" ? "batches" : activeTab === "cattle" ? "cattle" : `${activeTab}s`] || [], [allData, activeTab]);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    fetch("/api/dss/master-data")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setAllData(data);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Clear message after timeout
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const openCreateModal = useCallback(() => {
    const initial: Record<string, string> = {};
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    for (const f of activeConfig.fields) {
      if (f.type === "date") {
        initial[f.key] = today;
      } else {
        initial[f.key] = "";
      }
    }
    setFormData(initial);
    setEditingId(null);
    setModalOpen(true);
  }, [activeConfig]);

  const openEditModal = useCallback((item: any) => {
    const initial: Record<string, string> = {};
    for (const f of activeConfig.fields) {
      if (f.type === "date" && item[f.key]) {
        initial[f.key] = new Date(item[f.key]).toISOString().split("T")[0];
      } else {
        initial[f.key] = item[f.key] || "";
      }
    }
    setFormData(initial);
    setEditingId(item.id);
    setModalOpen(true);
  }, [activeConfig]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId
        ? { entity: activeTab, id: editingId, data: formData }
        : { entity: activeTab, data: formData };

      const res = await fetch("/api/dss/master-data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({ text: editingId ? "Data berhasil diperbarui!" : "Data berhasil ditambahkan!", type: "success" });
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dss/master-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: activeTab, id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({ text: "Data berhasil dihapus!", type: "success" });
      setDeleteConfirm(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  // Get display value for a cell
  const getCellValue = (item: any, field: FieldConfig): string => {
    if (field.relation === "farm" && item.farm) return item.farm.name;
    if (field.relation === "cattle" && item.cattle) return item.cattle.earTag + (item.cattle.farm ? ` (${item.cattle.farm.name})` : "");
    if (field.relation === "slaughterhouse" && item.slaughterhouse) return item.slaughterhouse.name;
    if (field.type === "date" && item[field.key]) return new Date(item[field.key]).toLocaleDateString("id-ID");
    return item[field.key] || "—";
  };

  // Get relation options for dropdowns
  const getRelationOptions = (relationKey: string): { id: string; label: string }[] => {
    if (relationKey === "farm") return (allData.farms || []).map((f: any) => ({ id: f.id, label: f.name }));
    if (relationKey === "slaughterhouse") return (allData.slaughterhouses || []).map((s: any) => ({ id: s.id, label: s.name }));
    if (relationKey === "cattle") return (allData.cattle || []).map((c: any) => ({ id: c.id, label: `${c.earTag}${c.farm ? ` — ${c.farm.name}` : ""}` }));
    return [];
  };

  // Admin guard
  if ((session?.user as any)?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-lg font-semibold">Akses Ditolak</p>
            <p className="text-sm text-muted-foreground">Halaman ini hanya untuk Admin.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-cyan-500" />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Manajemen CP
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kelola data master untuk semua entitas rantai pasok halal — Farm, RPH, Transporter, dan lainnya.
          </p>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl flex items-center gap-3 border ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
              <p className="font-semibold text-sm">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="rounded-2xl border bg-card p-1.5 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {ENTITY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const itemCount = (allData[tab.key === "halalBatch" ? "batches" : tab.key === "cattle" ? "cattle" : `${tab.key}s`] || []).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-foreground border border-cyan-500/30 shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" : "bg-muted text-muted-foreground"
                  }`}>
                    {itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="bg-muted/50 px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => { const Icon = activeConfig.icon; return <Icon className="h-5 w-5 text-cyan-500" />; })()}
              <div>
                <h2 className="font-bold text-sm">{activeConfig.label}</h2>
                <p className="text-[10px] text-muted-foreground">
                  Terkait dengan <span className={`font-bold bg-gradient-to-r ${CP_COLORS[activeConfig.cp] || "from-cyan-500 to-emerald-500"} bg-clip-text text-transparent`}>{activeConfig.cp}</span>
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah {activeConfig.label}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-semibold w-10">#</th>
                  {activeConfig.fields.map((f) => (
                    <th key={f.key} className="px-5 py-3 font-semibold">
                      {f.label}
                      {f.required && <span className="text-red-400 ml-0.5">*</span>}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item: any, idx: number) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{idx + 1}</td>
                    {activeConfig.fields.map((f) => (
                      <td key={f.key} className="px-5 py-3">
                        <span className={f.required ? "font-medium" : "text-muted-foreground"}>
                          {getCellValue(item, f as FieldConfig)}
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-cyan-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={activeConfig.fields.length + 2} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {(() => { const Icon = activeConfig.icon; return <Icon className="h-10 w-10 opacity-30" />; })()}
                        <p className="text-sm">Belum ada data {activeConfig.label.toLowerCase()}</p>
                        <button onClick={openCreateModal} className="text-xs text-cyan-500 hover:underline font-medium">
                          + Tambah {activeConfig.label} pertama
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border"
            >
              <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => { const Icon = activeConfig.icon; return <Icon className="h-5 w-5 text-cyan-500" />; })()}
                  <h3 className="text-lg font-bold">
                    {editingId ? "Edit" : "Tambah"} {activeConfig.label}
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {activeConfig.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>

                    {field.relation ? (
                      <select
                        aria-label={field.label}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        required={field.required}
                      >
                        <option value="">— Pilih {field.label} —</option>
                        {getRelationOptions(field.relation).map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.selectOptions ? (
                      <select
                        aria-label={field.label}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="">— Pilih {field.label} —</option>
                        {field.selectOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={field.label}
                        type={field.type || "text"}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        required={field.required}
                        placeholder={`Masukkan ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex border-t bg-muted/30">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border-r"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-4 text-sm font-bold text-cyan-500 hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Simpan Perubahan" : "Tambah Data"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Hapus Data?</h3>
                <p className="text-sm text-muted-foreground">
                  Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex border-t bg-muted/30">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border-r"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 py-4 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
