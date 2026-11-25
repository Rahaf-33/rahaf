import { NextResponse } from "next/server";
import { getStats } from "@/lib/data";
import { handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getStats(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleError(err);
  }
}
