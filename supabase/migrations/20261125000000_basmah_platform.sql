-- =====================================================================
-- بصمة رقمية — قاعدة بيانات المشاركات
-- يمكن تشغيل هذا الملف كما هو في Supabase › SQL Editor (آمن لإعادة التشغيل)
-- =====================================================================

-- 1) المسارات التدريبية
create table if not exists public.tracks (
  id         text primary key,
  title      text not null,
  sort_order int  not null default 0
);

insert into public.tracks (id, title, sort_order) values
  ('interactive', 'إدارة الحصة التفاعلية', 1),
  ('assessment',  'التقويم من أجل التعلم', 2)
on conflict (id) do update set title = excluded.title, sort_order = excluded.sort_order;

-- 2) مشاركات المعلمات
create table if not exists public.submissions (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  teacher_name     text not null check (char_length(btrim(teacher_name)) between 2 and 80),
  title            text not null check (char_length(btrim(title)) between 3 and 140),
  track_id         text not null references public.tracks(id),
  grade_level      text check (grade_level is null or char_length(grade_level) <= 60),
  lesson_title     text check (lesson_title is null or char_length(lesson_title) <= 140),
  tool_or_strategy text check (tool_or_strategy is null or char_length(tool_or_strategy) <= 140),
  description      text check (description is null or char_length(description) <= 2000),
  external_url     text check (external_url is null or external_url ~* '^https?://'),
  files            jsonb not null default '[]'::jsonb,
  cover_url        text,
  hidden           boolean not null default false
);

create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_track_idx      on public.submissions (track_id);

-- 3) الصلاحيات (RLS)
--   * الزائرات (anon) يقرأن المشاركات الظاهرة فقط — هذا ما يحتاجه التحديث اللحظي.
--   * الإضافة والإخفاء والحذف تتم حصريًا عبر خادم المنصة بمفتاح service_role
--     بعد التحقق من المدخلات، لذا لا توجد سياسة INSERT/UPDATE/DELETE للعامة.
alter table public.tracks      enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "tracks are public"            on public.tracks;
drop policy if exists "visible submissions readable" on public.submissions;

create policy "tracks are public"
  on public.tracks for select to anon, authenticated using (true);

create policy "visible submissions readable"
  on public.submissions for select to anon, authenticated using (hidden = false);

revoke insert, update, delete on public.submissions from anon, authenticated;
revoke insert, update, delete on public.tracks      from anon, authenticated;
grant  select on public.submissions, public.tracks to anon, authenticated;

-- 4) التحديث اللحظي
alter table public.submissions replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end $$;

-- 5) التخزين: حاوية عامة للقراءة (للعرض في الورشة)، والرفع فقط بروابط موقّعة يصدرها الخادم
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions', 'submissions', true, 15728640,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'video/mp4'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
