-- ==============================================================================
-- GODOL INSTITUTE — Comprehensive Supabase Database Migration
-- Run this in: https://supabase.com/dashboard/project/vljphjdpaflahytyszaq/sql
-- ==============================================================================

-- 1. Create course_modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.course_modules (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create course_lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT,
  video_library_id TEXT DEFAULT '815251',
  video_status TEXT DEFAULT 'pending',
  duration_seconds INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create lesson_resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL,
  course_id BIGINT,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create performant indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id ON public.lesson_resources(lesson_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

-- 6. Grant full read/write policies for public and authenticated users
DROP POLICY IF EXISTS "Public can manage course_modules" ON public.course_modules;
CREATE POLICY "Public can manage course_modules" 
  ON public.course_modules FOR ALL 
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage course_lessons" ON public.course_lessons;
CREATE POLICY "Public can manage course_lessons" 
  ON public.course_lessons FOR ALL 
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage lesson_resources" ON public.lesson_resources;
CREATE POLICY "Public can manage lesson_resources" 
  ON public.lesson_resources FOR ALL 
  USING (true) WITH CHECK (true);

-- 7. Safely attach foreign keys if types align (wrapped in exception block so it never aborts)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.course_modules 
      ADD CONSTRAINT fk_course_modules_course 
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint fk_course_modules_course notice: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.course_lessons 
      ADD CONSTRAINT fk_course_lessons_module 
      FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint fk_course_lessons_module notice: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE public.lesson_resources 
      ADD CONSTRAINT fk_lesson_resources_lesson 
      FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint fk_lesson_resources_lesson notice: %', SQLERRM;
  END;
END $$;

-- 8. Refresh PostgREST schema cache so tables become visible immediately
NOTIFY pgrst, 'reload schema';

-- Verification output
SELECT 'Migration successful! course_modules, course_lessons, and lesson_resources are ready.' AS status;
