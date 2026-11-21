-- ============================================================
-- Migration: Fix curriculum tables with UUID PKs + RLS policies
-- Applied: 2026-11-21
-- ============================================================

-- ── COURSES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  category_name TEXT,
  price NUMERIC DEFAULT 0,
  level TEXT DEFAULT 'Beginner',
  duration_hours NUMERIC DEFAULT 0,
  lesson_count INT DEFAULT 0,
  enrolled_count INT DEFAULT 0,
  rating NUMERIC,
  review_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  badge TEXT,
  thumbnail TEXT,
  thumbnail_url TEXT,
  instructor_id INT,
  instructor_name TEXT,
  category_id INT,
  status TEXT DEFAULT 'draft',
  approval_status TEXT DEFAULT 'pending',
  what_you_learn JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── COURSE_MODULES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── COURSE_LESSONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT,
  video_library_id TEXT,
  bunny_library_id TEXT,
  video_status TEXT DEFAULT 'pending',
  duration_seconds INT DEFAULT 0,
  resource_urls JSONB DEFAULT '[]'::jsonb,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── LESSON_RESOURCES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  bunny_storage_path TEXT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS: Enable on all tables ────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

-- ── COURSES policies ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access courses" ON public.courses;
CREATE POLICY "Admin full access courses" ON public.courses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses
  FOR SELECT TO anon USING (true);

-- ── COURSE_MODULES policies ───────────────────────────────────
DROP POLICY IF EXISTS "Admin full access modules" ON public.course_modules;
CREATE POLICY "Admin full access modules" ON public.course_modules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read modules" ON public.course_modules;
CREATE POLICY "Public read modules" ON public.course_modules
  FOR SELECT TO anon USING (true);

-- ── COURSE_LESSONS policies ───────────────────────────────────
DROP POLICY IF EXISTS "Admin full access lessons" ON public.course_lessons;
CREATE POLICY "Admin full access lessons" ON public.course_lessons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read lessons" ON public.course_lessons;
CREATE POLICY "Public read lessons" ON public.course_lessons
  FOR SELECT TO anon USING (true);

-- ── LESSON_RESOURCES policies ─────────────────────────────────
DROP POLICY IF EXISTS "Admin full access resources" ON public.lesson_resources;
CREATE POLICY "Admin full access resources" ON public.lesson_resources
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read resources" ON public.lesson_resources;
CREATE POLICY "Public read resources" ON public.lesson_resources
  FOR SELECT TO anon USING (true);

-- ── Indexes for performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id ON public.lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_course_id ON public.lesson_resources(course_id);

