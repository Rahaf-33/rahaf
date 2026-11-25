import { z } from "zod";
import { MAX_FILE_BYTES, MAX_FILES, resolveMime } from "./files";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `النص أطول من المسموح (${max} حرفًا)`)
    .optional()
    .transform((v) => (v ? v : null));

export const uploadRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    type: z.string().max(200).default(""),
    size: z.number().int().positive().max(MAX_FILE_BYTES, "حجم الملف أكبر من 15 ميجابايت"),
  })
  .transform((v, ctx) => {
    const mime = resolveMime(v.name, v.type);
    if (!mime) {
      ctx.addIssue({ code: "custom", message: "نوع الملف غير مدعوم" });
      return z.NEVER;
    }
    return { ...v, type: mime };
  });

export const fileRefSchema = z.object({
  path: z.string().regex(/^uploads\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/, "مسار ملف غير صالح"),
  name: z.string().trim().min(1).max(200),
  type: z.string().max(200),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});

export const submissionSchema = z.object({
  teacher_name: z.string().trim().min(2, "اكتبي اسمك (حرفان على الأقل)").max(80, "الاسم طويل جدًا"),
  title: z.string().trim().min(3, "اكتبي عنوانًا للمشاركة (3 أحرف على الأقل)").max(140, "العنوان طويل جدًا"),
  track_id: z.enum(["interactive", "assessment"], { message: "اختاري المسار التدريبي" }),
  grade_level: optionalText(60),
  lesson_title: optionalText(140),
  tool_or_strategy: optionalText(140),
  description: optionalText(2000),
  external_url: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), "الرابط غير صحيح، يجب أن يبدأ بـ https://"),
  files: z.array(fileRefSchema).max(MAX_FILES, `يمكن إرفاق ${MAX_FILES} ملفات كحد أقصى`).default([]),
});

export type SubmissionInput = z.input<typeof submissionSchema>;

/** يحوّل رابطًا كتبته المعلمة بدون بروتوكول إلى https */
export function normalizeUrl(v: string) {
  const t = v.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function firstError(err: z.ZodError) {
  return err.issues[0]?.message ?? "البيانات غير مكتملة";
}
