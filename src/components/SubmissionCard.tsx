import Link from "next/link";
import { ArrowLeft, Link2, Paperclip } from "lucide-react";
import type { Submission } from "@/lib/types";
import { TRACKS } from "@/lib/tracks";
import { TrackBadge } from "./TrackBadge";
import { FileIcon } from "./FileIcon";
import { timeAgo } from "@/lib/format";

export function SubmissionCard({ s, fresh = false }: { s: Submission; fresh?: boolean }) {
  const tone = TRACKS[s.track_id].tone;
  const firstFile = s.files[0];
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift ${
        fresh ? "animate-rise ring-2 ring-peach-200" : ""
      }`}
    >
      <Link href={`/gallery/${s.id}`} className="relative block aspect-[16/10] overflow-hidden bg-ivory-deep" tabIndex={-1} aria-hidden>
        {s.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className={`flex h-full w-full flex-col items-center justify-center gap-3 ${tone === "sage" ? "bg-sage-50 text-sage-600" : "bg-petrol-50 text-petrol-600"}`}>
            {firstFile ? (
              <FileIcon type={firstFile.type} className="h-10 w-10 opacity-80" />
            ) : s.external_url ? (
              <Link2 className="h-10 w-10 opacity-80" />
            ) : (
              <span className="font-display text-5xl font-extrabold opacity-30">{s.teacher_name.trim().charAt(0)}</span>
            )}
            {s.tool_or_strategy && <span className="max-w-[80%] truncate text-sm font-semibold opacity-80">{s.tool_or_strategy}</span>}
          </div>
        )}
        {fresh && <span className="chip absolute right-3 top-3 bg-peach-500 text-white shadow-soft">جديد</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <TrackBadge track={s.track_id} />
          <time className="text-xs text-ink-mute" dateTime={s.created_at}>{timeAgo(s.created_at)}</time>
        </div>
        <h3 className="font-display text-lg font-bold leading-snug text-ink">{s.title}</h3>
        <p className="text-sm font-semibold text-petrol-600">أ. {s.teacher_name}</p>
        {s.description && <p className="line-clamp-3 text-sm leading-7 text-ink-soft">{s.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 text-xs text-ink-mute">
            {s.files.length > 0 && (
              <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{s.files.length}</span>
            )}
            {s.external_url && <span className="inline-flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />رابط</span>}
          </div>
          <Link href={`/gallery/${s.id}`} className="btn-soft !min-h-[38px] !px-4 !text-sm">
            مشاهدة التطبيق
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
