import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Filter, Search } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const ACTION_LABELS = {
  payment_verified: { label: 'Payment Verified', color: 'bg-emerald-100 text-emerald-700' },
  payment_rejected: { label: 'Payment Rejected', color: 'bg-red-100 text-red-600' },
  enrollment_approved: { label: 'Enrollment Approved', color: 'bg-blue-100 text-blue-700' },
  enrollment_rejected: { label: 'Enrollment Rejected', color: 'bg-orange-100 text-orange-700' },
  course_approved: { label: 'Course Approved', color: 'bg-purple-100 text-purple-700' },
  course_rejected: { label: 'Course Rejected', color: 'bg-gray-100 text-gray-500' },
  access_revoked: { label: 'Access Revoked', color: 'bg-red-100 text-red-600' },
  student_suspended: { label: 'Student Suspended', color: 'bg-red-100 text-red-600' },
  student_activated: { label: 'Student Activated', color: 'bg-emerald-100 text-emerald-700' },
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiFetch('/api/admin/audit-logs').then(setLogs).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const filtered = logs.filter(log => {
    const q = searchTerm.toLowerCase();
    const matchQ = !q || log.details.toLowerCase().includes(q) || log.adminEmail.toLowerCase().includes(q);
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchQ && matchAction;
  });

  return (
    <AdminLayout title="Audit Logs" subtitle="Complete record of all administrative actions">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary">
            <option value="all">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([k, { label }]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary" />
          </div>
          <button onClick={() => apiFetch('/api/admin/audit-logs').then(setLogs)} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500">{filtered.length} log entries</p>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No audit log entries found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(log => {
                const cfg = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-500' };
                return (
                  <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400">By: {log.adminEmail}</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

