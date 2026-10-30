import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, ShieldOff, ShieldCheck, Edit3, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchStudents = () => {
    apiFetch('/api/admin/students').then(setStudents).catch(console.error);
  };

  useEffect(() => { fetchStudents(); }, []);

  const openDetail = async (student) => {
    setSelected(student);
    setShowDetail(true);
    setNotes(student.adminNotes || '');
    try {
      const d = await apiFetch(`/api/admin/students/${encodeURIComponent(student.email)}`);
      setDetail(d);
    } catch { setDetail(null); }
  };

  const handleSuspend = async (student) => {
    if (!confirm(`Suspend ${student.name || student.email}? They will not be able to enroll in new courses.`)) return;
    try {
      await apiFetch(`/api/admin/students/${encodeURIComponent(student.email)}/suspend`, { method: 'PUT', body: JSON.stringify({}) });
      showToast('Account suspended.');
      fetchStudents();
      if (showDetail) setShowDetail(false);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleActivate = async (student) => {
    try {
      await apiFetch(`/api/admin/students/${encodeURIComponent(student.email)}/activate`, { method: 'PUT', body: JSON.stringify({}) });
      showToast('Account reactivated.');
      fetchStudents();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleSaveNotes = async () => {
    try {
      await apiFetch(`/api/admin/students/${encodeURIComponent(selected.email)}/notes`, {
        method: 'PUT', body: JSON.stringify({ notes })
      });
      setIsEditing(false);
      showToast('Notes saved.');
      fetchStudents();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const exportCSV = () => {
    const rows = filtered.map(s => [s.name || '', s.email, s.phone || '', s.registeredAt ? new Date(s.registeredAt).toLocaleDateString() : '', s.coursesEnrolled || 0, s.approvedCourses || 0, `$${s.totalVerifiedPayments || 0}`, s.status || 'active']);
    const header = ['Name','Email','Phone','Registered','Enrolled','Approved','Total Paid','Status'];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
  };

  const filtered = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchQ = !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <AdminLayout title="Student Management" subtitle="View and manage student accounts">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {['all', 'active', 'suspended'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search name, email, phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary" />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-primary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <p className="text-xs text-gray-500">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">Contact</th>
                  <th className="py-3.5 px-5">Enrolled</th>
                  <th className="py-3.5 px-5">Paid</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Registered</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((s, i) => (
                  <tr key={s.email || i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(s.name || s.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{s.name || '—'}</div>
                          <div className="text-[11px] text-gray-400">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-500">{s.phone || '—'}</td>
                    <td className="py-4 px-5">
                      <span className="font-bold text-gray-900">{s.approvedCourses || 0}</span>
                      <span className="text-gray-400"> / {s.coursesEnrolled || 0}</span>
                      <div className="text-[10px] text-gray-400">active / total</div>
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-900">${(s.totalVerifiedPayments || 0).toLocaleString()}</td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(s.status || 'active') === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-400">
                      {s.registeredAt ? new Date(s.registeredAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(s)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100" title="View profile">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(s.status || 'active') === 'active'
                          ? <button onClick={() => handleSuspend(s)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100" title="Suspend"><ShieldOff className="w-4 h-4" /></button>
                          : <button onClick={() => handleActivate(s)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100" title="Activate"><ShieldCheck className="w-4 h-4" /></button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {showDetail && selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={() => setShowDetail(false)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Student Profile</h3>
              <button onClick={() => setShowDetail(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                  {(selected.name || selected.email)[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{selected.name || '—'}</h4>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${(selected.status || 'active') === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {selected.status || 'active'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[['Phone', selected.phone], ['WhatsApp', selected.whatsapp], ['Registered', selected.registeredAt ? new Date(selected.registeredAt).toLocaleDateString() : '—']].map(([k, v]) => v && (
                  <div key={k} className="flex justify-between border-b border-gray-100 py-2">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-900 font-medium">{v}</span>
                  </div>
                ))}
              </div>

              {/* Enrollments */}
              {detail?.enrollments && (
                <div>
                  <h5 className="font-bold text-gray-800 mb-3">Enrollments ({detail.enrollments.length})</h5>
                  <div className="space-y-2">
                    {detail.enrollments.map(e => (
                      <div key={e.id} className="bg-gray-50 rounded-xl p-3 text-xs">
                        <div className="font-semibold text-gray-900 truncate">{e.courseTitle}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${e.accessGranted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {e.enrollmentStatus}
                          </span>
                          <span className="text-gray-500">{e.progress || 0}% complete</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {detail?.payments && (
                <div>
                  <h5 className="font-bold text-gray-800 mb-3">Payments ({detail.payments.length})</h5>
                  <div className="space-y-2">
                    {detail.payments.map(p => (
                      <div key={p.id} className="bg-gray-50 rounded-xl p-3 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold truncate max-w-[160px]">{p.courseTitle}</div>
                          <div className="text-gray-400 font-mono mt-0.5">{p.transactionRef}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${p.verifiedAmount || p.claimedAmount}</div>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-gray-800">Admin Notes (Private)</h5>
                  <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {isEditing ? (
                  <div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary resize-none" />
                    <button onClick={handleSaveNotes} className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90">Save Notes</button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 min-h-[60px]">
                    {notes || 'No notes yet.'}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {(selected.status || 'active') === 'active'
                  ? <button onClick={() => handleSuspend(selected)} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50">Suspend Account</button>
                  : <button onClick={() => handleActivate(selected)} className="flex-1 py-2.5 rounded-xl border border-emerald-200 text-emerald-600 text-xs font-bold hover:bg-emerald-50">Activate Account</button>
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
