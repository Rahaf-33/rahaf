import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listSubmissions } from "@/lib/data";
import { handleError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return jsonError("غير مصرح", 401);
  try {
    return NextResponse.json({ items: await listSubmissions({ includeHidden: true }) });
  } catch (err) {
    return handleError(err);
  }
}
