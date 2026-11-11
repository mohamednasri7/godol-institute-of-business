import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, CheckCircle, XCircle, RefreshCw,
  ShieldOff, X, Download, MessageCircle, ArrowUpDown
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

const ENROLLMENT_STATUS = {
  pending_payment: { label: 'Pending Payment', color: 'bg-gray-100 text-gray-600' },
  pending_verification: { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700' },
  pending_approval: { label: 'Pending Approval', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
  completed: { label: 'Completed', color: 'bg-indigo-100 text-indigo-700' }
};

function StatusBadge({ status }) {
  const cfg = ENROLLMENT_STATUS[status] || { label: status, color: 'bg-gray-100 text-gray-500' };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>;
}

function AccessBadge({ granted }) {
  return granted
    ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Access Active</span>
    : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">No Access</span>;
}

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isActing, setIsActing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEnrollments = () => {
    setIsLoading(true);
    const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    apiFetch(`/api/admin/enrollments${qs}`)
      .then(setEnrollments)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchEnrollments(); }, [statusFilter]);

  // Instant Realtime sync: new student enrollments appear live
  useRealtimeSync(['enrollments', 'payments'], fetchEnrollments);

  const handleApprove = async (enrollment) => {
    if (!confirm(`Approve enrollment for ${enrollment.studentName} in "${enrollment.courseTitle}"?`)) return;
    setIsActing(true);
    try {
      await apiFetch(`/api/admin/enrollments/${enrollment.id}/approve`, { method: 'PUT', body: JSON.stringify({}) });
      showToast('Enrollment approved. Course access granted.');
      fetchEnrollments();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setIsActing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please enter a reason.', 'error'); return; }
    setIsActing(true);
    try {
      await apiFetch(`/api/admin/enrollments/${selected.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason })
      });
      setShowRejectModal(false);
      showToast('Enrollment rejected. Student notified.');
      fetchEnrollments();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setIsActing(false); }
  };

  const handleRevoke = async (enrollment) => {
    if (!confirm(`Revoke course access for ${enrollment.studentName}?`)) return;
    try {
      await apiFetch(`/api/admin/enrollments/${enrollment.id}/revoke`, { method: 'PUT', body: JSON.stringify({}) });
      showToast('Access revoked.');
      fetchEnrollments();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const exportCSV = () => {
    const rows = filtered.map(e => [
      e.id, e.studentName, e.studentEmail, e.studentPhone,
      e.courseTitle, e.coursePrice,
      e.enrollmentStatus, e.paymentStatus,
      e.accessGranted ? 'Yes' : 'No', e.progress + '%',
      new Date(e.enrolledAt).toLocaleDateString()
    ]);
    const header = ['ID','Name','Email','Phone','Course','Price','Enrollment Status','Payment Status','Access','Progress','Date'];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'enrollments.csv'; a.click();
  };

  const filtered = enrollments.filter(e => {
    const q = searchTerm.toLowerCase();
    return !q || (e.studentName || '').toLowerCase().includes(q) ||
      (e.courseTitle || '').toLowerCase().includes(q) ||
      (e.studentEmail || '').toLowerCase().includes(q);
  });

  const statusTabs = ['all', 'pending_verification', 'approved', 'rejected', 'completed', 'pending_payment'];

  return (
    <AdminLayout title="Enrollment Management" subtitle="Track and control student course access">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto">
            {statusTabs.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {s === 'all' ? 'All' : ENROLLMENT_STATUS[s]?.label || s}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary" />
          </div>
          <button onClick={fetchEnrollments} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-primary transition-colors">
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>

        {/* Count */}
        <p className="text-xs text-gray-500">{filtered.length} enrollment{filtered.length !== 1 ? 's' : ''}</p>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">No enrollments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Course</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Enrollment</th>
                    <th className="py-3.5 px-5">Access</th>
                    <th className="py-3.5 px-5">Progress</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filtered.map(enr => (
                    <tr key={enr.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900">{enr.studentName}</div>
                        <div className="text-[11px] text-gray-400">{enr.studentEmail}</div>
                        {enr.studentPhone && <div className="text-[11px] text-gray-400">{enr.studentPhone}</div>}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-medium text-gray-800 max-w-[180px] truncate">{enr.courseTitle}</div>
                      </td>
                      <td className="py-4 px-5 font-bold text-gray-900">${enr.coursePrice || 0}</td>
                      <td className="py-4 px-5"><StatusBadge status={enr.enrollmentStatus} /></td>
                      <td className="py-4 px-5"><AccessBadge granted={enr.accessGranted} /></td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${enr.progress || 0}%` }} />
                          </div>
                          <span className="font-bold text-gray-700">{enr.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-gray-400">{new Date(enr.enrolledAt).toLocaleDateString()}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {(enr.enrollmentStatus === 'pending_verification' || enr.enrollmentStatus === 'pending_approval') && (
                            <>
                              <button onClick={() => handleApprove(enr)} disabled={isActing}
                                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700">
                                Approve
                              </button>
                              <button onClick={() => { setSelected(enr); setRejectReason(''); setShowRejectModal(true); }}
                                className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600">
                                Reject
                              </button>
                            </>
                          )}
                          {enr.accessGranted && (
                            <button onClick={() => handleRevoke(enr)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100" title="Revoke access">
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Reject Enrollment</h3>
              <button onClick={() => setShowRejectModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Rejecting <strong>{selected.studentName}</strong>'s enrollment in "{selected.courseTitle}".</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} required
              placeholder="Reason for rejection (shared with student)..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold">Cancel</button>
              <button onClick={handleReject} disabled={isActing}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-60">
                {isActing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
