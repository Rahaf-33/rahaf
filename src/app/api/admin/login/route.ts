import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, checkPassword, isAdminConfigured } from "@/lib/admin-auth";
import { jsonError, rateLimited } from "@/lib/http";

export async function POST(req: Request) {
  if (!isAdminConfigured()) return jsonError("لم تُضبط كلمة مرور الإدارة (ADMIN_PASSWORD) في إعدادات الخادم.", 503);
  if (rateLimited(req, "admin-login", 8)) return jsonError("محاولات كثيرة، انتظري دقيقة.", 429);
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !checkPassword(password)) return jsonError("كلمة المرور غير صحيحة", 401);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken()!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
