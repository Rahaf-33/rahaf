"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "./supabase/browser";
import type { Stats, Submission } from "./types";
import type { TrackId } from "./tracks";

export type LiveStatus = "loading" | "live" | "polling" | "error" | "unconfigured";

const POLL_MS = 12_000;

/**
 * يشترك في تغييرات جدول المشاركات عبر Supabase Realtime.
 * عند أي تغيير يستدعي onChange. وللاحتياط (شبكات المدارس قد تحجب WebSocket)
 * يعيد الجلب دوريًا وعند عودة التبويب للواجهة.
 */
function useRealtime(onChange: () => void, channelName: string) {
  const cb = useRef(onChange);
  cb.current = onChange;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sb = browserClient();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => cb.current(), 250);
    };

    const channel = sb
      ?.channel(`${channelName}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, fire)
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    const poll = setInterval(() => cb.current(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && cb.current();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      clearTimeout(debounce);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      if (channel && sb) sb.removeChannel(channel);
    };
  }, [channelName]);

  return connected;
}

export function useLiveSubmissions(track?: TrackId | "all") {
  const [items, setItems] = useState<Submission[]>([]);
  const [status, setStatus] = useState<LiveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = track && track !== "all" ? `?track=${track}` : "";
      const res = await fetch(`/api/submissions${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (res.status === 503) {
        setStatus("unconfigured");
        setError(json.error);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "تعذر تحميل المشاركات");
      const next: Submission[] = json.items;
      if (known.current) {
        const added = next.filter((s) => !known.current!.has(s.id)).map((s) => s.id);
        if (added.length) {
          setFreshIds((prev) => new Set([...prev, ...added]));
          setTimeout(() => setFreshIds((prev) => {
            const n = new Set(prev);
            added.forEach((id) => n.delete(id));
            return n;
          }), 8000);
        }
      }
      known.current = new Set(next.map((s) => s.id));
      setItems(next);
      setError(null);
      setStatus((s) => (s === "live" ? s : "polling"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الاتصال");
      setStatus((s) => (s === "loading" ? "error" : s));
    }
  }, [track]);

  useEffect(() => {
    known.current = null;
    setStatus("loading");
    load();
  }, [load]);

  const connected = useRealtime(load, "submissions");
  const effective: LiveStatus =
    status === "polling" || status === "live" ? (connected ? "live" : "polling") : status;

  return { items, status: effective, error, freshIds, reload: load };
}

export function useLiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "تعذر تحميل الأرقام");
      setStats(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الاتصال");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useRealtime(load, "stats");
  return { stats, error };
}
