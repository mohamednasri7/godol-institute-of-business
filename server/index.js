import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from './data.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(initialData));
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Ensure new arrays exist for upgraded schema
    if (!data.students) data.students = initialData.students || [];
    if (!data.audit_logs) data.audit_logs = initialData.audit_logs || [];
    if (!data.notifications) data.notifications = initialData.notifications || [];
    if (!data.enquiries) data.enquiries = [];
    if (!data.newsletter_subscribers) data.newsletter_subscribers = [];
    return data;
  } catch (err) {
    return JSON.parse(JSON.stringify(initialData));
  }
}

// Whitelist of valid PostgreSQL columns per table to avoid PostgREST schema cache errors
const TABLE_COLUMNS = {
  instructors: ['id', 'name', 'title', 'bio', 'avatar', 'email', 'phone', 'rating', 'review_count', 'student_count', 'course_count', 'status', 'joined_at'],
  courses: ['id', 'title', 'slug', 'description', 'price', 'level', 'duration_hours', 'lesson_count', 'enrolled_count', 'rating', 'featured', 'badge', 'thumbnail', 'instructor_id', 'instructor_name', 'category_id', 'category_name', 'status', 'approval_status', 'what_you_learn', 'requirements', 'sections', 'created_at'],
  categories: ['id', 'name', 'icon', 'color', 'course_count'],
  enrollments: ['id', 'student_name', 'student_email', 'student_phone', 'course_id', 'course_title', 'course_price', 'payment_id', 'payment_status', 'enrollment_status', 'access_granted', 'access_granted_at', 'progress', 'enrolled_at', 'approved_at', 'approved_by', 'rejection_reason'],
  payments: ['id', 'enrollment_id', 'course_id', 'course_title', 'course_price', 'student_name', 'student_email', 'student_phone', 'student_whatsapp', 'provider', 'sender_phone', 'transaction_ref', 'claimed_amount', 'verified_amount', 'currency', 'status', 'payment_date', 'submitted_at', 'verified_at', 'verified_by', 'rejected_at', 'rejected_by', 'rejection_reason', 'admin_notes', 'receipt_url'],
  certificates: ['id', 'student_name', 'student_email', 'course_id', 'course_title', 'instructor_name', 'certificate_number', 'status', 'issue_date'],
  workshops: ['id', 'title', 'slug', 'description', 'location', 'date', 'duration_hours', 'capacity', 'enrolled_count', 'price', 'status', 'featured', 'tag', 'seats'],
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
  blog: 'blog_posts',
  students: 'profiles',
  audit_logs: 'audit_logs',
  notifications: 'notifications'
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
      console.error(`Supabase sync error for ${tableName}:`, error.message);
    }
  } catch (err) {
    console.error(`Supabase sync error for ${tableName}:`, err.message);
  }
}

// Delete item from Supabase
async function deleteFromSupabase(tableName, id) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) console.error(`Supabase delete error for ${tableName} id=${id}:`, error.message);
  } catch (err) {
    console.error(`Supabase delete error for ${tableName} id=${id}:`, err.message);
  }
}

let lastSyncTime = 0;
let isSyncingNow = false;

// Pull latest data from Supabase into local DB
export async function pullFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const db = loadDB();
    let updated = false;

    for (const [localKey, supabaseTable] of Object.entries(LOCAL_TO_SUPABASE)) {
      const { data, error } = await supabase.from(supabaseTable).select('*');
      if (!error && Array.isArray(data)) {
        db[localKey] = data.map(rowToCamel);
        updated = true;
      }
    }

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
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
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
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');

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

  // Blog
  router.get('/blog', (req, res) => {
    const db = loadDB();
    res.json(db.blog.filter(p => p.published));
  });

  router.get('/blog/:id', (req, res) => {
    const db = loadDB();
    const post = db.blog.find(p => p.id === Number(req.params.id) || p.slug === req.params.id);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json(post);
  });

  // Stats
  router.get('/stats', (req, res) => {
    const db = loadDB();
    res.json(db.stats);
  });

  // ─────────── STUDENT AUTH & REGISTRATION ───────────

  router.post('/auth/register', (req, res) => {
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

  router.put('/auth/student', (req, res) => {
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
    res.json(student);
  });

  // ─────────── CHECKOUT / ENROLLMENT INITIATION ───────────
  // Step 1: Student initiates enrollment → creates pending_payment enrollment
  router.post('/checkout', (req, res) => {
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
    res.status(201).json({ existing: false, enrollment });
  });

  // ─────────── PAYMENT SUBMISSION ───────────
  // Step 2: Student submits payment transaction details
  router.post('/payments/submit', (req, res) => {
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
      accreditation: 'Mogadishu & East Africa Enterprise Registry'
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

  // ─────────── ADMIN MIDDLEWARE ───────────

  router.all('/admin/*', (req, res, next) => {
    // Simple token check — in production use proper JWT
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (token && token !== 'godol_admin_mock_token_2026') {
      // Allow all requests with any non-empty token for now
    }
    next();
  });

  // ─────────── ADMIN AUTH ───────────

  router.get('/admin/me', (req, res) => {
    res.json({ email: 'admin@godolinstitute.so', name: 'Godol Administrator', role: 'admin' });
  });

  router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    return res.json({
      token: 'godol_admin_mock_token_2026',
      email,
      name: 'Godol Administrator'
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
      approvedEnrollments
    });
  });

  // ─────────── ADMIN COURSES ───────────

  router.get('/admin/courses', (req, res) => {
    const db = loadDB();
    res.json(db.courses);
  });

  router.post('/admin/courses', (req, res) => {
    const db = loadDB();
    const newCourse = {
      ...req.body,
      id: nextId(db.courses),
      status: req.body.status || 'draft',
      approvalStatus: req.body.approvalStatus || 'pending',
      createdAt: new Date().toISOString()
    };
    db.courses.unshift(newCourse);
    db.stats.totalCourses = db.courses.length;
    saveDB(db);
    res.status(201).json(newCourse);
  });

  router.put('/admin/courses/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.courses.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });
    const prev = db.courses[idx];
    db.courses[idx] = { ...prev, ...req.body };
    saveDB(db);
    res.json(db.courses[idx]);
  });

  router.put('/admin/courses/:id/approve', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const course = db.courses.find(c => c.id === id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    course.approvalStatus = 'approved';
    course.status = 'published';
    course.approvedAt = new Date().toISOString();
    addAuditLog(db, 'course_approved', 'admin@godolinstitute.so', 'course', id, `Approved and published course: "${course.title}"`);
    saveDB(db);
    res.json(course);
  });

  router.put('/admin/courses/:id/reject', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const course = db.courses.find(c => c.id === id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    course.approvalStatus = 'rejected';
    course.status = 'draft';
    course.rejectionReason = req.body.reason || '';
    addAuditLog(db, 'course_rejected', 'admin@godolinstitute.so', 'course', id, `Rejected course: "${course.title}" — Reason: ${req.body.reason || 'Not specified'}`);
    saveDB(db);
    res.json(course);
  });

  router.delete('/admin/courses/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.courses = db.courses.filter(c => c.id !== id);
    db.stats.totalCourses = db.courses.length;
    saveDB(db);
    deleteFromSupabase('courses', id);
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
  router.put('/admin/payments/:id/verify', (req, res) => {
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
    if (enrollment) {
      enrollment.paymentStatus = 'verified';
      enrollment.enrollmentStatus = 'approved';
      enrollment.accessGranted = true;
      enrollment.accessGrantedAt = now;
      enrollment.approvedAt = now;
      enrollment.approvedBy = admin;

      // Update course enrolled count
      const course = db.courses.find(c => c.id === enrollment.courseId);
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
    res.json({ success: true, payment, enrollment: enrollment || null });
  });

  // REJECT PAYMENT
  router.put('/admin/payments/:id/reject', (req, res) => {
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
    res.json({ success: true, payment, enrollment: enrollment || null });
  });

  // General payment update (notes, etc.)
  router.put('/admin/payments/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.payments.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });
    // Only allow updating safe fields
    const safe = ['adminNotes', 'status'];
    safe.forEach(k => { if (req.body[k] !== undefined) db.payments[idx][k] = req.body[k]; });
    saveDB(db);
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

  router.put('/admin/enrollments/:id/approve', (req, res) => {
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
    res.json(enrollment);
  });

  router.put('/admin/enrollments/:id/reject', (req, res) => {
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
    res.json(enrollment);
  });

  router.put('/admin/enrollments/:id/revoke', (req, res) => {
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
    res.json(enrollment);
  });

  router.put('/admin/enrollments/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.enrollments.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Enrollment not found' });
    db.enrollments[idx] = { ...db.enrollments[idx], ...req.body };
    saveDB(db);
    res.json(db.enrollments[idx]);
  });

  router.delete('/admin/enrollments/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.enrollments = db.enrollments.filter(e => e.id !== id);
    saveDB(db);
    deleteFromSupabase('enrollments', id);
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

  router.put('/admin/students/:email/suspend', (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    if (student) {
      student.status = 'suspended';
      addAuditLog(db, 'student_suspended', req.body.adminEmail || 'admin@godolinstitute.so', 'student', student.id, `Suspended account: ${email}`);
      saveDB(db);
    }
    res.json({ success: true });
  });

  router.put('/admin/students/:email/activate', (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    if (student) {
      student.status = 'active';
      addAuditLog(db, 'student_activated', req.body.adminEmail || 'admin@godolinstitute.so', 'student', student.id, `Re-activated account: ${email}`);
      saveDB(db);
    }
    res.json({ success: true });
  });

  router.put('/admin/students/:email/notes', (req, res) => {
    const db = loadDB();
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const student = db.students.find(s => s.email.toLowerCase() === email);
    if (student) {
      student.adminNotes = req.body.notes || '';
      saveDB(db);
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
      return { ...inst, courseCount: courses.length, enrollmentCount, revenue };
    });
    res.json(instructors);
  });

  router.post('/admin/instructors', (req, res) => {
    const db = loadDB();
    const inst = { ...req.body, id: nextId(db.instructors), status: 'active', joinedAt: new Date().toISOString() };
    db.instructors.push(inst);
    db.stats.totalInstructors = db.instructors.length;
    saveDB(db);
    res.status(201).json(inst);
  });

  router.put('/admin/instructors/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.instructors.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Instructor not found' });
    db.instructors[idx] = { ...db.instructors[idx], ...req.body };
    saveDB(db);
    res.json(db.instructors[idx]);
  });

  router.delete('/admin/instructors/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.instructors = db.instructors.filter(i => i.id !== id);
    db.stats.totalInstructors = db.instructors.length;
    saveDB(db);
    deleteFromSupabase('instructors', id);
    res.json({ success: true });
  });

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

  // ─────────── ADMIN BLOG ───────────

  router.get('/admin/blog', (req, res) => {
    const db = loadDB();
    res.json(db.blog);
  });

  router.post('/admin/blog', (req, res) => {
    const db = loadDB();
    const post = { ...req.body, id: nextId(db.blog), publishedAt: new Date().toISOString().slice(0, 10) };
    db.blog.unshift(post);
    saveDB(db);
    res.status(201).json(post);
  });

  router.put('/admin/blog/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.blog.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    db.blog[idx] = { ...db.blog[idx], ...req.body };
    saveDB(db);
    res.json(db.blog[idx]);
  });

  router.delete('/admin/blog/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.blog = db.blog.filter(p => p.id !== id);
    saveDB(db);
    deleteFromSupabase('blog_posts', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN CERTIFICATES ───────────

  router.get('/admin/certificates', (req, res) => {
    const db = loadDB();
    res.json(db.certificates);
  });

  router.post('/admin/certificates', (req, res) => {
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
    res.status(201).json(cert);
  });

  router.delete('/admin/certificates/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.certificates = db.certificates.filter(c => c.id !== id);
    saveDB(db);
    deleteFromSupabase('certificates', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN CATEGORIES ───────────

  router.get('/admin/categories', (req, res) => {
    const db = loadDB();
    res.json(db.categories);
  });

  router.post('/admin/categories', (req, res) => {
    const db = loadDB();
    const cat = { ...req.body, id: nextId(db.categories) };
    db.categories.push(cat);
    saveDB(db);
    res.status(201).json(cat);
  });

  router.put('/admin/categories/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Category not found' });
    db.categories[idx] = { ...db.categories[idx], ...req.body };
    saveDB(db);
    res.json(db.categories[idx]);
  });

  router.delete('/admin/categories/:id', (req, res) => {
    const db = loadDB();
    const id = Number(req.params.id);
    db.categories = db.categories.filter(c => c.id !== id);
    saveDB(db);
    deleteFromSupabase('categories', id);
    res.json({ success: true });
  });

  // ─────────── ADMIN SETTINGS ───────────

  router.get('/admin/settings', (req, res) => {
    const db = loadDB();
    res.json(db.settings);
  });

  router.put('/admin/settings', (req, res) => {
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
