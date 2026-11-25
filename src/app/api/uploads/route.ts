import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadRequestSchema, firstError } from "@/lib/validation";
import { adminClient } from "@/lib/supabase/server";
import { handleError, jsonError, rateLimited } from "@/lib/http";
import { ALLOWED_TYPES } from "@/lib/files";
import { BUCKET } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * يُصدر رابط رفع موقّعًا لملف واحد بعد التحقق من نوعه وحجمه.
 * المتصفح يرفع الملف مباشرة إلى Supabase Storage (لا يمر عبر الخادم، فلا قيود على حجم الطلب في Vercel).
 */
export async function POST(req: Request) {
  if (rateLimited(req, "upload", 40)) return jsonError("طلبات رفع كثيرة، انتظري دقيقة.", 429);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("صيغة الطلب غير صحيحة");
  }
  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));

  const { type } = parsed.data;
  const day = new Date().toISOString().slice(0, 10);
  const path = `uploads/${day}/${randomUUID()}.${ALLOWED_TYPES[type].ext}`;

  try {
    const { data, error } = await adminClient().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return NextResponse.json({ path: data.path, token: data.token, type });
  } catch (err) {
    return handleError(err);
  }
}
