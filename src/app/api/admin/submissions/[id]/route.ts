import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { adminClient } from "@/lib/supabase/server";
import { handleError, jsonError } from "@/lib/http";
import { BUCKET } from "@/lib/config";
import type { SubmissionFile } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return jsonError("غير مصرح", 401);
  const { id } = await params;
  const { hidden } = (await req.json().catch(() => ({}))) as { hidden?: unknown };
  if (typeof hidden !== "boolean") return jsonError("قيمة غير صحيحة");
  try {
    const { error } = await adminClient().from("submissions").update({ hidden }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return jsonError("غير مصرح", 401);
  const { id } = await params;
  try {
    const db = adminClient();
    const { data, error } = await db.from("submissions").delete().eq("id", id).select("files").maybeSingle();
    if (error) throw error;
    const paths = ((data?.files as SubmissionFile[] | undefined) ?? []).map((f) => f.path);
    if (paths.length) await db.storage.from(BUCKET).remove(paths);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
