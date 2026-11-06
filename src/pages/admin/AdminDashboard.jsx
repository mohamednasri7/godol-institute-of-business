import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'wouter';
import {
  Users, BookOpen, DollarSign, ClipboardList, Award, CreditCard,
  TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3,
  ArrowRight, RefreshCw, ShieldCheck, FileText, Plus, Edit2,
  Trash2, Eye, ThumbsUp, MessageSquare, Share2, Sparkles,
  ExternalLink, Search, Filter, X, Image as ImageIcon, Upload,
  Check
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { supabase, isSupabaseClientConfigured } from '../../lib/supabase';
import DashboardCharts from '../../components/admin/DashboardCharts';
import NeedsAttentionPanel from '../../components/admin/NeedsAttentionPanel';
import RecentActivityFeed from '../../components/admin/RecentActivityFeed';
import QuickActionsToolbar from '../../components/admin/QuickActionsToolbar';
import GlobalSearchModal from '../../components/admin/GlobalSearchModal';

function StatCard({ label, value, sub, trend, icon: Icon, color, linkTo }) {
  const card = (
    <div className={`bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow h-full ${linkTo ? 'cursor-pointer' : ''}`}>
      <div className="min-w-0 pr-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-1 truncate">{label}</p>
        <div className="text-2xl font-bold text-gray-900 dark:text-foreground mb-1">{value}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {trend && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
              {trend}
            </span>
          )}
          {sub && <span className="text-xs text-gray-500 dark:text-muted-foreground truncate">{sub}</span>}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
  return linkTo ? <Link href={linkTo} className="block h-full">{card}</Link> : card;
}

const defaultPostForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'Business Strategy',
  author: 'Godol Editorial',
  authorId: null,
  featuredImageUrl: '',
  status: 'published',
  readTime: '5 min read'
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [posts, setPosts] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Global search shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Blog Management state
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState('all'); // 'all', 'published', 'draft'
  const [blogAuthorFilter, setBlogAuthorFilter] = useState('all'); // 'all', 'editorial', or instructor id
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postFormData, setPostFormData] = useState(defaultPostForm);
  const [postFeedback, setPostFeedback] = useState(null);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [sRes, paysRes, enrsRes, inqsRes, pstsRes, instsRes, crsRes] = await Promise.allSettled([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/payments?status=pending_verification'),
        apiFetch('/api/admin/enrollments'),
        apiFetch('/api/admin/enquiries'),
        apiFetch('/api/admin/posts').catch(() => apiFetch('/api/admin/blog')),
        apiFetch('/api/admin/instructors'),
        apiFetch('/api/admin/courses')
      ]);

      if (sRes.status === 'fulfilled' && sRes.value && typeof sRes.value === 'object') {
        setStats(sRes.value);
      } else {
        console.warn('Dashboard stats failed to load:', sRes.reason);
        setErrorMessage("Couldn't load complete metrics from the server. Click Retry to re-fetch.");
      }

      const pays = paysRes.status === 'fulfilled' && Array.isArray(paysRes.value) ? paysRes.value : [];
      const enrs = enrsRes.status === 'fulfilled' && Array.isArray(enrsRes.value) ? enrsRes.value : [];
      const inqs = inqsRes.status === 'fulfilled' && Array.isArray(inqsRes.value) ? inqsRes.value : [];
      const psts = pstsRes.status === 'fulfilled' && Array.isArray(pstsRes.value) ? pstsRes.value : [];
      const insts = instsRes.status === 'fulfilled' && Array.isArray(instsRes.value) ? instsRes.value : [];
      const crs = crsRes.status === 'fulfilled' && Array.isArray(crsRes.value) ? crsRes.value : [];

      setRecentPayments(pays.slice(0, 5));
      setRecentEnrollments(enrs.slice(0, 6));
      setRecentInquiries(inqs.slice(0, 5));
      setPosts(psts);
      setInstructors(insts);
      setCourses(crs);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('fetchData error:', err);
      setErrorMessage(err.message || "Couldn't load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  const safeDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const handleDeleteInquiry = async (id) => {
    if (confirm('Delete this inquiry?')) {
      await apiFetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();

    if (!isSupabaseClientConfigured || !supabase) return;

    // Supabase Realtime Subscription: auto-syncs dashboard whenever student registers, enrolls, or submits payment
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchData();
      })
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString();
  const fmtUSD = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-emerald-100 text-emerald-700',
      pending_verification: 'bg-amber-100 text-amber-700',
      pending_payment: 'bg-gray-100 text-gray-600',
      rejected: 'bg-red-100 text-red-600',
      completed: 'bg-blue-100 text-blue-700',
      verified: 'bg-emerald-100 text-emerald-700',
    };
    const labels = {
      approved: 'Approved',
      pending_verification: 'Awaiting Verification',
      pending_payment: 'Pending Payment',
      rejected: 'Rejected',
      completed: 'Completed',
      verified: 'Verified'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-gray-100 text-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ─────────── GLOBAL BLOG MANAGEMENT ACTIONS (FULL ADMIN PRIVILEGES) ───────────

  const handleOpenAddPost = () => {
    setEditingPostId(null);
    setPostFormData(defaultPostForm);
    setPostFeedback(null);
    setIsPostModalOpen(true);
  };

  const handleOpenEditPost = (post) => {
    setEditingPostId(post.id);
    setPostFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Business Strategy',
      author: post.authorName || post.author || 'Godol Editorial',
      authorId: post.authorId || null,
      featuredImageUrl: post.featuredImageUrl || post.featured_image_url || '',
      status: post.status || (post.published ? 'published' : 'draft'),
      readTime: post.readTime || '5 min read'
    });
    setPostFeedback(null);
    setIsPostModalOpen(true);
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post? This will permanently remove its contents, comments, and metrics.')) {
      return;
    }
    try {
      await apiFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      setPostFeedback({ type: 'success', text: 'Article deleted from platform.' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleTogglePostStatus = async (post) => {
    const isPub = post.status === 'published' || post.published === true;
    const newStatus = isPub ? 'draft' : 'published';
    try {
      await apiFetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle post status:', err);
    }
  };

  const handlePostTitleChange = (val) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setPostFormData(prev => {
      const isAuto = !prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return {
        ...prev,
        title: val,
        slug: isAuto ? autoSlug : prev.slug
      };
    });
  };

  const handleAuthorSelectChange = (val) => {
    if (val === 'editorial') {
      setPostFormData(prev => ({
        ...prev,
        author: 'Godol Editorial',
        authorId: null
      }));
    } else {
      const inst = instructors.find(i => String(i.id) === String(val));
      if (inst) {
        setPostFormData(prev => ({
          ...prev,
          author: inst.name,
          authorId: inst.id
        }));
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPostFormData(prev => ({
        ...prev,
        featuredImageUrl: uploadEvent.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!postFormData.title.trim()) {
      alert('Please enter an article title.');
      return;
    }

    setIsSavingPost(true);
    try {
      const payload = {
        ...postFormData,
        featured_image_url: postFormData.featuredImageUrl
      };

      if (editingPostId) {
        await apiFetch(`/api/admin/posts/${editingPostId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setPostFeedback({ type: 'success', text: 'Article updated successfully!' });
      } else {
        await apiFetch('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setPostFeedback({ type: 'success', text: 'New article published across platform!' });
      }
      setIsPostModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save article. Please try again.');
    } finally {
      setIsSavingPost(false);
    }
  };

  // ─────────── GLOBAL ANALYTICS COMPUTATIONS ───────────
  const siteWideBlogViews = stats?.totalBlogViews ?? posts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
  const siteWideBlogLikes = stats?.totalBlogLikes ?? posts.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0);
  const siteWideBlogComments = stats?.totalBlogComments ?? posts.reduce((sum, p) => sum + (p.metrics?.commentsCount || 0), 0);
  const siteWideBlogInteractions = stats?.totalBlogInteractions ?? (siteWideBlogLikes + siteWideBlogComments + posts.reduce((sum, p) => sum + (p.metrics?.shares || 0), 0));
  const totalUniqueVisitors = posts.reduce((sum, p) => sum + (p.metrics?.uniqueVisitors || 0), 0);

  // Top-performing posts sorted by views & interactions
  const topPerformingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const scoreA = (a.metrics?.views || 0) * 1 + (a.metrics?.likes || 0) * 3 + (a.metrics?.commentsCount || 0) * 5;
        const scoreB = (b.metrics?.views || 0) * 1 + (b.metrics?.likes || 0) * 3 + (b.metrics?.commentsCount || 0) * 5;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [posts]);

  // Master posts table filter
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const isPub = post.status === 'published' || post.published === true;
      if (blogStatusFilter === 'published' && !isPub) return false;
      if (blogStatusFilter === 'draft' && isPub) return false;

      if (blogAuthorFilter === 'editorial') {
        if (post.authorRole === 'instructor' || post.authorId) return false;
      } else if (blogAuthorFilter !== 'all') {
        if (String(post.authorId) !== String(blogAuthorFilter)) return false;
      }

      if (blogSearchQuery.trim()) {
        const q = blogSearchQuery.toLowerCase();
        const matchTitle = (post.title || '').toLowerCase().includes(q);
        const matchAuthor = (post.authorName || post.author || '').toLowerCase().includes(q);
        const matchCategory = (post.category || '').toLowerCase().includes(q);
        const matchSlug = (post.slug || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchCategory && !matchSlug) return false;
      }

      return true;
    });
  }, [posts, blogStatusFilter, blogAuthorFilter, blogSearchQuery]);

  return (
    <AdminLayout title="Dashboard Overview" subtitle="Real-time platform analytics, global blog oversight, and management controls">
      <div className="space-y-6 sm:space-y-8">
        {/* Refresh Header, Global Search & Realtime Sync Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              isRealtimeActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <span>{isRealtimeActive ? 'Realtime Live Sync Active' : 'Polling Sync'}</span>
            </span>
            <p className="text-xs text-gray-400">Updated: {lastRefreshed.toLocaleTimeString()}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card text-xs text-gray-500 dark:text-muted-foreground hover:border-primary transition-colors shadow-xs"
              title="Global search across students, courses, and payments (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search platform...</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-muted rounded border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300">Ctrl+K</kbd>
            </button>

            <button onClick={fetchData} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card shadow-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Toolbar */}
        <QuickActionsToolbar />

        {/* Needs Attention Alert Panel */}
        <NeedsAttentionPanel
          pendingPayments={recentPayments}
          pendingEnrollments={recentEnrollments.filter(e => e.enrollmentStatus !== 'approved' && e.enrollmentStatus !== 'completed')}
          draftCourses={courses.filter(c => c.status === 'draft')}
        />

        {/* Error Alert with Retry */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="font-semibold truncate">{errorMessage}</span>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Metric Cards Row 1 with trend comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard label="Verified Revenue" value={fmtUSD(stats?.verifiedRevenue)} sub="vs last mo." trend="+18.4%" icon={DollarSign} color="bg-emerald-600" linkTo="/admin/revenue" />
          <StatCard label="Revenue This Month" value={fmtUSD(stats?.revenueThisMonth)} sub="vs last mo." trend="+12.2%" icon={TrendingUp} color="bg-blue-600" linkTo="/admin/revenue" />
          <StatCard label="Total Students" value={fmt(stats?.totalStudents)} sub="vs last mo." trend="+9.6%" icon={Users} color="bg-indigo-600" linkTo="/admin/students" />
          <StatCard label="Pending Verification" value={fmt(stats?.pendingVerification)} sub={stats?.pendingVerification > 0 ? "Action needed" : "Up to date"} trend={stats?.pendingVerification > 0 ? "Review" : "Clear"} icon={AlertCircle} color="bg-amber-500" linkTo="/admin/payments" />
        </div>

        {/* Metric Cards Row 2 with trend comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard label="Total Courses" value={fmt(stats?.totalCourses)} sub={`${fmt(stats?.publishedCourses)} published`} trend="+2 new" icon={BookOpen} color="bg-purple-600" linkTo="/admin/courses" />
          <StatCard label="Active Enrollments" value={fmt(stats?.activeEnrollments)} sub="vs last mo." trend="+14.1%" icon={ClipboardList} color="bg-cyan-600" linkTo="/admin/enrollments" />
          <StatCard label="Total Instructors" value={fmt(stats?.totalInstructors)} sub="Faculty active" trend="Verified" icon={Users} color="bg-pink-600" linkTo="/admin/instructors" />
          <StatCard label="Site-Wide Blog Views" value={fmt(siteWideBlogViews)} sub={`${fmt(posts.length)} articles`} trend="+24.5%" icon={FileText} color="bg-blue-700" linkTo="/admin/blog" />
        </div>

        {/* Performance & Growth Analytics Charts */}
        <DashboardCharts
          payments={recentPayments}
          enrollments={recentEnrollments}
          courses={courses}
        />

        {/* ─────────── 1. GLOBAL BLOG ANALYTICS WIDGET ─────────── */}
        <div className="bg-gradient-to-br from-gray-900 via-primary/95 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/15">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight">
                  Global Blog & Thought Leadership Analytics
                </h3>
              </div>
              <p className="text-xs text-white/70 max-w-xl">
                Real-time oversight of articles authored by Godol Institute Editorial and verified faculty members across East Africa.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={handleOpenAddPost}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Article</span>
              </button>
              <Link
                href="/admin/blog"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
              >
                <span>Full CMS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4-KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-300" /> Site-Wide Views
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight">{fmt(siteWideBlogViews)}</div>
              <p className="text-[11px] text-white/60 mt-1 font-medium">{fmt(totalUniqueVisitors)} unique visitors</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-amber-300" /> Reader Interactions
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight">{fmt(siteWideBlogInteractions)}</div>
              <p className="text-[11px] text-white/60 mt-1 font-medium">{fmt(siteWideBlogLikes)} likes • {fmt(siteWideBlogComments)} comments</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-300" /> Total Platform Articles
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight">{posts.length}</div>
              <p className="text-[11px] text-white/60 mt-1 font-medium">
                {posts.filter(p => p.status === 'published' || p.published).length} live • {posts.filter(p => p.status === 'draft').length} drafts
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Audience Engagement
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight text-emerald-400">
                {siteWideBlogViews > 0
                  ? ((siteWideBlogInteractions / siteWideBlogViews) * 100).toFixed(1) + '%'
                  : '0.0%'}
              </div>
              <p className="text-[11px] text-white/60 mt-1 font-medium">Avg reader conversion</p>
            </div>
          </div>

          {/* Top-Performing Posts Leaderboard */}
          <div className="bg-black/25 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Top-Performing Articles Leaderboard
              </span>
              <span className="text-[11px] text-white/50">Ranked by platform readership</span>
            </div>

            {topPerformingPosts.length === 0 ? (
              <p className="text-xs text-white/50 italic py-2">No published posts available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {topPerformingPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    className="bg-white/10 hover:bg-white/15 transition-all p-3.5 rounded-xl border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-white/70 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[10px]">
                          #{idx + 1} Ranked
                        </span>
                        <span className="text-white/60 text-[10px]">{post.category || 'Business'}</span>
                      </div>
                      <h4 className="font-semibold text-white text-xs line-clamp-2 mb-2 leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-[11px] text-white/60 mb-3 truncate">
                        By {post.authorName || post.author || 'Godol Editorial'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/80">
                      <span className="flex items-center gap-1 text-blue-300">
                        <Eye className="w-3 h-3" /> {post.metrics?.views || 0}
                      </span>
                      <span className="flex items-center gap-1 text-amber-300">
                        <ThumbsUp className="w-3 h-3" /> {post.metrics?.likes || 0}
                      </span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <MessageSquare className="w-3 h-3" /> {post.metrics?.commentsCount || 0}
                      </span>
                      <button
                        onClick={() => handleOpenEditPost(post)}
                        className="text-white hover:text-amber-300 font-sans font-bold text-[10px] ml-1"
                      >
                        Edit →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─────────── 2. MASTER TABLE OF ALL BLOG POSTS ACROSS PLATFORM ─────────── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-gray-900">
                Master Blog Management & Oversight Table
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Full platform-wide CRUD access: view, edit, or delete any article authored by Admins or Faculty
              </p>
            </div>
            <button
              onClick={handleOpenAddPost}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Article</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6 pb-5 border-b border-gray-100">
            {/* Status Filter Tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: `All (${posts.length})` },
                { id: 'published', label: `Published (${posts.filter(p => p.status === 'published' || p.published).length})` },
                { id: 'draft', label: `Drafts (${posts.filter(p => p.status === 'draft').length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBlogStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    blogStatusFilter === tab.id
                      ? 'bg-white text-gray-900 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 flex-1 max-w-lg justify-end">
              {/* Author Filter Dropdown */}
              <select
                value={blogAuthorFilter}
                onChange={(e) => setBlogAuthorFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 outline-none focus:border-primary font-medium"
              >
                <option value="all">All Authors (Platform-wide)</option>
                <option value="editorial">Godol Editorial (Admin Team)</option>
                {instructors.map(i => (
                  <option key={i.id} value={String(i.id)}>
                    Faculty: {i.name}
                  </option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search title, author, slug..."
                  value={blogSearchQuery}
                  onChange={(e) => setBlogSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Master Posts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Article & Slug</th>
                  <th className="py-3.5 px-4">Author & Role</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status & Visibility</th>
                  <th className="py-3.5 px-4">View / Interaction Metrics</th>
                  <th className="py-3.5 px-4">Publication Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      No blog posts match your filter criteria. Click "Create New Article" to publish one.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => {
                    const isPub = post.status === 'published' || post.published === true;
                    const isInstructor = post.authorRole === 'instructor' || post.authorId;
                    const views = post.metrics?.views || 0;
                    const likes = post.metrics?.likes || 0;
                    const comments = post.metrics?.commentsCount || 0;

                    return (
                      <tr key={post.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 max-w-xs">
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
                              <p className="font-semibold text-gray-900 truncate font-serif text-sm">{post.title}</p>
                              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">/{post.slug || `post-${post.id}`}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{post.authorName || post.author || 'Godol Editorial'}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 ${
                              isInstructor ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {isInstructor ? 'Faculty Instructor' : 'Admin / Editorial'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                            {post.category || 'Business'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleTogglePostStatus(post)}
                            title="Click to toggle Published vs Draft"
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
                          <div className="flex items-center gap-3 text-[11px] font-mono text-gray-600">
                            <span className="flex items-center gap-1 text-blue-600" title="Views">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{views}</span>
                            </span>
                            <span className="flex items-center gap-1 text-amber-600" title="Likes">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{likes}</span>
                            </span>
                            <span className="flex items-center gap-1 text-purple-600" title="Comments">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{comments}</span>
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-gray-500 text-[11px]">
                          {safeDate(post.publishedAt)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href="/blog"
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                              title="Preview on Blog"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleOpenEditPost(post)}
                              className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                              title="Edit Article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                              title="Delete Article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two columns: Payments Awaiting Verification & Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Payments */}
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-border">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-foreground">Payments Awaiting Verification</h3>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">Students waiting for course access approval</p>
                </div>
                <Link href="/admin/payments" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recentPayments.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">No payments pending</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">All student transactions have been processed.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-border">
                  {recentPayments.map(p => (
                    <div key={p.id} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(p.studentName || 'S')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">{p.studentName}</p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">{p.courseTitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-foreground font-mono">${p.claimedAmount}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{p.provider}</p>
                      </div>
                      <Link href="/admin/payments"
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">
                        Verify
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/20 flex items-center justify-between text-xs text-gray-500">
              <span>{recentPayments.length} pending transactions</span>
              <Link href="/admin/payments" className="font-semibold text-primary hover:underline">
                Open Verification Center →
              </Link>
            </div>
          </div>

          {/* Live Recent Activity Stream */}
          <RecentActivityFeed
            payments={recentPayments}
            enrollments={recentEnrollments}
          />
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Recent Enrollments</h3>
            <Link href="/admin/enrollments" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-6">Course</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentEnrollments.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{e.studentName}</td>
                    <td className="py-3.5 px-6 text-gray-600 truncate max-w-[200px]">{e.courseTitle}</td>
                    <td className="py-3.5 px-6 font-bold">${e.coursePrice || 0}</td>
                    <td className="py-3.5 px-6">{statusBadge(e.enrollmentStatus)}</td>
                    <td className="py-3.5 px-6 text-gray-400">{safeDate(e.enrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inbound Inquiries */}
        {recentInquiries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Recent Inquiries & Contact Requests</h3>
                <p className="text-xs text-gray-400 mt-0.5">Prospective students and admissions leads</p>
              </div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                {recentInquiries.length} Lead{recentInquiries.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-6">Prospect</th>
                    <th className="py-3 px-6">Subject</th>
                    <th className="py-3 px-6">Message</th>
                    <th className="py-3 px-6">Received</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {recentInquiries.map(inq => (
                    <tr key={inq.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        <div>{inq.name}</div>
                        <div className="text-[11px] text-gray-400 font-normal">{inq.email} {inq.phone ? `• ${inq.phone}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-6 text-gray-800 font-medium truncate max-w-[180px]">{inq.subject}</td>
                      <td className="py-3.5 px-6 text-gray-600 line-clamp-1 max-w-[280px]">{inq.message}</td>
                      <td className="py-3.5 px-6 text-gray-400">{safeDate(inq.createdAt)}</td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                        >
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─────────── 3. ADMIN POST CREATOR & EDITOR MODAL ─────────── */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold mb-1 text-gray-900">
              {editingPostId ? 'Edit Article & Platform Permissions' : 'Create & Publish New Article'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Admins have platform-wide authoring privileges. You can author articles directly or assign authorship to any faculty instructor.
            </p>

            <form onSubmit={handleSavePost} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Free Trade Protocols & SME Growth in Somalia"
                  value={postFormData.title}
                  onChange={(e) => handlePostTitleChange(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">URL Slug</label>
                  <input
                    type="text"
                    placeholder="auto-generated-from-title"
                    value={postFormData.slug}
                    onChange={(e) => setPostFormData({ ...postFormData, slug: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-900 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Publication Status</label>
                  <select
                    value={postFormData.status}
                    onChange={(e) => setPostFormData({ ...postFormData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 font-semibold"
                  >
                    <option value="published">Published (Live to all public readers)</option>
                    <option value="draft">Draft (Restricted preview mode)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Author & Ownership *</label>
                  <select
                    value={postFormData.authorId ? String(postFormData.authorId) : 'editorial'}
                    onChange={(e) => handleAuthorSelectChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900"
                  >
                    <option value="editorial">Godol Editorial (Admin Team)</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={String(i.id)}>
                        Faculty: {i.name} ({i.title || 'Instructor'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Category</label>
                  <select
                    value={postFormData.category}
                    onChange={(e) => setPostFormData({ ...postFormData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900"
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
              </div>

              {/* Cover Image Upload & URL */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Cover Image
                  </label>
                  {postFormData.featuredImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPostFormData({ ...postFormData, featuredImageUrl: '' })}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                {postFormData.featuredImageUrl && (
                  <div className="w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <img
                      src={postFormData.featuredImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    type="url"
                    placeholder="Or paste image URL (https://...)"
                    value={postFormData.featuredImageUrl}
                    onChange={(e) => setPostFormData({ ...postFormData, featuredImageUrl: e.target.value })}
                    className="flex-1 h-9 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Short Summary / Excerpt *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Introductory summary for search snippets and cards..."
                  value={postFormData.excerpt}
                  onChange={(e) => setPostFormData({ ...postFormData, excerpt: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Full Content (Supports HTML / Rich Text) *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Article body content..."
                  value={postFormData.content}
                  onChange={(e) => setPostFormData({ ...postFormData, content: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary font-mono text-[11px] text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingPost ? 'Saving...' : editingPostId ? 'Save Changes' : 'Publish Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </AdminLayout>
  );
}
