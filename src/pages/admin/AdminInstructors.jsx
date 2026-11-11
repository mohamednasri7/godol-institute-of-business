import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Upload, Check,
  Key, Eye, EyeOff, Copy, ExternalLink, ShieldCheck, Mail, Phone,
  Sparkles, Users, BookOpen, MessageSquare, Send, CheckCircle2,
  FileText, Award, AlertCircle, Clock, ChevronRight, UserCheck,
  RefreshCw
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { auth } from '../../lib/auth';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

const defaultInst = {
  name: '',
  title: '',
  bio: '',
  email: '',
  phone: '',
  password: 'godol2026',
  rating: 4.9,
  reviewCount: 50,
  studentCount: 150,
  courseCount: 1,
  avatar: '/instructor-1.png',
  status: 'verified'
};

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('instructors'); // 'instructors' | 'applications'
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultInst);
  const [editingId, setEditingId] = useState(null);

  // Quick Add Course Modal for an Instructor
  const [courseModalInstructor, setCourseModalInstructor] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    price: 99,
    categoryName: 'Business Strategy',
    level: 'Intermediate',
    durationHours: 6,
    lessonCount: 8,
    thumbnail: '/course-marketing.png'
  });

  // Quick Add Blog Modal for an Instructor
  const [blogModalInstructor, setBlogModalInstructor] = useState(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Business Growth',
    readTime: '4 min read'
  });

  // Application Verify Modal
  const [verifyingApp, setVerifyingApp] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    email: '',
    password: 'godol2026',
    title: 'Senior Faculty Instructor',
    rating: 4.9
  });

  // UI state
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [instRes, appRes, catRes] = await Promise.allSettled([
        apiFetch('/api/admin/instructors'),
        apiFetch('/api/admin/instructor-applications'),
        apiFetch('/api/categories')
      ]);

      if (instRes.status === 'fulfilled' && Array.isArray(instRes.value)) {
        setInstructors(instRes.value);
      } else if (instRes.status === 'fulfilled' && instRes.value && Array.isArray(instRes.value.instructors)) {
        setInstructors(instRes.value.instructors);
      } else {
        console.warn('Instructors fetch returned non-array:', instRes);
        setInstructors([]);
        setErrorMessage("Couldn't load instructors list. Please retry.");
      }

      setApplications(appRes.status === 'fulfilled' && Array.isArray(appRes.value) ? appRes.value : []);
      setCategories(catRes.status === 'fulfilled' && Array.isArray(catRes.value) ? catRes.value : []);
    } catch (err) {
      console.error('loadAll error:', err);
      setErrorMessage(err.message || "Couldn't load instructors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Instant Realtime sync: updates instructor roster live
  useRealtimeSync(['instructors', 'categories'], loadAll);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...defaultInst,
      password: `godol${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inst) => {
    setEditingId(inst.id);
    setFormData({
      ...inst,
      password: inst.password || 'godol2026'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete instructor? This removes their profile and portal access.')) {
      await apiFetch(`/api/admin/instructors/${id}`, { method: 'DELETE' });
      showToast('Instructor removed.');
      loadAll();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/admin/instructors/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      showToast('Instructor updated.');
    } else {
      await apiFetch('/api/admin/instructors', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      showToast('Instructor registered and login created.');
    }
    setIsModalOpen(false);
    loadAll();
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyCredentials = (inst) => {
    const text = `*Godol Institute of Business — Faculty Portal Access*\n` +
      `Instructor: ${inst.name}\n` +
      `Portal Link: ${window.location.origin}/instructor/login\n` +
      `Username / Email: ${inst.email}\n` +
      `Password: ${inst.password || 'godol2026'}\n\n` +
      `Please log in to manage your course syllabus, view enrolled students, and send announcements.`;
    navigator.clipboard.writeText(text);
    setCopiedId(inst.id);
    showToast('Credentials copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getWhatsAppMessage = (inst) => {
    return encodeURIComponent(
      `Salaam Alaykum ${inst.name},\n\n` +
      `Your faculty profile at *Godol Institute of Business* has been approved and activated! 🎉\n\n` +
      `Here are your official credentials to access the Faculty Portal:\n` +
      `• *Portal Link:* ${window.location.origin}/instructor/login\n` +
      `• *Login Email:* ${inst.email}\n` +
      `• *Password:* ${inst.password || 'godol2026'}\n\n` +
      `You can now view your assigned cohorts, monitor student course progress, and publish announcements.\n\n` +
      `Best regards,\nGodol Institute Academic Office`
    );
  };

  const handleSendWhatsApp = async (inst) => {
    const phone = (inst.phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('This instructor has no phone number entered. Please edit their profile to add a WhatsApp number.');
      return;
    }
    await apiFetch(`/api/admin/instructors/${inst.id}/log-dispatch`, {
      method: 'POST',
      body: JSON.stringify({ method: 'whatsapp' })
    }).catch(() => {});
    loadAll();

    const url = `https://wa.me/${phone}?text=${getWhatsAppMessage(inst)}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp with pre-filled credentials...');
  };

  const handleSendEmail = async (inst) => {
    if (!inst.email) {
      alert('This instructor has no email address.');
      return;
    }
    await apiFetch(`/api/admin/instructors/${inst.id}/log-dispatch`, {
      method: 'POST',
      body: JSON.stringify({ method: 'email' })
    }).catch(() => {});
    loadAll();

    const subject = encodeURIComponent('Your Godol Institute Faculty Portal Credentials');
    const body = encodeURIComponent(
      `Dear ${inst.name},\n\n` +
      `Welcome to Godol Institute of Business.\n\n` +
      `Your instructor account has been created and verified. You can log in to your dashboard to manage your courses and students:\n\n` +
      `Portal Link: ${window.location.origin}/instructor/login\n` +
      `Email: ${inst.email}\n` +
      `Password: ${inst.password || 'godol2026'}\n\n` +
      `Warm regards,\n` +
      `Godol Institute Academic Directorate`
    );
    window.open(`mailto:${inst.email}?subject=${subject}&body=${body}`, '_blank');
    showToast('Launching email client with formatted credentials...');
  };

  const handleLoginAsInstructor = (inst) => {
    auth.setInstructor(inst);
    window.open('/instructor/dashboard', '_blank');
  };

  // Open Verify Modal for Application
  const handleOpenVerify = (app) => {
    setVerifyingApp(app);
    const clean = (app.name || 'instructor').toLowerCase().replace(/[^a-z0-9]/g, '');
    setVerifyForm({
      email: app.email || `${clean}@godolinstitute.so`,
      password: `godol${Math.floor(1000 + Math.random() * 9000)}`,
      title: app.title || 'Executive Instructor',
      rating: 4.9,
      phone: app.phone || ''
    });
  };

  const handleApproveApplication = async (e) => {
    e.preventDefault();
    if (!verifyingApp) return;

    try {
      const res = await apiFetch(`/api/admin/instructor-applications/${verifyingApp.id}/verify`, {
        method: 'POST',
        body: JSON.stringify(verifyForm)
      });
      showToast(`Approved ${verifyingApp.name}! Login credentials created.`);
      setVerifyingApp(null);
      loadAll();

      // If phone exists, offer to send on WhatsApp immediately
      if (verifyForm.phone) {
        if (confirm(`Would you like to send login credentials to ${verifyingApp.name} via WhatsApp now?`)) {
          const inst = res.instructor;
          handleSendWhatsApp(inst);
        }
      }
    } catch (err) {
      alert(err.message || 'Error approving application');
    }
  };

  // Save new course for instructor
  const handleCreateCourseForInstructor = async (e) => {
    e.preventDefault();
    if (!courseModalInstructor) return;
    try {
      await apiFetch(`/api/admin/instructors/${courseModalInstructor.id}/create-course`, {
        method: 'POST',
        body: JSON.stringify(courseForm)
      });
      showToast(`Course "${courseForm.title}" created for ${courseModalInstructor.name}!`);
      setCourseModalInstructor(null);
      loadAll();
    } catch (err) {
      alert(err.message || 'Error creating course');
    }
  };

  // Save new blog article for instructor
  const handleCreateBlogForInstructor = async (e) => {
    e.preventDefault();
    if (!blogModalInstructor) return;
    try {
      await apiFetch(`/api/admin/instructors/${blogModalInstructor.id}/create-blog`, {
        method: 'POST',
        body: JSON.stringify(blogForm)
      });
      showToast(`Article "${blogForm.title}" published under ${blogModalInstructor.name}!`);
      setBlogModalInstructor(null);
      loadAll();
    } catch (err) {
      alert(err.message || 'Error publishing blog');
    }
  };

  const safeInstructors = Array.isArray(instructors) ? instructors : [];
  const safeApplications = Array.isArray(applications) ? applications : [];

  const pendingApps = safeApplications.filter(a => a && a.status === 'pending_verification');

  const filtered = safeInstructors.filter(i => {
    if (!i) return false;
    const matchesSearch =
      !searchFilter ||
      i.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.phone?.includes(searchFilter);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && (i.status === 'verified' || i.status === 'active' || !i.status)) ||
      (statusFilter === 'suspended' && i.status === 'suspended');
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Faculty & Instructors" subtitle="Central instructor administration, credential generation, and profile management">
      <div className="space-y-6">
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Error Alert with Retry */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-red-900 text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="font-semibold truncate">{errorMessage}</span>
            </div>
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium">Total Instructors</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-serif font-bold text-gray-900">{safeInstructors.length}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Faculty profiles</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium">Active & Verified</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-serif font-bold text-gray-900">
              {safeInstructors.filter(i => i.status !== 'suspended').length}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Active on website</div>
          </div>

          <div
            onClick={() => setActiveTab('applications')}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-amber-400 transition-colors relative"
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium">Pending Applications</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-serif font-bold text-gray-900">{pendingApps.length}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
              {pendingApps.length > 0 ? 'Review & issue login →' : 'All reviewed'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium">Assigned Courses</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-serif font-bold text-gray-900">
              {safeInstructors.reduce((acc, i) => acc + (i.courseCount || 0), 0)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Curriculum taught</div>
          </div>
        </div>

        {/* Tab & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          {/* Tab Selector */}
          <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('instructors')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'instructors'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Registered Faculty ({instructors.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'applications'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Applications</span>
              {pendingApps.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingApps.length}
                </span>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/instructor/login"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Open instructor sign-in page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Faculty Portal</span>
            </Link>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Instructor Manually</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ALL REGISTERED INSTRUCTORS */}
        {activeTab === 'instructors' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, title, email, or WhatsApp..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="all">All Instructors</option>
                  <option value="verified">Verified & Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Instructor Cards / Skeleton / Empty State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-white border border-gray-200 rounded-3xl p-6 h-72 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 bg-gray-200 rounded-full"></div>
                      <div className="h-5 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-200"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-100 rounded-xl"></div>
                    <div className="h-8 bg-gray-100 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-1">
                  {searchFilter ? 'No matching instructors found' : 'No instructors registered yet'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  {searchFilter
                    ? 'Try refining your search keyword or clearing the status filter.'
                    : 'Get started by creating your first faculty member. They will receive automated credentials for the Faculty Portal.'}
                </p>
                {searchFilter ? (
                  <button
                    onClick={() => { setSearchFilter(''); setStatusFilter('all'); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    <span>Clear Search</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Instructor Manually</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((inst) => (
                <div
                  key={inst.id}
                  className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Top Status & Verification Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inst.status === 'suspended'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>{inst.status === 'suspended' ? 'Suspended' : 'Verified Faculty'}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(inst)}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit profile & credentials"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inst.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Delete instructor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Instructor Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={inst.avatar || '/instructor-1.png'}
                        alt={inst.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-sm flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-base text-gray-900 truncate">{inst.name}</h4>
                        <p className="text-xs text-primary font-medium truncate">{inst.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                          <span>★ {inst.rating || 4.9}</span>
                          <span>•</span>
                          <span>👥 {inst.studentCount || 0} students</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                      {inst.bio}
                    </p>

                    {/* Assigned Courses List */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1.5">
                        <span>Assigned Courses ({inst.courseCount || 0})</span>
                        <button
                          onClick={() => {
                            setCourseModalInstructor(inst);
                            setCourseForm(f => ({ ...f, categoryName: categories[0]?.name || 'Business Strategy' }));
                          }}
                          className="text-primary hover:underline font-bold text-[10px]"
                        >
                          + Add Course
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {inst.assignedCourses && inst.assignedCourses.length > 0 ? (
                          inst.assignedCourses.map(c => (
                            <Link
                              key={c.id}
                              href={`/courses/${c.id}`}
                              target="_blank"
                              className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 truncate max-w-[170px] inline-block font-medium"
                              title={c.title}
                            >
                              {c.title}
                            </Link>
                          ))
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No courses linked yet</span>
                        )}
                      </div>
                    </div>

                    {/* Credentials & Dispatch Box (Primary Feature Requested by User) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Key className="w-3.5 h-3.5 text-amber-500" />
                          <span>Login Credentials</span>
                        </span>
                        <button
                          onClick={() => handleLoginAsInstructor(inst)}
                          className="text-[10px] text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                          title="Open instructor dashboard directly"
                        >
                          <span>Login As</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Email:</span>
                        <span className="font-mono text-gray-900 font-bold truncate max-w-[175px]" title={inst.email}>
                          {inst.email}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900 font-bold">
                            {showPasswords[inst.id] ? (inst.password || 'godol2026') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(inst.id)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200"
                            title={showPasswords[inst.id] ? 'Hide' : 'Show'}
                          >
                            {showPasswords[inst.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Dispatch Actions: WhatsApp & Email buttons */}
                      <div className="pt-2 border-t border-slate-200/70 flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendWhatsApp(inst)}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                          title="Send credentials directly to instructor on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleSendEmail(inst)}
                          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                          title="Send credentials to instructor via Email"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </button>

                        <button
                          onClick={() => copyCredentials(inst)}
                          className="p-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-[11px] font-medium"
                          title="Copy all credentials"
                        >
                          {copiedId === inst.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {inst.credentialsSentVia && (
                        <div className="text-[10px] text-gray-400 text-center pt-0.5">
                          ✓ Sent via {inst.credentialsSentVia}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Add Course & Add Blog Shortcuts */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setCourseModalInstructor(inst);
                        setCourseForm(f => ({ ...f, categoryName: categories[0]?.name || 'Business Strategy' }));
                      }}
                      className="text-primary hover:text-primary/80 font-bold inline-flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post Course</span>
                    </button>

                    <button
                      onClick={() => setBlogModalInstructor(inst)}
                      className="text-gray-600 hover:text-gray-900 font-bold inline-flex items-center gap-1 text-[11px]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Write Article</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* TAB 2: INSTRUCTOR APPLICATIONS & APPROVAL WORKFLOW */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">
                  Prospective Instructor Applications
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Review applicant profiles, verify qualifications, and issue login credentials
                </p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-gray-700">No applications received yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  When practitioners submit an application to teach at Godol Institute, they will appear here for admin verification.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3">Applicant Name</th>
                      <th className="pb-3">Contact (Email & WhatsApp)</th>
                      <th className="pb-3">Expertise / Specialization</th>
                      <th className="pb-3">Date Applied</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 font-bold text-gray-900">
                          <div>{app.name}</div>
                          <div className="text-[11px] text-gray-500 font-normal">{app.title}</div>
                        </td>
                        <td className="py-3.5 text-gray-700">
                          <div className="font-mono text-[11px]">{app.email}</div>
                          <div className="text-emerald-700 text-[11px] font-semibold">{app.phone || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 text-gray-800">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            {app.expertise || 'Business'}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-500 text-[11px]">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3.5">
                          {app.status === 'approved' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              Approved & Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {app.status === 'approved' ? (
                            <span className="text-gray-400 text-xs">Credentials Issued</span>
                          ) : (
                            <button
                              onClick={() => handleOpenVerify(app)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Verify & Issue Login</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ────────────────── MODAL 1: ADD / EDIT INSTRUCTOR ────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-xl font-bold mb-1 text-gray-900">
              {editingId ? 'Edit Instructor Profile & Credentials' : 'Add Instructor Manually'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Full control of instructor public identity, bio, and portal credentials
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Photo Upload & Preview */}
              <div>
                <label className="block font-semibold mb-1.5 text-gray-700">Instructor Photo / Portrait</label>
                <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                  <img
                    src={formData.avatar || '/instructor-1.png'}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, avatar: '/instructor-1.png' }))}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        Preset 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, avatar: '/instructor-2.png' }))}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        Preset 2
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste external photo URL (https://...)"
                      value={formData.avatar || ''}
                      onChange={(e) => setFormData(f => ({ ...f, avatar: e.target.value }))}
                      className="w-full h-8 px-2.5 text-[11px] bg-white rounded-lg border border-gray-200 outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    placeholder="e.g. Dr. Ahmed Hassan"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Title / Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    placeholder="e.g. Lead Marketing Director"
                  />
                </div>
              </div>

              {/* Credentials Box (Manual creation requested by user) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Portal Login Credentials</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, password: `godol${Math.floor(1000 + Math.random() * 9000)}` }))}
                    className="text-[10px] text-amber-800 font-bold underline hover:text-amber-950"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Portal Login Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary font-mono text-xs"
                      placeholder="faculty@godolinstitute.so"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Portal Password *</label>
                    <input
                      type="text"
                      required
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary font-mono text-xs"
                      placeholder="e.g. godol2026"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Phone */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  WhatsApp / Phone Number <span className="text-gray-400 font-normal">(Used to dispatch credentials)</span>
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  placeholder="+252 61 000 0000"
                />
              </div>

              {/* Biography */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Professional Biography *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                  placeholder="Summarize their business experience, education, and achievements in East Africa..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Rating (1–5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Students Taught</label>
                  <input
                    type="number"
                    value={formData.studentCount || 0}
                    onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Profile Status</label>
                  <select
                    value={formData.status || 'verified'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  >
                    <option value="verified">Verified & Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-sm"
                >
                  Save Profile & Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL 2: VERIFY APPLICATION & ISSUE LOGIN ────────────────── */}
      {verifyingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setVerifyingApp(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-emerald-600">
              <UserCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Verification & Approval</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">
              Approve {verifyingApp.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Set their login credentials to activate their instructor profile and portal access
            </p>

            <form onSubmit={handleApproveApplication} className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-[11px] text-gray-600">
                <div><strong>Expertise:</strong> {verifyingApp.expertise}</div>
                <div><strong>WhatsApp:</strong> {verifyingApp.phone || 'None provided'}</div>
                <div><strong>Bio Notes:</strong> {verifyingApp.bio || 'None'}</div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Assigned Portal Email *</label>
                <input
                  type="email"
                  required
                  value={verifyForm.email}
                  onChange={(e) => setVerifyForm({ ...verifyForm, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Assigned Password *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={verifyForm.password}
                    onChange={(e) => setVerifyForm({ ...verifyForm, password: e.target.value })}
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setVerifyForm(f => ({ ...f, password: `godol${Math.floor(1000 + Math.random() * 9000)}` }))}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-[11px]"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Official Faculty Title</label>
                <input
                  type="text"
                  value={verifyForm.title}
                  onChange={(e) => setVerifyForm({ ...verifyForm, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  placeholder="e.g. Senior Faculty Instructor"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyingApp(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Issue Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL 3: POST COURSE FOR INSTRUCTOR ────────────────── */}
      {courseModalInstructor && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCourseModalInstructor(null);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCourseModalInstructor(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1 text-primary">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Curriculum Authoring</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">
              Add Course for {courseModalInstructor.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Directly publish a course taught by this instructor
            </p>

            <form onSubmit={handleCreateCourseForInstructor} className="space-y-4 text-xs" onKeyDown={(e) => e.stopPropagation()}>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strategic Management & East African Markets"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Course Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Comprehensive description of what students will master..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Category</label>
                  <select
                    value={courseForm.categoryName}
                    onChange={(e) => setCourseForm({ ...courseForm, categoryName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Course Price ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Difficulty Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced / Executive">Advanced / Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Duration (Hours)</label>
                  <input
                    type="number"
                    value={courseForm.durationHours}
                    onChange={(e) => setCourseForm({ ...courseForm, durationHours: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCourseModalInstructor(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-sm"
                >
                  Publish Course Under Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL 4: WRITE BLOG FOR INSTRUCTOR ────────────────── */}
      {blogModalInstructor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setBlogModalInstructor(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1 text-blue-600">
              <FileText className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Faculty Article</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">
              Write Article as {blogModalInstructor.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Publish an industry article authored by this instructor
            </p>

            <form onSubmit={handleCreateBlogForInstructor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigating Inflation & Supply Chain Dynamics in Somalia"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Short Excerpt *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief preview of the insight..."
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Article Body / Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Full analysis and takeaways..."
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none font-sans"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlogModalInstructor(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
