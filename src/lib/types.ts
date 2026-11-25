import type { TrackId } from "./tracks";

export interface SubmissionFile {
  path: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Submission {
  id: string;
  created_at: string;
  teacher_name: string;
  title: string;
  track_id: TrackId;
  grade_level: string | null;
  lesson_title: string | null;
  tool_or_strategy: string | null;
  description: string | null;
  external_url: string | null;
  files: SubmissionFile[];
  cover_url: string | null;
  hidden: boolean;
}

export interface Stats {
  total: number;
  teachers: number;
  byTrack: Record<TrackId, number>;
}
