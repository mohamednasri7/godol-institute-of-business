import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const defaultWorkshop = {
  title: '',
  slug: '',
  description: '',
  location: 'Bosaso, Somalia',
  date: 'July 25–26, 2026',
  durationHours: '16 Hours / 2 Days',
  capacity: 30,
  enrolledCount: 0,
  price: 150,
  status: 'upcoming',
  featured: false,
  tag: 'New',
  seats: 25
};

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultWorkshop);
  const [editingId, setEditingId] = useState(null);

  const fetchWorkshops = () => {
    apiFetch('/api/admin/workshops').then(setWorkshops).catch(console.error);
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultWorkshop);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingId(w.id);
    setFormData({ ...w });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete workshop?')) {
      await apiFetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
      fetchWorkshops();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/admin/workshops/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    } else {
      await apiFetch('/api/admin/workshops', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
    setIsModalOpen(false);
    fetchWorkshops();
  };

  return (
    <AdminLayout
      title="Live Bosaso Workshops"
      subtitle="Manage in-person cohorts, dates, and seat availability"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">{workshops.length} scheduled workshops</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workshop</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">Workshop</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Location</th>
                <th className="py-3.5 px-6">Price</th>
                <th className="py-3.5 px-6">Seats Left</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {workshops.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900">
                    <div>{w.title}</div>
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                      {w.tag || 'Upcoming'}
                    </span>
                  </td>
                  <td className="py-4 px-6">{w.date}</td>
                  <td className="py-4 px-6">{w.location}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">${w.price}</td>
                  <td className="py-4 px-6">{w.seats || 20}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(w)}
                        className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4">
              {editingId ? 'Edit Workshop' : 'Schedule Workshop'}
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
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Seats Available</label>
                  <input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tag (e.g. Limited Seats)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
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

