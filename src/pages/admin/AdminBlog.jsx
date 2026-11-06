import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, BarChart3, ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Users, CheckCircle, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const defaultPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'Business',
  author: 'Godol Editorial',
  authorId: null,
  featuredImageUrl: '',
  status: 'published',
  readTime: '5 min read'
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultPost);
  const [editingId, setEditingId] = useState(null);
  const [selectedMetricsPost, setSelectedMetricsPost] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchPosts = () => {
    apiFetch('/api/admin/posts')
      .then(setPosts)
      .catch((err) => {
        console.error('Failed to load posts, trying legacy endpoint:', err);
        apiFetch('/api/admin/blog').then(setPosts).catch(console.error);
      });
  };

  const fetchInstructors = () => {
    apiFetch('/api/admin/instructors').then(setInstructors).catch(() => {});
  };

  useEffect(() => {
    fetchPosts();
    fetchInstructors();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultPost);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setEditingId(post.id);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Business',
      author: post.authorName || post.author || 'Godol Editorial',
      authorId: post.authorId || null,
      featuredImageUrl: post.featuredImageUrl || post.featured_image_url || '',
      status: post.status || (post.published ? 'published' : 'draft'),
      readTime: post.readTime || '5 min read'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this article? This will also remove all associated metrics.')) {
      try {
        await apiFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
        setFeedback({ type: 'success', text: 'Article deleted successfully.' });
        fetchPosts();
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', text: 'Failed to delete article.' });
      }
    }
  };

  const handleViewMetrics = async (post) => {
    setMetricsLoading(true);
    setSelectedMetricsPost(post);
    try {
      const data = await apiFetch(`/api/admin/posts/${post.id}/metrics`);
      setSelectedMetricsPost(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        featured_image_url: formData.featuredImageUrl
      };

      if (editingId) {
        await apiFetch(`/api/admin/posts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setFeedback({ type: 'success', text: 'Article updated successfully!' });
      } else {
        await apiFetch('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setFeedback({ type: 'success', text: 'New article published successfully!' });
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Failed to save article. Please try again.' });
    }
  };

  const handleAuthorChange = (val) => {
    if (val === 'editorial') {
      setFormData({
        ...formData,
        author: 'Godol Editorial',
        authorId: null
      });
    } else {
      const inst = instructors.find(i => String(i.id) === String(val));
      if (inst) {
        setFormData({
          ...formData,
          author: inst.name,
          authorId: inst.id
        });
      }
    }
  };

  // Derive aggregated stats across all posts
  const totalViews = posts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.metrics?.commentsCount || 0), 0);

  return (
    <AdminLayout title="Multi-Author Blog & Insights" subtitle="Manage articles, assign authors, track analytics, and enforce RBAC">
      <div className="space-y-6">
        {feedback && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="font-bold hover:opacity-75">×</button>
          </div>
        )}

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Total Posts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{posts.length}</span>
              <span className="text-xs text-emerald-600 font-medium">
                {posts.filter(p => p.status === 'published' || p.published).length} published
              </span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Total Post Views
            </span>
            <span className="text-2xl font-bold text-gray-900">{totalViews}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5 text-amber-500" /> Reader Likes
            </span>
            <span className="text-2xl font-bold text-gray-900">{totalLikes}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> Reader Comments
            </span>
            <span className="text-2xl font-bold text-gray-900">{totalComments}</span>
          </div>
        </div>

        {/* Table & Controls Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-xs text-gray-500">
            Admins have full CRUD & metrics access across all posts. Instructors can manage only their own posts.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>

        {/* Posts Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Article & Slug</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author / Owner</th>
                  <th className="py-3.5 px-4">Metrics</th>
                  <th className="py-3.5 px-4">Published</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No articles created yet. Click "Write New Article" above to create one.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    const isPub = post.status === 'published' || post.published === true;
                    const views = post.metrics?.views || 0;
                    const likes = post.metrics?.likes || 0;
                    const comments = post.metrics?.commentsCount || 0;

                    return (
                      <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex items-center gap-3">
                            {(post.featuredImageUrl || post.featured_image_url) ? (
                              <img
                                src={post.featuredImageUrl || post.featured_image_url}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{post.title}</p>
                              <p className="text-[10px] text-gray-400 font-mono truncate">/{post.slug || `post-${post.id}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPub ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPub ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-600">
                          {post.category || 'Business'}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{post.authorName || post.author || 'Godol Editorial'}</p>
                            <p className="text-[10px] text-gray-400">
                              {post.authorRole === 'instructor' ? 'Faculty Instructor' : 'Admin / Editorial'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewMetrics(post)}
                            className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Click to view full metrics breakdown"
                          >
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <Eye className="w-3 h-3 text-blue-500" /> {views}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <ThumbsUp className="w-3 h-3 text-amber-500" /> {likes}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <MessageSquare className="w-3 h-3 text-purple-500" /> {comments}
                            </span>
                          </button>
                        </td>
                        <td className="py-4 px-4 text-gray-500 text-[11px]">
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewMetrics(post)}
                              title="View Analytics"
                              className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(post)}
                              title="Edit Article"
                              className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              title="Delete Article"
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Write / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8 border border-gray-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold mb-1 text-gray-900">
              {editingId ? 'Edit Article & Permissions' : 'Write New Article'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Admins can author posts directly or assign authorship to any registered instructor with RBAC tracking.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scaling Supply Chains Across the Horn of Africa"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">URL Slug</label>
                  <input
                    type="text"
                    placeholder="auto-generated-from-title"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-900 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900 font-semibold"
                  >
                    <option value="published">Published (Visible to public readers)</option>
                    <option value="draft">Draft (Restricted to admin & author)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Author & RBAC Owner *</label>
                  <select
                    value={formData.authorId ? String(formData.authorId) : 'editorial'}
                    onChange={(e) => handleAuthorChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900"
                  >
                    <option value="editorial">Godol Editorial (Admin Team)</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={String(i.id)}>
                        {i.name} ({i.title || 'Instructor'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none bg-white text-gray-900"
                  >
                    <option value="Business">Business</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Finance">Finance</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Featured Image URL (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or /path/to/image.jpg"
                    value={formData.featuredImageUrl}
                    onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-gray-900"
                  />
                  {formData.featuredImageUrl && (
                    <img
                      src={formData.featuredImageUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Excerpt / Summary *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short introductory summary for cards and search snippets..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Full Content (Supports Rich Text / HTML) *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write the full article body. You can use standard paragraphs or HTML formatting tags like <h2>, <p>, <blockquote>, <ul>, etc."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-mono text-[11px] text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Analytics Modal */}
      {selectedMetricsPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setSelectedMetricsPost(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-bold text-gray-900">Post Performance Analytics</h3>
            </div>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Real-time analytics recorded for "{selectedMetricsPost.post?.title || selectedMetricsPost.title}"
            </p>

            {metricsLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading metrics...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                    <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block mb-1">
                      Total Views
                    </span>
                    <span className="text-3xl font-extrabold text-blue-900 font-mono">
                      {selectedMetricsPost.metrics?.views || 0}
                    </span>
                  </div>
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
                    <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider block mb-1">
                      Unique Visitors
                    </span>
                    <span className="text-3xl font-extrabold text-indigo-900 font-mono">
                      {selectedMetricsPost.metrics?.uniqueVisitors || 0}
                    </span>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                      Reader Likes
                    </span>
                    <span className="text-3xl font-extrabold text-amber-900 font-mono">
                      {selectedMetricsPost.metrics?.likes || 0}
                    </span>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
                      Social Shares
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-900 font-mono">
                      {selectedMetricsPost.metrics?.shares || 0}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      Comments ({selectedMetricsPost.comments?.length || selectedMetricsPost.metrics?.commentsCount || 0})
                    </span>
                  </div>
                  {(!selectedMetricsPost.comments || selectedMetricsPost.comments.length === 0) ? (
                    <p className="text-[11px] text-gray-500 italic">No comments received on this post yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedMetricsPost.comments.map((c) => (
                        <div key={c.id} className="bg-white p-2.5 rounded-xl border border-gray-200 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                            <span className="font-semibold text-gray-800">{c.authorName}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-700 text-[11px]">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedMetricsPost(null)}
                    className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800"
                  >
                    Close Analytics
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
