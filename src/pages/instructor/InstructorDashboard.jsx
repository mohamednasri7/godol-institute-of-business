import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import {
  BookOpen, Users, Award, TrendingUp, LogOut, ExternalLink,
  Search, Mail, Phone, MessageSquare, Send, CheckCircle,
  Clock, Shield, Settings, Key, Check, AlertCircle, Sparkles,
  ChevronRight, Calendar, FileText, Plus, Edit2, Trash2, Eye,
  ThumbsUp, Share2, X, BarChart2, BarChart3, Filter, Upload,
  Image as ImageIcon, Bold, Italic, Heading2, Heading3, List,
  ListOrdered, Quote, Code, Link2, Minus, EyeOff, ArrowUpRight
} from 'lucide-react';
import { auth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import ThemeToggleSwitch from '../../components/ThemeToggleSwitch';

export default function InstructorDashboard() {
  const [, setLocation] = useLocation();
  const [instructor, setInstructor] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Search in students
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    bio: '',
    phone: '',
    title: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Announcement state
  const [announcementForm, setAnnouncementForm] = useState({
    courseId: '',
    title: '',
    message: ''
  });
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  // My Articles / Blog Management state
  const [myArticles, setMyArticles] = useState([]);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState('all'); // 'all', 'published', 'draft'
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('30d'); // '7d', '30d', 'all'
  const [selectedArticleAnalytics, setSelectedArticleAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'

  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    category: 'Business Strategy',
    status: 'published',
    featuredImageUrl: '',
    excerpt: '',
    content: '',
    readTime: '5 min read'
  });
  const [articleSuccess, setArticleSuccess] = useState('');
  const [articleError, setArticleError] = useState('');
  const [isSavingArticle, setIsSavingArticle] = useState(false);

  const contentInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const current = auth.getInstructor();
    if (!current) {
      setLocation('/instructor/login');
      return;
    }
    setInstructor(current);
    loadDashboard(current.id);
  }, [setLocation]);

  const loadDashboard = (id) => {
    setIsLoading(true);
    apiFetch(`/api/instructor/dashboard?id=${id}`)
      .then((res) => {
        setData(res);
        if (res.instructor) {
          setProfileForm((prev) => ({
            ...prev,
            bio: res.instructor.bio || '',
            phone: res.instructor.phone || '',
            title: res.instructor.title || ''
          }));
        }
        if (res.courses && res.courses.length > 0) {
          setAnnouncementForm((prev) => ({
            ...prev,
            courseId: res.courses[0].id
          }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));

    loadArticles(id);
  };

  const loadArticles = (id) => {
    apiFetch(`/api/instructor/posts?instructorId=${id}`)
      .then((data) => setMyArticles(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load instructor articles:', err));
  };

  const handleSignOut = () => {
    auth.logoutInstructor();
    setLocation('/instructor/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveSuccess('');
    setProfileSaveError('');

    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileSaveError('New passwords do not match.');
        return;
      }
      if (profileForm.newPassword.length < 4) {
        setProfileSaveError('Password must be at least 4 characters long.');
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        id: instructor.id,
        bio: profileForm.bio,
        phone: profileForm.phone,
        title: profileForm.title
      };
      if (profileForm.newPassword) {
        payload.password = profileForm.newPassword;
      }

      const res = await apiFetch('/api/instructor/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setProfileSaveSuccess('Profile and settings updated successfully!');
        setProfileForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
        // Refresh local instructor cache
        const updated = { ...instructor, ...res.instructor };
        auth.setInstructor(updated);
        setInstructor(updated);
        loadDashboard(instructor.id);
      }
    } catch (err) {
      setProfileSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementSuccess('');
    setAnnouncementError('');

    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementError('Please provide both a title and message.');
      return;
    }

    setIsSendingAnnouncement(true);
    try {
      const res = await apiFetch('/api/instructor/announcements', {
        method: 'POST',
        body: JSON.stringify({
          instructorId: instructor.id,
          courseId: announcementForm.courseId,
          title: announcementForm.title,
          message: announcementForm.message
        })
      });

      if (res.success) {
        setAnnouncementSuccess(`Announcement delivered to ${res.recipients} enrolled student(s)!`);
        setAnnouncementForm((prev) => ({ ...prev, title: '', message: '' }));
      }
    } catch (err) {
      setAnnouncementError(err.message || 'Failed to broadcast announcement.');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  // ─────────── BLOG & ARTICLE MANAGEMENT (RBAC ENFORCED) ───────────
  
  // Text editor formatting tools
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const el = contentInputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setArticleForm(prev => ({ ...prev, content: newContent }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  // Image upload with FileReader preview
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setArticleError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setArticleError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    setArticleError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setArticleForm(prev => ({
        ...prev,
        featuredImageUrl: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Title change with auto-slug generator
  const handleArticleTitleChange = (val) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setArticleForm(prev => {
      const isAutoSlug = !prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return {
        ...prev,
        title: val,
        slug: isAutoSlug ? autoSlug : prev.slug
      };
    });
  };

  const handleOpenNewArticle = () => {
    setEditingArticleId(null);
    setEditorMode('write');
    setArticleForm({
      title: '',
      slug: '',
      category: 'Business Strategy',
      status: 'published',
      featuredImageUrl: '',
      excerpt: '',
      content: '',
      readTime: '5 min read'
    });
    setArticleError('');
    setArticleSuccess('');
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (post) => {
    setEditingArticleId(post.id);
    setEditorMode('write');
    setArticleForm({
      title: post.title || '',
      slug: post.slug || '',
      category: post.category || 'Business Strategy',
      status: post.status || (post.published ? 'published' : 'draft'),
      featuredImageUrl: post.featuredImageUrl || post.featured_image_url || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      readTime: post.readTime || '5 min read'
    });
    setArticleError('');
    setArticleSuccess('');
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = async (e, forcedStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setArticleError('');
    setArticleSuccess('');

    if (!articleForm.title.trim()) {
      setArticleError('Please enter an article title.');
      return;
    }

    const payloadStatus = forcedStatus || articleForm.status || 'published';
    const payload = {
      ...articleForm,
      status: payloadStatus,
      instructorId: instructor.id
    };

    setIsSavingArticle(true);
    try {
      if (editingArticleId) {
        await apiFetch(`/api/instructor/posts/${editingArticleId}?instructorId=${instructor.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setArticleSuccess(payloadStatus === 'published' ? 'Article updated and published live!' : 'Article updated and saved as draft.');
      } else {
        await apiFetch(`/api/instructor/posts?instructorId=${instructor.id}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setArticleSuccess(payloadStatus === 'published' ? 'New article published live on the Godol blog!' : 'New article saved to drafts.');
      }
      setIsArticleModalOpen(false);
      loadArticles(instructor.id);
    } catch (err) {
      setArticleError(err.message || 'Failed to save article.');
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleToggleArticleStatus = async (post) => {
    const isPub = post.status === 'published' || post.published;
    const newStatus = isPub ? 'draft' : 'published';
    try {
      await apiFetch(`/api/instructor/posts/${post.id}?instructorId=${instructor.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          instructorId: instructor.id
        })
      });
      loadArticles(instructor.id);
    } catch (err) {
      console.error('Failed to toggle article status:', err);
    }
  };

  const handleViewArticleAnalytics = async (post) => {
    setIsLoadingAnalytics(true);
    setSelectedArticleAnalytics(post);
    try {
      const data = await apiFetch(`/api/instructor/posts/${post.id}/metrics?instructorId=${instructor.id}`);
      setSelectedArticleAnalytics(data);
    } catch (err) {
      console.error('Failed to load article metrics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    try {
      await apiFetch(`/api/instructor/posts/${id}?instructorId=${instructor.id}`, {
        method: 'DELETE'
      });
      loadArticles(instructor.id);
    } catch (err) {
      alert(err.message || 'Failed to delete article.');
    }
  };

  // Filtered articles list based on status, category, search
  const filteredArticles = useMemo(() => {
    return myArticles.filter(art => {
      const isPub = art.status === 'published' || art.published === true;
      if (articleStatusFilter === 'published' && !isPub) return false;
      if (articleStatusFilter === 'draft' && isPub) return false;

      if (articleCategoryFilter !== 'all' && art.category !== articleCategoryFilter) return false;

      if (articleSearchQuery.trim()) {
        const q = articleSearchQuery.toLowerCase();
        const matchTitle = (art.title || '').toLowerCase().includes(q);
        const matchExcerpt = (art.excerpt || '').toLowerCase().includes(q);
        const matchContent = (art.content || '').toLowerCase().includes(q);
        if (!matchTitle && !matchExcerpt && !matchContent) return false;
      }

      return true;
    });
  }, [myArticles, articleStatusFilter, articleCategoryFilter, articleSearchQuery]);

  // Performance Trend Data over Time
  const performanceTrendData = useMemo(() => {
    const count = analyticsTimeRange === '7d' ? 7 : analyticsTimeRange === '30d' ? 14 : 10;
    const now = new Date();
    const dataPoints = [];
    const totalViews = myArticles.reduce((s, a) => s + (a.metrics?.views || 0), 0);
    const totalLikes = myArticles.reduce((s, a) => s + (a.metrics?.likes || 0), 0);
    const totalComments = myArticles.reduce((s, a) => s + (a.metrics?.commentsCount || 0), 0);

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - (analyticsTimeRange === '7d' ? i : i * 2));
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const factor = (count - i) / count;
      const wave = Math.sin((i / count) * Math.PI) * 0.15;
      const pointViews = Math.max(0, Math.round(totalViews * (factor * 0.65 + 0.35 + wave)));
      const pointInteractions = Math.max(0, Math.round((totalLikes + totalComments) * (factor * 0.7 + 0.3)));

      dataPoints.push({
        date: label,
        views: pointViews,
        interactions: pointInteractions
      });
    }
    return dataPoints;
  }, [myArticles, analyticsTimeRange]);

  if (!instructor) return null;

  const courses = data?.courses || [];
  const enrollments = data?.enrollments || [];
  const stats = data?.stats || {
    totalCourses: 0,
    totalStudents: 0,
    completedStudents: 0,
    inProgressStudents: 0,
    avgProgress: 0,
    certificatesIssued: 0
  };

  // Filter students
  const filteredStudents = enrollments.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourseFilter === 'all' || e.courseId === Number(selectedCourseFilter);
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Banner */}
      <div className="bg-[hsl(215,72%,18%)] pt-28 pb-10 text-white shadow-md">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <img
                src={instructor.avatar || '/instructor-1.png'}
                alt={instructor.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/40 shadow-inner"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Faculty Instructor
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
                  {instructor.name}
                </h1>
                <p className="text-white/70 text-xs mt-0.5">{instructor.title || 'Faculty Member'}</p>
                <p className="text-white/50 text-[11px] font-mono mt-0.5">{instructor.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleSwitch isTransparent={true} />
              <Link
                href={`/instructors/${instructor.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <span>View Public Bio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Assigned Courses</span>
                <BookOpen className="w-4 h-4 text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.totalCourses}</div>
              <div className="text-[11px] text-white/50 mt-1">Active curriculum</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Enrolled Students</span>
                <Users className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.totalStudents}</div>
              <div className="text-[11px] text-white/50 mt-1">Learning under your courses</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Average Progress</span>
                <TrendingUp className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.avgProgress}%</div>
              <div className="text-[11px] text-white/50 mt-1">Overall completion rate</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Graduates & Certs</span>
                <Award className="w-4 h-4 text-purple-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.completedStudents}</div>
              <div className="text-[11px] text-white/50 mt-1">Verified completions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Tabs */}
      <div className="container mx-auto px-4 md:px-6 -mt-4">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 inline-flex flex-wrap gap-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'courses', label: `My Courses (${courses.length})`, icon: BookOpen },
            { id: 'students', label: `My Students (${enrollments.length})`, icon: Users },
            { id: 'articles', label: `My Articles (${myArticles.length})`, icon: FileText },
            { id: 'announcements', label: 'Announcements', icon: MessageSquare },
            { id: 'profile', label: 'Settings & Password', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs animate-pulse">
            Loading your instructor workspace...
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Courses Overview */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-gray-900">Your Assigned Courses</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Courses you are currently leading</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('courses')}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      View all courses <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {courses.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-700">No courses assigned yet</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        The administrator will link you to courses from the Admin Panel.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map((c) => (
                        <div
                          key={c.id}
                          className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span className="font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px]">
                                {c.categoryName || 'Business Program'}
                              </span>
                              <span>${c.price || 0}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2">{c.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                              {c.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              👥 {c.studentsCount || 0} Students
                            </span>
                            <Link
                              href={`/courses/${c.id}`}
                              target="_blank"
                              className="text-primary font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                            >
                              <span>Preview</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Students Table */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-gray-900">Recent Student Enrollments</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Students studying in your cohorts</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      All students ({enrollments.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {enrollments.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-700">No student enrollments yet</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        When students enroll in your courses, they will automatically appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                            <th className="pb-3">Student</th>
                            <th className="pb-3">Course</th>
                            <th className="pb-3">Progress</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {enrollments.slice(0, 5).map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-3 font-semibold text-gray-900">
                                <div>{e.studentName || 'Student'}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{e.studentEmail}</div>
                              </td>
                              <td className="py-3 text-gray-700 font-medium">{e.courseTitle}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-primary h-full rounded-full"
                                      style={{ width: `${e.progress || 0}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[11px] text-gray-700">
                                    {e.progress || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                {e.progress === 100 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                    Graduated
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                    In Progress
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                {e.studentPhone && (
                                  <a
                                    href={`https://wa.me/${e.studentPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg inline-block mr-1"
                                    title="WhatsApp student"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <a
                                  href={`mailto:${e.studentEmail}`}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg inline-block"
                                  title="Email student"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MY COURSES TAB */}
            {activeTab === 'courses' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-gray-900">My Teaching Courses</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    All courses configured with your instructor profile
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-bold text-sm text-gray-700">No courses linked</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Courses assigned to you in the Admin Panel will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {course.categoryName || 'Business'}
                            </span>
                            <span className="font-bold text-gray-900">${course.price}</span>
                          </div>
                          <h4 className="font-serif font-bold text-base text-gray-900 mb-2">
                            {course.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                            <span>👥 {course.enrolledCount ?? course.studentsCount ?? 0} {(course.enrolledCount ?? course.studentsCount ?? 0) === 1 ? 'Enrolled Student' : 'Enrolled Students'}</span>
                            <span>⏱ {Number(course.durationHours) > 0 ? `${course.durationHours}h course` : 'Self-paced'}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/courses/${course.slug || course.id}/learn`}
                              target="_blank"
                              className="flex-1 text-center py-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-amber-700 dark:text-accent font-bold text-xs transition-colors inline-flex items-center justify-center gap-1 border border-accent/30"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Learning Player</span>
                            </Link>
                            <Link
                              href={`/courses/${course.id}`}
                              target="_blank"
                              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1"
                              title="View Catalog Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => {
                                setAnnouncementForm((prev) => ({ ...prev, courseId: course.id }));
                                setActiveTab('announcements');
                              }}
                              className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                              title="Send announcement to this course"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY STUDENTS TAB */}
            {activeTab === 'students' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">Enrolled Students</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Monitor student progress and contact learners
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary w-44"
                      />
                    </div>

                    <select
                      value={selectedCourseFilter}
                      onChange={(e) => setSelectedCourseFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary"
                    >
                      <option value="all">All Courses</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-700">No students found</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {searchQuery
                        ? 'Try modifying your search filter.'
                        : 'No students have enrolled in this selection yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                          <th className="pb-3">Student Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Course</th>
                          <th className="pb-3">Course Progress</th>
                          <th className="pb-3">Certificate</th>
                          <th className="pb-3 text-right">Direct Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 font-bold text-gray-900">
                              {e.studentName || 'Student'}
                            </td>
                            <td className="py-3.5 text-gray-500 font-mono text-[11px]">
                              {e.studentEmail}
                            </td>
                            <td className="py-3.5 text-gray-800 font-medium">{e.courseTitle}</td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      e.progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${e.progress || 0}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[11px] text-gray-700">
                                  {e.progress || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              {e.progress === 100 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <Award className="w-3 h-3" />
                                  <span>Issued</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  In coursework
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {e.studentPhone && (
                                  <a
                                    href={`https://wa.me/${e.studentPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="WhatsApp student"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <a
                                  href={`mailto:${e.studentEmail}`}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Send Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'announcements' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm max-w-2xl">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-gray-900">Broadcast Announcement</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Send a class notification to all active students in your course
                  </p>
                </div>

                {announcementSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{announcementSuccess}</span>
                  </div>
                )}
                {announcementError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{announcementError}</span>
                  </div>
                )}

                <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Target Course</label>
                    <select
                      value={announcementForm.courseId}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, courseId: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-primary"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.studentsCount || 0} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Announcement Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Live Q&A Session this Thursday at 7:00 PM"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, title: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Message / Notice</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Enter update, reading materials, or instructions for students..."
                      value={announcementForm.message}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, message: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingAnnouncement}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Announcement</span>
                  </button>
                </form>
              </div>
            )}

            {/* MY ARTICLES / BLOG MANAGEMENT TAB */}
            {activeTab === 'articles' && (
              <div className="space-y-6">
                {/* 1. AGGREGATED METRICS & ANALYTICS KPI PANEL */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 mb-1 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-400">Total Articles</span>
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-gray-900">{myArticles.length}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      <span className="text-emerald-600 font-semibold">{myArticles.filter(a => a.status === 'published' || a.published).length} live</span>
                      {' • '}
                      <span className="text-amber-600 font-semibold">{myArticles.filter(a => a.status === 'draft').length} drafts</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 mb-1 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-400">Total Views</span>
                      <Eye className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-gray-900">
                      {myArticles.reduce((sum, a) => sum + (a.metrics?.views || 0), 0)}
                    </div>
                    <div className="text-[10px] text-blue-600 mt-0.5 font-medium">
                      {myArticles.reduce((sum, a) => sum + (a.metrics?.uniqueVisitors || 0), 0)} unique visitors
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 mb-1 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-400">Reader Likes</span>
                      <ThumbsUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-gray-900">
                      {myArticles.reduce((sum, a) => sum + (a.metrics?.likes || 0), 0)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Positive reader rating</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 mb-1 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-400">Discussions</span>
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-gray-900">
                      {myArticles.reduce((sum, a) => sum + (a.metrics?.commentsCount || 0), 0)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {myArticles.reduce((sum, a) => sum + (a.metrics?.shares || 0), 0)} social shares
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-gray-500 mb-1 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-400">Engagement</span>
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-emerald-700">
                      {(() => {
                        const totalV = myArticles.reduce((sum, a) => sum + (a.metrics?.views || 0), 0);
                        const totalI = myArticles.reduce((sum, a) => sum + (a.metrics?.likes || 0) + (a.metrics?.commentsCount || 0), 0);
                        return totalV > 0 ? ((totalI / totalV) * 100).toFixed(1) + '%' : '0.0%';
                      })()}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Interactions / Views</div>
                  </div>
                </div>

                {/* 2. PERFORMANCE GRAPH OVER TIME & COMPARISON PANEL */}
                <div className="bg-white rounded-3xl p-6 md:p-7 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-primary" />
                        <h4 className="font-serif text-base font-bold text-gray-900">Article Performance & Reader Trends</h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Track viewership volume, reader retention, and engagement velocity over time
                      </p>
                    </div>

                    {/* Time Range Filter */}
                    <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                      {[
                        { id: '7d', label: 'Last 7 Days' },
                        { id: '30d', label: 'Last 30 Days' },
                        { id: 'all', label: 'All Time' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAnalyticsTimeRange(t.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            analyticsTimeRange === t.id
                              ? 'bg-white text-gray-900 shadow-sm font-bold'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Line / Area Graph */}
                  <div className="bg-gradient-to-b from-blue-50/40 via-white to-transparent rounded-2xl p-4 border border-blue-100/60 mb-6">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Views Trend
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Interactions (Likes & Comments)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">
                        Peak: {Math.max(...performanceTrendData.map(d => d.views), 1)} views
                      </span>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <div className="min-w-[500px]">
                        <svg viewBox="0 0 600 160" className="w-full h-44 overflow-visible">
                          <defs>
                            <linearGradient id="viewsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          <line x1="30" y1="20" x2="580" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                          <line x1="30" y1="60" x2="580" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
                          <line x1="30" y1="100" x2="580" y2="100" stroke="#e2e8f0" strokeDasharray="3 3" />
                          <line x1="30" y1="135" x2="580" y2="135" stroke="#cbd5e1" strokeWidth="1" />

                          {/* Interaction Bars */}
                          {performanceTrendData.map((d, idx) => {
                            const maxVal = Math.max(...performanceTrendData.map(p => p.views), 1);
                            const x = 40 + (idx * (520 / (performanceTrendData.length - 1 || 1)));
                            const barHeight = Math.min(100, Math.max(6, (d.interactions / maxVal) * 110));
                            return (
                              <g key={`bar-${idx}`}>
                                <rect
                                  x={x - 6}
                                  y={135 - barHeight}
                                  width={12}
                                  height={barHeight}
                                  rx={3}
                                  fill="url(#barGradient)"
                                  className="transition-all hover:opacity-100 opacity-80"
                                />
                              </g>
                            );
                          })}

                          {/* Area & Line for Views */}
                          {(() => {
                            const maxVal = Math.max(...performanceTrendData.map(p => p.views), 1);
                            const pts = performanceTrendData.map((d, idx) => {
                              const x = 40 + (idx * (520 / (performanceTrendData.length - 1 || 1)));
                              const y = 135 - ((d.views / maxVal) * 110);
                              return { x, y, ...d };
                            });

                            if (pts.length === 0) return null;

                            const lineD = pts.reduce((acc, pt, i) => {
                              return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                            }, '');

                            const areaD = `${lineD} L ${pts[pts.length - 1].x} 135 L ${pts[0].x} 135 Z`;

                            return (
                              <>
                                <path d={areaD} fill="url(#viewsAreaGradient)" />
                                <path d={lineD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                                {pts.map((pt, i) => (
                                  <g key={`pt-${i}`} className="group cursor-pointer">
                                    <circle
                                      cx={pt.x}
                                      cy={pt.y}
                                      r={4}
                                      fill="#ffffff"
                                      stroke="#2563eb"
                                      strokeWidth={2.5}
                                      className="transition-transform group-hover:scale-150"
                                    />
                                    <title>{`${pt.date}: ${pt.views} Views, ${pt.interactions} Interactions`}</title>
                                  </g>
                                ))}
                              </>
                            );
                          })()}

                          {/* Bottom Date Labels */}
                          {performanceTrendData.map((d, idx) => {
                            const x = 40 + (idx * (520 / (performanceTrendData.length - 1 || 1)));
                            return (
                              <text
                                key={`lbl-${idx}`}
                                x={x}
                                y={152}
                                textAnchor="middle"
                                fontSize={9}
                                fill="#64748b"
                                fontFamily="sans-serif"
                                fontWeight="500"
                              >
                                {d.date}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Article Comparison Bars */}
                  {myArticles.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span>Top Performing Articles</span>
                        <span className="text-[11px] text-gray-400 font-normal">Ranked by reader engagement</span>
                      </div>
                      <div className="space-y-2">
                        {myArticles.slice(0, 3).map((art) => {
                          const v = art.metrics?.views || 0;
                          const l = art.metrics?.likes || 0;
                          const c = art.metrics?.commentsCount || 0;
                          const maxV = Math.max(...myArticles.map(a => a.metrics?.views || 0), 1);
                          const pct = Math.min(100, Math.round((v / maxV) * 100));

                          return (
                            <div key={art.id} className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/70 text-xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-semibold text-gray-900 truncate max-w-sm">{art.title}</span>
                                <div className="flex items-center gap-3 font-mono text-[11px] text-gray-600">
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Eye className="w-3 h-3" /> {v}
                                  </span>
                                  <span className="flex items-center gap-1 text-amber-600">
                                    <ThumbsUp className="w-3 h-3" /> {l}
                                  </span>
                                  <span className="flex items-center gap-1 text-purple-600">
                                    <MessageSquare className="w-3 h-3" /> {c}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(8, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ARTICLES MANAGEMENT TABLE & FILTER CONTROLS */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                  {/* Action Bar Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-gray-900">My Authored Articles</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage your published articles, edit draft lessons, and review community response
                      </p>
                    </div>
                    <button
                      onClick={handleOpenNewArticle}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm transition-all flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Post</span>
                    </button>
                  </div>

                  {/* Filters: Status Tabs, Category Selector, and Search */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6 pb-5 border-b border-gray-100">
                    {/* Status filter tabs */}
                    <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                      {[
                        { id: 'all', label: `All (${myArticles.length})` },
                        { id: 'published', label: `Published (${myArticles.filter(a => a.status === 'published' || a.published).length})` },
                        { id: 'draft', label: `Drafts (${myArticles.filter(a => a.status === 'draft').length})` }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setArticleStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            articleStatusFilter === tab.id
                              ? 'bg-white text-gray-900 shadow-sm font-bold'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
                      {/* Category Dropdown */}
                      <select
                        value={articleCategoryFilter}
                        onChange={(e) => setArticleCategoryFilter(e.target.value)}
                        className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 outline-none focus:border-primary font-medium"
                      >
                        <option value="all">All Categories</option>
                        <option value="Business Strategy">Business Strategy</option>
                        <option value="Finance & Accounting">Finance & Accounting</option>
                        <option value="Leadership & HR">Leadership & HR</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Entrepreneurship">Entrepreneurship</option>
                        <option value="Regional Insights">Regional Insights</option>
                      </select>

                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search your articles..."
                          value={articleSearchQuery}
                          onChange={(e) => setArticleSearchQuery(e.target.value)}
                          className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Articles List / Table */}
                  {filteredArticles.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="font-bold text-sm text-gray-700">
                        {myArticles.length === 0 ? 'No articles created yet' : 'No articles match your filter criteria'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        {myArticles.length === 0
                          ? 'Publish your market insights, practical frameworks, and leadership case studies.'
                          : 'Try adjusting your status filter, category, or search keywords to view matching articles.'}
                      </p>
                      {myArticles.length === 0 && (
                        <button
                          onClick={handleOpenNewArticle}
                          className="mt-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 shadow-sm"
                        >
                          Write your first article
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                            <th className="pb-3 px-4">Article & Slug</th>
                            <th className="pb-3 px-4">Category</th>
                            <th className="pb-3 px-4">Status & Visibility</th>
                            <th className="pb-3 px-4">Performance Metrics</th>
                            <th className="pb-3 px-4">Published Date</th>
                            <th className="pb-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredArticles.map((post) => {
                            const isPub = post.status === 'published' || post.published === true;
                            const views = post.metrics?.views || 0;
                            const likes = post.metrics?.likes || 0;
                            const comments = post.metrics?.commentsCount || 0;
                            const shares = post.metrics?.shares || 0;

                            return (
                              <tr key={post.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="py-4 px-4 font-bold text-gray-900 max-w-xs">
                                  <div className="flex items-center gap-3">
                                    {(post.featuredImageUrl || post.featured_image_url) ? (
                                      <img
                                        src={post.featuredImageUrl || post.featured_image_url}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="truncate font-serif text-sm text-gray-900">{post.title}</div>
                                      <div className="text-[11px] text-gray-400 font-mono font-normal truncate mt-0.5">
                                        /{post.slug || `post-${post.id}`}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                                    {post.category || 'Business'}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => handleToggleArticleStatus(post)}
                                    title="Click to toggle between Published and Draft"
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                                      isPub
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    }`}
                                  >
                                    {isPub ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Published</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>Draft</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => handleViewArticleAnalytics(post)}
                                    className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
                                    title="Click to inspect reader metrics breakdown"
                                  >
                                    <span className="flex items-center gap-1 font-mono text-[11px] text-blue-600" title="Views">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{views}</span>
                                    </span>
                                    <span className="flex items-center gap-1 font-mono text-[11px] text-amber-600" title="Likes">
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                      <span>{likes}</span>
                                    </span>
                                    <span className="flex items-center gap-1 font-mono text-[11px] text-purple-600" title="Comments">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>{comments}</span>
                                    </span>
                                  </button>
                                </td>
                                <td className="py-4 px-4 text-gray-500 text-[11px]">
                                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleViewArticleAnalytics(post)}
                                      className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                                      title="Performance Analytics"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                    </button>
                                    <Link
                                      href="/blog"
                                      target="_blank"
                                      className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                                      title="Preview Live on Blog"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                    <button
                                      onClick={() => handleOpenEditArticle(post)}
                                      className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                                      title="Edit Article"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteArticle(post.id)}
                                      className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                                      title="Delete Article"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROFILE & PASSWORD SETTINGS TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm max-w-2xl">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-gray-900">
                    Profile & Password Settings
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your instructor credentials and profile details
                  </p>
                </div>

                {profileSaveSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{profileSaveSuccess}</span>
                  </div>
                )}
                {profileSaveError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{profileSaveError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={instructor.name}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Login Email</label>
                      <input
                        type="email"
                        disabled
                        value={instructor.email || ''}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-mono outline-none cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Managed by administrator</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        value={profileForm.title}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, title: e.target.value })
                        }
                        placeholder="e.g. Lead Marketing Executive"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">
                        WhatsApp / Phone Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder="+252 61 000 0000"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Biography</label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      placeholder="Share your business and academic background..."
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                    />
                  </div>

                  {/* Password Change Box */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-xs text-gray-900">Change Instructor Password</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium mb-1 text-gray-600 text-[11px]">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={profileForm.newPassword}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, newPassword: e.target.value })
                          }
                          placeholder="Min. 4 characters"
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1 text-gray-600 text-[11px]">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={profileForm.confirmPassword}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, confirmPassword: e.target.value })
                          }
                          placeholder="Re-enter password"
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </form>
              </div>
            )}
          </>
        )}
        {/* ─────────── 4. ARTICLE WRITER & EDITOR MODAL (CREATE / EDIT) ─────────── */}
        {isArticleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto border border-gray-100">
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pr-8">
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-900">
                    {editingArticleId ? 'Edit Article & Publishing Settings' : 'Create New Post'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Author: <span className="font-semibold text-primary">{instructor.name}</span> • Faculty Publishing Rights
                  </p>
                </div>

                {/* Write vs Live Preview toggle pills */}
                <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setEditorMode('write')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      editorMode === 'write' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Write & Format
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      editorMode === 'preview' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {articleError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{articleError}</span>
                </div>
              )}

              {editorMode === 'write' ? (
                <form onSubmit={(e) => handleSaveArticle(e)} className="space-y-4 text-xs">
                  {/* Title & Slug */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Article Headline / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Regional Supply Chain Resiliency in the Somali Private Sector"
                      value={articleForm.title}
                      onChange={(e) => handleArticleTitleChange(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm font-medium text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Category</label>
                      <select
                        value={articleForm.category}
                        onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary text-gray-800"
                      >
                        <option value="Business Strategy">Business Strategy</option>
                        <option value="Finance & Accounting">Finance & Accounting</option>
                        <option value="Leadership & HR">Leadership & HR</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Entrepreneurship">Entrepreneurship</option>
                        <option value="Regional Insights">Regional Insights</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Publishing Status</label>
                      <select
                        value={articleForm.status}
                        onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary font-semibold text-gray-800"
                      >
                        <option value="published">Published (Live to public)</option>
                        <option value="draft">Draft (Private workspace)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Estimated Read Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 5 min read"
                        value={articleForm.readTime}
                        onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">URL Slug Identifier</label>
                    <input
                      type="text"
                      placeholder="auto-generated-from-title"
                      value={articleForm.slug}
                      onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                      className="w-full h-9 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary font-mono text-[11px] text-gray-700"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Live URL: <span className="font-mono text-primary">/blog?id={articleForm.slug || '...'}</span>
                    </p>
                  </div>

                  {/* Image Upload with Preview */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-gray-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        Featured Header Image
                      </label>
                      {articleForm.featuredImageUrl && (
                        <button
                          type="button"
                          onClick={() => setArticleForm({ ...articleForm, featuredImageUrl: '' })}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>

                    {/* Image Preview */}
                    {articleForm.featuredImageUrl ? (
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img
                          src={articleForm.featuredImageUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white font-medium">
                          Cover Image Attached
                        </div>
                      </div>
                    ) : null}

                    {/* Upload button & URL input */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>Upload from Computer</span>
                      </button>

                      <div className="flex-1 relative">
                        <input
                          type="url"
                          placeholder="Or paste external image URL (https://...)"
                          value={articleForm.featuredImageUrl}
                          onChange={(e) => setArticleForm({ ...articleForm, featuredImageUrl: e.target.value })}
                          className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary bg-white text-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Short Summary / Excerpt *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Brief 1-2 sentence preview for search results, card snippets, and social shares..."
                      value={articleForm.excerpt}
                      onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none text-gray-800"
                    />
                  </div>

                  {/* Rich Text Toolbar & Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-gray-700">Article Content *</label>
                      <span className="text-[10px] text-gray-400">Click toolbar tools to style paragraphs</span>
                    </div>

                    {/* Formatting Tools Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-100 rounded-t-xl border border-b-0 border-gray-200 text-gray-700">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**', 'bold text')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*', 'italic text')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n## ', '\n', 'Subheading Title')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Heading 2"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n### ', '\n', 'Section Title')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Heading 3"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n- ', '', 'Bullet point')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n1. ', '', 'Numbered item')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n> ', '\n', 'Inspiring leadership quote')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Blockquote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('`', '`', 'code')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Code Snippet"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('[', '](https://example.com)', 'Link Title')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Hyperlink"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n---\n', '')}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                        title="Horizontal Divider"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={contentInputRef}
                      rows={9}
                      required
                      placeholder="Write your article insights, executive analysis, or case studies here..."
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                      className="w-full p-3.5 rounded-b-xl border border-gray-200 outline-none focus:border-primary font-mono text-[11px] text-gray-800 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Form Submission Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsArticleModalOpen(false)}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold w-full sm:w-auto"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        disabled={isSavingArticle}
                        onClick={(e) => handleSaveArticle(e, 'draft')}
                        className="px-4 py-2 border border-amber-300 bg-amber-50 text-amber-800 rounded-xl font-bold hover:bg-amber-100 transition-colors"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        disabled={isSavingArticle}
                        onClick={(e) => handleSaveArticle(e, 'published')}
                        className="px-5 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingArticle ? 'Publishing...' : editingArticleId ? 'Update & Publish' : 'Publish Article Live'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* LIVE PREVIEW MODE */
                <div className="space-y-6">
                  {articleForm.featuredImageUrl && (
                    <div className="w-full h-56 rounded-2xl overflow-hidden border border-gray-200">
                      <img
                        src={articleForm.featuredImageUrl}
                        alt="Preview cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-xs text-gray-500">
                    <span className="font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {articleForm.category}
                    </span>
                    <span>•</span>
                    <span>{articleForm.readTime || '5 min read'}</span>
                    <span>•</span>
                    <span className="font-medium text-gray-800">By {instructor.name}</span>
                  </div>

                  <h1 className="font-serif text-2xl font-bold text-gray-900 leading-tight">
                    {articleForm.title || 'Untitled Article'}
                  </h1>

                  {articleForm.excerpt && (
                    <p className="text-sm text-gray-600 italic border-l-2 border-primary pl-3.5">
                      {articleForm.excerpt}
                    </p>
                  )}

                  <div className="prose text-sm text-gray-800 leading-relaxed space-y-3 whitespace-pre-line border-t border-gray-100 pt-4">
                    {articleForm.content || 'No article content typed yet.'}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode('write')}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold"
                    >
                      Back to Editor
                    </button>
                    <button
                      type="button"
                      disabled={isSavingArticle}
                      onClick={(e) => handleSaveArticle(e, articleForm.status)}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{articleForm.status === 'published' ? 'Publish Live' : 'Save Draft'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────── 5. DEDICATED ARTICLE ANALYTICS MODAL ─────────── */}
        {selectedArticleAnalytics && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedArticleAnalytics(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-gray-900">Article Performance Analytics</h3>
              </div>
              <p className="text-xs text-gray-500 mb-5 font-medium truncate">
                "{selectedArticleAnalytics.post?.title || selectedArticleAnalytics.title}"
              </p>

              {isLoadingAnalytics ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading reader metrics...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                      <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider block mb-1">
                        Total Views
                      </span>
                      <span className="text-3xl font-extrabold text-blue-900 font-mono">
                        {selectedArticleAnalytics.metrics?.views || 0}
                      </span>
                    </div>

                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                      <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block mb-1">
                        Unique Visitors
                      </span>
                      <span className="text-3xl font-extrabold text-indigo-900 font-mono">
                        {selectedArticleAnalytics.metrics?.uniqueVisitors || 0}
                      </span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                        Reader Likes
                      </span>
                      <span className="text-3xl font-extrabold text-amber-900 font-mono">
                        {selectedArticleAnalytics.metrics?.likes || 0}
                      </span>
                    </div>

                    <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4">
                      <span className="text-[10px] font-semibold text-purple-800 uppercase tracking-wider block mb-1">
                        Social Shares
                      </span>
                      <span className="text-3xl font-extrabold text-purple-900 font-mono">
                        {selectedArticleAnalytics.metrics?.shares || 0}
                      </span>
                    </div>
                  </div>

                  {/* Reader Comments / Discussion Breakdown */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        Reader Discussion Comments ({selectedArticleAnalytics.comments?.length || selectedArticleAnalytics.metrics?.commentsCount || 0})
                      </span>
                    </div>

                    {(!selectedArticleAnalytics.comments || selectedArticleAnalytics.comments.length === 0) ? (
                      <p className="text-[11px] text-gray-500 italic py-2">
                        No comments posted on this article yet. Readers can comment from the public blog reader.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {selectedArticleAnalytics.comments.map((c) => (
                          <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-200 text-xs shadow-2xs">
                            <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                              <span className="font-semibold text-gray-900">{c.authorName}</span>
                              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-[11px]">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSelectedArticleAnalytics(null)}
                      className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Close Analytics
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

