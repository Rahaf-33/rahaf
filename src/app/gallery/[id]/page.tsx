import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, ExternalLink, GraduationCap, BookOpen, Wrench, MonitorPlay } from "lucide-react";
import { Shell } from "@/components/Shell";
import { TrackBadge } from "@/components/TrackBadge";
import { FileIcon } from "@/components/FileIcon";
import { Notice } from "@/components/Notice";
import { getSubmission } from "@/lib/data";
import { NotConfiguredError } from "@/lib/supabase/server";
import { NOT_CONFIGURED_MESSAGE } from "@/lib/config";
import { fileKind, formatBytes, officeViewerUrl } from "@/lib/files";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<Submission | null | "unconfigured"> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    return await getSubmission(id);
  } catch (e) {
    if (e instanceof NotConfiguredError) return "unconfigured";
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = await load((await params).id);
  return { title: s && s !== "unconfigured" ? `${s.title} — ${s.teacher_name}` : "مشاركة" };
}

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await load((await params).id);
  if (s === "unconfigured")
    return (
      <Shell>
        <div className="container-page max-w-3xl pt-14"><Notice tone="setup" title="المنصة غير متصلة بعد">{NOT_CONFIGURED_MESSAGE}</Notice></div>
      </Shell>
    );
  if (!s) notFound();

  const date = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", { dateStyle: "long", timeStyle: "short" }).format(new Date(s.created_at));
  const images = s.files.filter((f) => fileKind(f.type) === "image");
  const others = s.files.filter((f) => fileKind(f.type) !== "image");

  return (
    <Shell>
      <article className="container-page max-w-4xl pt-8 sm:pt-12">
        <Link href={`/gallery?track=${s.track_id}`} className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink">
          <ArrowRight className="h-4 w-4" /> العودة إلى المعرض
        </Link>
        <TrackBadge track={s.track_id} />
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{s.title}</h1>
        <p className="mt-3 text-lg font-semibold text-petrol-600">أ. {s.teacher_name}</p>
        <p className="mt-1 text-sm text-ink-mute">{date}</p>

        {(s.grade_level || s.lesson_title || s.tool_or_strategy) && (
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: GraduationCap, k: "المرحلة", v: s.grade_level },
              { icon: BookOpen, k: "الدرس", v: s.lesson_title },
              { icon: Wrench, k: s.track_id === "assessment" ? "الاستراتيجية / الأداة" : "البرنامج / الأداة", v: s.tool_or_strategy },
            ]
              .filter((x) => x.v)
              .map((x) => (
                <div key={x.k} className="card flex items-start gap-3 p-4">
                  <x.icon className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" />
                  <div>
                    <dt className="text-xs font-semibold text-ink-mute">{x.k}</dt>
                    <dd className="font-semibold">{x.v}</dd>
                  </div>
                </div>
              ))}
          </dl>
        )}

        {s.description && (
          <div className="card mt-6 p-6 sm:p-8">
            <h2 className="mb-3 font-display text-lg font-bold">وصف التطبيق</h2>
            <p className="whitespace-pre-line leading-9 text-ink-soft">{s.description}</p>
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-6 grid gap-4">
            {images.map((f) => (
              <a key={f.path} href={f.url} target="_blank" rel="noopener noreferrer" className="card block overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`صورة من مشاركة ${s.teacher_name}`} className="w-full object-contain" />
              </a>
            ))}
          </div>
        )}

        {(others.length > 0 || s.external_url) && (
          <div className="mt-6 grid gap-3">
            {s.external_url && (
              <a href={s.external_url} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:shadow-lift">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-petrol-100 text-petrol-700"><ExternalLink className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">فتح رابط التطبيق</span>
                  <span className="block truncate text-sm text-ink-mute" dir="ltr">{s.external_url}</span>
                </span>
              </a>
            )}
            {others.map((f) => {
              const k = fileKind(f.type);
              const viewUrl = k === "slides" || k === "doc" || k === "sheet" ? officeViewerUrl(f.url) : f.url;
              return (
                <div key={f.path} className="card flex flex-wrap items-center gap-4 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700"><FileIcon type={f.type} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold" dir="auto">{f.name}</span>
                    <span className="text-sm text-ink-mute">{formatBytes(f.size)}</span>
                  </span>
                  <div className="flex gap-2">
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="btn-soft !min-h-[40px] !text-sm">عرض</a>
                    <a href={f.url} download={f.name} className="btn-ghost !min-h-[40px] !text-sm" aria-label={`تحميل ${f.name}`}><Download className="h-4 w-4" /></a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={`/present?id=${s.id}`} className="btn-soft"><MonitorPlay className="h-4 w-4" /> عرضها على الشاشة</Link>
          <Link href={`/submit?track=${s.track_id}`} className="btn-primary">أضيفي مشاركتك أنتِ أيضًا</Link>
        </div>
      </article>
    </Shell>
  );
}
