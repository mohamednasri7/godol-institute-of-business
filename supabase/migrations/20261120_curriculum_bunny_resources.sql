-- ==============================================================================
-- GODOL INSTITUTE OF BUSINESS: POST-COURSE CREATION CURRICULUM & BUNNY.NET MEDIA
-- Tables: course_modules, course_lessons, lesson_resources
-- ==============================================================================

-- 1. COURSE MODULES (Sections)
CREATE TABLE IF NOT EXISTS public.course_modules (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSE LESSONS (Bunny Stream Video Streaming & Lesson Details)
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    bunny_video_id TEXT,
    video_library_id TEXT,
    video_status TEXT DEFAULT 'ready', -- 'pending', 'uploading', 'processing', 'ready'
    duration_seconds INT DEFAULT 0,
    is_free_preview BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add video_status and video_library_id columns if table already existed without them
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS video_library_id TEXT;
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'ready';

-- 3. LESSON RESOURCES (Bunny Storage Zone for PDFs, Slides, Worksheets)
CREATE TABLE IF NOT EXISTS public.lesson_resources (
    id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT DEFAULT 'pdf', -- 'pdf', 'docx', 'pptx', 'zip', 'xlsx', etc.
    file_size_bytes BIGINT DEFAULT 0,
    bunny_storage_path TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON public.course_modules(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON public.course_lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON public.lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_course ON public.lesson_resources(course_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

-- Public can read modules and lessons
DROP POLICY IF EXISTS "Public can view course modules" ON public.course_modules;
CREATE POLICY "Public can view course modules" ON public.course_modules
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view course lessons" ON public.course_lessons;
CREATE POLICY "Public can view course lessons" ON public.course_lessons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view lesson resources" ON public.lesson_resources;
CREATE POLICY "Public can view lesson resources" ON public.lesson_resources
    FOR SELECT USING (true);

-- Backend Service Role / Admins have full access
DROP POLICY IF EXISTS "Service role full access course_modules" ON public.course_modules;
CREATE POLICY "Service role full access course_modules" ON public.course_modules
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access course_lessons" ON public.course_lessons;
CREATE POLICY "Service role full access course_lessons" ON public.course_lessons
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access lesson_resources" ON public.lesson_resources;
CREATE POLICY "Service role full access lesson_resources" ON public.lesson_resources
    FOR ALL USING (true);
