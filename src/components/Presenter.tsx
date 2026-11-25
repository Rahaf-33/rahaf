"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Shrink, QrCode, X, ExternalLink, Download, GraduationCap, BookOpen, Wrench, Sparkles } from "lucide-react";
import { useLiveSubmissions } from "@/lib/live";
import { TRACK_LIST, TRACKS, type TrackId } from "@/lib/tracks";
import { fileKind, officeViewerUrl } from "@/lib/files";
import { useSiteUrl } from "@/lib/site-url";
import type { Submission, SubmissionFile } from "@/lib/types";
import { Mark } from "./Logo";
import { QrImage } from "./QrImage";
import { LiveIndicator } from "./LiveIndicator";
import { FileIcon } from "./FileIcon";
import { arNum } from "@/lib/format";

type Filter = TrackId | "all";
type Order = "oldest" | "newest";

function Media({ s, file }: { s: Submission; file: SubmissionFile | "link" | null }) {
  if (file === "link" && s.external_url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <QrImage value={s.external_url} size={260} label="رمز رابط التطبيق" className="rounded-2xl bg-white p-3 shadow-soft" />
        <p className="text-lg text-ink-soft">امسحي الرمز لفتح التطبيق على جوالك</p>
        <a href={s.external_url} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-[52px] !px-7 !text-lg">
          <ExternalLink className="h-5 w-5" /> فتح رابط التطبيق
        </a>
        <p className="max-w-xl truncate text-sm text-ink-mute" dir="ltr">{s.external_url}</p>
      </div>
    );
  }
  if (file && file !== "link") {
    const k = fileKind(file.type);
    if (k === "image")
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={file.url} alt={`عمل ${s.teacher_name}`} className="h-full w-full object-contain" />;
    if (k === "pdf")
      return (
        <div className="relative h-full w-full">
          <iframe src={`${file.url}#view=FitH`} title={file.name} className="h-full w-full rounded-2xl bg-white" />
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn-soft absolute bottom-3 left-3 !min-h-[40px] !text-sm shadow-soft">
            <ExternalLink className="h-4 w-4" /> فتح الملف
          </a>
        </div>
      );
    if (k === "video") return <video src={file.url} controls className="h-full w-full rounded-2xl bg-ink object-contain" />;
    const viewer = k === "slides" || k === "doc" || k === "sheet" ? officeViewerUrl(file.url) : null;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-sage-100 text-sage-700"><FileIcon type={file.type} className="h-12 w-12" /></span>
        <p className="max-w-lg truncate text-xl font-semibold" dir="auto">{file.name}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {viewer && (
            <a href={viewer} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-[52px] !px-7 !text-lg">
              <ExternalLink className="h-5 w-5" /> فتح العرض
            </a>
          )}
          <a href={file.url} download={file.name} className="btn-soft !min-h-[52px] !px-7 !text-lg"><Download className="h-5 w-5" /> تحميل الملف</a>
        </div>
      </div>
    );
  }
  const tone = TRACKS[s.track_id].tone;
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-6 rounded-3xl p-10 text-center ${tone === "sage" ? "bg-sage-50" : "bg-petrol-50"}`}>
      <Sparkles className={`h-12 w-12 ${tone === "sage" ? "text-sage-500" : "text-petrol-500"}`} />
      <p className="max-w-2xl font-display text-3xl font-bold leading-[1.6] text-ink lg:text-4xl">{s.tool_or_strategy || s.lesson_title || s.title}</p>
    </div>
  );
}

export function Presenter({ initialTrack = "all", initialId }: { initialTrack?: Filter; initialId?: string }) {
  const { items, status, error } = useLiveSubmissions("all");
  const siteUrl = useSiteUrl();
  const [filter, setFilter] = useState<Filter>(initialTrack);
  const [order, setOrder] = useState<Order>("oldest");
  const [currentId, setCurrentId] = useState<string | null>(initialId ?? null);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [toast, setToast] = useState<Submission | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const l = filter === "all" ? items : items.filter((s) => s.track_id === filter);
    return order === "oldest" ? [...l].reverse() : l;
  }, [items, filter, order]);

  const index = Math.max(0, list.findIndex((s) => s.id === currentId));
  const current = list[index] as Submission | undefined;

  // ثبّت المشاركة الحالية عند وصول مشاركات جديدة
  useEffect(() => {
    if (!currentId && list.length) setCurrentId(list[0].id);
    if (currentId && list.length && !list.some((s) => s.id === currentId)) setCurrentId(list[0].id);
  }, [list, currentId]);

  // تنبيه بالمشاركات الجديدة
  useEffect(() => {
    if (status === "loading") return;
    if (seen.current) {
      const fresh = items.find((s) => !seen.current!.has(s.id));
      if (fresh) {
        setToast(fresh);
        const t = setTimeout(() => setToast(null), 9000);
        seen.current = new Set(items.map((s) => s.id));
        return () => clearTimeout(t);
      }
    }
    seen.current = new Set(items.map((s) => s.id));
  }, [items, status]);

  const go = useCallback(
    (delta: number) => {
      if (!list.length) return;
      const next = Math.min(list.length - 1, Math.max(0, index + delta));
      setCurrentId(list[next].id);
      setMediaIdx(0);
    },
    [list, index],
  );

  const toggleFs = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await (rootRef.current ?? document.documentElement).requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("select, input, textarea")) return;
      if (e.key === "ArrowLeft" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowRight" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") go(-Infinity);
      else if (e.key === "End") go(Infinity);
      else if (e.key.toLowerCase() === "f") toggleFs();
      else if (e.key.toLowerCase() === "q") setShowQr((v) => !v);
      else if (e.key === "Escape") setShowQr(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, toggleFs]);

  // سحب أفقي على الشاشات اللمسية
  const touchX = useRef<number | null>(null);

  const mediaList: (SubmissionFile | "link")[] = current
    ? [...current.files.filter((f) => fileKind(f.type) === "image"), ...current.files.filter((f) => fileKind(f.type) !== "image"), ...(current.external_url ? (["link"] as const) : [])]
    : [];
  const media = mediaList[Math.min(mediaIdx, mediaList.length - 1)] ?? null;

  return (
    <div
      ref={rootRef}
      className="flex h-dvh flex-col overflow-hidden bg-ivory"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 60) go(dx > 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* الشريط العلوي */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Mark className="h-9 w-9" />
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold">بصمة <span className="text-sage-600">رقمية</span></p>
            <p className="text-xs text-ink-mute">إبداعات معلماتنا</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LiveIndicator status={status} />
          <select aria-label="المسار" value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setCurrentId(null); }} className="field !w-auto !rounded-full !py-2 !text-sm">
            <option value="all">كل المسارات</option>
            {TRACK_LIST.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <select aria-label="الترتيب" value={order} onChange={(e) => { setOrder(e.target.value as Order); setCurrentId(null); }} className="field !w-auto !rounded-full !py-2 !text-sm">
            <option value="oldest">بترتيب الوصول</option>
            <option value="newest">الأحدث أولًا</option>
          </select>
          <button onClick={() => setShowQr(true)} className="btn-soft !min-h-[40px] !px-3" title="رمز QR (Q)" aria-label="عرض رمز QR"><QrCode className="h-5 w-5" /></button>
          <button onClick={toggleFs} className="btn-soft !min-h-[40px] !px-3" title="ملء الشاشة (F)" aria-label={fullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}>
            {fullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
          </button>
          {!fullscreen && <Link href="/gallery" className="btn-ghost !min-h-[40px] !px-3" aria-label="إغلاق وضع العرض"><X className="h-5 w-5" /></Link>}
        </div>
      </header>

      {/* المحتوى */}
      <main className="min-h-0 flex-1 px-5 pb-3 lg:px-8">
        {status === "unconfigured" || (status === "error" && !items.length) ? (
          <div className="flex h-full items-center justify-center text-center text-lg text-ink-soft">{error}</div>
        ) : status === "loading" ? (
          <div className="h-full animate-pulse rounded-4xl bg-white/60" />
        ) : !current ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            {siteUrl && <QrImage value={siteUrl} size={300} className="rounded-3xl bg-white p-4 shadow-lift" />}
            <h1 className="font-display text-4xl font-extrabold">بانتظار أول بصمة…</h1>
            <p className="text-xl text-ink-soft">امسحي الرمز، وطبّقي، وارفعي مشاركتك لتظهر هنا مباشرة.</p>
            <p className="text-lg font-semibold text-petrol-600" dir="ltr">{siteUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        ) : (
          <div key={current.id} className="grid h-full animate-rise gap-5 lg:grid-cols-[minmax(320px,32%)_minmax(0,1fr)]">
            <section className="card relative flex min-h-[40vh] flex-col overflow-hidden p-3 lg:order-2">
              <div className="min-h-0 flex-1">
                <Media s={current} file={media} />
              </div>
              {mediaList.length > 1 && (
                <div className="flex justify-center gap-2 pt-3">
                  {mediaList.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setMediaIdx(i)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${i === mediaIdx ? "bg-ink text-white" : "bg-ivory-deep text-ink-soft"}`}
                    >
                      {m === "link" ? <ExternalLink className="h-4 w-4" /> : <FileIcon type={m.type} className="h-4 w-4" />}
                      {m === "link" ? "الرابط" : fileKind(m.type) === "image" ? `صورة ${i + 1}` : "ملف"}
                    </button>
                  ))}
                </div>
              )}
            </section>
            <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto lg:order-1 lg:py-4">
              <p className="font-display text-sm font-bold text-ink-mute">المشاركة {arNum(index + 1)} من {arNum(list.length)}</p>
              <div>
                <p className="text-sm font-semibold text-ink-mute">المعلمة</p>
                <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight text-petrol-700 xl:text-5xl">أ. {current.teacher_name}</h1>
              </div>
              <h2 className="font-display text-2xl font-bold leading-[1.6] xl:text-3xl">{current.title}</h2>
              <span className={`chip self-start !px-4 !py-1.5 !text-sm ${TRACKS[current.track_id].tone === "sage" ? "bg-sage-100 text-sage-700" : "bg-petrol-100 text-petrol-700"}`}>
                {TRACKS[current.track_id].title}
              </span>
              <dl className="grid gap-2 text-base">
                {[
                  { icon: GraduationCap, v: current.grade_level },
                  { icon: BookOpen, v: current.lesson_title },
                  { icon: Wrench, v: current.tool_or_strategy },
                ]
                  .filter((x) => x.v)
                  .map((x, i) => (
                    <div key={i} className="flex items-center gap-2 text-ink-soft">
                      <x.icon className="h-5 w-5 shrink-0 text-sage-600" /> <dd>{x.v}</dd>
                    </div>
                  ))}
              </dl>
              {current.description && <p className="whitespace-pre-line text-lg leading-9 text-ink-soft">{current.description}</p>}
            </aside>
          </div>
        )}
      </main>

      {/* التنقل */}
      {list.length > 0 && (
        <footer className="flex items-center justify-between gap-4 px-5 pb-4 lg:px-8">
          <button onClick={() => go(-1)} disabled={index === 0} className="btn-soft !min-h-[52px] !px-6 !text-base">
            <ChevronRight className="h-5 w-5" /> السابقة
          </button>
          <div className="hidden min-w-0 flex-1 justify-center gap-1.5 overflow-hidden sm:flex" aria-hidden>
            {list.length <= 40 &&
              list.map((s, i) => (
                <button
                  key={s.id}
                  tabIndex={-1}
                  onClick={() => { setCurrentId(s.id); setMediaIdx(0); }}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-petrol-600" : "w-2 bg-ink/15 hover:bg-ink/30"}`}
                />
              ))}
          </div>
          <button onClick={() => go(1)} disabled={index >= list.length - 1} className="btn-primary !min-h-[52px] !px-6 !text-base">
            التالية <ChevronLeft className="h-5 w-5" />
          </button>
        </footer>
      )}

      {/* تنبيه مشاركة جديدة */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex animate-rise items-center gap-4 rounded-full bg-ink py-2.5 pe-2.5 ps-5 text-white shadow-lift" role="status">
          <Sparkles className="h-5 w-5 text-peach-200" />
          <span className="text-sm sm:text-base">مشاركة جديدة من <b>أ. {toast.teacher_name}</b></span>
          <button
            onClick={() => {
              if (filter !== "all" && filter !== toast.track_id) setFilter("all");
              setCurrentId(toast.id);
              setMediaIdx(0);
              setToast(null);
            }}
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink"
          >
            اعرضيها
          </button>
        </div>
        </div>
      )}

      {/* طبقة QR */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-sm" onClick={() => setShowQr(false)}>
          <div className="card flex flex-col items-center gap-4 p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <QrImage value={siteUrl} size={340} />
            <p className="font-display text-2xl font-extrabold">شاركي بصمتك</p>
            <p className="text-lg font-semibold text-petrol-600" dir="ltr">{siteUrl.replace(/^https?:\/\//, "")}</p>
            <button onClick={() => setShowQr(false)} className="btn-soft">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
