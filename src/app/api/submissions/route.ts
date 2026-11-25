import { NextResponse } from "next/server";
import { firstError, submissionSchema } from "@/lib/validation";
import { fileExists, listSubmissions, publicFileUrl } from "@/lib/data";
import { adminClient } from "@/lib/supabase/server";
import { handleError, jsonError, rateLimited } from "@/lib/http";
import { isTrackId } from "@/lib/tracks";
import { isImage, resolveMime } from "@/lib/files";
import type { SubmissionFile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const track = new URL(req.url).searchParams.get("track");
    const items = await listSubmissions({ track: isTrackId(track) ? track : undefined });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  if (rateLimited(req, "submit", 12)) return jsonError("أرسلتِ عدة مشاركات بسرعة، انتظري دقيقة ثم حاولي مجددًا.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("صيغة الطلب غير صحيحة");
  }
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const input = parsed.data;

  try {
    // التأكد أن الملفات رُفعت فعلًا إلى التخزين قبل ربطها بالمشاركة
    const files: SubmissionFile[] = [];
    for (const f of input.files) {
      if (!(await fileExists(f.path))) return jsonError(`تعذّر العثور على الملف «${f.name}»، أعيدي إرفاقه.`);
      files.push({ ...f, type: resolveMime(f.name, f.type) ?? f.type, url: publicFileUrl(f.path) });
    }
    const cover = files.find((f) => isImage(f.type))?.url ?? null;

    const { data, error } = await adminClient()
      .from("submissions")
      .insert({ ...input, files, cover_url: cover })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
