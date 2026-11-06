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

function StatCard({ label, value, sub, icon: Icon, color, linkTo }) {
  const card = (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${linkTo ? 'cursor-pointer' : ''}`}>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
  return linkTo ? <Link href={linkTo}>{card}</Link> : card;
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

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

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('/api/admin/stats'),
      apiFetch('/api/admin/payments?status=pending_verification'),
      apiFetch('/api/admin/enrollments'),
      apiFetch('/api/admin/enquiries').catch(() => []),
      apiFetch('/api/admin/posts').catch(() => apiFetch('/api/admin/blog').catch(() => [])),
      apiFetch('/api/admin/instructors').catch(() => [])
    ]).then(([s, pays, enrs, inqs, psts, insts]) => {
      setStats(s);
      setRecentPayments(pays.slice(0, 5));
      setRecentEnrollments(enrs.slice(0, 6));
      setRecentInquiries((inqs || []).slice(0, 5));
      setPosts(Array.isArray(psts) ? psts : []);
      setInstructors(Array.isArray(insts) ? insts : []);
      setLastRefreshed(new Date());
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleDeleteInquiry = async (id) => {
    if (confirm('Delete this inquiry?')) {
      await apiFetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
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
      <div className="space-y-8">
        {/* Refresh Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Last updated: {lastRefreshed.toLocaleTimeString()}</p>
          <button onClick={fetchData} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Pending alert banner */}
        {stats?.pendingVerification > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">
                {stats.pendingVerification} payment{stats.pendingVerification > 1 ? 's' : ''} awaiting your verification
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Students are waiting for course access. Review and verify their transactions.</p>
            </div>
            <Link href="/admin/payments"
              className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors">
              Verify Now
            </Link>
          </div>
        )}

        {/* Metric Cards Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Verified Revenue" value={fmtUSD(stats?.verifiedRevenue)} sub="Confirmed payments only" icon={DollarSign} color="bg-emerald-600" linkTo="/admin/revenue" />
          <StatCard label="Revenue This Month" value={fmtUSD(stats?.revenueThisMonth)} sub="Verified this calendar month" icon={TrendingUp} color="bg-blue-600" linkTo="/admin/revenue" />
          <StatCard label="Total Students" value={fmt(stats?.totalStudents)} sub="Registered accounts" icon={Users} color="bg-indigo-600" linkTo="/admin/students" />
          <StatCard label="Pending Verification" value={fmt(stats?.pendingVerification)} sub="Need admin review" icon={AlertCircle} color="bg-amber-500" linkTo="/admin/payments" />
        </div>

        {/* Metric Cards Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Courses" value={fmt(stats?.totalCourses)} sub={`${fmt(stats?.publishedCourses)} published`} icon={BookOpen} color="bg-purple-600" linkTo="/admin/courses" />
          <StatCard label="Active Enrollments" value={fmt(stats?.activeEnrollments)} sub="Students with course access" icon={ClipboardList} color="bg-cyan-600" linkTo="/admin/enrollments" />
          <StatCard label="Total Instructors" value={fmt(stats?.totalInstructors)} sub="Faculty members" icon={Users} color="bg-pink-600" linkTo="/admin/instructors" />
          <StatCard label="Site-Wide Blog Views" value={fmt(siteWideBlogViews)} sub={`${fmt(posts.length)} articles online`} icon={FileText} color="bg-blue-700" linkTo="/admin/blog" />
        </div>

        {/* ─────────── 1. GLOBAL BLOG ANALYTICS WIDGET ─────────── */}
        <div className="bg-gradient-to-br from-gray-900 via-primary/95 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
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

        {/* Two columns: Payments & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Payments */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Payments Awaiting Verification</h3>
                <p className="text-xs text-gray-500 mt-0.5">Students waiting for course access approval</p>
              </div>
              <Link href="/admin/payments" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No payments pending verification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(p.studentName || 'S')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.studentName}</p>
                      <p className="text-xs text-gray-500 truncate">{p.courseTitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">${p.claimedAmount}</p>
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

          {/* Quick actions + stats */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Verify Payments', sub: 'Review transactions', path: '/admin/payments', color: 'text-amber-600 bg-amber-50' },
                  { label: 'Manage Blog Posts', sub: 'Publish articles & insights', path: '/admin/blog', color: 'text-blue-600 bg-blue-50' },
                  { label: 'Add New Course', sub: 'Create curriculum', path: '/admin/courses', color: 'text-primary bg-primary/5' },
                  { label: 'View Revenue', sub: 'Financial reports', path: '/admin/revenue', color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Manage Students', sub: 'All registered users', path: '/admin/students', color: 'text-purple-600 bg-purple-50' },
                ].map(a => (
                  <Link key={a.path} href={a.path}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 group">
                    <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{a.label}</p>
                      <p className="text-xs text-gray-400">{a.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform health */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Platform Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Paid Enrollments', value: fmt(stats?.paidEnrollments) },
                  { label: 'Pending Requests', value: fmt(stats?.pendingEnrollments), warn: (stats?.pendingEnrollments || 0) > 0 },
                  { label: 'Rejected Payments', value: fmt(stats?.rejectedPayments) },
                  { label: 'Certificates Issued', value: fmt(stats?.completedCertificates) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{item.label}</span>
                    <span className={`font-bold ${item.warn ? 'text-amber-600' : 'text-gray-900'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                    <td className="py-3.5 px-6 text-gray-400">{new Date(e.enrolledAt).toLocaleDateString()}</td>
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
                      <td className="py-3.5 px-6 text-gray-400">{new Date(inq.createdAt).toLocaleDateString()}</td>
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
    </AdminLayout>
  );
}
