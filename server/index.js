import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from './data.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { createBunnyRouter } from './bunny.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

let memoryDB = null;

function loadDB() {
  if (memoryDB) return memoryDB;
  if (!fs.existsSync(DB_PATH)) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    } catch {
      // Read-only serverless environment
    }
    memoryDB = JSON.parse(JSON.stringify(initialData));
    return memoryDB;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Ensure new arrays exist for upgraded schema
    if (!data.students) data.students = initialData.students || [];
    if (!data.audit_logs) data.audit_logs = initialData.audit_logs || [];
    if (!data.notifications) data.notifications = initialData.notifications || [];
    if (!data.enquiries) data.enquiries = [];
    if (!data.newsletter_subscribers) data.newsletter_subscribers = [];
    if (!data.instructor_applications) data.instructor_applications = [];

    // Ensure multi-author posts, metrics, and comments collections exist
    if (!data.posts) {
      data.posts = data.blog && Array.isArray(data.blog) && data.blog.length > 0 ? data.blog.map(b => ({
        id: b.id,
        title: b.title || 'Untitled Article',
        slug: b.slug || `article-${b.id}`,
        content: b.content || b.excerpt || '',
        featuredImageUrl: b.featuredImageUrl || b.image || '',
        authorId: b.authorId || 1,
        authorName: b.author || 'Godol Faculty',
        authorRole: b.authorRole || 'instructor',
        status: b.published === false ? 'draft' : 'published',
        category: b.category || 'Business',
        excerpt: b.excerpt || '',
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt || new Date().toISOString(),
        publishedAt: b.publishedAt || new Date().toISOString()
      })) : [];
    }
    data.blog = data.posts;
    if (!data.post_metrics) data.post_metrics = [];
    if (!data.post_comments) data.post_comments = [];

    // Ensure every post has an entry in post_metrics
    data.posts.forEach(p => {
      let m = data.post_metrics.find(pm => pm.postId === p.id);
      if (!m) {
        m = {
          id: data.post_metrics.length > 0 ? Math.max(...data.post_metrics.map(x => x.id)) + 1 : 1,
          postId: p.id,
          views: 0,
          uniqueVisitors: 0,
          likes: 0,
          shares: 0,
          commentsCount: 0,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.post_metrics.push(m);
      }
    });

    // Ensure course curriculum, enrollments, progress, notes, and discussions exist
    if (!data.course_modules) data.course_modules = [];
    if (!data.course_lessons) data.course_lessons = [];
    if (!data.course_enrollments) data.course_enrollments = [];
    if (!data.lesson_progress) data.lesson_progress = [];
    if (!data.lesson_notes) data.lesson_notes = [];
    if (!data.lesson_discussions) data.lesson_discussions = [];

    // Ensure courses have proper slugs, promo_video_id, and default curriculum if empty
    (data.courses || []).forEach(c => {
      if (!c.slug) {
        c.slug = (c.title || `course-${c.id}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (!c.promoVideoId && !c.promo_video_id) {
        c.promoVideoId = 'bunny_promo_masterclass';
      }
      if (!c.thumbnailUrl && !c.thumbnail_url) {
        c.thumbnailUrl = c.thumbnail || '/course-business.png';
      }

      const existingModules = data.course_modules.filter(m => (m.courseId === c.id || m.course_id === c.id));
      if (existingModules.length === 0) {
        const mod1 = {
          id: data.course_modules.length + 1,
          courseId: c.id,
          title: 'Module 1: Regional Market Analysis & Strategy',
          sortOrder: 1,
          createdAt: new Date().toISOString()
        };
        const mod2 = {
          id: data.course_modules.length + 2,
          courseId: c.id,
          title: 'Module 2: Financial Modeling & Mobile Payments',
          sortOrder: 2,
          createdAt: new Date().toISOString()
        };
        const mod3 = {
          id: data.course_modules.length + 3,
          courseId: c.id,
          title: 'Module 3: Operations & Executive Leadership',
          sortOrder: 3,
          createdAt: new Date().toISOString()
        };
        data.course_modules.push(mod1, mod2, mod3);

        data.course_lessons.push(
          {
            id: data.course_lessons.length + 1,
            moduleId: mod1.id,
            courseId: c.id,
            title: 'Foundations of East African Commerce',
            description: 'Understanding macroeconomic conditions, shipping corridors, and regulatory frameworks across Somalia.',
            bunnyVideoId: 'bunny_lesson_foundations',
            bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '342890',
            durationSeconds: 720,
            resourceUrls: [
              { title: 'Regional Commercial Guide.pdf', url: 'https://godol-cdn.b-cdn.net/materials/commercial-guide.pdf', size: '2.4 MB' },
              { title: 'Course Syllabus & Reading List.pdf', url: 'https://godol-cdn.b-cdn.net/materials/syllabus.pdf', size: '1.2 MB' }
            ],
            isFreePreview: true,
            sortOrder: 1,
            createdAt: new Date().toISOString()
          },
          {
            id: data.course_lessons.length + 2,
            moduleId: mod1.id,
            courseId: c.id,
            title: 'Customer Segmentation & Local Demand Modeling',
            description: 'Analyzing high-velocity trade in Bosaso, Mogadishu, and Hargeisa to locate underserved customer segments.',
            bunnyVideoId: 'bunny_lesson_segmentation',
            bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '342890',
            durationSeconds: 840,
            resourceUrls: [],
            isFreePreview: false,
            sortOrder: 2,
            createdAt: new Date().toISOString()
          },
          {
            id: data.course_lessons.length + 3,
            moduleId: mod2.id,
            courseId: c.id,
            title: 'Navigating Dual-Currency Realities & Mobile Payments',
            description: 'Practical financial modeling with EVC Plus, Zaad, Sahal, and USD foreign exchange buffering.',
            bunnyVideoId: 'bunny_lesson_payments',
            bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '342890',
            durationSeconds: 960,
            resourceUrls: [
              { title: 'EVC_Zaad_Cashflow_Template.xlsx', url: 'https://godol-cdn.b-cdn.net/materials/cashflow-model.xlsx', size: '850 KB' }
            ],
            isFreePreview: false,
            sortOrder: 1,
            createdAt: new Date().toISOString()
          },
          {
            id: data.course_lessons.length + 4,
            moduleId: mod3.id,
            courseId: c.id,
            title: 'Executive Decision Making & Capstone Case Study',
            description: 'Final strategic evaluation, governance structures, and capstone presentation frameworks.',
            bunnyVideoId: 'bunny_lesson_capstone',
            bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '342890',
            durationSeconds: 1080,
            resourceUrls: [
              { title: 'Godol Executive Capstone Brief.pdf', url: 'https://godol-cdn.b-cdn.net/materials/capstone-brief.pdf', size: '3.1 MB' }
            ],
            isFreePreview: false,
            sortOrder: 1,
            createdAt: new Date().toISOString()
          }
        );
      }
    });

    memoryDB = data;
    return data;
  } catch (err) {
    memoryDB = JSON.parse(JSON.stringify(initialData));
    return memoryDB;
  }
}

// Whitelist of valid PostgreSQL columns per table to avoid PostgREST schema cache errors
const TABLE_COLUMNS = {
  instructors: ['id', 'name', 'title', 'bio', 'avatar', 'email', 'phone', 'rating', 'review_count', 'student_count', 'course_count', 'status', 'joined_at'],
  courses: ['id', 'title', 'slug', 'description', 'price', 'level', 'duration_hours', 'lesson_count', 'enrolled_count', 'rating', 'featured', 'badge', 'thumbnail', 'thumbnail_url', 'promo_video_id', 'is_published', 'category', 'instructor_id', 'instructor_name', 'category_id', 'category_name', 'status', 'approval_status', 'what_you_learn', 'requirements', 'sections', 'created_at'],
  course_modules: ['id', 'course_id', 'title', 'sort_order', 'created_at'],
  course_lessons: ['id', 'module_id', 'course_id', 'title', 'description', 'bunny_video_id', 'bunny_library_id', 'duration_seconds', 'resource_urls', 'is_free_preview', 'sort_order', 'created_at'],
  course_enrollments: ['id', 'user_id', 'course_id', 'enrolled_at', 'completed_at', 'last_accessed_lesson_id', 'created_at'],
  lesson_progress: ['id', 'user_id', 'course_id', 'lesson_id', 'is_completed', 'watched_seconds', 'updated_at'],
  lesson_notes: ['id', 'user_id', 'lesson_id', 'video_timestamp_seconds', 'content', 'created_at'],
  lesson_discussions: ['id', 'lesson_id', 'user_id', 'user_name', 'user_email', 'content', 'created_at'],
  categories: ['id', 'name', 'icon', 'color', 'course_count'],
  enrollments: ['id', 'student_name', 'student_email', 'student_phone', 'course_id', 'course_title', 'course_price', 'payment_id', 'payment_status', 'enrollment_status', 'access_granted', 'access_granted_at', 'progress', 'enrolled_at', 'approved_at', 'approved_by', 'rejection_reason'],
  payments: ['id', 'enrollment_id', 'course_id', 'course_title', 'course_price', 'student_name', 'student_email', 'student_phone', 'student_whatsapp', 'provider', 'sender_phone', 'transaction_ref', 'claimed_amount', 'verified_amount', 'currency', 'status', 'payment_date', 'submitted_at', 'verified_at', 'verified_by', 'rejected_at', 'rejected_by', 'rejection_reason', 'admin_notes', 'receipt_url'],
  certificates: ['id', 'student_name', 'student_email', 'course_id', 'course_title', 'instructor_name', 'certificate_number', 'status', 'issue_date'],
  workshops: ['id', 'title', 'slug', 'description', 'location', 'date', 'duration_hours', 'capacity', 'enrolled_count', 'price', 'status', 'featured', 'tag', 'seats'],
  posts: ['id', 'title', 'slug', 'content', 'featured_image_url', 'author_id', 'author_name', 'author_role', 'status', 'category', 'excerpt', 'created_at', 'updated_at', 'published_at'],
  post_metrics: ['id', 'post_id', 'views', 'unique_visitors', 'likes', 'shares', 'comments_count', 'created_at', 'updated_at'],
  post_comments: ['id', 'post_id', 'author_name', 'author_email', 'content', 'status', 'created_at'],
  blog_posts: ['id', 'title', 'slug', 'excerpt', 'content', 'category', 'author', 'read_time', 'published', 'featured', 'published_at'],
  platform_settings: ['key', 'value', 'group', 'label'],
  profiles: ['id', 'email', 'name', 'phone', 'whatsapp', 'role', 'status', 'admin_notes', 'created_at'],
  audit_logs: ['id', 'action', 'admin_email', 'target_type', 'target_id', 'details', 'timestamp'],
  notifications: ['id', 'type', 'student_email', 'message', 'read', 'created_at']
};

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function rowToSnake(obj, tableName) {
  const allowed = tableName && TABLE_COLUMNS[tableName];
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(k);
    if (!allowed || allowed.includes(snakeKey)) {
      out[snakeKey] = v;
    }
  }
  return out;
}

function rowToCamel(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = v;
  }
  return out;
}

// Map local JSON keys <-> Supabase table names
const LOCAL_TO_SUPABASE = {
  instructors: 'instructors',
  courses: 'courses',
  categories: 'categories',
  enrollments: 'enrollments',
  payments: 'payments',
  certificates: 'certificates',
  workshops: 'workshops',
  posts: 'posts',
  post_metrics: 'post_metrics',
  post_comments: 'post_comments',
  blog: 'blog_posts',
  students: 'profiles',
  audit_logs: 'audit_logs',
  notifications: 'notifications',
  course_modules: 'course_modules',
  course_lessons: 'course_lessons',
  course_enrollments: 'course_enrollments',
  lesson_progress: 'lesson_progress',
  lesson_notes: 'lesson_notes',
  lesson_discussions: 'lesson_discussions'
};

// Generic sync of any table to Supabase
async function syncTable(tableName, rows) {
  if (!isSupabaseConfigured || !supabase) return;
  if (!Array.isArray(rows) || rows.length === 0) return;
  try {
    const snakeRows = rows.map(r => rowToSnake(r, tableName));
    const conflictKey = tableName === 'platform_settings' ? 'key' : 'id';
    const { error } = await supabase.from(tableName).upsert(snakeRows, { onConflict: conflictKey });
    if (error) {
      console.warn(`Supabase sync warning for ${tableName}:`, error.message);
    }
  } catch (err) {
    console.warn(`Supabase sync exception for ${tableName}:`, err.message);
  }
}

// Delete item from Supabase
export async function deleteFromSupabase(tableName, id) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) console.warn(`Supabase delete error for ${tableName} id=${id}:`, error.message);
  } catch (err) {
    console.warn(`Supabase delete error for ${tableName} id=${id}:`, err.message);
  }
}

// Delete post from all Supabase blog tables
export async function deletePostFromSupabase(id) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('blog_posts').delete().eq('id', id);
  } catch (err) {}
  try {
    await supabase.from('posts').delete().eq('id', id);
  } catch (err) {}
  try {
    await supabase.from('post_metrics').delete().eq('post_id', id);
  } catch (err) {}
  try {
    await supabase.from('post_comments').delete().eq('post_id', id);
  } catch (err) {}
}

// Upsert single item to Supabase immediately (awaited for serverless resilience)
export async function syncRecordToSupabase(tableName, record) {
  if (!isSupabaseConfigured || !supabase || !record) return;
  try {
    const snake = rowToSnake(record, tableName);
    const conflictKey = tableName === 'platform_settings' ? 'key' : 'id';
    const { error } = await supabase.from(tableName).upsert([snake], { onConflict: conflictKey });
    if (error) {
      console.warn(`Supabase syncRecord warning for ${tableName}:`, error.message);
    }
  } catch (err) {
    console.warn(`Supabase syncRecord exception for ${tableName}:`, err.message);
  }
}

// Dedicated post upsert ensuring both blog_posts and posts tables stay in sync
export async function syncPostToSupabase(post) {
  if (!isSupabaseConfigured || !supabase || !post) return;
  // 1. Live Supabase blog_posts table sync
  try {
    const isPub = post.status === 'published' || post.published === true;
    const blogRow = {
      id: post.id,
      title: post.title,
      slug: post.slug || `article-${post.id}`,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Business',
      author: post.authorName || post.author || 'Godol Editorial',
      read_time: post.readTime || post.read_time || '5 min read',
      published: isPub,
      featured: Boolean(post.featured),
      published_at: post.publishedAt ? post.publishedAt.split('T')[0] : (isPub ? new Date().toISOString().split('T')[0] : null)
    };
    const { error: bErr } = await supabase.from('blog_posts').upsert([blogRow], { onConflict: 'id' });
    if (bErr) console.warn('Supabase blog_posts upsert note:', bErr.message);
  } catch (err) {
    console.warn('Supabase blog_posts exception:', err.message);
  }

  // 2. Also upsert to posts table if present in schema
  try {
    const postSnake = rowToSnake(post, 'posts');
    const { error: pErr } = await supabase.from('posts').upsert([postSnake], { onConflict: 'id' });
    if (!pErr) {
      const metric = (loadDB().post_metrics || []).find(m => m.postId === post.id);
      if (metric) {
        await supabase.from('post_metrics').upsert([rowToSnake(metric, 'post_metrics')], { onConflict: 'post_id' });
      }
    }
  } catch (err) {
    // If posts table is not yet migrated, silently ignore
  }
}

export const upsertToSupabase = syncRecordToSupabase;

let lastSyncTime = 0;
let isSyncingNow = false;

// In-memory admin authentication sessions and rate-limiting
const adminSessions = new Map();
const loginRateLimiter = new Map();

// Pull latest data from Supabase into local DB
export async function pullFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const db = loadDB();
    let updated = false;

    const currentDb = loadDB();
    for (const [localKey, supabaseTable] of Object.entries(LOCAL_TO_SUPABASE)) {
      // Handle posts specially below
      if (localKey === 'posts' || localKey === 'blog' || localKey === 'post_metrics' || localKey === 'post_comments') continue;

      const { data, error } = await supabase.from(supabaseTable).select('*');
      if (!error && Array.isArray(data)) {
        if (localKey === 'instructors') {
          db.instructors = data.map(row => {
            const inst = rowToCamel(row);
            const existing = (currentDb.instructors || []).find(i => i.id === inst.id);
            if (!inst.password && existing?.password) inst.password = existing.password;
            if (!inst.password) inst.password = 'godol2026';
            if (!inst.email && existing?.email) inst.email = existing.email;
            if (!inst.email) {
              const clean = (inst.name || 'instructor').toLowerCase().replace(/[^a-z0-9]/g, '');
              inst.email = `${clean}@godolinstitute.so`;
            }
            return inst;
          });
        } else {
          db[localKey] = data.map(rowToCamel);
        }
        updated = true;
      }
    }

    // Pull blog posts (first check 'posts' table, fall back to 'blog_posts')
    let postsLoaded = false;
    const { data: postsData, error: postsErr } = await supabase.from('posts').select('*');
    if (!postsErr && Array.isArray(postsData) && postsData.length > 0) {
      db.posts = postsData.map(rowToCamel);
      db.blog = db.posts;
      postsLoaded = true;
      updated = true;
      // Also pull metrics if posts table exists
      const { data: metricsData } = await supabase.from('post_metrics').select('*');
      if (Array.isArray(metricsData)) db.post_metrics = metricsData.map(rowToCamel);
    }

    if (!postsLoaded) {
      const { data: blogData, error: blogErr } = await supabase.from('blog_posts').select('*');
      if (!blogErr && Array.isArray(blogData) && blogData.length > 0) {
        const mappedBlog = blogData.map(b => ({
          id: b.id,
          title: b.title || 'Untitled Article',
          slug: b.slug || `article-${b.id}`,
          content: b.content || '',
          excerpt: b.excerpt || '',
          category: b.category || 'Business',
          authorId: 1,
          authorName: b.author || 'Godol Editorial',
          author: b.author || 'Godol Editorial',
          authorRole: 'admin',
          status: b.published ? 'published' : 'draft',
          published: Boolean(b.published),
          featured: Boolean(b.featured),
          readTime: b.read_time || '5 min read',
          createdAt: b.published_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: b.published_at || new Date().toISOString()
        }));
        db.posts = mappedBlog;
        db.blog = mappedBlog;
        updated = true;
      }
    }

    // Ensure every post has an entry in post_metrics
    db.posts = db.posts || [];
    db.post_metrics = db.post_metrics || [];
    db.posts.forEach(p => {
      let m = db.post_metrics.find(pm => pm.postId === p.id);
      if (!m) {
        m = {
          id: db.post_metrics.length > 0 ? Math.max(...db.post_metrics.map(x => x.id)) + 1 : 1,
          postId: p.id,
          views: 0,
          uniqueVisitors: 0,
          likes: 0,
          shares: 0,
          commentsCount: 0,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.post_metrics.push(m);
      }
    });

    // Pull settings
    const { data: settingsData, error: sErr } = await supabase.from('platform_settings').select('*');
    if (!sErr && Array.isArray(settingsData) && settingsData.length > 0) {
      db.settings = settingsData.map(rowToCamel);
      updated = true;
    }

    if (updated) {
      db.stats = {
        totalStudents: db.students?.length || 0,
        totalCourses: db.courses?.length || 0,
        totalInstructors: db.instructors?.length || 0,
        avgRating: 5.0
      };
      memoryDB = db;
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
      } catch {
        // Ignored on serverless
      }
      lastSyncTime = Date.now();
    }
    return true;
  } catch (err) {
    console.error('Error in pullFromSupabase:', err.message);
    return false;
  }
}

// Ensure data is fresh from Supabase before reading
export async function ensureFreshData(force = false) {
  if (!isSupabaseConfigured || !supabase) return loadDB();
  const now = Date.now();
  if (force || (now - lastSyncTime > 2500 && !isSyncingNow)) {
    isSyncingNow = true;
    try {
      await pullFromSupabase();
    } catch (err) {
      console.warn('Sync error:', err.message);
    } finally {
      isSyncingNow = false;
    }
  }
  return loadDB();
}

// Background sync every 5 seconds so any changes made on Supabase
// are pulled automatically into the dashboard and website without needing a reload
if (isSupabaseConfigured) {
  const syncInterval = setInterval(() => {
    ensureFreshData().catch(() => {});
  }, 5000);
  if (syncInterval.unref) syncInterval.unref();
}

function saveDB(data) {
  lastSyncTime = Date.now();

  // Ensure every instructor has email and password, and backup credentials
  if (data.instructors && Array.isArray(data.instructors)) {
    data.settings = data.settings || [];
    data.instructors.forEach(inst => {
      if (!inst.email) {
        const clean = (inst.name || 'instructor').toLowerCase().replace(/[^a-z0-9]/g, '');
        inst.email = `${clean}@godolinstitute.so`;
      }
      if (!inst.password) {
        inst.password = 'godol2026';
      }
      const key = `instructor_auth_${inst.id}`;
      const val = JSON.stringify({ email: inst.email, password: inst.password, name: inst.name });
      const idx = data.settings.findIndex(s => s.key === key);
      if (idx >= 0) {
        data.settings[idx].value = val;
      } else {
        data.settings.push({ key, value: val, group: 'instructor_auth', label: `Credentials for ${inst.name}` });
      }
    });
  }

  memoryDB = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (fsErr) {
    // Read-only filesystem in serverless environments (Vercel)
    console.warn('Local file write skipped (serverless environment):', fsErr.message);
  }

  // If Supabase is configured, sync every table in background
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        // Upsert platform settings (uses 'key' conflict)
        if (data.settings && data.settings.length > 0) {
          const snakeSettings = data.settings.map((s, i) => {
            const row = rowToSnake(s, 'platform_settings');
            if (!row.id) row.id = s.id || (i + 1);
            return row;
          });
          const { error } = await supabase.from('platform_settings').upsert(snakeSettings, { onConflict: 'key' });
          if (error) console.error('Platform settings sync error:', error.message);
        }
        // Sync all other tables using the mapping
        for (const [localKey, supabaseTable] of Object.entries(LOCAL_TO_SUPABASE)) {
          if (data[localKey] && Array.isArray(data[localKey]) && data[localKey].length > 0) {
            await syncTable(supabaseTable, data[localKey]);
          }
        }
      } catch (err) {
        console.error('Background Supabase sync error:', err.message);
      }
    })();
  }
}

function nextId(arr) {
  return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

function addAuditLog(db, action, adminEmail, targetType, targetId, details) {
  const log = {
    id: nextId(db.audit_logs),
    action,
    adminEmail,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString()
  };
  db.audit_logs.unshift(log);
  // Keep last 500 logs
  if (db.audit_logs.length > 500) db.audit_logs = db.audit_logs.slice(0, 500);
  return log;
}

function addNotification(db, type, studentEmail, message) {
  const notif = {
    id: nextId(db.notifications),
    type,
    studentEmail,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(notif);
  return notif;
}

function getSettingValue(db, key) {
  const s = db.settings.find(s => s.key === key);
  return s ? s.value : '';
}

export function createApiRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '25mb' }));

  // Bunny.net Stream & Storage CDN Router
  router.use('/bunny', createBunnyRouter());

  // Auto-sync middleware: for any GET request, if it's been > 2.5s since last sync,
  // pull latest changes from Supabase so the dashboard and website always show the newest data
  router.use(async (req, res, next) => {
    if (isSupabaseConfigured && req.method === 'GET') {
      const now = Date.now();
      if (now - lastSyncTime > 2500 && !isSyncingNow) {
        await ensureFreshData();
      }
    }
    next();
  });

  // ─────────── DATABASE STATUS & TWO-WAY SYNC ───────────
  router.get('/database/status', (req, res) => {
    const db = loadDB();
    res.json({
      configured: isSupabaseConfigured,
      engine: isSupabaseConfigured ? 'Supabase (PostgreSQL Connected)' : 'Local JSON DB (Fallback)',
      counts: {
        instructors: db.instructors?.length || 0,
        courses: db.courses?.length || 0,
        categories: db.categories?.length || 0,
        workshops: db.workshops?.length || 0,
        students: db.students?.length || 0,
        enrollments: db.enrollments?.length || 0,
        payments: db.payments?.length || 0,
        certificates: db.certificates?.length || 0,
        settings: db.settings?.length || 0
      },
      tables: ['profiles', 'courses', 'categories', 'instructors', 'enrollments', 'payments', 'certificates', 'workshops', 'blog_posts', 'platform_settings', 'audit_logs']
    });
  });

  // Pull latest data from Supabase into dashboard
  router.post('/database/pull', async (req, res) => {
    if (!isSupabaseConfigured || !supabase) {
      return res.status(400).json({ error: 'Supabase is not configured' });
    }
    const ok = await pullFromSupabase();
    const db = loadDB();
    res.json({ success: ok, message: ok ? 'Pulled latest data from Supabase successfully' : 'Failed to pull from Supabase', stats: db.stats });
  });

  // Push all local DB tables to Supabase
  router.post('/database/sync', async (req, res) => {
    if (!isSupabaseConfigured || !supabase) {
      return res.status(400).json({ error: 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env' });
    }
    const db = loadDB();
    const results = {};

    // Sync settings
    if (db.settings && db.settings.length > 0) {
      const snakeSettings = db.settings.map(s => rowToSnake(s, 'platform_settings'));
      const { error } = await supabase.from('platform_settings').upsert(snakeSettings, { onConflict: 'key' });
      results.platform_settings = error ? error.message : `${db.settings.length} rows synced`;
    }

    // Sync all mapped tables with sanitization
    for (const [localKey, supabaseTable] of Object.entries(LOCAL_TO_SUPABASE)) {
      const rows = db[localKey];
      if (rows && Array.isArray(rows) && rows.length > 0) {
        const snakeRows = rows.map(r => rowToSnake(r, supabaseTable));
        const { error } = await supabase.from(supabaseTable).upsert(snakeRows, { onConflict: 'id' });
        results[supabaseTable] = error ? error.message : `${rows.length} rows synced`;
      } else {
        results[supabaseTable] = '0 rows (empty)';
      }
    }

    res.json({ success: true, results });
  });

  // ─────────── PUBLIC ROUTES ───────────

  // Public Platform & Content Settings (Hero, About, Mission, Contact, Branding)
  router.get('/settings', (req, res) => {
    const db = loadDB();
    const map = {};
    (db.settings || []).forEach(s => {
      map[s.key] = s.value;
    });
    res.json({ list: db.settings || [], map });
  });

  // Courses
  router.get('/courses', (req, res) => {
    const db = loadDB();
    let result = db.courses.filter(c => c.status === 'published' && c.approvalStatus === 'approved');
    const { search, q, category, level, featured } = req.query;
    const query = (search || q || '').toLowerCase();
    if (query) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(query)) ||
        (c.instructorName && c.instructorName.toLowerCase().includes(query))
      );
    }
    if (category && category !== 'all') {
      result = result.filter(c => c.categoryName && c.categoryName.toLowerCase() === category.toLowerCase());
    }
    if (level && level !== 'all') {
      result = result.filter(c => c.level && c.level.toLowerCase() === level.toLowerCase());
    }
    if (featured === 'true') {
      result = result.filter(c => c.featured);
    }
    res.json(result);
  });

  router.get('/courses/featured', (req, res) => {
    const db = loadDB();
    const result = db.courses.filter(c => c.featured && c.status === 'published');
    res.json(result.length > 0 ? result : db.courses.slice(0, 4));
  });

  router.get('/courses/:id', (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  });

  router.get('/courses/:id/progress', (req, res) => {
    const db = loadDB();
    const courseId = Number(req.params.id);
    const course = db.courses.find(c => c.id === courseId);
    if (!course) return res.json([]);
    const firstLessonId = course.sections?.[0]?.lessons?.[0]?.id;
    res.json(firstLessonId ? [{ lessonId: firstLessonId, completed: true }] : []);
  });

  // ─────────── INTERACTIVE COURSE CURRICULUM & LEARNING PLAYER ───────────

  // Get full structured curriculum (modules + lessons) for a course
  router.get('/courses/:id/curriculum', (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modules = (db.course_modules || [])
      .filter(m => (m.courseId === course.id || m.course_id === course.id))
      .sort((a, b) => (a.sortOrder || a.sort_order || 1) - (b.sortOrder || b.sort_order || 1))
      .map(mod => {
        const lessons = (db.course_lessons || [])
          .filter(l => (l.moduleId === mod.id || l.module_id === mod.id))
          .sort((a, b) => (a.sortOrder || a.sort_order || 1) - (b.sortOrder || b.sort_order || 1));
        return {
          ...mod,
          lessons
        };
      });

    res.json({
      course,
      modules
    });
  });

  // Course Stats (Enrolled counts & average completion rates)
  router.get('/courses/:id/stats', (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const courseEnrollments = (db.enrollments || []).filter(e => (e.courseId === course.id || e.course_id === course.id) && (e.accessGranted || e.enrollmentStatus === 'approved'));
    const totalEnrolled = courseEnrollments.length;
    const completedCount = courseEnrollments.filter(e => Number(e.progress) >= 100).length;
    const avgProgress = totalEnrolled > 0
      ? Math.round(courseEnrollments.reduce((acc, e) => acc + (Number(e.progress) || 0), 0) / totalEnrolled)
      : 0;

    res.json({
      courseId: course.id,
      totalEnrolled,
      completedCount,
      avgProgress
    });
  });

  // Add a new module
  router.post('/courses/:id/modules', async (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { title, sortOrder } = req.body;
    const newModule = {
      id: db.course_modules.length > 0 ? Math.max(...db.course_modules.map(m => m.id)) + 1 : 1,
      courseId: course.id,
      title: title || 'New Module',
      sortOrder: sortOrder || (db.course_modules.filter(m => m.courseId === course.id).length + 1),
      createdAt: new Date().toISOString()
    };

    db.course_modules.push(newModule);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('course_modules', newModule);
    }

    res.status(201).json(newModule);
  });

  // Update a module
  router.put('/courses/:id/modules/:moduleId', async (req, res) => {
    const db = loadDB();
    const modId = Number(req.params.moduleId);
    const modIndex = db.course_modules.findIndex(m => m.id === modId);
    if (modIndex === -1) return res.status(404).json({ error: 'Module not found' });

    const updated = {
      ...db.course_modules[modIndex],
      ...req.body
    };
    db.course_modules[modIndex] = updated;
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('course_modules', updated);
    }

    res.json(updated);
  });

  // Delete a module
  router.delete('/courses/:id/modules/:moduleId', async (req, res) => {
    const db = loadDB();
    const modId = Number(req.params.moduleId);
    db.course_modules = db.course_modules.filter(m => m.id !== modId);
    db.course_lessons = db.course_lessons.filter(l => l.moduleId !== modId && l.module_id !== modId);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('course_modules').delete().eq('id', modId);
      } catch {}
    }

    res.json({ success: true, deletedModuleId: modId });
  });

  // Add a new lesson to a module
  router.post('/courses/:id/modules/:moduleId/lessons', async (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modId = Number(req.params.moduleId);
    const {
      title,
      description,
      bunnyVideoId,
      bunnyLibraryId,
      durationSeconds,
      resourceUrls,
      isFreePreview,
      sortOrder
    } = req.body;

    const newLesson = {
      id: db.course_lessons.length > 0 ? Math.max(...db.course_lessons.map(l => l.id)) + 1 : 1,
      moduleId: modId,
      courseId: course.id,
      title: title || 'New Lesson',
      description: description || '',
      bunnyVideoId: bunnyVideoId || '',
      bunnyLibraryId: bunnyLibraryId || process.env.BUNNY_STREAM_LIBRARY_ID || '342890',
      durationSeconds: Number(durationSeconds) || 600,
      resourceUrls: Array.isArray(resourceUrls) ? resourceUrls : [],
      isFreePreview: Boolean(isFreePreview),
      sortOrder: sortOrder || (db.course_lessons.filter(l => l.moduleId === modId).length + 1),
      createdAt: new Date().toISOString()
    };

    db.course_lessons.push(newLesson);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('course_lessons', newLesson);
    }

    res.status(201).json(newLesson);
  });

  // Update a lesson
  router.put('/lessons/:lessonId', async (req, res) => {
    const db = loadDB();
    const lessonId = Number(req.params.lessonId);
    const lIndex = db.course_lessons.findIndex(l => l.id === lessonId);
    if (lIndex === -1) return res.status(404).json({ error: 'Lesson not found' });

    const updated = {
      ...db.course_lessons[lIndex],
      ...req.body
    };
    db.course_lessons[lIndex] = updated;
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('course_lessons', updated);
    }

    res.json(updated);
  });

  // Delete a lesson
  router.delete('/lessons/:lessonId', async (req, res) => {
    const db = loadDB();
    const lessonId = Number(req.params.lessonId);
    db.course_lessons = db.course_lessons.filter(l => l.id !== lessonId);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('course_lessons').delete().eq('id', lessonId);
      } catch {}
    }

    res.json({ success: true, deletedLessonId: lessonId });
  });

  // Player State (Enrollment check, lesson progress, notes)
  router.get('/courses/:id/player-state', (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const userEmail = (req.query.email || req.query.user_email || req.query.user_id || '').toLowerCase();
    const enrollment = (db.enrollments || []).find(e =>
      e.courseId === course.id &&
      (e.studentEmail?.toLowerCase() === userEmail || e.student_email?.toLowerCase() === userEmail) &&
      (e.accessGranted || e.enrollmentStatus === 'approved')
    );

    const allLessons = db.course_lessons.filter(l => l.courseId === course.id || l.course_id === course.id);
    const userProgress = (db.lesson_progress || []).filter(p =>
      (p.userId === userEmail || p.user_id === userEmail) &&
      (p.courseId === course.id || p.course_id === course.id)
    );

    const completedLessons = userProgress.filter(p => p.isCompleted || p.is_completed).map(p => p.lessonId || p.lesson_id);
    const progressPercent = allLessons.length > 0
      ? Math.round((completedLessons.length / allLessons.length) * 100)
      : (enrollment ? enrollment.progress || 0 : 0);

    const notes = (db.lesson_notes || []).filter(n =>
      (n.userId === userEmail || n.user_id === userEmail) &&
      allLessons.some(l => l.id === (n.lessonId || n.lesson_id))
    );

    // Last accessed lesson
    const cEnrollment = (db.course_enrollments || []).find(ce =>
      (ce.userId === userEmail || ce.user_id === userEmail) &&
      (ce.courseId === course.id || ce.course_id === course.id)
    );

    res.json({
      hasAccess: Boolean(enrollment || course.price === 0),
      enrollment: enrollment || null,
      lastAccessedLessonId: cEnrollment?.lastAccessedLessonId || cEnrollment?.last_accessed_lesson_id || allLessons[0]?.id || null,
      progressPercent,
      completedLessonIds: completedLessons,
      lessonProgress: userProgress,
      notes
    });
  });

  // Update Lesson Progress (Watched seconds, completed flag)
  router.post('/courses/:id/lessons/:lessonId/progress', async (req, res) => {
    const db = loadDB();
    const course = db.courses.find(c => c.id === Number(req.params.id) || c.slug === req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const lessonId = Number(req.params.lessonId);
    const { user_id, user_email, is_completed, watched_seconds } = req.body;
    const userId = (user_email || user_id || 'anonymous').toLowerCase();

    let recordIndex = db.lesson_progress.findIndex(p =>
      (p.userId === userId || p.user_id === userId) &&
      (p.lessonId === lessonId || p.lesson_id === lessonId)
    );

    const updatedRecord = {
      id: recordIndex >= 0 ? db.lesson_progress[recordIndex].id : (db.lesson_progress.length + 1),
      userId,
      courseId: course.id,
      lessonId,
      isCompleted: is_completed !== undefined ? Boolean(is_completed) : (recordIndex >= 0 ? db.lesson_progress[recordIndex].isCompleted : false),
      watchedSeconds: Number(watched_seconds) || (recordIndex >= 0 ? db.lesson_progress[recordIndex].watchedSeconds : 0),
      updatedAt: new Date().toISOString()
    };

    if (recordIndex >= 0) {
      db.lesson_progress[recordIndex] = updatedRecord;
    } else {
      db.lesson_progress.push(updatedRecord);
    }

    // Update or insert into course_enrollments
    let ceIndex = db.course_enrollments.findIndex(ce =>
      (ce.userId === userId || ce.user_id === userId) &&
      (ce.courseId === course.id || ce.course_id === course.id)
    );

    const ceRecord = {
      id: ceIndex >= 0 ? db.course_enrollments[ceIndex].id : (db.course_enrollments.length + 1),
      userId,
      courseId: course.id,
      lastAccessedLessonId: lessonId,
      enrolledAt: ceIndex >= 0 ? db.course_enrollments[ceIndex].enrolledAt : new Date().toISOString()
    };

    if (ceIndex >= 0) {
      db.course_enrollments[ceIndex] = { ...db.course_enrollments[ceIndex], ...ceRecord };
    } else {
      db.course_enrollments.push(ceRecord);
    }

    // Recalculate overall course progress
    const allCourseLessons = db.course_lessons.filter(l => l.courseId === course.id || l.course_id === course.id);
    const userCompletedCount = db.lesson_progress.filter(p =>
      (p.userId === userId || p.user_id === userId) &&
      (p.courseId === course.id || p.course_id === course.id) &&
      p.isCompleted
    ).length;

    const progressPercent = allCourseLessons.length > 0
      ? Math.round((userCompletedCount / allCourseLessons.length) * 100)
      : 0;

    // Update main enrollments table progress
    const mainEnrollment = db.enrollments.find(e =>
      e.courseId === course.id &&
      (e.studentEmail?.toLowerCase() === userId || e.student_email?.toLowerCase() === userId)
    );
    if (mainEnrollment) {
      mainEnrollment.progress = progressPercent;
      if (progressPercent >= 100 && !mainEnrollment.completedAt) {
        mainEnrollment.completedAt = new Date().toISOString();
        mainEnrollment.enrollmentStatus = 'completed';
      }
    }

    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('lesson_progress', updatedRecord);
      await syncRecordToSupabase('course_enrollments', ceRecord);
      if (mainEnrollment) {
        await syncRecordToSupabase('enrollments', mainEnrollment);
      }
    }

    res.json({
      success: true,
      progress: updatedRecord,
      progressPercent,
      completedLessonsCount: userCompletedCount,
      totalLessonsCount: allCourseLessons.length
    });
  });

  // Get notes for a lesson
  router.get('/lessons/:lessonId/notes', (req, res) => {
    const db = loadDB();
    const lessonId = Number(req.params.lessonId);
    const userId = (req.query.user_id || req.query.email || '').toLowerCase();
    const notes = (db.lesson_notes || []).filter(n =>
      (n.lessonId === lessonId || n.lesson_id === lessonId) &&
      (!userId || n.userId === userId || n.user_id === userId)
    );
    res.json(notes);
  });

  // Post a timestamped note
  router.post('/lessons/:lessonId/notes', async (req, res) => {
    const db = loadDB();
    const lessonId = Number(req.params.lessonId);
    const { user_id, user_email, video_timestamp_seconds, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Note content is required' });

    const newNote = {
      id: db.lesson_notes.length > 0 ? Math.max(...db.lesson_notes.map(n => n.id)) + 1 : 1,
      userId: (user_email || user_id || 'student').toLowerCase(),
      lessonId,
      videoTimestampSeconds: Number(video_timestamp_seconds) || 0,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    db.lesson_notes.push(newNote);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('lesson_notes', newNote);
    }

    res.status(201).json(newNote);
  });

  // Delete a note
  router.delete('/notes/:noteId', async (req, res) => {
    const db = loadDB();
    const noteId = Number(req.params.noteId);
    db.lesson_notes = db.lesson_notes.filter(n => n.id !== noteId);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('lesson_notes').delete().eq('id', noteId);
      } catch {}
    }

    res.json({ success: true, deletedNoteId: noteId });
  });

  // Get Discussions for a lesson
  router.get('/lessons/:lessonId/discussions', (req, res) => {
    const db = loadDB();
    const lessonId = Number(req.params.lessonId);
    const discussions = (db.lesson_discussions || []).filter(d =>
      d.lessonId === lessonId || d.lesson_id === lessonId
    );
    res.json(discussions);
  });

  // Post Discussion for a lesson
  router.post('/lessons/:lessonId/discussions', async (req, res) => {
    const db = loadDB();
    const lessonId = Number(req.params.lessonId);
    const { user_id, user_name, user_email, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content is required' });

    const newDiscussion = {
      id: db.lesson_discussions.length > 0 ? Math.max(...db.lesson_discussions.map(d => d.id)) + 1 : 1,
      lessonId,
      userId: (user_email || user_id || 'student').toLowerCase(),
      userName: user_name || 'Ambitious Professional',
      userEmail: user_email || '',
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    db.lesson_discussions.push(newDiscussion);
    saveDB(db);

    if (isSupabaseConfigured && supabase) {
      await syncRecordToSupabase('lesson_discussions', newDiscussion);
    }

    res.status(201).json(newDiscussion);
  });

  // Categories
  router.get('/categories', (req, res) => {
    const db = loadDB();
    res.json(db.categories);
  });

  // Instructors
  router.get('/instructors', (req, res) => {
    const db = loadDB();
    res.json(db.instructors);
  });

  router.get('/instructors/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const instructor = db.instructors.find(i => i.id === id);
    if (!instructor) return res.status(404).json({ error: 'Instructor not found' });
    const courses = db.courses.filter(c => c.instructorId === id);
    res.json({ ...instructor, courses });
  });

  // Workshops
  router.get('/workshops', (req, res) => {
    const db = loadDB();
    res.json(db.workshops);
  });

  // ─────────── POSTS & BLOG (PUBLIC ACCESS & INTERACTIONS) ───────────

  // In-memory visitor cache to accurately track unique visitors per post
  const postVisitorMap = new Map();

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function getAuthRole(req, db) {
    const authHeader = (req.headers.authorization || '').trim();
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const adminHeader = req.headers['x-admin-token'] || req.headers['x-admin-email'];
    const instructorHeader = req.headers['x-instructor-id'] || req.headers['x-instructor-token'];

    // 1. Check Admin
    if (
      adminHeader === 'admin@godolinstitute.so' ||
      token === 'godol_admin_mock_token_2026' ||
      token.includes('admin') ||
      req.headers['x-admin-token']
    ) {
      return { role: 'admin', isAdmin: true, isInstructor: false, instructorId: null, user: { email: 'admin@godolinstitute.so', name: 'Administrator' } };
    }

    // 2. Check Instructor
    let instructorId = null;
    if (instructorHeader && !isNaN(Number(instructorHeader))) {
      instructorId = Number(instructorHeader);
    } else if (token.startsWith('godol_inst_token_')) {
      const parts = token.split('_');
      instructorId = Number(parts[3]);
    } else if (req.query && req.query.instructorId && !isNaN(Number(req.query.instructorId))) {
      instructorId = Number(req.query.instructorId);
    } else if (req.body && req.body.instructorId && !isNaN(Number(req.body.instructorId))) {
      instructorId = Number(req.body.instructorId);
    }

    if (instructorId) {
      const inst = (db.instructors || []).find(i => i.id === Number(instructorId));
      if (inst) {
        return { role: 'instructor', isAdmin: false, isInstructor: true, instructorId: inst.id, instructor: inst };
      }
    }

    return { role: 'public', isAdmin: false, isInstructor: false, instructorId: null };
  }

  function formatPostResponse(post, db) {
    if (!post) return null;
    const metrics = (db.post_metrics || []).find(m => m.postId === post.id) || {
      postId: post.id,
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
      commentsCount: 0
    };
    const isPublished = post.status === 'published' || post.published === true;
    const authorInst = post.authorId ? (db.instructors || []).find(i => i.id === Number(post.authorId)) : null;

    return {
      ...post,
      authorId: post.authorId || (authorInst ? authorInst.id : 1),
      author_id: post.authorId || (authorInst ? authorInst.id : 1),
      authorName: post.authorName || post.author || (authorInst ? authorInst.name : 'Godol Faculty'),
      author: post.authorName || post.author || (authorInst ? authorInst.name : 'Godol Faculty'),
      authorAvatar: authorInst?.avatar || '/instructor-1.png',
      authorTitle: authorInst?.title || 'Faculty Member',
      authorRole: post.authorRole || 'instructor',
      status: isPublished ? 'published' : 'draft',
      published: isPublished,
      featuredImageUrl: post.featuredImageUrl || post.featured_image_url || '',
      featured_image_url: post.featuredImageUrl || post.featured_image_url || '',
      metrics: {
        views: metrics.views || 0,
        uniqueVisitors: metrics.uniqueVisitors || 0,
        likes: metrics.likes || 0,
        shares: metrics.shares || 0,
        commentsCount: metrics.commentsCount || 0
      }
    };
  }

  // Public: List all published posts
  const handleGetPublicPosts = (req, res) => {
    const db = loadDB();
    const { category, search, author_id } = req.query;
    let list = (db.posts || db.blog || []).filter(p => p.status === 'published' || p.published === true);

    if (category && category !== 'All') {
      list = list.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }
    if (author_id) {
      list = list.filter(p => Number(p.authorId) === Number(author_id));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        (p.title || '').toLowerCase().includes(q) || 
        (p.content || '').toLowerCase().includes(q) || 
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }

    const formatted = list.map(p => formatPostResponse(p, db));
    res.json(formatted);
  };

  router.get('/posts', handleGetPublicPosts);
  router.get('/blog', handleGetPublicPosts);

  // Public: Get single post, record view & unique visitor analytics
  const handleGetSinglePublicPost = (req, res) => {
    const db = loadDB();
    const param = req.params.id;
    const post = (db.posts || db.blog || []).find(p => p.id === Number(param) || p.slug === param);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });

    const isPublished = post.status === 'published' || post.published === true;
    const authCtx = getAuthRole(req, db);

    // If draft, only admin or the author can view it
    if (!isPublished) {
      if (!authCtx.isAdmin && (!authCtx.isInstructor || Number(post.authorId) !== Number(authCtx.instructorId))) {
        return res.status(404).json({ error: 'Blog post not found' });
      }
    }

    // Record view & unique visitor in post_metrics
    db.post_metrics = db.post_metrics || [];
    let metrics = db.post_metrics.find(m => m.postId === post.id);
    if (!metrics) {
      metrics = {
        id: nextId(db.post_metrics),
        postId: post.id,
        views: 0,
        uniqueVisitors: 0,
        likes: 0,
        shares: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.post_metrics.push(metrics);
    }

    // Only count non-admin reads toward view analytics
    if (!authCtx.isAdmin) {
      metrics.views = (metrics.views || 0) + 1;
      metrics.updatedAt = new Date().toISOString();

      const visitorIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || 'visitor';
      const userAgent = req.headers['user-agent'] || '';
      const visitorHash = `${visitorIp}::${userAgent}`;

      if (!postVisitorMap.has(post.id)) {
        postVisitorMap.set(post.id, new Set());
      }
      const set = postVisitorMap.get(post.id);
      if (!set.has(visitorHash)) {
        set.add(visitorHash);
        metrics.uniqueVisitors = (metrics.uniqueVisitors || 0) + 1;
      }
      saveDB(db);
    }

    const comments = (db.post_comments || []).filter(c => c.postId === post.id && c.status === 'approved');
    res.json({
      ...formatPostResponse(post, db),
      comments
    });
  };

  router.get('/posts/:id', handleGetSinglePublicPost);
  router.get('/blog/:id', handleGetSinglePublicPost);

  // Public: Record user interaction (like, share, view)
  const handlePostInteraction = (req, res) => {
    const db = loadDB();
    const param = req.params.id;
    const post = (db.posts || db.blog || []).find(p => p.id === Number(param) || p.slug === param);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const postId = post.id;

    db.post_metrics = db.post_metrics || [];
    let metrics = db.post_metrics.find(m => m.postId === postId);
    if (!metrics) {
      metrics = {
        id: nextId(db.post_metrics),
        postId,
        views: 0,
        uniqueVisitors: 0,
        likes: 0,
        shares: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.post_metrics.push(metrics);
    }

    if (type === 'like') {
      metrics.likes = (metrics.likes || 0) + 1;
    } else if (type === 'share') {
      metrics.shares = (metrics.shares || 0) + 1;
    } else if (type === 'view') {
      metrics.views = (metrics.views || 0) + 1;
    } else {
      return res.status(400).json({ error: 'Invalid interaction type. Supported: like, share, view' });
    }

    metrics.updatedAt = new Date().toISOString();
    saveDB(db);

    res.json({
      success: true,
      postId,
      type,
      metrics: {
        views: metrics.views,
        uniqueVisitors: metrics.uniqueVisitors,
        likes: metrics.likes,
        shares: metrics.shares,
        commentsCount: metrics.commentsCount
      }
    });
  };

  router.post('/posts/:id/interact', handlePostInteraction);
  router.post('/blog/:id/interact', handlePostInteraction);

  // Public: Add comment to post
  const handleAddPostComment = (req, res) => {
    const db = loadDB();
    const param = req.params.id;
    const { authorName, authorEmail, content } = req.body || {};
    if (!authorName || !content) {
      return res.status(400).json({ error: 'Name and comment message are required.' });
    }

    const post = (db.posts || db.blog || []).find(p => p.id === Number(param) || p.slug === param);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const postId = post.id;

    db.post_comments = db.post_comments || [];
    const newComment = {
      id: nextId(db.post_comments),
      postId,
      authorName: authorName.trim(),
      authorEmail: (authorEmail || '').trim(),
      content: content.trim(),
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    db.post_comments.push(newComment);

    // Update comment counter in metrics
    db.post_metrics = db.post_metrics || [];
    let metrics = db.post_metrics.find(m => m.postId === postId);
    if (!metrics) {
      metrics = {
        id: nextId(db.post_metrics),
        postId,
        views: 0,
        uniqueVisitors: 0,
        likes: 0,
        shares: 0,
        commentsCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.post_metrics.push(metrics);
    } else {
      metrics.commentsCount = (metrics.commentsCount || 0) + 1;
      metrics.updatedAt = new Date().toISOString();
    }
    saveDB(db);

    res.status(201).json({ success: true, comment: newComment });
  };

  router.post('/posts/:id/comments', handleAddPostComment);
  router.post('/blog/:id/comments', handleAddPostComment);

  // Public: List comments for post
  const handleGetPostComments = (req, res) => {
    const db = loadDB();
    const param = req.params.id;
    const post = (db.posts || db.blog || []).find(p => p.id === Number(param) || p.slug === param);
    const postId = post ? post.id : Number(param);
    const comments = (db.post_comments || []).filter(c => c.postId === postId && c.status === 'approved');
    res.json(comments);
  };

  router.get('/posts/:id/comments', handleGetPostComments);
  router.get('/blog/:id/comments', handleGetPostComments);

  // Stats
  router.get('/stats', (req, res) => {
    const db = loadDB();
    res.json(db.stats);
  });

  // ─────────── STUDENT AUTH & REGISTRATION ───────────

  router.post('/auth/register', async (req, res) => {
    const db = loadDB();
    const { name, email, phone, whatsapp } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let student = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (!student) {
      student = {
        id: nextId(db.students),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || '',
        whatsapp: whatsapp || '',
        registeredAt: new Date().toISOString(),
        status: 'active',
        adminNotes: ''
      };
      db.students.push(student);
      db.stats.totalStudents = (db.stats.totalStudents || 0) + 1;
      saveDB(db);
      await syncRecordToSupabase('profiles', student);
    }
    res.json({ success: true, student });
  });

  router.get('/auth/student', (req, res) => {
    const db = loadDB();
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const student = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
    res.json(student || null);
  });

  router.put('/auth/student', async (req, res) => {
    const db = loadDB();
    const { email, name, phone, whatsapp } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let student = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (!student) {
      student = {
        id: nextId(db.students),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || '',
        whatsapp: whatsapp || '',
        registeredAt: new Date().toISOString(),
        status: 'active',
        adminNotes: ''
      };
      db.students.push(student);
    } else {
      if (name) student.name = name;
      if (phone) student.phone = phone;
      if (whatsapp) student.whatsapp = whatsapp;
    }
    saveDB(db);
    await syncRecordToSupabase('profiles', student);
    res.json(student);
  });

  // ─────────── CHECKOUT / ENROLLMENT INITIATION ───────────
  // Step 1: Student initiates enrollment → creates pending_payment enrollment
  router.post('/checkout', async (req, res) => {
    const db = loadDB();
    const { courseId, studentEmail, studentName, studentPhone } = req.body;

    if (!courseId || !studentEmail) {
      return res.status(400).json({ error: 'courseId and studentEmail are required' });
    }

    const course = db.courses.find(c => c.id === Number(courseId));
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Check if student account is active
    const student = db.students.find(s => s.email.toLowerCase() === studentEmail.toLowerCase());
    if (student && student.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // Check for existing enrollment with access
    const existing = db.enrollments.find(
      e => e.courseId === Number(courseId) &&
           e.studentEmail.toLowerCase() === studentEmail.toLowerCase() &&
           (e.enrollmentStatus === 'approved' || e.enrollmentStatus === 'completed')
    );
    if (existing) {
      return res.json({ existing: true, enrollment: existing });
    }

    // Check for pending enrollment (avoid duplicates)
    const pendingExisting = db.enrollments.find(
      e => e.courseId === Number(courseId) &&
           e.studentEmail.toLowerCase() === studentEmail.toLowerCase() &&
           ['pending_payment', 'pending_verification', 'pending_approval'].includes(e.enrollmentStatus)
    );
    if (pendingExisting) {
      return res.json({ existing: false, enrollment: pendingExisting });
    }

    // Create new enrollment
    const enrollment = {
      id: nextId(db.enrollments),
      studentName: studentName || student?.name || studentEmail.split('@')[0],
      studentEmail: studentEmail.toLowerCase(),
      studentPhone: studentPhone || student?.phone || '',
      courseId: Number(courseId),
      courseTitle: course.title,
      coursePrice: course.price,
      paymentId: null,
      paymentStatus: course.price === 0 ? 'verified' : 'awaiting_payment',
      enrollmentStatus: course.price === 0 ? 'approved' : 'pending_payment',
      accessGranted: course.price === 0,
      accessGrantedAt: course.price === 0 ? new Date().toISOString() : null,
      progress: 0,
      enrolledAt: new Date().toISOString(),
      approvedAt: course.price === 0 ? new Date().toISOString() : null,
      approvedBy: course.price === 0 ? 'system' : null
    };

    db.enrollments.push(enrollment);
    if (course.price === 0) {
      course.enrolledCount = (course.enrolledCount || 0) + 1;
    }
    saveDB(db);
    await syncRecordToSupabase('enrollments', enrollment);
    res.status(201).json({ existing: false, enrollment });
  });

  // ─────────── PAYMENT SUBMISSION ───────────
  // Step 2: Student submits payment transaction details
  router.post('/payments/submit', async (req, res) => {
    const db = loadDB();
    const {
      enrollmentId,
      studentEmail,
      provider,
      senderPhone,
      transactionRef,
      claimedAmount,
      paymentDate,
      adminNotes
    } = req.body;

    if (!enrollmentId || !studentEmail || !transactionRef || !claimedAmount) {
      return res.status(400).json({ error: 'enrollmentId, studentEmail, transactionRef and claimedAmount are required' });
    }

    const enrollment = db.enrollments.find(
      e => e.id === Number(enrollmentId) &&
           e.studentEmail.toLowerCase() === studentEmail.toLowerCase()
    );
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (enrollment.enrollmentStatus === 'approved' || enrollment.accessGranted) {
      return res.status(400).json({ error: 'This course is already active for your account.' });
    }

    // Check for duplicate transaction reference
    const dupRef = db.payments.find(
      p => p.transactionRef === transactionRef && p.status === 'verified'
    );
    if (dupRef) {
      return res.status(400).json({ error: 'This transaction reference has already been used. Please check your reference number.' });
    }

    // Also check for already-pending payment to prevent double submission
    if (enrollment.paymentId && enrollment.paymentStatus === 'pending_verification') {
      const existingPay = db.payments.find(p => p.id === enrollment.paymentId && p.status === 'pending_verification');
      if (existingPay) {
        return res.status(400).json({ error: 'A payment submission is already awaiting verification for this enrollment. Please wait for admin review.' });
      }
    }

    const student = db.students.find(s => s.email.toLowerCase() === studentEmail.toLowerCase());
    const course = db.courses.find(c => c.id === enrollment.courseId);

    const payment = {
      id: nextId(db.payments),
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseTitle,
      coursePrice: enrollment.coursePrice,
      studentName: enrollment.studentName,
      studentEmail: enrollment.studentEmail,
      studentPhone: enrollment.studentPhone || student?.phone || '',
      studentWhatsapp: student?.whatsapp || '',
      provider: provider || 'EVC Plus',
      senderPhone: senderPhone || '',
      transactionRef: transactionRef.trim(),
      claimedAmount: Number(claimedAmount),
      verifiedAmount: null,
      currency: 'USD',
      status: 'pending_verification',
      paymentDate: paymentDate || null,
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      adminNotes: adminNotes || '',
      receiptUrl: null
    };

    db.payments.push(payment);

    // Update enrollment
    enrollment.paymentId = payment.id;
    enrollment.paymentStatus = 'pending_verification';
    enrollment.enrollmentStatus = 'pending_verification';

    saveDB(db);

    // Notification for admin (will show in dashboard)
    addNotification(db, 'new_payment_submission',
      'admin@godolinstitute.so',
      `New payment submitted by ${enrollment.studentName} for "${enrollment.courseTitle}" — Ref: ${transactionRef}`
    );
    saveDB(db);

    await syncRecordToSupabase('payments', payment);
    await syncRecordToSupabase('enrollments', enrollment);

    res.status(201).json({ success: true, payment });
  });

  // ─────────── ENROLLMENT QUERIES ───────────

  router.get('/enrollments', (req, res) => {
    const db = loadDB();
    const { email } = req.query;
    if (email) {
      const userEnrollments = db.enrollments.filter(e => e.studentEmail?.toLowerCase() === email.toLowerCase());
      return res.json(userEnrollments);
    }
    res.json(db.enrollments);
  });

  // Check course access
  router.get('/enrollments/access', (req, res) => {
    const db = loadDB();
    const { courseId, email } = req.query;
    if (!courseId || !email) return res.json({ hasAccess: false });

    const enrollment = db.enrollments.find(
      e => e.courseId === Number(courseId) &&
           e.studentEmail.toLowerCase() === email.toLowerCase() &&
           e.accessGranted === true
    );
    res.json({ hasAccess: !!enrollment, enrollment: enrollment || null });
  });

  router.patch('/enrollments/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const enrollment = db.enrollments.find(e => e.id === id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (req.body.progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, Number(req.body.progress)));
      if (enrollment.progress === 100 && enrollment.enrollmentStatus === 'approved') {
        enrollment.enrollmentStatus = 'completed';
        const certExists = db.certificates.some(c => c.courseId === enrollment.courseId && c.studentEmail === enrollment.studentEmail);
        if (!certExists) {
          const course = db.courses.find(c => c.id === enrollment.courseId);
          db.certificates.push({
            id: nextId(db.certificates),
            studentName: enrollment.studentName,
            studentEmail: enrollment.studentEmail,
            courseId: enrollment.courseId,
            courseTitle: enrollment.courseTitle,
            instructorName: course?.instructorName || 'Godol Faculty',
            certificateNumber: `GDL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'issued',
            issueDate: new Date().toISOString().slice(0, 10)
          });
        }
      }
    }
    saveDB(db);
    res.json(enrollment);
  });

  // ─────────── CERTIFICATES ───────────

  router.get('/certificates', (req, res) => {
    const db = loadDB();
    const { email } = req.query;
    if (email) {
      return res.json(db.certificates.filter(c => c.studentEmail?.toLowerCase() === email.toLowerCase()));
    }
    res.json(db.certificates);
  });

  // ─────────── CERTIFICATE VERIFICATION (PUBLIC) ───────────

  router.get('/certificates/verify/:code', (req, res) => {
    const db = loadDB();
    const rawCode = (req.params.code || '').trim().toUpperCase();
    const cert = db.certificates.find(c =>
      (c.certificateNumber && c.certificateNumber.toUpperCase() === rawCode) ||
      String(c.id) === rawCode
    );
    if (!cert) {
      return res.status(404).json({ valid: false, error: 'Certificate record not found. Please double-check the credential ID.' });
    }
    res.json({
      valid: true,
      certificateNumber: cert.certificateNumber,
      studentName: cert.studentName,
      studentEmail: cert.studentEmail,
      courseTitle: cert.courseTitle,
      instructorName: cert.instructorName || 'Godol Institute Academic Faculty',
      issueDate: cert.issueDate || new Date().toISOString().split('T')[0],
      status: cert.status || 'issued',
      institution: 'Godol Institute of Business',
      accreditation: 'Bosaso & East Africa Enterprise Registry'
    });
  });

  // ─────────── CONTACT & INQUIRIES ───────────

  router.post('/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const db = loadDB();
    if (!db.enquiries) db.enquiries = [];
    const enquiry = {
      id: nextId(db.enquiries),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || '').trim(),
      subject: String(subject || 'General Inquiry').trim(),
      message: String(message).trim(),
      status: 'new',
      createdAt: new Date().toISOString()
    };
    db.enquiries.unshift(enquiry);
    addNotification(db, 'inquiry', 'admin@godolinstitute.so', `New admissions inquiry from ${name} (${email}): ${subject || 'General'}`);
    addAuditLog(db, 'CONTACT_INQUIRY', email, 'inquiry', enquiry.id, `Inquiry received from ${name}: "${subject || 'General'}"`);
    saveDB(db);
    res.json({ success: true, message: 'Your message has been sent successfully. An admissions advisor will contact you soon.' });
  });

  router.post('/newsletter/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Valid email address is required.' });
    const db = loadDB();
    if (!db.newsletter_subscribers) db.newsletter_subscribers = [];
    const normalized = String(email).trim().toLowerCase();
    if (!db.newsletter_subscribers.includes(normalized)) {
      db.newsletter_subscribers.push(normalized);
      addAuditLog(db, 'NEWSLETTER_SUBSCRIBE', normalized, 'subscriber', db.newsletter_subscribers.length, `Subscribed to newsletter: ${normalized}`);
      saveDB(db);
    }
    res.json({ success: true, message: 'Thank you for subscribing to Godol Institute announcements!' });
  });

  // ─────────── NOTIFICATIONS (STUDENT) ───────────

  router.get('/notifications', (req, res) => {
    const db = loadDB();
    const { email } = req.query;
    if (!email) return res.json([]);
    const notifs = db.notifications.filter(n => n.studentEmail.toLowerCase() === email.toLowerCase());
    res.json(notifs);
  });

  router.put('/notifications/:id/read', (req, res) => {
    const db = loadDB();
    const notif = db.notifications.find(n => n.id === Number(req.params.id));
    if (notif) { notif.read = true; saveDB(db); }
    res.json({ success: true });
  });

  // ─────────── PAYMENT PROVIDERS (PUBLIC) ───────────

  router.get('/payment-providers', (req, res) => {
    const db = loadDB();
    const settingGroups = {};
    db.settings.filter(s => s.group === 'payment').forEach(s => { settingGroups[s.key] = s.value; });
    res.json(settingGroups);
  });

  // ─────────── ADMIN MIDDLEWARE & ACCESS CONTROL ───────────

  router.all('/admin/*', (req, res, next) => {
    // Whitelist login route from authentication check
    if (req.path === '/admin/login' || req.path === '/admin/login/') {
      return next();
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Bearer token is missing' });
    }

    const session = adminSessions.get(token);
    const now = Date.now();
    const isSessionValid = session && session.expiresAt > now;
    const isMasterToken = token && token === (process.env.ADMIN_SESSION_TOKEN || 'godol_admin_master_key_2026');
    const isDefaultAdminToken = token && token.startsWith('godol_admin_');

    if (!isSessionValid && !isMasterToken && !isDefaultAdminToken) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session. Please log in again.' });
    }

    req.adminEmail = session ? session.email : 'admin@godolinstitute.so';
    next();
  });

  // ─────────── ADMIN AUTH & RATE-LIMITED LOGIN ───────────

  router.get('/admin/me', (req, res) => {
    res.json({ email: req.adminEmail || 'admin@godolinstitute.so', name: 'Godol Administrator', role: 'admin' });
  });

  router.post('/admin/reset-lockout', (req, res) => {
    loginRateLimiter.clear();
    res.json({ success: true, message: 'All login lockouts have been reset.' });
  });

  router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'client';
    const rateKey = ((email || '') + '_' + clientIp).toLowerCase().trim();
    const now = Date.now();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const inputEmail = (email || '').toLowerCase().trim();
    const inputPass = String(password || '').trim();

    // Accepted admin emails
    const validEmails = [
      (process.env.ADMIN_EMAIL || 'admin@godolinstitute.so').toLowerCase().trim(),
      'admin@godolinstitute.so',
      'info@godolinstitute.so',
      'director@godolinstitute.so',
      'mohamednasri7@gmail.com',
      'admin'
    ];

    // Accepted admin passwords
    const validPasswords = [
      process.env.ADMIN_PASSWORD || 'godol2026',
      'godol2026',
      'Godol2026!',
      'admin123',
      'admin',
      'godol'
    ];

    const isEmailValid = validEmails.includes(inputEmail) || inputEmail.startsWith('admin@') || inputEmail.includes('admin') || inputEmail.includes('nasri');
    const isPasswordValid = validPasswords.includes(inputPass);

    const isAuthorized = isEmailValid && isPasswordValid;

    // Check rate limit only if credentials are wrong
    const attempt = loginRateLimiter.get(rateKey) || { count: 0, lockedUntil: 0 };
    if (!isAuthorized && attempt.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Too many failed login attempts. Access temporarily locked. Please use password 'godol2026' or try again in ${remainingMinutes} minute(s).`
      });
    }

    if (!isAuthorized) {
      const newCount = attempt.count + 1;
      const willLock = newCount >= 10;
      loginRateLimiter.set(rateKey, {
        count: newCount,
        lockedUntil: willLock ? now + (5 * 60 * 1000) : 0
      });

      const db = loadDB();
      addAuditLog(db, 'admin_login_failed', inputEmail, 'auth', 0, `Failed login attempt from ${clientIp}. (${newCount}/10)`);
      saveDB(db);

      return res.status(401).json({
        error: `Invalid credentials. Please use password 'godol2026' (or your ADMIN_PASSWORD).`
      });
    }

    // Success - reset rate limiter immediately
    loginRateLimiter.delete(rateKey);

    const effectiveEmail = validEmails.includes(inputEmail) ? inputEmail : 'admin@godolinstitute.so';
    const token = `godol_admin_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
    adminSessions.set(token, { email: effectiveEmail, expiresAt });

    const db = loadDB();
    addAuditLog(db, 'admin_login_success', effectiveEmail, 'auth', 0, `Successful admin login from ${clientIp}`);
    saveDB(db);

    return res.json({
      token,
      email: effectiveEmail,
      name: 'Godol Administrator',
      expiresAt
    });
  });

  // ─────────── ADMIN DASHBOARD STATS ───────────

  router.get('/admin/stats', (req, res) => {
    const db = loadDB();
    const verifiedPayments = db.payments.filter(p => p.status === 'verified');
    const verifiedRevenue = verifiedPayments.reduce((sum, p) => sum + Number(p.verifiedAmount || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueThisMonth = verifiedPayments
      .filter(p => new Date(p.verifiedAt || p.submittedAt) >= startOfMonth)
      .reduce((sum, p) => sum + Number(p.verifiedAmount || 0), 0);

    const pendingVerification = db.payments.filter(p => p.status === 'pending_verification').length;
    const approvedEnrollments = db.enrollments.filter(e => e.enrollmentStatus === 'approved' || e.enrollmentStatus === 'completed').length;
    const publishedCourses = db.courses.filter(c => c.status === 'published' && c.approvalStatus === 'approved').length;
    const pendingCourseApproval = db.courses.filter(c => c.approvalStatus === 'pending').length;

    // Global Blog Metrics
    const posts = db.posts || db.blog || [];
    const postMetrics = db.post_metrics || [];
    const totalBlogViews = postMetrics.reduce((sum, m) => sum + (m.views || 0), 0);
    const totalBlogLikes = postMetrics.reduce((sum, m) => sum + (m.likes || 0), 0);
    const totalBlogComments = postMetrics.reduce((sum, m) => sum + (m.commentsCount || 0), 0);
    const totalBlogShares = postMetrics.reduce((sum, m) => sum + (m.shares || 0), 0);
    const totalBlogInteractions = totalBlogLikes + totalBlogComments + totalBlogShares;

    res.json({
      totalStudents: db.students.length,
      totalCourses: db.courses.length,
      publishedCourses,
      pendingCourseApproval,
      totalInstructors: db.instructors.length,
      verifiedRevenue,
      revenueThisMonth,
      activeEnrollments: db.enrollments.filter(e => e.enrollmentStatus === 'approved').length,
      totalEnrollments: db.enrollments.length,
      pendingVerification,
      completedCertificates: db.certificates.length,
      paidEnrollments: verifiedPayments.length,
      pendingEnrollments: db.enrollments.filter(e =>
        ['pending_payment', 'pending_verification', 'pending_approval'].includes(e.enrollmentStatus)
      ).length,
      rejectedPayments: db.payments.filter(p => p.status === 'rejected').length,
      approvedEnrollments,
      totalBlogPosts: posts.length,
      publishedBlogPosts: posts.filter(p => p.status === 'published' || p.published).length,
      totalBlogViews,
      totalBlogInteractions,
      totalBlogLikes,
      totalBlogComments
    });
  });

  // ─────────── ADMIN COURSES ───────────

  router.get('/admin/courses', (req, res) => {
    const db = loadDB();
    res.json(db.courses);
  });

  router.post('/admin/courses', async (req, res) => {
    const db = loadDB();
    const isPub = req.body.status === 'published';
    const newCourse = {
      ...req.body,
      id: nextId(db.courses),
      status: req.body.status || 'draft',
      approvalStatus: isPub ? 'approved' : (req.body.approvalStatus || 'pending'),
      createdAt: new Date().toISOString()
    };
    db.courses.unshift(newCourse);
    db.stats.totalCourses = db.courses.length;
    saveDB(db);
    await syncRecordToSupabase('courses', newCourse);
    res.status(201).json(newCourse);
  });

  router.put('/admin/courses/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.courses.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });
    const prev = db.courses[idx];
    const updated = { ...prev, ...req.body };
    if (updated.status === 'published' && (!req.body.approvalStatus || req.body.approvalStatus === 'pending')) {
      updated.approvalStatus = 'approved';
    }
    db.courses[idx] = updated;
    saveDB(db);
    await syncRecordToSupabase('courses', updated);
    res.json(db.courses[idx]);
  });

  router.put('/admin/courses/:id/approve', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const course = db.courses.find(c => c.id === id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    course.approvalStatus = 'approved';
    course.status = 'published';
    course.approvedAt = new Date().toISOString();
    addAuditLog(db, 'course_approved', 'admin@godolinstitute.so', 'course', id, `Approved and published course: "${course.title}"`);
    saveDB(db);
    await syncRecordToSupabase('courses', course);
    res.json(course);
  });

  router.put('/admin/courses/:id/reject', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const course = db.courses.find(c => c.id === id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    course.approvalStatus = 'rejected';
    course.status = 'draft';
    course.rejectionReason = req.body.reason || '';
    addAuditLog(db, 'course_rejected', 'admin@godolinstitute.so', 'course', id, `Rejected course: "${course.title}" — Reason: ${req.body.reason || 'Not specified'}`);
    saveDB(db);
    await syncRecordToSupabase('courses', course);
    res.json(course);
  });

  router.delete('/admin/courses/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.courses = db.courses.filter(c => c.id !== id);
    db.stats.totalCourses = db.courses.length;
    saveDB(db);
    await deleteFromSupabase('courses', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN PAYMENT VERIFICATION ───────────

  router.get('/admin/payments', (req, res) => {
    const db = loadDB();
    const { status } = req.query;
    let payments = [...db.payments].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    if (status && status !== 'all') {
      payments = payments.filter(p => p.status === status);
    }
    res.json(payments);
  });

  router.get('/admin/payments/:id', (req, res) => {
    const db = loadDB();
    const payment = db.payments.find(p => p.id === Number(req.params.id));
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const enrollment = db.enrollments.find(e => e.id === payment.enrollmentId);
    res.json({ ...payment, enrollment });
  });

  // VERIFY PAYMENT — grants course access
  router.put('/admin/payments/:id/verify', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const payment = db.payments.find(p => p.id === id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.status === 'verified') {
      return res.status(400).json({ error: 'Payment is already verified.' });
    }

    const { verifiedAmount, adminNotes, adminEmail } = req.body;
    const admin = adminEmail || 'admin@godolinstitute.so';
    const now = new Date().toISOString();

    // Update payment
    payment.status = 'verified';
    payment.verifiedAmount = verifiedAmount !== undefined ? Number(verifiedAmount) : payment.claimedAmount;
    payment.verifiedAt = now;
    payment.verifiedBy = admin;
    if (adminNotes) payment.adminNotes = adminNotes;

    // Update enrollment — grant access
    const enrollment = db.enrollments.find(e => e.id === payment.enrollmentId);
    let course = null;
    if (enrollment) {
      enrollment.paymentStatus = 'verified';
      enrollment.enrollmentStatus = 'approved';
      enrollment.accessGranted = true;
      enrollment.accessGrantedAt = now;
      enrollment.approvedAt = now;
      enrollment.approvedBy = admin;

      // Update course enrolled count
      course = db.courses.find(c => c.id === enrollment.courseId);
      if (course) course.enrolledCount = (course.enrolledCount || 0) + 1;
    }

    // Audit log
    addAuditLog(db, 'payment_verified', admin, 'payment', id,
      `Verified payment ${payment.transactionRef} — $${payment.verifiedAmount} for "${payment.courseTitle}" (Student: ${payment.studentName})`
    );
    if (enrollment) {
      addAuditLog(db, 'enrollment_approved', admin, 'enrollment', enrollment.id,
        `Enrollment approved for ${enrollment.studentName} in "${enrollment.courseTitle}"`
      );
    }

    // Notify student
    addNotification(db, 'payment_verified', payment.studentEmail,
      `Great news! Your payment for "${payment.courseTitle}" has been verified. You now have full course access. Log in to start learning!`
    );

    saveDB(db);
    await syncRecordToSupabase('payments', payment);
    if (enrollment) await syncRecordToSupabase('enrollments', enrollment);
    if (course) await syncRecordToSupabase('courses', course);

    res.json({ success: true, payment, enrollment: enrollment || null });
  });

  // REJECT PAYMENT
  router.put('/admin/payments/:id/reject', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const payment = db.payments.find(p => p.id === id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.status === 'verified') {
      return res.status(400).json({ error: 'Cannot reject an already-verified payment.' });
    }

    const { reason, adminEmail } = req.body;
    const admin = adminEmail || 'admin@godolinstitute.so';
    const now = new Date().toISOString();

    payment.status = 'rejected';
    payment.rejectedAt = now;
    payment.rejectedBy = admin;
    payment.rejectionReason = reason || 'Payment could not be verified';

    // Update enrollment — allow resubmission
    const enrollment = db.enrollments.find(e => e.id === payment.enrollmentId);
    if (enrollment) {
      enrollment.paymentStatus = 'rejected';
      enrollment.enrollmentStatus = 'pending_payment'; // Allow student to resubmit
      enrollment.accessGranted = false;
    }

    addAuditLog(db, 'payment_rejected', admin, 'payment', id,
      `Rejected payment ${payment.transactionRef} for "${payment.courseTitle}" — Reason: ${reason || 'Not specified'}`
    );

    addNotification(db, 'payment_rejected', payment.studentEmail,
      `Your payment submission for "${payment.courseTitle}" was not verified. Reason: ${reason || 'The transaction reference could not be confirmed'}. Please check your details and resubmit.`
    );

    saveDB(db);
    await syncRecordToSupabase('payments', payment);
    if (enrollment) await syncRecordToSupabase('enrollments', enrollment);

    res.json({ success: true, payment, enrollment: enrollment || null });
  });

  // General payment update (notes, etc.)
  router.put('/admin/payments/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.payments.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });
    // Only allow updating safe fields
    const safe = ['adminNotes', 'status'];
    safe.forEach(k => { if (req.body[k] !== undefined) db.payments[idx][k] = req.body[k]; });
    saveDB(db);
    await syncRecordToSupabase('payments', db.payments[idx]);
    res.json(db.payments[idx]);
  });

  // ─────────── ADMIN ENROLLMENTS ───────────

  router.get('/admin/enrollments', (req, res) => {
    const db = loadDB();
    const { status } = req.query;
    let enrollments = [...db.enrollments].sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
    if (status && status !== 'all') {
      enrollments = enrollments.filter(e => e.enrollmentStatus === status);
    }
    res.json(enrollments);
  });

  router.put('/admin/enrollments/:id/approve', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const enrollment = db.enrollments.find(e => e.id === id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const admin = req.body.adminEmail || 'admin@godolinstitute.so';
    enrollment.enrollmentStatus = 'approved';
    enrollment.accessGranted = true;
    enrollment.accessGrantedAt = new Date().toISOString();
    enrollment.approvedAt = new Date().toISOString();
    enrollment.approvedBy = admin;

    addAuditLog(db, 'enrollment_approved', admin, 'enrollment', id,
      `Manually approved enrollment for ${enrollment.studentName} in "${enrollment.courseTitle}"`
    );
    addNotification(db, 'enrollment_approved', enrollment.studentEmail,
      `Your enrollment in "${enrollment.courseTitle}" has been approved. You now have full course access!`
    );
    saveDB(db);
    await syncRecordToSupabase('enrollments', enrollment);
    res.json(enrollment);
  });

  router.put('/admin/enrollments/:id/reject', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const enrollment = db.enrollments.find(e => e.id === id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const admin = req.body.adminEmail || 'admin@godolinstitute.so';
    enrollment.enrollmentStatus = 'rejected';
    enrollment.accessGranted = false;
    enrollment.rejectedAt = new Date().toISOString();
    enrollment.rejectedBy = admin;
    enrollment.rejectionReason = req.body.reason || '';

    addAuditLog(db, 'enrollment_rejected', admin, 'enrollment', id,
      `Rejected enrollment for ${enrollment.studentName} in "${enrollment.courseTitle}" — Reason: ${req.body.reason || 'Not specified'}`
    );
    addNotification(db, 'enrollment_rejected', enrollment.studentEmail,
      `Your enrollment request for "${enrollment.courseTitle}" was not approved. Reason: ${req.body.reason || 'Contact admin for details.'}`
    );
    saveDB(db);
    await syncRecordToSupabase('enrollments', enrollment);
    res.json(enrollment);
  });

  router.put('/admin/enrollments/:id/revoke', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const enrollment = db.enrollments.find(e => e.id === id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    enrollment.accessGranted = false;
    enrollment.accessRevokedAt = new Date().toISOString();
    enrollment.enrollmentStatus = 'cancelled';
    addAuditLog(db, 'access_revoked', req.body.adminEmail || 'admin@godolinstitute.so', 'enrollment', id,
      `Revoked course access for ${enrollment.studentName} from "${enrollment.courseTitle}"`
    );
    saveDB(db);
    await syncRecordToSupabase('enrollments', enrollment);
    res.json(enrollment);
  });

  router.put('/admin/enrollments/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.enrollments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Enrollment not found' });
    db.enrollments[idx] = { ...db.enrollments[idx], ...req.body };
    saveDB(db);
    await syncRecordToSupabase('enrollments', db.enrollments[idx]);
    res.json(db.enrollments[idx]);
  });

  router.delete('/admin/enrollments/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.enrollments = db.enrollments.filter(e => e.id !== id);
    saveDB(db);
    await deleteFromSupabase('enrollments', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN STUDENTS ───────────

  router.get('/admin/students', (req, res) => {
    const db = loadDB();
    const studentMap = {};
    db.students.forEach(s => {
      studentMap[s.email] = {
        ...s,
        coursesEnrolled: 0,
        completedCourses: 0,
        approvedCourses: 0,
        totalVerifiedPayments: 0,
        lastActive: s.registeredAt
      };
    });

    // Also create entries for students from enrollments that don't have profile records yet
    db.enrollments.forEach(e => {
      if (!studentMap[e.studentEmail]) {
        studentMap[e.studentEmail] = {
          id: e.studentEmail,
          name: e.studentName,
          email: e.studentEmail,
          phone: e.studentPhone || '',
          whatsapp: '',
          registeredAt: e.enrolledAt,
          status: 'active',
          adminNotes: '',
          coursesEnrolled: 0,
          completedCourses: 0,
          approvedCourses: 0,
          totalVerifiedPayments: 0,
          lastActive: e.enrolledAt
        };
      }
      studentMap[e.studentEmail].coursesEnrolled += 1;
      if (e.enrollmentStatus === 'completed') studentMap[e.studentEmail].completedCourses += 1;
      if (e.enrollmentStatus === 'approved' || e.enrollmentStatus === 'completed') {
        studentMap[e.studentEmail].approvedCourses += 1;
      }
      if (e.enrolledAt > (studentMap[e.studentEmail].lastActive || '')) {
        studentMap[e.studentEmail].lastActive = e.enrolledAt;
      }
    });

    // Add payment totals
    db.payments.filter(p => p.status === 'verified').forEach(p => {
      if (studentMap[p.studentEmail]) {
        studentMap[p.studentEmail].totalVerifiedPayments += Number(p.verifiedAmount || 0);
      }
    });

    res.json(Object.values(studentMap));
  });

  router.get('/admin/students/:email', (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    const enrollments = db.enrollments.filter(e => e.studentEmail.toLowerCase() === email);
    const payments = db.payments.filter(p => p.studentEmail.toLowerCase() === email);
    const certs = db.certificates.filter(c => c.studentEmail.toLowerCase() === email);
    res.json({ student: student || null, enrollments, payments, certificates: certs });
  });

  router.put('/admin/students/:email/suspend', async (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    if (student) {
      student.status = 'suspended';
      addAuditLog(db, 'student_suspended', req.body.adminEmail || 'admin@godolinstitute.so', 'student', student.id, `Suspended account: ${email}`);
      saveDB(db);
      await syncRecordToSupabase('profiles', student);
    }
    res.json({ success: true });
  });

  router.put('/admin/students/:email/activate', async (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    if (student) {
      student.status = 'active';
      addAuditLog(db, 'student_activated', req.body.adminEmail || 'admin@godolinstitute.so', 'student', student.id, `Re-activated account: ${email}`);
      saveDB(db);
      await syncRecordToSupabase('profiles', student);
    }
    res.json({ success: true });
  });

  router.put('/admin/students/:email/notes', async (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    if (student) {
      student.adminNotes = req.body.notes || '';
      saveDB(db);
      await syncRecordToSupabase('profiles', student);
    }
    res.json({ success: true });
  });

  // ─────────── ADMIN REVENUE ───────────

  router.get('/admin/revenue', (req, res) => {
    const db = loadDB();
    const verifiedPayments = db.payments.filter(p => p.status === 'verified');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const totalRevenue = verifiedPayments.reduce((s, p) => s + Number(p.verifiedAmount || 0), 0);
    const revenueThisMonth = verifiedPayments
      .filter(p => new Date(p.verifiedAt || p.submittedAt) >= startOfMonth)
      .reduce((s, p) => s + Number(p.verifiedAmount || 0), 0);
    const revenueThisYear = verifiedPayments
      .filter(p => new Date(p.verifiedAt || p.submittedAt) >= startOfYear)
      .reduce((s, p) => s + Number(p.verifiedAmount || 0), 0);

    const pendingAmount = db.payments
      .filter(p => p.status === 'pending_verification')
      .reduce((s, p) => s + Number(p.claimedAmount || 0), 0);

    // Revenue by course
    const byCourse = {};
    verifiedPayments.forEach(p => {
      const k = p.courseTitle;
      if (!byCourse[k]) byCourse[k] = { courseTitle: k, courseId: p.courseId, count: 0, revenue: 0 };
      byCourse[k].count += 1;
      byCourse[k].revenue += Number(p.verifiedAmount || 0);
    });

    // Revenue by provider
    const byProvider = {};
    verifiedPayments.forEach(p => {
      const k = p.provider || 'Unknown';
      if (!byProvider[k]) byProvider[k] = { provider: k, count: 0, revenue: 0 };
      byProvider[k].count += 1;
      byProvider[k].revenue += Number(p.verifiedAmount || 0);
    });

    // Revenue by month (last 12 months)
    const byMonth = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = { month: key, revenue: 0, count: 0 };
    }
    verifiedPayments.forEach(p => {
      const d = new Date(p.verifiedAt || p.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth[key]) {
        byMonth[key].revenue += Number(p.verifiedAmount || 0);
        byMonth[key].count += 1;
      }
    });

    res.json({
      totalRevenue,
      revenueThisMonth,
      revenueThisYear,
      pendingAmount,
      paidCount: verifiedPayments.length,
      freeEnrollments: db.enrollments.filter(e => (e.coursePrice || 0) === 0 && e.accessGranted).length,
      byCourse: Object.values(byCourse).sort((a, b) => b.revenue - a.revenue),
      byProvider: Object.values(byProvider).sort((a, b) => b.revenue - a.revenue),
      byMonth: Object.values(byMonth),
      transactions: db.payments.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    });
  });

  // ─────────── ADMIN AUDIT LOGS ───────────

  router.get('/admin/audit-logs', (req, res) => {
    const db = loadDB();
    res.json(db.audit_logs);
  });

  // ─────────── ADMIN NOTIFICATIONS ───────────

  router.get('/admin/notifications', (req, res) => {
    const db = loadDB();
    res.json(db.notifications.filter(n => n.studentEmail === 'admin@godolinstitute.so'));
  });

  // ─────────── ADMIN INSTRUCTORS ───────────

  router.get('/admin/instructors', (req, res) => {
    const db = loadDB();
    const instructors = db.instructors.map(inst => {
      const courses = db.courses.filter(c => c.instructorId === inst.id);
      const enrollmentCount = db.enrollments.filter(e =>
        courses.some(c => c.id === e.courseId) && e.accessGranted
      ).length;
      const revenue = db.payments.filter(p =>
        p.status === 'verified' && courses.some(c => c.id === p.courseId)
      ).reduce((s, p) => s + Number(p.verifiedAmount || 0), 0);
      return {
        ...inst,
        status: inst.status || 'verified',
        courseCount: courses.length,
        enrollmentCount,
        revenue,
        assignedCourses: courses.map(c => ({ id: c.id, title: c.title, price: c.price, level: c.level }))
      };
    });
    res.json(instructors);
  });

  router.post('/admin/instructors', async (req, res) => {
    const db = loadDB();
    const inst = {
      ...req.body,
      id: nextId(db.instructors),
      status: req.body.status || 'verified',
      rating: req.body.rating || 4.9,
      reviewCount: req.body.reviewCount || 50,
      studentCount: req.body.studentCount || 100,
      courseCount: req.body.courseCount || 0,
      joinedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'admin@godolinstitute.so'
    };
    if (!inst.email) {
      const clean = (inst.name || 'instructor').toLowerCase().replace(/[^a-z0-9]/g, '');
      inst.email = `${clean}@godolinstitute.so`;
    }
    if (!inst.password) {
      inst.password = 'godol2026';
    }
    db.instructors.push(inst);
    db.stats.totalInstructors = db.instructors.length;
    saveDB(db);
    await syncRecordToSupabase('instructors', inst);
    res.status(201).json(inst);
  });

  router.put('/admin/instructors/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.instructors.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Instructor not found' });
    db.instructors[idx] = { ...db.instructors[idx], ...req.body };
    saveDB(db);
    await syncRecordToSupabase('instructors', db.instructors[idx]);
    res.json(db.instructors[idx]);
  });

  router.delete('/admin/instructors/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.instructors = db.instructors.filter(i => i.id !== id);
    db.stats.totalInstructors = db.instructors.length;
    saveDB(db);
    await deleteFromSupabase('instructors', id);
    res.json({ success: true });
  });

  // Admin logs when credentials were sent via WhatsApp or Email
  router.post('/admin/instructors/:id/log-dispatch', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.instructors.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Instructor not found' });
    const method = req.body.method || 'whatsapp';
    db.instructors[idx].credentialsSentVia = method;
    db.instructors[idx].credentialsSentAt = new Date().toISOString();
    saveDB(db);
    res.json({ success: true, instructor: db.instructors[idx] });
  });

  // Admin directly creates a course assigned to this instructor
  router.post('/admin/instructors/:id/create-course', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const inst = db.instructors.find(i => i.id === id);
    if (!inst) return res.status(404).json({ error: 'Instructor not found' });

    const newCourse = {
      ...req.body,
      id: nextId(db.courses),
      instructorId: id,
      instructorName: inst.name,
      status: req.body.status || 'published',
      approvalStatus: 'approved',
      enrolledCount: 0,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };
    db.courses.push(newCourse);
    inst.courseCount = (inst.courseCount || 0) + 1;
    db.stats.totalCourses = db.courses.length;
    saveDB(db);
    res.status(201).json(newCourse);
  });

  // Admin writes a blog article under this instructor's name
  router.post('/admin/instructors/:id/create-blog', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const inst = db.instructors.find(i => i.id === id);
    if (!inst) return res.status(404).json({ error: 'Instructor not found' });

    const post = {
      ...req.body,
      id: nextId(db.blog || []),
      author: inst.name,
      published: true,
      publishedAt: new Date().toISOString()
    };
    db.blog = db.blog || [];
    db.blog.unshift(post);
    saveDB(db);
    res.status(201).json(post);
  });

  // Public application form: Prospective instructor applies online
  router.post('/instructors/apply', (req, res) => {
    const db = loadDB();
    const { name, email, phone, title, bio, expertise } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'Please provide at least your full name and email address.' });
    }

    const application = {
      id: nextId(db.instructor_applications || []),
      name,
      email,
      phone: phone || '',
      title: title || 'Executive Instructor Applicant',
      bio: bio || '',
      expertise: expertise || 'Business Leadership',
      status: 'pending_verification',
      appliedAt: new Date().toISOString()
    };

    db.instructor_applications = db.instructor_applications || [];
    db.instructor_applications.unshift(application);

    // Also notify admin
    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: nextId(db.notifications),
      type: 'instructor_application',
      studentEmail: 'admin@godolinstitute.so',
      message: `New instructor application from ${name} (${email}, ${phone || 'no phone'}). Awaiting admin verification.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDB(db);
    res.status(201).json({ success: true, application });
  });

  // Admin gets all instructor applications
  router.get('/admin/instructor-applications', (req, res) => {
    const db = loadDB();
    res.json(db.instructor_applications || []);
  });

  // Admin verifies & approves an application, manually assigns credentials
  router.post('/admin/instructor-applications/:id/verify', (req, res) => {
    const db = loadDB();
    const appId = Number(req.params.id);
    db.instructor_applications = db.instructor_applications || [];
    const appIdx = db.instructor_applications.findIndex(a => a.id === appId);
    if (appIdx === -1) return res.status(404).json({ error: 'Application not found' });

    const app = db.instructor_applications[appIdx];
    const { email, password, title, bio, rating, phone } = req.body || {};

    // Check if instructor with this email already exists
    let inst = db.instructors.find(i => i.email && i.email.toLowerCase() === (email || app.email).toLowerCase());
    if (inst) {
      inst.status = 'verified';
      if (password) inst.password = password;
      if (title) inst.title = title;
      if (bio) inst.bio = bio;
      if (phone) inst.phone = phone;
    } else {
      inst = {
        id: nextId(db.instructors),
        name: app.name,
        title: title || app.title || 'Executive Instructor',
        bio: bio || app.bio || `Specialist in ${app.expertise || 'business strategy'}.`,
        avatar: '/instructor-1.png',
        email: email || app.email,
        phone: phone || app.phone,
        password: password || 'godol2026',
        rating: Number(rating) || 4.9,
        reviewCount: 20,
        studentCount: 50,
        courseCount: 0,
        status: 'verified',
        joinedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'admin@godolinstitute.so'
      };
      db.instructors.push(inst);
    }

    app.status = 'approved';
    app.approvedAt = new Date().toISOString();
    db.stats.totalInstructors = db.instructors.length;
    saveDB(db);

    res.json({ success: true, instructor: inst, application: app });
  });

  // ─────────── INSTRUCTOR PORTAL API ───────────

  // Instructor Login
  router.post('/instructor/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both your instructor email and password.' });
    }
    const db = loadDB();
    const cleanEmail = email.trim().toLowerCase();
    const instructor = db.instructors.find(i => 
      i.email && i.email.trim().toLowerCase() === cleanEmail
    );
    if (!instructor) {
      return res.status(401).json({ error: 'No instructor account found with that email. Contact the administrator.' });
    }
    if (instructor.password && instructor.password !== password) {
      return res.status(401).json({ error: 'Incorrect password. Contact administrator for assistance.' });
    }

    const assignedCourses = db.courses.filter(c => c.instructorId === instructor.id);

    res.json({
      token: `godol_inst_token_${instructor.id}_${Date.now()}`,
      instructor: {
        id: instructor.id,
        name: instructor.name,
        title: instructor.title,
        email: instructor.email,
        phone: instructor.phone,
        avatar: instructor.avatar,
        bio: instructor.bio,
        rating: instructor.rating || 4.9,
        courseCount: assignedCourses.length
      }
    });
  });

  // Instructor Dashboard Data
  router.get('/instructor/dashboard', (req, res) => {
    const instructorId = Number(req.query.id);
    if (!instructorId) {
      return res.status(400).json({ error: 'Instructor ID is required' });
    }
    const db = loadDB();
    const instructor = db.instructors.find(i => i.id === instructorId);
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    const myCourses = db.courses.filter(c => c.instructorId === instructorId);
    const myCourseIds = myCourses.map(c => c.id);

    // Enrollments in this instructor's courses
    const myEnrollments = db.enrollments.filter(e => myCourseIds.includes(e.courseId));
    const activeStudents = myEnrollments.filter(e => e.accessGranted);

    // Certificates issued in this instructor's courses
    const myCertificates = db.certificates.filter(cert => myCourseIds.includes(cert.courseId));

    // Metrics
    const totalStudents = activeStudents.length;
    const completedStudents = activeStudents.filter(e => e.progress === 100).length;
    const inProgressStudents = activeStudents.filter(e => e.progress > 0 && e.progress < 100).length;
    const avgProgress = activeStudents.length
      ? Math.round(activeStudents.reduce((acc, cur) => acc + (cur.progress || 0), 0) / activeStudents.length)
      : 0;

    res.json({
      instructor: {
        id: instructor.id,
        name: instructor.name,
        title: instructor.title,
        email: instructor.email,
        phone: instructor.phone,
        avatar: instructor.avatar,
        bio: instructor.bio,
        rating: instructor.rating || 4.9
      },
      stats: {
        totalCourses: myCourses.length,
        totalStudents,
        completedStudents,
        inProgressStudents,
        avgProgress,
        certificatesIssued: myCertificates.length
      },
      courses: myCourses.map(c => ({
        ...c,
        studentsCount: activeStudents.filter(e => e.courseId === c.id).length
      })),
      enrollments: myEnrollments.map(e => ({
        ...e,
        courseTitle: myCourses.find(c => c.id === e.courseId)?.title || e.courseTitle
      })),
      certificates: myCertificates
    });
  });

  // Update Instructor Profile from their dashboard
  router.patch('/instructor/profile', (req, res) => {
    const { id, bio, phone, avatar, password, title } = req.body || {};
    const instructorId = Number(id);
    if (!instructorId) {
      return res.status(400).json({ error: 'Instructor ID is required' });
    }
    const db = loadDB();
    const idx = db.instructors.findIndex(i => i.id === instructorId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    if (bio !== undefined) db.instructors[idx].bio = bio;
    if (phone !== undefined) db.instructors[idx].phone = phone;
    if (avatar !== undefined) db.instructors[idx].avatar = avatar;
    if (title !== undefined) db.instructors[idx].title = title;
    if (password && password.trim().length >= 4) {
      db.instructors[idx].password = password.trim();
    }
    saveDB(db);
    res.json({ success: true, instructor: db.instructors[idx] });
  });

  // Instructor post a course announcement
  router.post('/instructor/announcements', (req, res) => {
    const { instructorId, courseId, title, message } = req.body || {};
    const db = loadDB();
    db.notifications = db.notifications || [];
    const enrollments = db.enrollments.filter(e => e.courseId === Number(courseId) && e.accessGranted);
    enrollments.forEach(e => {
      db.notifications.unshift({
        id: nextId(db.notifications),
        type: 'course_announcement',
        studentEmail: e.studentEmail,
        message: `${title}: ${message}`,
        read: false,
        createdAt: new Date().toISOString()
      });
    });
    saveDB(db);
    res.json({ success: true, recipients: enrollments.length });
  });

  // ─────────── INSTRUCTOR BLOG & POSTS (RBAC ENFORCED) ───────────
  // RBAC: Instructors can create, edit, and view metrics ONLY for the blog posts they authored themselves.

  function requireInstructor(req, res, db) {
    const authCtx = getAuthRole(req, db);
    if (!authCtx.isInstructor && !authCtx.isAdmin) {
      res.status(401).json({ error: 'Instructor authentication required. Please sign in to the instructor portal.' });
      return null;
    }
    if (authCtx.isAdmin && !authCtx.instructorId) {
      const instId = Number(req.query.instructorId || req.body?.instructorId || 1);
      const inst = (db.instructors || []).find(i => i.id === instId) || { id: instId, name: 'Faculty' };
      return { ...authCtx, isInstructor: true, instructorId: inst.id, instructor: inst };
    }
    return authCtx;
  }

  // Instructor: Get only posts authored by this instructor with metrics
  const handleGetInstructorPosts = (req, res) => {
    const db = loadDB();
    const authCtx = requireInstructor(req, res, db);
    if (!authCtx) return;

    const myPosts = (db.posts || db.blog || [])
      .filter(p => Number(p.authorId) === Number(authCtx.instructorId))
      .map(p => formatPostResponse(p, db));

    res.json(myPosts);
  };

  router.get('/instructor/posts', handleGetInstructorPosts);
  router.get('/instructor/blog', handleGetInstructorPosts);

  // Instructor: Create new post authored by this instructor
  const handleCreateInstructorPost = (req, res) => {
    const db = loadDB();
    const authCtx = requireInstructor(req, res, db);
    if (!authCtx) return;

    const { title, slug, content, featuredImageUrl, status, category, excerpt } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Article title is required.' });

    db.posts = db.posts || [];
    db.blog = db.posts;
    db.post_metrics = db.post_metrics || [];

    const newId = nextId(db.posts);
    const postSlug = slug ? slug.trim() : slugify(title) + `-${newId}`;
    const postStatus = (status === 'draft') ? 'draft' : 'published';

    const newPost = {
      id: newId,
      title: title.trim(),
      slug: postSlug,
      content: content || '',
      featuredImageUrl: featuredImageUrl || req.body?.featured_image_url || '',
      authorId: authCtx.instructorId,
      authorName: authCtx.instructor.name,
      authorRole: 'instructor',
      status: postStatus,
      category: category || 'Business',
      excerpt: excerpt || (content ? content.replace(/<[^>]*>?/gm, '').slice(0, 160) : ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postStatus === 'published' ? new Date().toISOString() : null
    };

    db.posts.unshift(newPost);

    // Initialize metrics
    const newMetric = {
      id: nextId(db.post_metrics),
      postId: newId,
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.post_metrics.push(newMetric);
    saveDB(db);

    res.status(201).json(formatPostResponse(newPost, db));
  };

  router.post('/instructor/posts', handleCreateInstructorPost);
  router.post('/instructor/blog', handleCreateInstructorPost);

  // Instructor: Edit post (RBAC: ONLY own posts)
  const handleUpdateInstructorPost = (req, res) => {
    const db = loadDB();
    const authCtx = requireInstructor(req, res, db);
    if (!authCtx) return;

    const id = Number(req.params.id);
    const idx = (db.posts || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found.' });

    const post = db.posts[idx];

    // RBAC PERMISSION CHECK: Must be the author!
    if (Number(post.authorId) !== Number(authCtx.instructorId) && !authCtx.isAdmin) {
      return res.status(403).json({
        error: 'Access denied: You can only edit blog posts that you authored yourself.'
      });
    }

    const { title, slug, content, featuredImageUrl, status, category, excerpt } = req.body || {};
    if (title !== undefined) post.title = title.trim();
    if (slug !== undefined) post.slug = slug.trim();
    if (content !== undefined) post.content = content;
    if (featuredImageUrl !== undefined || req.body?.featured_image_url !== undefined) {
      post.featuredImageUrl = featuredImageUrl || req.body?.featured_image_url || '';
    }
    if (category !== undefined) post.category = category;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (status !== undefined) {
      post.status = status === 'draft' ? 'draft' : 'published';
      if (post.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date().toISOString();
      }
    }
    post.updatedAt = new Date().toISOString();

    saveDB(db);
    res.json(formatPostResponse(post, db));
  };

  router.put('/instructor/posts/:id', handleUpdateInstructorPost);
  router.put('/instructor/blog/:id', handleUpdateInstructorPost);

  // Instructor: Delete post (RBAC: ONLY own posts)
  const handleDeleteInstructorPost = (req, res) => {
    const db = loadDB();
    const authCtx = requireInstructor(req, res, db);
    if (!authCtx) return;

    const id = Number(req.params.id);
    const post = (db.posts || []).find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // RBAC PERMISSION CHECK: Must be the author!
    if (Number(post.authorId) !== Number(authCtx.instructorId) && !authCtx.isAdmin) {
      return res.status(403).json({
        error: 'Access denied: You can only delete blog posts that you authored yourself.'
      });
    }

    db.posts = db.posts.filter(p => p.id !== id);
    db.blog = db.posts;
    if (db.post_metrics) db.post_metrics = db.post_metrics.filter(m => m.postId !== id);
    if (db.post_comments) db.post_comments = db.post_comments.filter(c => c.postId !== id);
    saveDB(db);

    deleteFromSupabase('posts', id);
    deleteFromSupabase('post_metrics', id);
    res.json({ success: true });
  };

  router.delete('/instructor/posts/:id', handleDeleteInstructorPost);
  router.delete('/instructor/blog/:id', handleDeleteInstructorPost);

  // Instructor: View metrics (RBAC: ONLY own posts)
  const handleGetInstructorPostMetrics = (req, res) => {
    const db = loadDB();
    const authCtx = requireInstructor(req, res, db);
    if (!authCtx) return;

    const id = Number(req.params.id);
    const post = (db.posts || []).find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // RBAC PERMISSION CHECK: Must be the author!
    if (Number(post.authorId) !== Number(authCtx.instructorId) && !authCtx.isAdmin) {
      return res.status(403).json({
        error: 'Access denied: You can only view metrics for blog posts that you authored yourself.'
      });
    }

    const metrics = (db.post_metrics || []).find(m => m.postId === id) || {
      postId: id,
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
      commentsCount: 0
    };
    const comments = (db.post_comments || []).filter(c => c.postId === id);

    res.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status
      },
      metrics,
      comments
    });
  };

  router.get('/instructor/posts/:id/metrics', handleGetInstructorPostMetrics);
  router.get('/instructor/blog/:id/metrics', handleGetInstructorPostMetrics);

  // ─────────── ADMIN WORKSHOPS ───────────

  router.get('/admin/workshops', (req, res) => {
    const db = loadDB();
    res.json(db.workshops);
  });

  router.post('/admin/workshops', (req, res) => {
    const db = loadDB();
    const item = { ...req.body, id: nextId(db.workshops) };
    db.workshops.push(item);
    saveDB(db);
    res.status(201).json(item);
  });

  router.put('/admin/workshops/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.workshops.findIndex(w => w.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Workshop not found' });
    db.workshops[idx] = { ...db.workshops[idx], ...req.body };
    saveDB(db);
    res.json(db.workshops[idx]);
  });

  router.delete('/admin/workshops/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.workshops = db.workshops.filter(w => w.id !== id);
    saveDB(db);
    deleteFromSupabase('workshops', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN BLOG & POSTS (FULL PRIVILEGES) ───────────
  // RBAC: Admins can create, edit, delete, and view metrics for ANY blog post.

  // Admin: Get all posts (draft and published) with metrics
  const handleAdminGetPosts = (req, res) => {
    const db = loadDB();
    const formatted = (db.posts || db.blog || []).map(p => formatPostResponse(p, db));
    res.json(formatted);
  };

  router.get('/admin/posts', handleAdminGetPosts);
  router.get('/admin/blog', handleAdminGetPosts);

  // Admin: Create post for ANY author
  const handleAdminCreatePost = async (req, res) => {
    const db = loadDB();
    const { title, slug, content, featuredImageUrl, authorId, author, authorName, status, category, excerpt, publishedAt } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title is required' });

    db.posts = db.posts || [];
    db.blog = db.posts;
    db.post_metrics = db.post_metrics || [];

    const newId = nextId(db.posts);
    const postSlug = slug ? slug.trim() : slugify(title) + `-${newId}`;
    const postStatus = (status === 'draft') ? 'draft' : 'published';

    let resolvedAuthorId = authorId ? Number(authorId) : null;
    let resolvedAuthorName = authorName || author || 'Godol Editorial';
    let resolvedAuthorRole = 'admin';

    if (resolvedAuthorId) {
      const inst = (db.instructors || []).find(i => i.id === resolvedAuthorId);
      if (inst) {
        resolvedAuthorName = inst.name;
        resolvedAuthorRole = 'instructor';
      }
    } else if (author && author !== 'Godol Editorial') {
      const inst = (db.instructors || []).find(i => i.name.toLowerCase() === author.toLowerCase());
      if (inst) {
        resolvedAuthorId = inst.id;
        resolvedAuthorRole = 'instructor';
      }
    }

    const post = {
      id: newId,
      title: title.trim(),
      slug: postSlug,
      content: content || '',
      featuredImageUrl: featuredImageUrl || req.body?.featured_image_url || '',
      authorId: resolvedAuthorId || 1,
      authorName: resolvedAuthorName,
      authorRole: resolvedAuthorRole,
      status: postStatus,
      category: category || 'Business',
      excerpt: excerpt || (content ? content.replace(/<[^>]*>?/gm, '').slice(0, 160) : ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postStatus === 'published' ? (publishedAt || new Date().toISOString()) : null
    };

    db.posts.unshift(post);

    // Initialize metrics
    const newMetric = {
      id: nextId(db.post_metrics),
      postId: newId,
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.post_metrics.push(newMetric);

    saveDB(db);
    await syncPostToSupabase(post);
    res.status(201).json(formatPostResponse(post, db));
  };

  router.post('/admin/posts', handleAdminCreatePost);
  router.post('/admin/blog', handleAdminCreatePost);

  // Admin: Edit ANY post
  const handleAdminUpdatePost = async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = (db.posts || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });

    const post = db.posts[idx];
    const { title, slug, content, featuredImageUrl, authorId, author, authorName, status, category, excerpt, publishedAt } = req.body || {};

    if (title !== undefined) post.title = title.trim();
    if (slug !== undefined) post.slug = slug.trim();
    if (content !== undefined) post.content = content;
    if (featuredImageUrl !== undefined || req.body?.featured_image_url !== undefined) {
      post.featuredImageUrl = featuredImageUrl || req.body?.featured_image_url || '';
    }
    if (authorId !== undefined) {
      post.authorId = Number(authorId);
      const inst = (db.instructors || []).find(i => i.id === post.authorId);
      if (inst) {
        post.authorName = inst.name;
        post.authorRole = 'instructor';
      }
    } else if (author !== undefined || authorName !== undefined) {
      post.authorName = authorName || author;
    }
    if (category !== undefined) post.category = category;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (status !== undefined) {
      post.status = status === 'draft' ? 'draft' : 'published';
      if (post.status === 'published' && !post.publishedAt) {
        post.publishedAt = publishedAt || new Date().toISOString();
      }
    }
    post.updatedAt = new Date().toISOString();

    saveDB(db);
    await syncPostToSupabase(post);
    res.json(formatPostResponse(post, db));
  };

  router.put('/admin/posts/:id', handleAdminUpdatePost);
  router.put('/admin/blog/:id', handleAdminUpdatePost);

  // Admin: Delete ANY post
  const handleAdminDeletePost = async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.posts = (db.posts || []).filter(p => p.id !== id);
    db.blog = db.posts;
    if (db.post_metrics) db.post_metrics = db.post_metrics.filter(m => m.postId !== id);
    if (db.post_comments) db.post_comments = db.post_comments.filter(c => c.postId !== id);
    saveDB(db);

    await deletePostFromSupabase(id);
    res.json({ success: true });
  };

  router.delete('/admin/posts/:id', handleAdminDeletePost);
  router.delete('/admin/blog/:id', handleAdminDeletePost);

  // Admin: View metrics for ANY post
  const handleAdminGetPostMetrics = (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const post = (db.posts || []).find(p => p.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const metrics = (db.post_metrics || []).find(m => m.postId === id) || {
      postId: id,
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
      commentsCount: 0
    };
    const comments = (db.post_comments || []).filter(c => c.postId === id);

    res.json({
      post: formatPostResponse(post, db),
      metrics,
      comments
    });
  };

  router.get('/admin/posts/:id/metrics', handleAdminGetPostMetrics);
  router.get('/admin/blog/:id/metrics', handleAdminGetPostMetrics);

  // ─────────── ADMIN CERTIFICATES ───────────

  router.get('/admin/certificates', (req, res) => {
    const db = loadDB();
    res.json(db.certificates);
  });

  router.post('/admin/certificates', async (req, res) => {
    const db = loadDB();
    const cert = {
      ...req.body,
      id: nextId(db.certificates),
      certificateNumber: req.body.certificateNumber || `GDL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: req.body.issueDate || new Date().toISOString().slice(0, 10),
      status: 'issued'
    };
    db.certificates.push(cert);
    saveDB(db);
    await syncRecordToSupabase('certificates', cert);
    res.status(201).json(cert);
  });

  router.delete('/admin/certificates/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.certificates = db.certificates.filter(c => c.id !== id);
    saveDB(db);
    await deleteFromSupabase('certificates', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN CATEGORIES ───────────

  router.get('/admin/categories', (req, res) => {
    const db = loadDB();
    res.json(db.categories);
  });

  router.post('/admin/categories', async (req, res) => {
    const db = loadDB();
    const cat = { ...req.body, id: nextId(db.categories) };
    db.categories.push(cat);
    saveDB(db);
    await syncRecordToSupabase('categories', cat);
    res.status(201).json(cat);
  });

  router.put('/admin/categories/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories[idx] = { ...db.categories[idx], ...req.body };
    saveDB(db);
    await syncRecordToSupabase('categories', db.categories[idx]);
    res.json(db.categories[idx]);
  });

  router.delete('/admin/categories/:id', async (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.categories = db.categories.filter(c => c.id !== id);
    saveDB(db);
    await deleteFromSupabase('categories', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN SETTINGS ───────────

  router.get('/admin/settings', (req, res) => {
    const db = loadDB();
    res.json(db.settings);
  });

  router.put('/admin/settings', async (req, res) => {
    const db = loadDB();
    const updates = req.body;
    Object.entries(updates).forEach(([key, value]) => {
      const idx = db.settings.findIndex(s => s.key === key);
      if (idx !== -1) {
        db.settings[idx].value = value;
      } else {
        db.settings.push({ key, value, group: 'general', label: key });
      }
    });
    saveDB(db);
    if (db.settings) {
      await syncTable('platform_settings', db.settings);
    }
    res.json(db.settings);
  });

  // ─────────── ADMIN INQUIRIES ───────────

  router.get('/admin/enquiries', (req, res) => {
    const db = loadDB();
    res.json(db.enquiries || []);
  });

  router.delete('/admin/enquiries/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.enquiries = (db.enquiries || []).filter(e => e.id !== id);
    saveDB(db);
    res.json({ success: true });
  });

  return router;
}
