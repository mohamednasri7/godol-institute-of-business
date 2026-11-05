import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, CheckCircle, XCircle,
  Eye, BookOpen, X, Star, Users, Filter, Upload
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const STATUS_COLOR = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-gray-100 text-gray-500',
  archived: 'bg-yellow-100 text-yellow-700'
};
const APPROVAL_COLOR = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600'
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', price: 0, level: 'Beginner',
    categoryName: '', instructorId: null, instructorName: '', thumbnail: '',
    status: 'draft', approvalStatus: 'pending', featured: false
  });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchCourses = () => apiFetch('/api/admin/courses').then(setCourses).catch(console.error);
  const fetchInstructors = () => apiFetch('/api/admin/instructors').then(setInstructors).catch(() => {});
  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, []);

  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, thumbnail: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setEditingCourse(null);
    setForm({
      title: '', description: '', price: 0, level: 'Beginner',
      categoryName: '', instructorId: instructors[0]?.id || null,
      instructorName: instructors[0]?.name || '',
      thumbnail: '', status: 'draft', approvalStatus: 'pending', featured: false
    });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingCourse(c);
    setForm({
      title: c.title, description: c.description, price: c.price, level: c.level,
      categoryName: c.categoryName, instructorId: c.instructorId || null,
      instructorName: c.instructorName || '',
      thumbnail: c.thumbnail || '', status: c.status, approvalStatus: c.approvalStatus, featured: !!c.featured
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingCourse) {
        await apiFetch(`/api/admin/courses/${editingCourse.id}`, { method: 'PUT', body: JSON.stringify(form) });
        showToast('Course updated.');
      } else {
        await apiFetch('/api/admin/courses', { method: 'POST', body: JSON.stringify(form) });
        showToast('Course created.');
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleApprove = async (course) => {
    try {
      await apiFetch(`/api/admin/courses/${course.id}/approve`, { method: 'PUT', body: JSON.stringify({}) });
      showToast(`"${course.title}" approved and published.`);
      fetchCourses();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleReject = async (course) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await apiFetch(`/api/admin/courses/${course.id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
      showToast('Course rejected.');
      fetchCourses();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (course) => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/courses/${course.id}`, { method: 'DELETE' });
      showToast('Course deleted.');
      fetchCourses();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const toggleFeatured = async (course) => {
    await apiFetch(`/api/admin/courses/${course.id}`, { method: 'PUT', body: JSON.stringify({ featured: !course.featured }) });
    fetchCourses();
  };

  const togglePublish = async (course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    await apiFetch(`/api/admin/courses/${course.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    fetchCourses();
  };

  const filtered = courses.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || (c.instructorName || '').toLowerCase().includes(q) || (c.categoryName || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || c.approvalStatus === filterStatus || c.status === filterStatus;
    return matchQ && matchStatus;
  });

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary";

  return (
    <AdminLayout title="Course Management" subtitle="Manage all courses — approve, publish, and configure">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {['all', 'pending', 'approved', 'rejected', 'published', 'draft'].map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${filterStatus === f ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Course</th>
                  <th className="py-3.5 px-5">Instructor</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Students</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Approval</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img src={c.thumbnail || '/course-business.png'} alt={c.title} className="w-10 h-7 object-cover rounded-lg flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900 max-w-[180px] truncate">{c.title}</div>
                          <div className="text-[10px] text-gray-400">{c.categoryName}</div>
                          {c.featured && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-600">{c.instructorName || '—'}</td>
                    <td className="py-4 px-5 font-bold text-gray-900">{c.price === 0 ? 'Free' : `$${c.price}`}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" />{c.enrolledCount || 0}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${APPROVAL_COLOR[c.approvalStatus] || 'bg-gray-100 text-gray-500'}`}>{c.approvalStatus}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.approvalStatus === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(c)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700">Approve</button>
                            <button onClick={() => handleReject(c)} className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600">Reject</button>
                          </>
                        )}
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => toggleFeatured(c)} className={`p-1.5 rounded-lg hover:bg-gray-100 ${c.featured ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`} title="Toggle featured">
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Course Title *">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g. Business Strategy Masterclass" />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (USD)">
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className={inputCls} />
                </Field>
                <Field label="Level">
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className={inputCls}>
                    {['Beginner', 'Intermediate', 'Advanced', 'All Levels'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <input value={form.categoryName} onChange={e => setForm(f => ({ ...f, categoryName: e.target.value }))} className={inputCls} placeholder="e.g. Business Strategy" />
                </Field>
                <Field label="Faculty Instructor">
                  <select
                    value={form.instructorId || ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const inst = instructors.find(i => i.id === id);
                      setForm(f => ({
                        ...f,
                        instructorId: id || null,
                        instructorName: inst ? inst.name : ''
                      }));
                    }}
                    className={inputCls}
                  >
                    <option value="">Select Instructor...</option>
                    {instructors.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.title})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Thumbnail / Cover Image</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <img
                    src={form.thumbnail || '/course-business.png'}
                    alt="Preview"
                    className="w-16 h-11 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all">
                        <Upload className="w-3 h-3" />
                        <span>Upload Cover</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, thumbnail: '/course-business.png' }))}
                        className="px-2 py-1 text-[11px] bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        Business
                      </button>
                    </div>
                    <input
                      value={form.thumbnail}
                      onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                      className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-gray-200 outline-none"
                      placeholder="Or paste image URL (https://...)"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Publish Status">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
                <Field label="Approval Status">
                  <select value={form.approvalStatus} onChange={e => setForm(f => ({ ...f, approvalStatus: e.target.value }))} className={inputCls}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-gray-700 font-medium">Feature this course on homepage</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90">
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
