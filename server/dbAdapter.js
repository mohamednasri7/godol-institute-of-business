import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from './data.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// ────────── LOCAL STORAGE HELPERS ──────────

export function loadLocalDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(initialData));
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (!data.students) data.students = initialData.students || [];
    if (!data.audit_logs) data.audit_logs = initialData.audit_logs || [];
    if (!data.notifications) data.notifications = initialData.notifications || [];
    return data;
  } catch (err) {
    return JSON.parse(JSON.stringify(initialData));
  }
}

export function saveLocalDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ────────── SUPABASE REPOSITORY LAYER ──────────

export const db = {
  isSupabase: () => isSupabaseConfigured,

  // --- COURSES ---
  async getCourses() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('courses').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) return data;
    }
    const local = loadLocalDB();
    return local.courses;
  },

  async getCourseById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('courses').select('*').or(`id.eq.${Number(id) || 0},slug.eq.${id}`).single();
      if (!error && data) return data;
    }
    const local = loadLocalDB();
    return local.courses.find(c => c.id === Number(id) || c.slug === id);
  },

  async createCourse(courseData) {
    const local = loadLocalDB();
    const newId = local.courses.length > 0 ? Math.max(...local.courses.map(c => c.id)) + 1 : 1;
    const course = {
      ...courseData,
      id: newId,
      status: courseData.status || 'draft',
      approvalStatus: courseData.approvalStatus || 'pending',
      createdAt: new Date().toISOString()
    };
    local.courses.unshift(course);
    local.stats.totalCourses = local.courses.length;
    saveLocalDB(local);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('courses').insert([course]);
      } catch (err) {
        console.error('Supabase createCourse error:', err);
      }
    }
    return course;
  },

  async updateCourse(id, updates) {
    const local = loadLocalDB();
    const idx = local.courses.findIndex(c => c.id === Number(id));
    if (idx !== -1) {
      local.courses[idx] = { ...local.courses[idx], ...updates };
      saveLocalDB(local);
    }
    if (isSupabaseConfigured) {
      try {
        await supabase.from('courses').update(updates).eq('id', Number(id));
      } catch (err) {
        console.error('Supabase updateCourse error:', err);
      }
    }
    return idx !== -1 ? local.courses[idx] : null;
  },

  // --- ENROLLMENTS ---
  async getEnrollments(email) {
    if (isSupabaseConfigured) {
      let query = supabase.from('enrollments').select('*').order('enrolled_at', { ascending: false });
      if (email) query = query.eq('student_email', email.toLowerCase());
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const local = loadLocalDB();
    if (email) {
      return local.enrollments.filter(e => e.studentEmail?.toLowerCase() === email.toLowerCase());
    }
    return local.enrollments;
  },

  async createEnrollment(enrollment) {
    const local = loadLocalDB();
    local.enrollments.push(enrollment);
    saveLocalDB(local);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('enrollments').insert([{
          id: enrollment.id,
          student_name: enrollment.studentName,
          student_email: enrollment.studentEmail,
          student_phone: enrollment.studentPhone,
          course_id: enrollment.courseId,
          course_title: enrollment.courseTitle,
          course_price: enrollment.coursePrice,
          payment_status: enrollment.paymentStatus,
          enrollment_status: enrollment.enrollmentStatus,
          access_granted: enrollment.accessGranted,
          access_granted_at: enrollment.accessGrantedAt,
          progress: enrollment.progress || 0,
          enrolled_at: enrollment.enrolledAt,
          approved_at: enrollment.approvedAt,
          approved_by: enrollment.approvedBy
        }]);
      } catch (err) {
        console.error('Supabase createEnrollment error:', err);
      }
    }
    return enrollment;
  },

  // --- PAYMENTS ---
  async getPayments(status) {
    if (isSupabaseConfigured) {
      let query = supabase.from('payments').select('*').order('submitted_at', { ascending: false });
      if (status && status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const local = loadLocalDB();
    let payments = [...local.payments].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    if (status && status !== 'all') {
      payments = payments.filter(p => p.status === status);
    }
    return payments;
  },

  async createPayment(payment) {
    const local = loadLocalDB();
    local.payments.push(payment);
    saveLocalDB(local);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('payments').insert([{
          id: payment.id,
          enrollment_id: payment.enrollmentId,
          course_id: payment.courseId,
          course_title: payment.courseTitle,
          course_price: payment.coursePrice,
          student_name: payment.studentName,
          student_email: payment.studentEmail,
          student_phone: payment.studentPhone,
          student_whatsapp: payment.studentWhatsapp,
          provider: payment.provider,
          sender_phone: payment.senderPhone,
          transaction_ref: payment.transactionRef,
          claimed_amount: payment.claimedAmount,
          verified_amount: payment.verifiedAmount,
          currency: payment.currency,
          status: payment.status,
          payment_date: payment.paymentDate,
          submitted_at: payment.submittedAt,
          admin_notes: payment.adminNotes,
          receipt_url: payment.receiptUrl
        }]);
      } catch (err) {
        console.error('Supabase createPayment error:', err);
      }
    }
    return payment;
  },

  // --- PROFILES / STUDENTS ---
  async getStudents() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data;
    }
    const local = loadLocalDB();
    return local.students;
  },

  async createOrUpdateStudent(student) {
    const local = loadLocalDB();
    let existing = local.students.find(s => s.email.toLowerCase() === student.email.toLowerCase());
    if (!existing) {
      local.students.push(student);
    } else {
      Object.assign(existing, student);
    }
    saveLocalDB(local);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').upsert([{
          email: student.email.toLowerCase(),
          name: student.name,
          phone: student.phone,
          whatsapp: student.whatsapp,
          status: student.status || 'active',
          admin_notes: student.adminNotes || ''
        }], { onConflict: 'email' });
      } catch (err) {
        console.error('Supabase upsert profile error:', err);
      }
    }
    return student;
  },

  // --- PLATFORM SETTINGS ---
  async getSettings() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('platform_settings').select('*');
      if (!error && data && data.length > 0) return data;
    }
    const local = loadLocalDB();
    return local.settings;
  },

  async updateSettings(updates) {
    const local = loadLocalDB();
    Object.entries(updates).forEach(([key, value]) => {
      const idx = local.settings.findIndex(s => s.key === key);
      if (idx !== -1) {
        local.settings[idx].value = value;
      } else {
        local.settings.push({ key, value, group: 'general', label: key });
      }
    });
    saveLocalDB(local);

    if (isSupabaseConfigured) {
      try {
        const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
        await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' });
      } catch (err) {
        console.error('Supabase updateSettings error:', err);
      }
    }
    return local.settings;
  },

  // --- AUDIT LOGS ---
  async addAuditLog(action, adminEmail, targetType, targetId, details) {
    const local = loadLocalDB();
    const log = {
      id: local.audit_logs.length > 0 ? Math.max(...local.audit_logs.map(x => x.id)) + 1 : 1,
      action,
      adminEmail,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    local.audit_logs.unshift(log);
    if (local.audit_logs.length > 500) local.audit_logs = local.audit_logs.slice(0, 500);
    saveLocalDB(local);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('audit_logs').insert([{
          action,
          admin_email: adminEmail,
          target_type: targetType,
          target_id: targetId,
          details,
          timestamp: log.timestamp
        }]);
      } catch (err) {
        console.error('Supabase addAuditLog error:', err);
      }
    }
    return log;
  }
};
