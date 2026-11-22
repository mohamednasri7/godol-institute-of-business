-- ============================================================
-- GODOL INSTITUTE — Supabase Migration Fix
-- Run this ENTIRE script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Create tables if they don't exist yet
-- (safe to run even if they already exist — IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.courses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC DEFAULT 0,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft',
  level TEXT DEFAULT 'Beginner',
  duration_hours NUMERIC DEFAULT 0,
  lesson_count INT DEFAULT 0,
  enrolled_count INT DEFAULT 0,
  rating NUMERIC,
  review_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  badge TEXT,
  promo_video_id TEXT,
  instructor_id BIGINT,
  instructor_name TEXT,
  approval_status TEXT DEFAULT 'approved',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  module_id BIGINT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT,
  video_library_id TEXT,
  video_status TEXT DEFAULT 'pending',
  duration_seconds INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  lesson_id BIGINT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id BIGINT,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (safe to run even if they don't exist)
DROP POLICY IF EXISTS "Public can read published courses" ON public.courses;
DROP POLICY IF EXISTS "Service role full access to courses" ON public.courses;
DROP POLICY IF EXISTS "Service role full access to course_modules" ON public.course_modules;
DROP POLICY IF EXISTS "Public can read course_modules" ON public.course_modules;
DROP POLICY IF EXISTS "Service role full access to course_lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Public can read course_lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Service role full access to lesson_resources" ON public.lesson_resources;
DROP POLICY IF EXISTS "Public can read lesson_resources" ON public.lesson_resources;

-- Step 4: Create RLS policies

-- courses
CREATE POLICY "Public can read published courses"
  ON public.courses FOR SELECT
  USING (status = 'published' OR status = 'draft');

CREATE POLICY "Service role full access to courses"
  ON public.courses FOR ALL
  USING (true)
  WITH CHECK (true);

-- course_modules
CREATE POLICY "Public can read course_modules"
  ON public.course_modules FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to course_modules"
  ON public.course_modules FOR ALL
  USING (true)
  WITH CHECK (true);

-- course_lessons
CREATE POLICY "Public can read course_lessons"
  ON public.course_lessons FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to course_lessons"
  ON public.course_lessons FOR ALL
  USING (true)
  WITH CHECK (true);

-- lesson_resources
CREATE POLICY "Public can read lesson_resources"
  ON public.lesson_resources FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to lesson_resources"
  ON public.lesson_resources FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 5: Force PostgREST to reload its schema cache
-- This fixes the PGRST205 "Could not find the table in the schema cache" error
SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================
-- Done! The course_modules, course_lessons, and lesson_resources
-- tables are now ready. Go back to your Admin Dashboard and
-- click "Reload Schema" or try saving a module again.
-- ============================================================
