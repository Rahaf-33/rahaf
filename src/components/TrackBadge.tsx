import { TRACKS, type TrackId } from "@/lib/tracks";

export function TrackBadge({ track, className = "" }: { track: TrackId; className?: string }) {
  const t = TRACKS[track];
  const tone = t.tone === "sage" ? "bg-sage-100 text-sage-700" : "bg-petrol-100 text-petrol-700";
  return (
    <span className={`chip ${tone} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.tone === "sage" ? "bg-sage-500" : "bg-petrol-500"}`} />
      {t.title}
    </span>
  );
}
