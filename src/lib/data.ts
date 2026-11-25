import "server-only";
import { adminClient } from "./supabase/server";
import { BUCKET } from "./config";
import type { Stats, Submission } from "./types";
import type { TrackId } from "./tracks";

const COLUMNS =
  "id, created_at, teacher_name, title, track_id, grade_level, lesson_title, tool_or_strategy, description, external_url, files, cover_url, hidden";

export async function listSubmissions(opts: { track?: TrackId; includeHidden?: boolean } = {}) {
  let q = adminClient().from("submissions").select(COLUMNS).order("created_at", { ascending: false }).limit(500);
  if (!opts.includeHidden) q = q.eq("hidden", false);
  if (opts.track) q = q.eq("track_id", opts.track);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Submission[];
}

export async function getSubmission(id: string) {
  const { data, error } = await adminClient()
    .from("submissions")
    .select(COLUMNS)
    .eq("id", id)
    .eq("hidden", false)
    .maybeSingle();
  if (error) throw error;
  return data as Submission | null;
}

export async function getStats(): Promise<Stats> {
  const { data, error } = await adminClient()
    .from("submissions")
    .select("teacher_name, track_id")
    .eq("hidden", false)
    .limit(5000);
  if (error) throw error;
  const rows = data ?? [];
  const teachers = new Set(rows.map((r) => normalizeName(r.teacher_name)));
  return {
    total: rows.length,
    teachers: teachers.size,
    byTrack: {
      interactive: rows.filter((r) => r.track_id === "interactive").length,
      assessment: rows.filter((r) => r.track_id === "assessment").length,
    },
  };
}

/** توحيد الاسم لحساب المعلمات المختلفات (المسافات، الهمزات، التاء المربوطة) */
export function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة(\s|$)/g, "ه$1")
    .replace(/ى(\s|$)/g, "ي$1")
    .replace(/[ً-ْ]/g, "")
    .toLowerCase();
}

export function publicFileUrl(path: string) {
  return adminClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function fileExists(path: string) {
  const dir = path.slice(0, path.lastIndexOf("/"));
  const file = path.slice(path.lastIndexOf("/") + 1);
  const { data, error } = await adminClient().storage.from(BUCKET).list(dir, { search: file, limit: 5 });
  if (error) return false;
  return (data ?? []).some((f) => f.name === file);
}
