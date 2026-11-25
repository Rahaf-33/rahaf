/** قواعد الملفات المشتركة بين المتصفح والخادم */
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_FILES = 3;

export const ALLOWED_TYPES: Record<string, { ext: string; label: string }> = {
  "image/jpeg": { ext: "jpg", label: "صورة" },
  "image/png": { ext: "png", label: "صورة" },
  "image/webp": { ext: "webp", label: "صورة" },
  "image/gif": { ext: "gif", label: "صورة" },
  "image/heic": { ext: "heic", label: "صورة" },
  "image/heif": { ext: "heif", label: "صورة" },
  "application/pdf": { ext: "pdf", label: "PDF" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: "pptx", label: "عرض تقديمي" },
  "application/vnd.ms-powerpoint": { ext: "ppt", label: "عرض تقديمي" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", label: "مستند Word" },
  "application/msword": { ext: "doc", label: "مستند Word" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", label: "جدول Excel" },
  "application/vnd.ms-excel": { ext: "xls", label: "جدول Excel" },
  "video/mp4": { ext: "mp4", label: "فيديو" },
};

const EXT_TO_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_TYPES).map(([type, { ext }]) => [ext, type]),
);
EXT_TO_TYPE["jpeg"] = "image/jpeg";

/** بعض الجوالات لا ترسل نوع الملف؛ نستنتجه من الامتداد */
export function resolveMime(name: string, type: string): string | null {
  if (type && ALLOWED_TYPES[type]) return type;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? null;
}

export const ACCEPT_ATTR = [
  "image/*",
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".mp4",
].join(",");

export function isImage(type: string) {
  return type.startsWith("image/") && type !== "image/heic" && type !== "image/heif";
}

export function fileKind(type: string): "image" | "pdf" | "slides" | "doc" | "sheet" | "video" | "file" {
  if (isImage(type)) return "image";
  if (type === "application/pdf") return "pdf";
  if (type.includes("presentation") || type.includes("powerpoint")) return "slides";
  if (type.includes("word")) return "doc";
  if (type.includes("sheet") || type.includes("excel")) return "sheet";
  if (type.startsWith("video/")) return "video";
  return "file";
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} ك.ب`;
  return `${(n / 1024 / 1024).toFixed(1)} م.ب`;
}

/** رابط عارض Office للملفات العامة (PowerPoint/Word/Excel) */
export function officeViewerUrl(url: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}
