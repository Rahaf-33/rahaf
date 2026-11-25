"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogOut, RefreshCw, Trash2, Lock } from "lucide-react";
import type { Submission } from "@/lib/types";
import { TrackBadge } from "./TrackBadge";
import { timeAgo } from "@/lib/format";

export function AdminPanel() {
  const [state, setState] = useState<"loading" | "login" | "ready">("loading");
  const [items, setItems] = useState<Submission[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/submissions", { cache: "no-store" });
    if (res.status === 401) return setState("login");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      setState("ready");
      return;
    }
    setItems(json.items);
    setError(null);
    setState("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error ?? "تعذر الدخول");
    setPassword("");
    load();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setItems([]);
    setState("login");
  }

  async function setHidden(s: Submission, hidden: boolean) {
    setBusyId(s.id);
    const res = await fetch(`/api/admin/submissions/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }) });
    setBusyId(null);
    if (res.ok) setItems((l) => l.map((x) => (x.id === s.id ? { ...x, hidden } : x)));
    else setError((await res.json().catch(() => ({}))).error ?? "تعذر التحديث");
  }

  async function remove(s: Submission) {
    if (!confirm(`حذف مشاركة «${s.title}» للمعلمة ${s.teacher_name} نهائيًا مع ملفاتها؟`)) return;
    setBusyId(s.id);
    const res = await fetch(`/api/admin/submissions/${s.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) setItems((l) => l.filter((x) => x.id !== s.id));
    else setError((await res.json().catch(() => ({}))).error ?? "تعذر الحذف");
  }

  if (state === "loading") return <div className="card h-40 animate-pulse" />;

  if (state === "login")
    return (
      <form onSubmit={login} className="card mx-auto max-w-md space-y-4 p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-petrol-100 text-petrol-700"><Lock className="h-5 w-5" /></span>
        <h2 className="font-display text-xl font-bold">دخول المدربة</h2>
        <div>
          <label htmlFor="pw" className="label">كلمة مرور الإدارة</label>
          <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required />
        </div>
        {error && <p className="text-sm text-peach-500" role="alert">{error}</p>}
        <button className="btn-primary w-full">دخول</button>
      </form>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft">
          {items.length} مشاركة · {items.filter((i) => i.hidden).length} مخفية
        </p>
        <div className="flex gap-2">
          <button onClick={load} className="btn-soft !min-h-[40px] !text-sm"><RefreshCw className="h-4 w-4" /> تحديث</button>
          <button onClick={logout} className="btn-ghost !min-h-[40px] !text-sm"><LogOut className="h-4 w-4" /> خروج</button>
        </div>
      </div>
      {error && <p className="rounded-2xl bg-peach-50 p-3 text-sm text-ink" role="alert">{error}</p>}
      <ul className="grid gap-3">
        {items.map((s) => (
          <li key={s.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${s.hidden ? "opacity-60" : ""}`}>
            {s.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.cover_url} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="hidden h-16 w-24 shrink-0 rounded-xl bg-ivory-deep sm:block" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <TrackBadge track={s.track_id} />
                {s.hidden && <span className="chip bg-ink/10 text-ink-soft">مخفية</span>}
                <span className="text-xs text-ink-mute">{timeAgo(s.created_at)}</span>
              </div>
              <Link href={`/gallery/${s.id}`} className="mt-1 block truncate font-semibold hover:underline">{s.title}</Link>
              <p className="text-sm text-ink-soft">أ. {s.teacher_name}</p>
            </div>
            <div className="flex gap-2">
              <button disabled={busyId === s.id} onClick={() => setHidden(s, !s.hidden)} className="btn-soft !min-h-[40px] !text-sm">
                {busyId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : s.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {s.hidden ? "إظهار" : "إخفاء"}
              </button>
              <button disabled={busyId === s.id} onClick={() => remove(s)} className="btn-ghost !min-h-[40px] !text-sm text-peach-500 hover:!text-peach-500" aria-label={`حذف ${s.title}`}>
                <Trash2 className="h-4 w-4" /> حذف
              </button>
            </div>
          </li>
        ))}
        {!items.length && <li className="card p-8 text-center text-ink-soft">لا توجد مشاركات بعد.</li>}
      </ul>
    </div>
  );
}
