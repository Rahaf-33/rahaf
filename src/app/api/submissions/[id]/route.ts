import { NextResponse } from "next/server";
import { getSubmission } from "@/lib/data";
import { handleError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return jsonError("المشاركة غير موجودة", 404);
  try {
    const item = await getSubmission(id);
    if (!item) return jsonError("المشاركة غير موجودة", 404);
    return NextResponse.json({ item });
  } catch (err) {
    return handleError(err);
  }
}
