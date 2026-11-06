-- ==============================================================================
-- GODOL INSTITUTE OF BUSINESS — SUPABASE DATABASE SCHEMA
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- 1. PROFILES (Students and Staff)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    role TEXT DEFAULT 'student', -- 'student', 'lecturer', 'admin'
    status TEXT DEFAULT 'active', -- 'active', 'suspended'
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#2563eb',
    course_count INT DEFAULT 0
);

-- 3. INSTRUCTORS / LECTURERS
CREATE TABLE IF NOT EXISTS public.instructors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    avatar TEXT DEFAULT '/instructor-1.png',
    email TEXT UNIQUE,
    phone TEXT,
    rating NUMERIC(3,2) DEFAULT 4.90,
    review_count INT DEFAULT 0,
    student_count INT DEFAULT 0,
    course_count INT DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'suspended'
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    level TEXT DEFAULT 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced', 'All Levels'
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
    status TEXT DEFAULT 'published', -- 'published', 'draft', 'archived'
    approval_status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
    what_you_learn JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT,
    course_id INT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    course_price NUMERIC(10,2) DEFAULT 0,
    payment_id INT,
    payment_status TEXT DEFAULT 'awaiting_payment', -- 'awaiting_payment', 'pending_verification', 'verified', 'rejected'
    enrollment_status TEXT DEFAULT 'pending_payment', -- 'pending_payment', 'pending_verification', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled'
    access_granted BOOLEAN DEFAULT FALSE,
    access_granted_at TIMESTAMPTZ,
    progress INT DEFAULT 0,
    enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    rejection_reason TEXT
);

-- 6. PAYMENTS (Manual Mobile Money Verification)
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
    provider TEXT NOT NULL DEFAULT 'EVC Plus', -- 'EVC Plus', 'Zaad', 'Sahal', 'Premier Wallet'
    sender_phone TEXT NOT NULL,
    transaction_ref TEXT NOT NULL,
    claimed_amount NUMERIC(10,2) NOT NULL,
    verified_amount NUMERIC(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending_verification', -- 'pending_verification', 'verified', 'rejected', 'refunded'
    payment_date TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT '',
    receipt_url TEXT
);

-- 7. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    course_id INT REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT NOT NULL,
    instructor_name TEXT,
    certificate_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'issued',
    issue_date DATE DEFAULT CURRENT_DATE
);

-- 8. WORKSHOPS
CREATE TABLE IF NOT EXISTS public.workshops (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    location TEXT DEFAULT 'Mogadishu, Somalia',
    date TEXT,
    duration_hours TEXT,
    capacity INT DEFAULT 30,
    enrolled_count INT DEFAULT 0,
    price NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'upcoming',
    featured BOOLEAN DEFAULT FALSE,
    tag TEXT,
    seats INT DEFAULT 15
);

-- 9. POSTS (Multi-Author Blogging System)
CREATE TABLE IF NOT EXISTS public.posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT, -- Supports rich text and HTML
    featured_image_url TEXT,
    author_id INT REFERENCES public.instructors(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'Godol Faculty',
    author_role TEXT DEFAULT 'instructor', -- 'admin', 'instructor'
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    category TEXT DEFAULT 'Business',
    excerpt TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    published_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9.1 POST METRICS & ANALYTICS
CREATE TABLE IF NOT EXISTS public.post_metrics (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
    views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    likes INT DEFAULT 0,
    shares INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9.2 POST COMMENTS & INTERACTIONS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'spam'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Backwards compatibility view for legacy blog_posts queries
CREATE OR REPLACE VIEW public.blog_posts AS
    SELECT 
        id,
        title,
        slug,
        excerpt,
        content,
        category,
        author_name AS author,
        '5 min read' AS read_time,
        (status = 'published') AS published,
        false AS featured,
        published_at::date AS published_at,
        featured_image_url
    FROM public.posts;

-- 10. PLATFORM SETTINGS (Key-Value Config)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    "group" TEXT DEFAULT 'general',
    label TEXT
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    target_type TEXT,
    target_id INT,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    student_email TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status, approval_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_txref ON public.payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_post_metrics_post_id ON public.post_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Posts RBAC Policies:
-- 1. Public users can view only published posts
CREATE POLICY "Public can view published posts" ON public.posts
    FOR SELECT USING (status = 'published');

-- 2. Public users can view metrics of published posts
CREATE POLICY "Public can view metrics of published posts" ON public.post_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE public.posts.id = public.post_metrics.post_id 
            AND public.posts.status = 'published'
        )
    );

-- 3. Public users can view approved comments
CREATE POLICY "Public can view approved comments" ON public.post_comments
    FOR SELECT USING (status = 'approved');

-- 4. Public users can submit interactions and comments
CREATE POLICY "Public can submit comments" ON public.post_comments
    FOR INSERT WITH CHECK (true);

-- 5. Instructors can view ALL their own posts (both draft & published)
CREATE POLICY "Instructors can view own posts" ON public.posts
    FOR SELECT USING (
        author_id = (SELECT id FROM public.instructors WHERE email = auth.jwt() ->> 'email' LIMIT 1)
    );

-- 6. Instructors can create posts assigned to their own author_id
CREATE POLICY "Instructors can create own posts" ON public.posts
    FOR INSERT WITH CHECK (
        author_id = (SELECT id FROM public.instructors WHERE email = auth.jwt() ->> 'email' LIMIT 1)
    );

-- 7. Instructors can update ONLY their own posts
CREATE POLICY "Instructors can update own posts" ON public.posts
    FOR UPDATE USING (
        author_id = (SELECT id FROM public.instructors WHERE email = auth.jwt() ->> 'email' LIMIT 1)
    );

-- 8. Instructors can delete ONLY their own posts
CREATE POLICY "Instructors can delete own posts" ON public.posts
    FOR DELETE USING (
        author_id = (SELECT id FROM public.instructors WHERE email = auth.jwt() ->> 'email' LIMIT 1)
    );

-- 9. Instructors can view metrics ONLY for their own posts
CREATE POLICY "Instructors can view own post metrics" ON public.post_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE public.posts.id = public.post_metrics.post_id 
            AND public.posts.author_id = (SELECT id FROM public.instructors WHERE email = auth.jwt() ->> 'email' LIMIT 1)
        )
    );

-- 10. Service role & Admins have full access to all tables
CREATE POLICY "Service role full access posts" ON public.posts FOR ALL USING (true);
CREATE POLICY "Service role full access post_metrics" ON public.post_metrics FOR ALL USING (true);
CREATE POLICY "Service role full access post_comments" ON public.post_comments FOR ALL USING (true);

-- Courses: Anyone can read published approved courses
CREATE POLICY "Public can view approved published courses" ON public.courses
    FOR SELECT USING (status = 'published' AND approval_status = 'approved');

-- Allow backend service role full access to all tables
CREATE POLICY "Service role full access courses" ON public.courses FOR ALL USING (true);
CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Service role full access enrollments" ON public.enrollments FOR ALL USING (true);
CREATE POLICY "Service role full access payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Service role full access certificates" ON public.certificates FOR ALL USING (true);
CREATE POLICY "Service role full access settings" ON public.platform_settings FOR ALL USING (true);

-- ==============================================================================
-- SEED INITIAL PLATFORM DATA
-- ==============================================================================

-- Settings (Mobile money numbers, contacts, site branding)
INSERT INTO public.platform_settings (key, value, "group", label) VALUES
    ('site_name', 'Godol Institute of Business', 'general', 'Institution Name'),
    ('site_tagline', 'Shaping East Africa''s Business Leaders', 'general', 'Tagline'),
    ('enrollment_open', 'true', 'general', 'Enrollment Open Status'),
    ('contact_email', 'info@godolinstitute.so', 'contact', 'Contact Email'),
    ('contact_phone', '+252 61 000 0000', 'contact', 'Contact Phone'),
    ('contact_address', 'Makka Al-Mukarama Road, Mogadishu, Somalia', 'contact', 'Campus Address'),
    ('whatsapp_number', '252610000000', 'contact', 'WhatsApp Support'),
    ('currency', 'USD', 'commerce', 'Primary Currency'),
    ('active_cohort', 'July 2026 Cohort', 'commerce', 'Active Cohort'),
    ('evc_phone', '252610000000', 'payment', 'EVC Plus Number'),
    ('evc_name', 'Godol Institute of Business', 'payment', 'EVC Plus Account Name'),
    ('zaad_phone', '252630000000', 'payment', 'Zaad Number'),
    ('zaad_name', 'Godol Institute of Business', 'payment', 'Zaad Account Name'),
    ('sahal_phone', '252900000000', 'payment', 'Sahal Number'),
    ('sahal_name', 'Godol Institute of Business', 'payment', 'Sahal Account Name'),
    ('premier_merchant_id', '100294819', 'payment', 'Premier Wallet Merchant ID'),
    ('premier_name', 'Godol Institute of Business', 'payment', 'Premier Wallet Name'),
    ('payment_instructions_extra', 'After transferring, please submit your transaction details below. Enrollment will be activated within 24 hours of payment verification.', 'payment', 'Additional Payment Instructions')
ON CONFLICT (key) DO NOTHING;

-- Categories (Clean Slate: initialized with 0 courses)
INSERT INTO public.categories (id, name, icon, color, course_count) VALUES
    (1, 'Business Strategy', 'trending-up', '#f5a614', 0),
    (2, 'Finance & Accounting', 'bar-chart', '#2563eb', 0),
    (3, 'Entrepreneurship', 'pen-tool', '#10b981', 0),
    (4, 'Digital Marketing', 'monitor-play', '#8b5cf6', 0),
    (5, 'Leadership & HR', 'server', '#ec4899', 0),
    (6, 'Live Workshops', 'code', '#06b6d4', 0)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    course_count = 0;

-- Clean slate: No fake mock courses or instructors.
-- All real courses, faculty, and workshops will be published directly via the Admin Dashboard.

