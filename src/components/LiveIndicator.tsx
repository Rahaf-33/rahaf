import type { LiveStatus } from "@/lib/live";

export function LiveIndicator({ status }: { status: LiveStatus }) {
  if (status === "loading" || status === "unconfigured") return null;
  const map = {
    live: { dot: "bg-sage-500", text: "تحديث مباشر", ping: true },
    polling: { dot: "bg-petrol-400", text: "يتحدث تلقائيًا", ping: false },
    error: { dot: "bg-peach-500", text: "تعذر الاتصال — نعيد المحاولة", ping: false },
  } as const;
  const m = map[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-soft shadow-soft" role="status">
      <span className="relative flex h-2 w-2">
        {m.ping && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${m.dot} opacity-60`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${m.dot}`} />
      </span>
      {m.text}
    </span>
  );
}
