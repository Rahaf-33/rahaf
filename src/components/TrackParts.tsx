import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Home, PenLine, UploadCloud } from "lucide-react";
import { TRACKS, type TrackId } from "@/lib/tracks";
import { Gallery } from "./Gallery";

export function TrackHero({ track, index, intro }: { track: TrackId; index: string; intro: string }) {
  const t = TRACKS[track];
  const sage = t.tone === "sage";
  return (
    <section className="container-page pb-6 pt-8 sm:pt-12">
      <nav className="mb-8 flex items-center gap-2 text-sm text-ink-mute" aria-label="مسار التنقل">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-ink"><Home className="h-4 w-4" /> الرئيسية</Link>
        <span aria-hidden>/</span>
        <span className="text-ink-soft">{t.title}</span>
      </nav>
      <div className="max-w-3xl">
        <span className={`chip ${sage ? "bg-sage-100 text-sage-700" : "bg-petrol-100 text-petrol-700"}`}>المسار {index}</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg leading-9 text-ink-soft">{intro}</p>
      </div>
    </section>
  );
}

export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <div className="sticky top-16 z-30 border-y border-ink/[0.05] bg-ivory/90 backdrop-blur">
      <nav className="container-page -mb-px flex gap-1 overflow-x-auto py-2.5" aria-label="أقسام المسار">
        {items.map((it, i) => (
          <a key={it.id} href={`#${it.id}`} className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-white hover:text-ink">
            <span className="me-1.5 text-ink-mute">{i + 1}</span>
            {it.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function Section({ id, num, title, lead, children }: { id: string; num: number; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="container-page scroll-mt-32 pt-16 sm:pt-20">
      <div className="mb-8 flex items-start gap-4">
        <span className="mt-1 font-display text-4xl font-extrabold leading-none text-peach-200 sm:text-5xl">{num}</span>
        <div>
          <h2 className="h-section">{title}</h2>
          {lead && <p className="mt-2 max-w-2xl leading-8 text-ink-soft">{lead}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ToolCard({ name, use, when, url, tone }: { name: string; use: string; when: string; url: string; tone: "sage" | "petrol" | "peach" }) {
  const bg = tone === "sage" ? "bg-sage-100 text-sage-700" : tone === "petrol" ? "bg-petrol-100 text-petrol-700" : "bg-peach-100 text-peach-500";
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-display text-lg font-extrabold ${bg}`} dir="ltr">{name.charAt(0)}</span>
        <div>
          <h3 className="font-bold" dir="ltr">{name}</h3>
          <p className="text-xs font-semibold text-ink-mute">{use}</p>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-7 text-ink-soft">
        <span className="font-semibold text-ink">متى أستخدمها؟ </span>
        {when}
      </p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-petrol-600 hover:text-petrol-700">
        الموقع الرسمي <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export function StepFlow({ steps, tone }: { steps: { title: string; text: string; tag?: string }[]; tone: "sage" | "petrol" }) {
  const dot = tone === "sage" ? "bg-sage-600" : "bg-petrol-600";
  const line = tone === "sage" ? "bg-sage-200" : "bg-petrol-200";
  return (
    <ol className="relative grid gap-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${dot}`}>{i + 1}</span>
            {i < steps.length - 1 && <span className={`w-0.5 flex-1 ${line}`} aria-hidden />}
          </div>
          <div className="card mb-1 flex-1 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-bold">{s.title}</h3>
              {s.tag && <span className="chip bg-peach-50 text-peach-500" dir="auto">{s.tag}</span>}
            </div>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ApplySpace({ track, instructions, hints }: { track: TrackId; instructions: string; hints: string[] }) {
  const sage = TRACKS[track].tone === "sage";
  return (
    <div className={`overflow-hidden rounded-4xl border ${sage ? "border-sage-200 bg-sage-50" : "border-petrol-200 bg-petrol-50"}`}>
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 font-display font-bold text-ink-soft">
            <PenLine className="h-5 w-5 text-peach-500" /> مهمة التطبيق
          </span>
          <p className="mt-4 font-display text-xl font-bold leading-10 text-ink sm:text-2xl sm:leading-[3rem]">«{instructions}»</p>
          <ul className="mt-6 grid gap-2 text-sm leading-7 text-ink-soft">
            {hints.map((h) => (
              <li key={h} className="flex gap-2">
                <span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${sage ? "bg-sage-500" : "bg-petrol-500"}`} />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:items-center">
          <Link href={`/submit?track=${track}`} className={`${sage ? "btn-sage" : "btn-primary"} !min-h-[60px] !text-lg shadow-lift`}>
            <UploadCloud className="h-5 w-5" /> أضيفي مشاركتك
          </Link>
          <p className="text-center text-xs text-ink-mute">من جوالك مباشرة — تستغرق دقيقة واحدة</p>
        </div>
      </div>
    </div>
  );
}

export function TrackGallery({ track }: { track: TrackId }) {
  return (
    <section id="gallery" className="container-page scroll-mt-32 pt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">يتحدث مباشرة</p>
          <h2 className="h-section mt-2">مشاركات هذا المسار</h2>
        </div>
        <Link href={`/gallery?track=${track}`} className="btn-soft">كل مشاركات المسار <ArrowLeft className="h-4 w-4" /></Link>
      </div>
      <Gallery compact initialTrack={track} limit={6} />
    </section>
  );
}

export function TrackSwitch({ current }: { current: TrackId }) {
  const other = TRACKS[current === "interactive" ? "assessment" : "interactive"];
  return (
    <div className="container-page mt-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Link href="/" className="card flex items-center gap-3 p-5 text-ink-soft transition hover:text-ink sm:w-56">
          <ArrowRight className="h-5 w-5" /> العودة للرئيسية
        </Link>
        <Link href={other.href} className="card group flex flex-1 items-center justify-between gap-4 p-5 transition hover:shadow-lift">
          <div>
            <p className="text-xs font-semibold text-ink-mute">المسار {current === "interactive" ? "الثاني" : "الأول"}</p>
            <p className="font-display text-lg font-bold">{other.title}</p>
          </div>
          <ArrowLeft className="h-5 w-5 text-petrol-600 transition group-hover:-translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
