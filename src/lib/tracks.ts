export type TrackId = "interactive" | "assessment";

export interface TrackMeta {
  id: TrackId;
  title: string;
  short: string;
  description: string;
  href: string;
  /** Tailwind token family used for the track accent */
  tone: "sage" | "petrol";
}

export const TRACKS: Record<TrackId, TrackMeta> = {
  interactive: {
    id: "interactive",
    title: "إدارة الحصة التفاعلية",
    short: "الحصة التفاعلية",
    description: "أدوات وممارسات تجعل الحصة أكثر تفاعلًا وتنظيمًا.",
    href: "/tracks/interactive",
    tone: "sage",
  },
  assessment: {
    id: "assessment",
    title: "التقويم من أجل التعلم",
    short: "التقويم من أجل التعلم",
    description: "كيف نكتشف تعلم الطالبة ونستخدم الأدلة لتحسين تعلمها.",
    href: "/tracks/assessment",
    tone: "petrol",
  },
};

export const TRACK_LIST: TrackMeta[] = [TRACKS.interactive, TRACKS.assessment];

export function isTrackId(v: unknown): v is TrackId {
  return v === "interactive" || v === "assessment";
}

export const GRADE_LEVELS = [
  "المرحلة الابتدائية",
  "المرحلة المتوسطة",
  "المرحلة الثانوية",
  "أخرى",
] as const;
