"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Send, Trash2, UploadCloud, Plus, LayoutGrid } from "lucide-react";
import { GRADE_LEVELS, TRACK_LIST, type TrackId } from "@/lib/tracks";
import { ACCEPT_ATTR, MAX_FILES, MAX_FILE_BYTES, formatBytes, resolveMime } from "@/lib/files";
import { normalizeUrl, submissionSchema, firstError } from "@/lib/validation";
import { browserClient } from "@/lib/supabase/browser";
import { BUCKET, NOT_CONFIGURED_MESSAGE } from "@/lib/config";
import { FileIcon } from "./FileIcon";

type Picked = { id: string; file: File; type: string; preview?: string };
type Phase = { kind: "idle" } | { kind: "sending"; step: string } | { kind: "done"; id: string; track: TrackId };

const NAME_KEY = "basmah:teacher-name";

/** تصغير صور الجوال الكبيرة قبل الرفع لتسريع الإرسال على شبكة الورشة */
async function shrinkImage(file: File, type: string): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 2200;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function SubmitForm({ initialTrack }: { initialTrack?: TrackId }) {
  const [track, setTrack] = useState<TrackId | "">(initialTrack ?? "");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved);
    } catch {}
  }, []);

  useEffect(() => () => files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), [files]);

  function addFiles(list: FileList | null) {
    setFileError(null);
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        setFileError(`يمكن إرفاق ${MAX_FILES} ملفات كحد أقصى.`);
        break;
      }
      const type = resolveMime(file.name, file.type);
      if (!type) {
        setFileError(`نوع الملف «${file.name}» غير مدعوم. الأنواع المتاحة: صور، PDF، عروض PowerPoint، Word، Excel، فيديو MP4.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES && !type.startsWith("image/")) {
        setFileError(`الملف «${file.name}» أكبر من ${formatBytes(MAX_FILE_BYTES)}. يمكنك إضافة رابط له بدلًا من رفعه.`);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        type,
        preview: type.startsWith("image/") && !type.includes("hei") ? URL.createObjectURL(file) : undefined,
      });
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const draft = {
      teacher_name: String(fd.get("teacher_name") ?? ""),
      title: String(fd.get("title") ?? ""),
      track_id: track,
      grade_level: String(fd.get("grade_level") ?? ""),
      lesson_title: String(fd.get("lesson_title") ?? ""),
      tool_or_strategy: String(fd.get("tool_or_strategy") ?? ""),
      description: String(fd.get("description") ?? ""),
      external_url: normalizeUrl(String(fd.get("external_url") ?? "")),
      files: [] as { path: string; name: string; type: string; size: number }[],
    };
    const check = submissionSchema.safeParse(draft);
    if (!check.success) {
      setError(firstError(check.error));
      return;
    }

    try {
      if (files.length) {
        const sb = browserClient();
        if (!sb) throw new Error(NOT_CONFIGURED_MESSAGE);
        for (let i = 0; i < files.length; i++) {
          const picked = files[i];
          setPhase({ kind: "sending", step: files.length > 1 ? `رفع الملف ${i + 1} من ${files.length}…` : "رفع الملف…" });
          const file = await shrinkImage(picked.file, picked.type);
          const type = resolveMime(file.name, file.type) ?? picked.type;
          if (file.size > MAX_FILE_BYTES) throw new Error(`الملف «${file.name}» أكبر من ${formatBytes(MAX_FILE_BYTES)}.`);
          const res = await fetch("/api/uploads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name, type, size: file.size }),
          });
          const sign = await res.json();
          if (!res.ok) throw new Error(sign.error ?? "تعذر تجهيز رفع الملف");
          const { error: upErr } = await sb.storage.from(BUCKET).uploadToSignedUrl(sign.path, sign.token, file, { contentType: sign.type });
          if (upErr) throw new Error(`تعذر رفع «${file.name}». تأكدي من الاتصال وحاولي مجددًا.`);
          draft.files.push({ path: sign.path, name: file.name.slice(0, 200), type: sign.type, size: file.size });
        }
      }

      setPhase({ kind: "sending", step: "حفظ المشاركة…" });
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "تعذر حفظ المشاركة");
      try {
        localStorage.setItem(NAME_KEY, draft.teacher_name.trim());
      } catch {}
      setPhase({ kind: "done", id: json.id, track: draft.track_id as TrackId });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setPhase({ kind: "idle" });
      setError(
        err instanceof TypeError
          ? "تعذر الاتصال بالإنترنت. تأكدي من الشبكة ثم اضغطي «إرسال المشاركة» مرة أخرى — بياناتك ما زالت محفوظة في النموذج."
          : err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع",
      );
    }
  }

  function reset() {
    setFiles([]);
    setError(null);
    setPhase({ kind: "idle" });
    formRef.current?.reset();
  }

  if (phase.kind === "done") {
    return (
      <div className="card animate-rise px-6 py-12 text-center sm:px-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 animate-glow">
          <CheckCircle2 className="h-8 w-8 text-sage-600" />
        </div>
        <h2 className="font-display text-2xl font-extrabold">وصلت بصمتك، شكرًا لكِ 🌿</h2>
        <p className="mx-auto mt-3 max-w-md leading-8 text-ink-soft">
          أُضيفت مشاركتك إلى معرض «إبداعات معلماتنا» وظهرت الآن على شاشة الورشة. فكرتك اليوم قد تكون إلهامًا لزميلة غدًا.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/gallery/${phase.id}`} className="btn-primary">
            <LayoutGrid className="h-4 w-4" /> مشاهدة مشاركتي
          </Link>
          <Link href={`/gallery?track=${phase.track}`} className="btn-soft">معرض الأعمال</Link>
          <button type="button" onClick={reset} className="btn-ghost">
            <Plus className="h-4 w-4" /> إضافة مشاركة أخرى
          </button>
        </div>
      </div>
    );
  }

  const sending = phase.kind === "sending";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      {/* المسار */}
      <fieldset className="card p-5 sm:p-7">
        <legend className="sr-only">المسار التدريبي</legend>
        <p className="label">المسار التدريبي <span className="text-peach-500">*</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRACK_LIST.map((t) => {
            const active = track === t.id;
            const tone = t.tone === "sage" ? "border-sage-400 bg-sage-50" : "border-petrol-400 bg-petrol-50";
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${active ? tone : "border-ink/[0.07] bg-white hover:border-ink/15"}`}
              >
                <input type="radio" name="track" value={t.id} checked={active} onChange={() => setTrack(t.id)} className="mt-1 h-4 w-4 accent-petrol-600" />
                <span>
                  <span className="block font-semibold">{t.title}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-ink-mute">{t.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* البيانات */}
      <div className="card space-y-5 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="teacher_name" className="label">اسم المعلمة <span className="text-peach-500">*</span></label>
            <input id="teacher_name" name="teacher_name" required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="مثال: نورة العتيبي" />
          </div>
          <div>
            <label htmlFor="title" className="label">عنوان المشاركة <span className="text-peach-500">*</span></label>
            <input id="title" name="title" required maxLength={140} className="field" placeholder="مثال: مسابقة Blooket لمراجعة أنواع البيانات" />
          </div>
          <div>
            <label htmlFor="grade_level" className="label">المرحلة الدراسية</label>
            <select id="grade_level" name="grade_level" className="field" defaultValue="">
              <option value="">اختاري المرحلة</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lesson_title" className="label">عنوان الدرس</label>
            <input id="lesson_title" name="lesson_title" maxLength={140} className="field" placeholder="مثال: الأمن السيبراني" />
          </div>
        </div>
        <div>
          <label htmlFor="tool_or_strategy" className="label">
            {track === "assessment" ? "الاستراتيجية أو الأداة المستخدمة" : track === "interactive" ? "البرنامج أو الأداة المستخدمة" : "البرنامج أو الاستراتيجية المستخدمة"}
          </label>
          <input
            id="tool_or_strategy"
            name="tool_or_strategy"
            maxLength={140}
            className="field"
            placeholder={track === "assessment" ? "مثال: بطاقة خروج رقمية عبر Socrative" : "مثال: Nearpod، Wooclap، Padlet…"}
          />
        </div>
        <div>
          <label htmlFor="description" className="label">وصف مختصر للتطبيق</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="field resize-y leading-7"
            placeholder={
              track === "assessment"
                ? "كيف ستجمعين دليلًا على تعلم الطالبات؟ وما القرار التعليمي الذي ستتخذينه بناءً عليه؟"
                : "ما الجزء التفاعلي الذي صممتِه؟ وكيف ستشارك الطالبات فيه؟"
            }
          />
        </div>
      </div>

      {/* المرفقات */}
      <div className="card space-y-5 p-5 sm:p-7">
        <div>
          <p className="label">صورة أو ملف التطبيق</p>
          <p className="mb-3 text-sm text-ink-mute">لقطة شاشة، صورة، PDF، عرض تقديمي أو مستند — حتى {MAX_FILES} ملفات، و{formatBytes(MAX_FILE_BYTES)} للملف.</p>
          <input ref={inputRef} id="files" type="file" multiple accept={ACCEPT_ATTR} className="sr-only" onChange={(e) => addFiles(e.target.files)} disabled={sending || files.length >= MAX_FILES} />
          {files.length < MAX_FILES && (
            <label
              htmlFor="files"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-petrol-200 bg-petrol-50/50 px-4 py-8 text-center transition hover:border-petrol-400 hover:bg-petrol-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <UploadCloud className="h-8 w-8 text-petrol-500" aria-hidden />
              <span className="font-semibold text-petrol-700">اضغطي لاختيار ملف أو صورة</span>
              <span className="text-xs text-ink-mute">أو التقطي صورة من الجوال مباشرة</span>
            </label>
          )}
          {fileError && <p className="mt-2 text-sm text-peach-500" role="alert">{fileError}</p>}
          {files.length > 0 && (
            <ul className="mt-3 grid gap-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white p-2.5">
                  {f.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ivory-deep text-petrol-600">
                      <FileIcon type={f.type} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold" dir="auto">{f.file.name}</span>
                    <span className="text-xs text-ink-mute">{formatBytes(f.file.size)}</span>
                  </span>
                  <button type="button" disabled={sending} onClick={() => setFiles(files.filter((x) => x.id !== f.id))} className="btn-ghost !min-h-[40px] !px-3" aria-label={`إزالة ${f.file.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor="external_url" className="label">رابط التطبيق (اختياري)</label>
          <input id="external_url" name="external_url" type="url" inputMode="url" dir="ltr" maxLength={1000} className="field text-left" placeholder="https://nearpod.com/…" />
          <p className="mt-1.5 text-xs text-ink-mute">رابط درس Nearpod أو لوحة Padlet أو نموذج أو أي عمل منشور.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-peach-200 bg-peach-50 px-4 py-3 text-sm leading-7 text-ink" role="alert">{error}</div>
      )}

      <div className="sticky bottom-3 z-10 sm:static">
        <button type="submit" disabled={sending} className="btn-primary w-full !min-h-[54px] !text-base shadow-lift sm:shadow-none">
          {sending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> {phase.step}
            </>
          ) : (
            <>
              <Send className="h-5 w-5 -scale-x-100" /> إرسال المشاركة
            </>
          )}
        </button>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-mute">
        <ImagePlus className="h-3.5 w-3.5" /> ستظهر مشاركتك باسمك في معرض الورشة لجميع الزميلات.
      </p>
    </form>
  );
}
