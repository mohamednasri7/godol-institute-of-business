import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const defaultPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'Business',
  author: 'Godol Editorial',
  readTime: '5 min read',
  published: true,
  featured: false
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultPost);
  const [editingId, setEditingId] = useState(null);

  const fetchPosts = () => {
    apiFetch('/api/admin/blog').then(setPosts).catch(console.error);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultPost);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setEditingId(post.id);
    setFormData({ ...post });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete article?')) {
      await apiFetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      fetchPosts();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/admin/blog/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    } else {
      await apiFetch('/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
    setIsModalOpen(false);
    fetchPosts();
  };

  return (
    <AdminLayout title="Blog & Insights" subtitle="Publish articles and business thought-leadership">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">{posts.length} published articles</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Write Article</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">Title</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Author</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900 max-w-xs truncate">
                    {post.title}
                  </td>
                  <td className="py-4 px-6">{post.category}</td>
                  <td className="py-4 px-6">{post.author}</td>
                  <td className="py-4 px-6 text-gray-500">{post.publishedAt || '2026'}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(post)}
                        className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4">
              {editingId ? 'Edit Article' : 'Write New Article'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Author</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Excerpt</label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Article Content</label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold"
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

