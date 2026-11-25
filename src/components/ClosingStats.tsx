"use client";
import Link from "next/link";
import { useLiveStats } from "@/lib/live";
import { arNum } from "@/lib/format";
import { TRACKS } from "@/lib/tracks";
import { Notice } from "./Notice";

export function ClosingStats() {
  const { stats, error } = useLiveStats();
  if (error && !stats) return <Notice tone="setup" title="تعذر تحميل الأرقام">{error}</Notice>;
  const tiles = [
    { label: "مشاركة فعلية", value: stats?.total, tone: "text-ink" },
    { label: "معلمة مشاركة", value: stats?.teachers, tone: "text-peach-500" },
    { label: TRACKS.interactive.title, value: stats?.byTrack.interactive, tone: "text-sage-600", href: "/gallery?track=interactive" },
    { label: TRACKS.assessment.title, value: stats?.byTrack.assessment, tone: "text-petrol-600", href: "/gallery?track=assessment" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((t) => {
        const body = (
          <>
            <p className={`font-display text-5xl font-extrabold tabular-nums sm:text-6xl ${t.tone}`}>
              {t.value === undefined ? <span className="inline-block h-12 w-16 animate-pulse rounded-xl bg-ivory-deep align-middle" /> : arNum(t.value)}
            </p>
            <p className="mt-3 text-sm font-semibold text-ink-soft sm:text-base">{t.href ? `مشاركة في ${t.label}` : t.label}</p>
          </>
        );
        return t.href ? (
          <Link key={t.label} href={t.href} className="card p-6 text-center transition hover:shadow-lift sm:p-8">{body}</Link>
        ) : (
          <div key={t.label} className="card p-6 text-center sm:p-8">{body}</div>
        );
      })}
    </div>
  );
}
