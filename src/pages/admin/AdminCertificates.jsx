import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Search, X, ExternalLink, QrCode, Download } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { exportToCSV } from '../../lib/exportUtils';

const defaultCert = {
  studentName: '',
  studentEmail: '',
  courseTitle: '',
  instructorName: '',
  status: 'issued'
};

export default function AdminCertificates() {
  const [certs, setCerts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultCert);

  const fetchCerts = () => {
    apiFetch('/api/admin/certificates').then(setCerts).catch(console.error);
    apiFetch('/api/admin/courses').then(setCourses).catch(console.error);
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Delete certificate? This invalidates the verification code.')) {
      await apiFetch(`/api/admin/certificates/${id}`, { method: 'DELETE' });
      fetchCerts();
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      certificateNumber: formData.certificateNumber || `GIB-2026-${Math.floor(100000 + Math.random() * 900000)}`
    };
    await apiFetch('/api/admin/certificates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setIsModalOpen(false);
    setFormData(defaultCert);
    fetchCerts();
  };

  const filtered = certs.filter(c => {
    const q = searchTerm.toLowerCase();
    return !q ||
      (c.studentName || '').toLowerCase().includes(q) ||
      (c.certificateNumber || '').toLowerCase().includes(q) ||
      (c.courseTitle || '').toLowerCase().includes(q) ||
      (c.studentEmail || '').toLowerCase().includes(q);
  });

  return (
    <AdminLayout
      title="Issued Certificates"
      subtitle="View credentials and issue accredited course completions"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, certificate serial, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(filtered, 'godol_certificates', [
                { key: 'certificateNumber', label: 'Serial Number' },
                { key: 'studentName', label: 'Student' },
                { key: 'studentEmail', label: 'Email' },
                { key: 'courseTitle', label: 'Course' },
                { key: 'instructorName', label: 'Instructor' },
                { key: 'issueDate', label: 'Issue Date' },
                { key: 'status', label: 'Status' }
              ])}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  ...defaultCert,
                  certificateNumber: `GIB-2026-${Math.floor(100000 + Math.random() * 900000)}`
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Certificate</span>
            </button>
          </div>
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
              {filtered.map((c) => (
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
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/verify/${c.certificateNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                        title="Verify certificate on public portal"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Verify</span>
                      </a>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Delete certificate"
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
                {courses.length > 0 ? (
                  <select
                    value={formData.courseTitle}
                    onChange={(e) => {
                      const selected = courses.find(c => c.title === e.target.value);
                      setFormData({
                        ...formData,
                        courseTitle: e.target.value,
                        instructorName: selected?.instructorName || formData.instructorName
                      });
                    }}
                    required
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none bg-white mb-2"
                  >
                    <option value="">Select a Course</option>
                    {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                  </select>
                ) : null}
                <input
                  type="text"
                  required
                  placeholder="Or enter custom course title"
                  value={formData.courseTitle}
                  onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Instructor / Signatory</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Academic Faculty"
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
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

