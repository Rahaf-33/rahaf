"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MonitorPlay, Plus, Search } from "lucide-react";
import { useLiveSubmissions } from "@/lib/live";
import { TRACK_LIST, type TrackId } from "@/lib/tracks";
import { SubmissionCard } from "./SubmissionCard";
import { LiveIndicator } from "./LiveIndicator";
import { Notice } from "./Notice";
import { arNum } from "@/lib/format";

type Filter = TrackId | "all";

export function Gallery({ initialTrack = "all", compact = false, limit }: { initialTrack?: Filter; compact?: boolean; limit?: number }) {
  const [filter, setFilter] = useState<Filter>(initialTrack);
  const [q, setQ] = useState("");
  const { items, status, error, freshIds } = useLiveSubmissions(compact ? initialTrack : "all");

  const counts = useMemo(
    () => ({
      all: items.length,
      interactive: items.filter((s) => s.track_id === "interactive").length,
      assessment: items.filter((s) => s.track_id === "assessment").length,
    }),
    [items],
  );

  const shown = useMemo(() => {
    const term = q.trim();
    let list = filter === "all" ? items : items.filter((s) => s.track_id === filter);
    if (term) {
      list = list.filter((s) =>
        [s.teacher_name, s.title, s.lesson_title, s.tool_or_strategy, s.description].some((v) => v?.includes(term)),
      );
    }
    return limit ? list.slice(0, limit) : list;
  }, [items, filter, q, limit]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "كل المشاركات" },
    ...TRACK_LIST.map((t) => ({ id: t.id as Filter, label: t.title })),
  ];

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="تصفية حسب المسار">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={filter === t.id}
                onClick={() => setFilter(t.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === t.id ? "bg-ink text-white" : "bg-white text-ink-soft shadow-soft hover:text-ink"
                }`}
              >
                {t.label}
                <span className={`ms-2 rounded-full px-2 py-0.5 text-xs ${filter === t.id ? "bg-white/15" : "bg-ivory-deep"}`}>
                  {arNum(counts[t.id])}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="relative block flex-1 md:w-64 md:flex-none">
              <span className="sr-only">بحث</span>
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم معلمة أو أداة…" className="field !rounded-full !py-2.5 !pr-10 !text-sm" />
            </label>
            <LiveIndicator status={status} />
          </div>
        </div>
      )}

      {status === "unconfigured" && (
        <Notice tone="setup" title="المعرض بانتظار ربط قاعدة البيانات">
          {error} راجعي ملف README لخطوات الإعداد.
        </Notice>
      )}
      {status === "error" && items.length === 0 && <Notice title="تعذر تحميل المشاركات">{error}</Notice>}

      {status === "loading" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-white/60" />
          ))}
        </div>
      )}

      {(status === "live" || status === "polling" || (status === "error" && items.length > 0)) &&
        (shown.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s) => (
              <SubmissionCard key={s.id} s={s} fresh={freshIds.has(s.id)} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
            <p className="font-display text-xl font-bold">{q ? "لا توجد نتائج مطابقة" : "المعرض ينتظر أول بصمة"}</p>
            <p className="max-w-md text-sm leading-7 text-ink-soft">
              {q ? "جرّبي كلمة أخرى." : "عندما ترفع المعلمات مشاركاتهن ستظهر هنا مباشرة دون تحديث الصفحة."}
            </p>
            {!q && (
              <Link href={filter === "all" ? "/submit" : `/submit?track=${filter}`} className="btn-primary">
                <Plus className="h-4 w-4" /> أضيفي أول مشاركة
              </Link>
            )}
          </div>
        ))}

      {!compact && items.length > 0 && (
        <div className="flex justify-center pt-2">
          <Link href={filter === "all" ? "/present" : `/present?track=${filter}`} className="btn-soft">
            <MonitorPlay className="h-4 w-4" /> استعراض هذه المشاركات في وضع العرض
          </Link>
        </div>
      )}
    </div>
  );
}
