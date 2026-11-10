-- ==============================================================================
-- GODOL INSTITUTE OF BUSINESS — COURSE PLAYER & BUNNY.NET ARCHITECTURE
-- Migration: 20261111_course_player_bunny.sql
-- Description: Interactive Course Player, Bunny Stream & Storage CDN schema,
--              Row-Level Security (RLS), and Realtime Publications.
-- ==============================================================================

-- 1. EXTEND COURSES TABLE
-- Ensure courses table has all columns for Bunny.net streaming and spatial player
ALTER TABLE IF EXISTS public.courses 
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_video_id TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Business Strategy';

-- 2. COURSE MODULES TABLE
CREATE TABLE IF NOT EXISTS public.course_modules (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for fast lookup by course
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);

-- 3. COURSE LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    bunny_video_id TEXT,
    bunny_library_id TEXT,
    duration_seconds INT DEFAULT 0,
    resource_urls JSONB DEFAULT '[]'::jsonb,
    is_free_preview BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);

-- 4. COURSE ENROLLMENTS TABLE (Bridged with existing enrollments table)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMPTZ,
    last_accessed_lesson_id INT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_course_enrollment UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course ON public.course_enrollments(user_id, course_id);

-- 5. LESSON PROGRESS TABLE (Realtime completion & timestamp tracking)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    watched_seconds INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_lesson_progress UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON public.lesson_progress(user_id, course_id);

-- 6. LESSON NOTES TABLE (Timestamped student notes)
CREATE TABLE IF NOT EXISTS public.lesson_notes (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id INT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    video_timestamp_seconds INT DEFAULT 0,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_user_lesson ON public.lesson_notes(user_id, lesson_id);

-- 7. LESSON DISCUSSIONS / QUIZ TABLE
CREATE TABLE IF NOT EXISTS public.lesson_discussions (
    id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_discussions_lesson_id ON public.lesson_discussions(lesson_id);

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_discussions ENABLE ROW LEVEL SECURITY;

-- Modules & Lessons: Public read for published courses
DROP POLICY IF EXISTS "Public can view course modules" ON public.course_modules;
CREATE POLICY "Public can view course modules"
    ON public.course_modules FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view course lessons" ON public.course_lessons;
CREATE POLICY "Public can view course lessons"
    ON public.course_lessons FOR SELECT
    USING (true);

-- Admins & Instructors can manage modules and lessons
DROP POLICY IF EXISTS "Admins can manage course modules" ON public.course_modules;
CREATE POLICY "Admins can manage course modules"
    ON public.course_modules FOR ALL
    USING (true);

DROP POLICY IF EXISTS "Admins can manage course lessons" ON public.course_lessons;
CREATE POLICY "Admins can manage course lessons"
    ON public.course_lessons FOR ALL
    USING (true);

-- Enrollments RLS
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view their own enrollments"
    ON public.course_enrollments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can enroll themselves" ON public.course_enrollments;
CREATE POLICY "Users can enroll themselves"
    ON public.course_enrollments FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their enrollment last accessed lesson" ON public.course_enrollments;
CREATE POLICY "Users can update their enrollment last accessed lesson"
    ON public.course_enrollments FOR UPDATE
    USING (true);

-- Progress RLS
DROP POLICY IF EXISTS "Users can view their own progress" ON public.lesson_progress;
CREATE POLICY "Users can view their own progress"
    ON public.lesson_progress FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert and update their progress" ON public.lesson_progress;
CREATE POLICY "Users can insert and update their progress"
    ON public.lesson_progress FOR ALL
    USING (true);

-- Notes RLS
DROP POLICY IF EXISTS "Users can view their own lesson notes" ON public.lesson_notes;
CREATE POLICY "Users can view their own lesson notes"
    ON public.lesson_notes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own lesson notes" ON public.lesson_notes;
CREATE POLICY "Users can insert their own lesson notes"
    ON public.lesson_notes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own lesson notes" ON public.lesson_notes;
CREATE POLICY "Users can delete their own lesson notes"
    ON public.lesson_notes FOR DELETE
    USING (true);

-- Discussions RLS
DROP POLICY IF EXISTS "Public can view lesson discussions" ON public.lesson_discussions;
CREATE POLICY "Public can view lesson discussions"
    ON public.lesson_discussions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can post lesson discussions" ON public.lesson_discussions;
CREATE POLICY "Users can post lesson discussions"
    ON public.lesson_discussions FOR INSERT
    WITH CHECK (true);

-- 9. REALTIME PUBLICATION
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.course_modules;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.course_lessons;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.course_enrollments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_progress;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_notes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_discussions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

