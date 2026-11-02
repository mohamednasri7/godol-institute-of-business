import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Camera, Check } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const defaultInst = {
  name: '',
  title: '',
  bio: '',
  email: '',
  phone: '',
  rating: 4.9,
  reviewCount: 50,
  studentCount: 500,
  courseCount: 1,
  avatar: '/instructor-1.png',
  status: 'active'
};

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultInst);
  const [editingId, setEditingId] = useState(null);

  const fetchInstructors = () => {
    apiFetch('/api/admin/instructors').then(setInstructors).catch(console.error);
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

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
    setFormData(defaultInst);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inst) => {
    setEditingId(inst.id);
    setFormData({ ...inst });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete instructor?')) {
      await apiFetch(`/api/admin/instructors/${id}`, { method: 'DELETE' });
      fetchInstructors();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/admin/instructors/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    } else {
      await apiFetch('/api/admin/instructors', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
    setIsModalOpen(false);
    fetchInstructors();
  };

  return (
    <AdminLayout title="Instructors" subtitle="Manage instructor profiles and bios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {instructors.length} active instructor profiles
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Add Instructor</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map((inst) => (
            <div
              key={inst.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={inst.avatar || '/instructor-1.png'}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{inst.name}</h4>
                    <p className="text-xs text-primary font-medium">{inst.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ★ {inst.rating} • {inst.studentCount} students
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                  {inst.bio}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEdit(inst)}
                  className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(inst.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4">
              {editingId ? 'Edit Faculty Instructor' : 'Add New Instructor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Photo Upload & Preview */}
              <div>
                <label className="block font-semibold mb-1.5 text-gray-700">Instructor Photo / Avatar</label>
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
                      placeholder="Or paste external image URL (https://...)"
                      value={formData.avatar || ''}
                      onChange={(e) => setFormData(f => ({ ...f, avatar: e.target.value }))}
                      className="w-full h-8 px-2.5 text-[11px] bg-white rounded-lg border border-gray-200 outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

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
                    placeholder="e.g. Senior Marketing Director"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    placeholder="faculty@godolinstitute.so"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Phone / WhatsApp (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    placeholder="+252 61 000 0000"
                  />
                </div>
              </div>

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
                  <label className="block font-semibold mb-1 text-gray-700">Courses Count</label>
                  <input
                    type="number"
                    value={formData.courseCount || 0}
                    onChange={(e) => setFormData({ ...formData, courseCount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700">Profile Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                >
                  <option value="active">Active (Visible on Website)</option>
                  <option value="suspended">Suspended (Hidden from Public)</option>
                </select>
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
                  Save Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

