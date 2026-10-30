import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Search, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const defaultCert = {
  studentName: '',
  studentEmail: '',
  courseTitle: 'Strategic Business Planning Masterclass',
  instructorName: 'Dr. Abdi Hassan',
  status: 'issued'
};

export default function AdminCertificates() {
  const [certs, setCerts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultCert);

  const fetchCerts = () => {
    apiFetch('/api/admin/certificates').then(setCerts).catch(console.error);
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Delete certificate?')) {
      await apiFetch(`/api/admin/certificates/${id}`, { method: 'DELETE' });
      fetchCerts();
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    await apiFetch('/api/admin/certificates', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    setIsModalOpen(false);
    fetchCerts();
  };

  return (
    <AdminLayout
      title="Issued Certificates"
      subtitle="View credentials and issue accredited course completions"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">{certs.length} verified certificates</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">Certificate ID</th>
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-6">Course</th>
                <th className="py-3.5 px-6">Issue Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {certs.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-gray-900">
                    {c.certificateNumber}
                  </td>
                  <td className="py-4 px-6 font-semibold">
                    <div>{c.studentName}</div>
                    <div className="text-[11px] text-gray-400 font-normal">
                      {c.studentEmail}
                    </div>
                  </td>
                  <td className="py-4 px-6">{c.courseTitle}</td>
                  <td className="py-4 px-6 text-gray-500">{c.issueDate}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <h3 className="font-bold text-base mb-4">Issue New Certificate</h3>
            <form onSubmit={handleIssue} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Student Email</label>
                <input
                  type="email"
                  required
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.courseTitle}
                  onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
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
                  Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

