"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import {
  Users, UserPlus, Loader2, CheckCircle2, AlertTriangle,
  Shield, Ban, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "PAKAR_K1", label: "Pakar — Kuesioner 1 (Pembobotan)" },
  { value: "PAKAR_K2", label: "Pakar — Kuesioner 2 (Risiko)" },
  { value: "CP1_FARM", label: "CP1 — Peternakan (Farm)" },
  { value: "CP2_FEED", label: "CP2 — Pakan Ternak (Feed)" },
  { value: "CP3_TRANSPORT", label: "CP3 — Transportasi" },
  { value: "CP4_SLAUGHTER", label: "CP4 — Penyembelihan (RPH)" },
  { value: "CP5_POST_SLAUGHTER", label: "CP5 — Pasca Sembelih" },
  { value: "CP6_PROCESSING", label: "CP6 — Pengolahan" },
  { value: "CP7_STORAGE", label: "CP7 — Penyimpanan" },
  { value: "CP8_DISTRIBUTION", label: "CP8 — Distribusi" },
  { value: "CP9_RETAIL", label: "CP9 — Retail" },
  { value: "CP10_CONSUMER", label: "CP10 — Konsumen" },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  PAKAR_K1: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  PAKAR_K2: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  CP1_FARM: "bg-green-500/15 text-green-500 border-green-500/30",
  CP2_FEED: "bg-lime-500/15 text-lime-500 border-lime-500/30",
  CP3_TRANSPORT: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  CP4_SLAUGHTER: "bg-red-500/15 text-red-500 border-red-500/30",
  CP5_POST_SLAUGHTER: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  CP6_PROCESSING: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  CP7_STORAGE: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  CP8_DISTRIBUTION: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  CP9_RETAIL: "bg-pink-500/15 text-pink-500 border-pink-500/30",
  CP10_CONSUMER: "bg-teal-500/15 text-teal-500 border-teal-500/30",
};

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  orgId: string | null;
  orgName: string | null;
  isBanned: boolean;
  createdAt: string;
};

type OrgOption = { id: string; name: string };

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, OrgOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "CP1_FARM", phone: "", orgId: "", orgName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [togglingBan, setTogglingBan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/dss/users")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUsers(data.users || []);
          setOrganizations(data.organizations || {});
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const orgOptions = useMemo(() => {
    if (form.role === "ADMIN" || form.role === "PAKAR_K1" || form.role === "PAKAR_K2") return [];
    return organizations[form.role] || [];
  }, [form.role, organizations]);

  const handleOrgChange = (orgId: string) => {
    const org = orgOptions.find(o => o.id === orgId);
    setForm(prev => ({ ...prev, orgId, orgName: org?.name || "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dss/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({ text: `User "${result.user.name}" berhasil dibuat sebagai ${result.user.role}`, type: "success" });
      setForm({ name: "", email: "", password: "", role: "CP1_FARM", phone: "", orgId: "", orgName: "" });
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    setTogglingBan(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/dss/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBanned: !currentlyBanned }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({
        text: currentlyBanned ? `User berhasil di-unban.` : `User berhasil di-ban.`,
        type: "success",
      });
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setTogglingBan(null);
    }
  };

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
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-8">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-500" />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Manajemen User
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Buat dan kelola akun pengguna untuk setiap Critical Point (CP) dan Pakar dalam rantai pasok halal.
          </p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"}`}
            >
              {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <p className="font-semibold text-sm">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form — Buat Akun Baru */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border bg-card p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
                <UserPlus className="h-5 w-5 text-cyan-500" />
                Buat Akun Baru
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Lengkap</label>
                  <input
                    type="text" required
                    placeholder="Contoh: Ahmad Fauzi"
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email" required
                    placeholder="contoh@email.com"
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Password</label>
                  <input
                    type="password" required
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">No. Telepon (opsional)</label>
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Role</label>
                  <select
                    required
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value, orgId: "", orgName: "" })}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {orgOptions.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Organisasi / Lokasi
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:border-cyan-500"
                      value={form.orgId}
                      onChange={e => handleOrgChange(e.target.value)}
                    >
                      <option value="">— Pilih Organisasi —</option>
                      {orgOptions.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      User ini akan otomatis terikat ke organisasi yang dipilih.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white p-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Buat Akun
                </button>
              </form>
            </div>
          </div>

          {/* Tabel User */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                <h3 className="font-bold text-sm">Daftar User Terdaftar</h3>
                <span className="text-xs font-mono bg-cyan-500/20 text-cyan-600 px-2 py-0.5 rounded-md">
                  {users.length} User
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Nama</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Organisasi</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${u.isBanned ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border whitespace-nowrap ${ROLE_COLORS[u.role] || "bg-muted text-muted-foreground"}`}>
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.orgName || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-500/15 text-red-500 border border-red-500/30">Banned</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Aktif</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.role !== "ADMIN" && (
                            <button
                              onClick={() => handleToggleBan(u.id, u.isBanned)}
                              disabled={togglingBan === u.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors disabled:opacity-50 ${
                                u.isBanned
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500"
                                  : "bg-red-500/10 hover:bg-red-500/20 text-red-500"
                              }`}
                            >
                              {togglingBan === u.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : u.isBanned ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <Ban className="h-3 w-3" />
                              )}
                              {u.isBanned ? "Unban" : "Ban"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">
                          Belum ada user terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
