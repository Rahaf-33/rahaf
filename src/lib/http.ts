import "server-only";
import { NextResponse } from "next/server";
import { NotConfiguredError } from "./supabase/server";
import { NOT_CONFIGURED_MESSAGE } from "./config";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof NotConfiguredError) return jsonError(NOT_CONFIGURED_MESSAGE, 503);
  console.error(err);
  return jsonError("حدث خطأ غير متوقع في الخادم، حاولي مرة أخرى بعد لحظات.", 500);
}

/** حد بسيط لعدد الطلبات لكل عنوان IP (يحمي من الإرسال المتكرر بالخطأ) */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimited(req: Request, key: string, limit: number, windowMs = 60_000) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const id = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > limit;
}
