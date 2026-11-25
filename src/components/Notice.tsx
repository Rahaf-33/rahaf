import { AlertCircle, Settings } from "lucide-react";

export function Notice({ tone = "warn", title, children }: { tone?: "warn" | "setup"; title: string; children?: React.ReactNode }) {
  const Icon = tone === "setup" ? Settings : AlertCircle;
  return (
    <div className="rounded-3xl border border-peach-200 bg-peach-50 p-5 text-ink" role="alert">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-peach-500" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          {children && <div className="text-sm leading-7 text-ink-soft">{children}</div>}
        </div>
      </div>
    </div>
  );
}
