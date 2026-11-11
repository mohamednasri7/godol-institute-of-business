import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const COLORS = ['#f5a614', '#2563eb', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#f97316'];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'tag', color: '#2563eb', courseCount: 0 });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetch = () => apiFetch('/api/admin/categories').then(setCategories).catch(console.error);
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', icon: 'tag', color: '#2563eb', courseCount: 0 }); setShowModal(true); };
  const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, icon: cat.icon, color: cat.color, courseCount: cat.courseCount || 0 }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Category name is required.', 'error'); return; }
    try {
      if (editing) {
        await apiFetch(`/api/admin/categories/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        showToast('Category updated.');
      } else {
        await apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(form) });
        showToast('Category created.');
      }
      setShowModal(false);
      fetch();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? This does not delete courses in it.`)) return;
    try {
      await apiFetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
      showToast('Category deleted.');
      fetch();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <AdminLayout title="Category Management" subtitle="Manage course categories displayed on the platform">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{categories.length} categories</p>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '22' }}>
                  <Tag className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.courseCount || 0} courses</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary" placeholder="e.g. Business Strategy" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course Count (display)</label>
                <input type="number" value={form.courseCount} onChange={e => setForm(f => ({ ...f, courseCount: Number(e.target.value) }))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90">
                {editing ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

