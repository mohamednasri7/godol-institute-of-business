-- ==============================================================================
-- GODOL INSTITUTE OF BUSINESS — PHASE 2 DATABASE MIGRATION
-- Migration: 20261106_phase2_complete_architecture.sql
-- Description: Complete schema verification, foreign keys, updated_at triggers,
--              realtime publication, soft-delete columns, and strict Row-Level Security.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES (Students, Staff & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin', 'finance', 'registrar')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    is_archived BOOLEAN DEFAULT FALSE,
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#2563eb',
    course_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. INSTRUCTORS
CREATE TABLE IF NOT EXISTS public.instructors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    avatar TEXT DEFAULT '/instructor-1.png',
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    rating NUMERIC(3,2) DEFAULT 4.90,
    review_count INT DEFAULT 0,
    student_count INT DEFAULT 0,
    course_count INT DEFAULT 0,
    status TEXT DEFAULT 'verified' CHECK (status IN ('verified', 'active', 'suspended')),
    password_hash TEXT,
    credentials_sent_via TEXT,
    credentials_sent_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0 NOT NULL,
    level TEXT DEFAULT 'Beginner',
    duration_hours INT DEFAULT 20,
    lesson_count INT DEFAULT 14,
    enrolled_count INT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 4.90,
    featured BOOLEAN DEFAULT FALSE,
    badge TEXT,
    thumbnail TEXT DEFAULT '/course-business.png',
    instructor_id INT REFERENCES public.instructors(id) ON DELETE SET NULL,
    instructor_name TEXT,
    category_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
    is_archived BOOLEAN DEFAULT FALSE,
    what_you_learn JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. COURSE MODULES & LESSONS (Structured Content Hierarchy)
CREATE TABLE IF NOT EXISTS public.course_modules (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT DEFAULT '15 mins',
    video_url TEXT,
    is_preview BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    course_title TEXT NOT NULL,
    course_price NUMERIC(10,2) DEFAULT 0,
    payment_id INT,
    payment_status TEXT DEFAULT 'pending_verification' CHECK (payment_status IN ('awaiting_payment', 'pending_verification', 'verified', 'rejected')),
    enrollment_status TEXT DEFAULT 'pending_verification' CHECK (enrollment_status IN ('pending_payment', 'pending_verification', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled')),
    access_granted BOOLEAN DEFAULT FALSE,
    access_granted_at TIMESTAMPTZ,
    progress INT DEFAULT 0,
    enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    rejection_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 9. PAYMENTS (Mobile Money Verification)
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    enrollment_id INT REFERENCES public.enrollments(id) ON DELETE SET NULL,
    course_id INT REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT,
    course_price NUMERIC(10,2),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT,
    student_whatsapp TEXT,
    provider TEXT NOT NULL DEFAULT 'EVC Plus',
    sender_phone TEXT NOT NULL,
    transaction_ref TEXT UNIQUE NOT NULL,
    claimed_amount NUMERIC(10,2) NOT NULL,
    verified_amount NUMERIC(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected', 'refunded')),
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT '',
    receipt_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 10. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    course_id INT REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT NOT NULL,
    instructor_name TEXT,
    certificate_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 11. BLOG POSTS (Multi-Author CMS)
CREATE TABLE IF NOT EXISTS public.posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    category TEXT DEFAULT 'Business Strategy',
    featured_image_url TEXT,
    author_id INT REFERENCES public.instructors(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'Godol Editorial',
    author_role TEXT DEFAULT 'admin' CHECK (author_role IN ('admin', 'instructor')),
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    published_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 12. POST METRICS
CREATE TABLE IF NOT EXISTS public.post_metrics (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
    views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    likes INT DEFAULT 0,
    shares INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 13. POST COMMENTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'spam')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    target_type TEXT,
    target_id INT,
    details TEXT NOT NULL,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 15. ATTACH UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_instructors_updated_at ON public.instructors;
CREATE TRIGGER trg_instructors_updated_at BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_post_metrics_updated_at ON public.post_metrics;
CREATE TRIGGER trg_post_metrics_updated_at BEFORE UPDATE ON public.post_metrics FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

-- 16. INDEXES FOR HIGH-THROUGHPUT SEARCH & REALTIME
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status, approval_status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_email ON public.enrollments(student_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_txref ON public.payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payments_student_email ON public.payments(student_email);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_student_email ON public.certificates(student_email);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_post_id ON public.post_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 17. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access (Backend Server)
CREATE POLICY "service_role_all_profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_instructors" ON public.instructors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_courses" ON public.courses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_course_modules" ON public.course_modules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_course_lessons" ON public.course_lessons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_enrollments" ON public.enrollments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_certificates" ON public.certificates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_posts" ON public.posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_post_metrics" ON public.post_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_post_comments" ON public.post_comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public Read Policies
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_instructors" ON public.instructors FOR SELECT TO anon, authenticated USING (status IN ('verified', 'active'));
CREATE POLICY "public_read_courses" ON public.courses FOR SELECT TO anon, authenticated USING (status = 'published' AND approval_status = 'approved' AND is_archived = false);
CREATE POLICY "public_read_course_modules" ON public.course_modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_course_lessons" ON public.course_lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_published_posts" ON public.posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "public_read_post_metrics" ON public.post_metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_post_comments" ON public.post_comments FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "public_insert_post_comments" ON public.post_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_verify_certificates" ON public.certificates FOR SELECT TO anon, authenticated USING (status = 'issued');

-- Student Policies
CREATE POLICY "student_read_own_profile" ON public.profiles FOR SELECT TO authenticated USING (email = auth.jwt() ->> 'email');
CREATE POLICY "student_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (email = auth.jwt() ->> 'email');
CREATE POLICY "student_read_own_enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_email = auth.jwt() ->> 'email');
CREATE POLICY "student_insert_enrollment" ON public.enrollments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "student_read_own_payments" ON public.payments FOR SELECT TO authenticated USING (student_email = auth.jwt() ->> 'email');
CREATE POLICY "student_insert_payment" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 18. SUPABASE REALTIME REPLICATION
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

