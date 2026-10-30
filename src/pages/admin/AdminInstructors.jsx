import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const defaultInst = {
  name: '',
  title: '',
  bio: '',
  rating: 4.9,
  reviewCount: 50,
  studentCount: 500,
  courseCount: 3,
  avatar: '/instructor-1.png'
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
    <AdminLayout title="Faculty & Instructors" subtitle="Manage faculty profiles and bios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {instructors.length} active faculty profiles
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4">
              {editingId ? 'Edit Instructor' : 'Add Instructor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Title / Designation</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Bio</label>
                <textarea
                  rows={3}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Courses Count</label>
                  <input
                    type="number"
                    value={formData.courseCount}
                    onChange={(e) => setFormData({ ...formData, courseCount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

