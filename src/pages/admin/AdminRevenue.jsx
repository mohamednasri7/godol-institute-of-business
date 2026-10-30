import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, BarChart3, Download, Filter,
  RefreshCw, CheckCircle, Clock, XCircle
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</div>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRevenue = () => {
    setIsLoading(true);
    apiFetch('/api/admin/revenue').then(setData).catch(console.error).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchRevenue(); }, []);

  const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const exportCSV = () => {
    if (!data?.transactions) return;
    const rows = data.transactions.map(p => [
      p.id, new Date(p.submittedAt).toLocaleDateString(), p.studentName, p.studentEmail,
      p.courseTitle, p.coursePrice, p.claimedAmount, p.verifiedAmount || '',
      p.status, p.provider, p.transactionRef, p.verifiedBy || ''
    ]);
    const header = ['ID','Date','Student','Email','Course','Course Price','Claimed','Verified','Status','Provider','Reference','Verified By'];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'godol-revenue-report.csv'; a.click();
  };

  const statusBadge = (s) => {
    const map = { verified: 'bg-emerald-100 text-emerald-700', pending_verification: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-600' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>;
  };

  const maxBar = data?.byMonth ? Math.max(...data.byMonth.map(m => m.revenue), 1) : 1;

  return (
    <AdminLayout title="Revenue & Financial Reports" subtitle="Verified payments and collected revenue — only confirmed amounts counted">
      <div className="space-y-7">
        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={fetchRevenue} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-primary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Total Verified Revenue" value={fmt(data?.totalRevenue)} sub="All time, confirmed only" color="text-emerald-700" />
              <StatCard label="Revenue This Month" value={fmt(data?.revenueThisMonth)} sub="Verified this calendar month" />
              <StatCard label="Revenue This Year" value={fmt(data?.revenueThisYear)} sub="Year to date" />
              <StatCard label="Pending (Unverified)" value={fmt(data?.pendingAmount)} sub="Not counted as revenue" color="text-amber-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard label="Paid Enrollments" value={(data?.paidCount || 0).toLocaleString()} sub="Verified payments" />
              <StatCard label="Free Enrollments" value={(data?.freeEnrollments || 0).toLocaleString()} sub="Zero-cost courses" />
              <StatCard label="Avg per Transaction" value={data?.paidCount ? fmt((data.totalRevenue || 0) / data.paidCount) : '$0'} sub="Average verified amount" />
            </div>

            {/* Revenue by month chart */}
            {data?.byMonth && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-5">Monthly Revenue (Last 12 Months)</h3>
                <div className="flex items-end gap-2 h-40">
                  {data.byMonth.map(m => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[9px] text-gray-500 font-bold">{m.revenue > 0 ? fmt(m.revenue) : ''}</div>
                      <div className="w-full bg-primary/20 rounded-t-md relative group"
                        style={{ height: `${Math.max((m.revenue / maxBar) * 120, m.revenue > 0 ? 4 : 1)}px` }}>
                        <div className="absolute inset-0 bg-primary rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[9px] text-gray-400 text-center">{m.month.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue by course + provider */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Revenue by Course</h3>
                <div className="space-y-3">
                  {(data?.byCourse || []).slice(0, 8).map(c => {
                    const pct = data?.totalRevenue ? Math.round((c.revenue / data.totalRevenue) * 100) : 0;
                    return (
                      <div key={c.courseTitle}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-gray-700 font-medium truncate max-w-[60%]">{c.courseTitle}</span>
                          <span className="font-bold text-gray-900">{fmt(c.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{c.count} enrollment{c.count !== 1 ? 's' : ''} • {pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Revenue by Payment Provider</h3>
                <div className="space-y-3">
                  {(data?.byProvider || []).map(p => {
                    const pct = data?.totalRevenue ? Math.round((p.revenue / data.totalRevenue) * 100) : 0;
                    return (
                      <div key={p.provider}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-gray-700 font-medium">{p.provider}</span>
                          <span className="font-bold text-gray-900">{fmt(p.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{p.count} transaction{p.count !== 1 ? 's' : ''} • {pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">All Transactions</h3>
                <button onClick={exportCSV} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Student</th>
                      <th className="py-3 px-5">Course</th>
                      <th className="py-3 px-5">Claimed</th>
                      <th className="py-3 px-5">Verified</th>
                      <th className="py-3 px-5">Provider</th>
                      <th className="py-3 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {(data?.transactions || []).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3.5 px-5 text-gray-500">{new Date(p.submittedAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-5 font-semibold text-gray-900">{p.studentName}</td>
                        <td className="py-3.5 px-5 text-gray-600 max-w-[160px] truncate">{p.courseTitle}</td>
                        <td className="py-3.5 px-5">${p.claimedAmount}</td>
                        <td className="py-3.5 px-5 font-bold text-emerald-700">{p.verifiedAmount ? `$${p.verifiedAmount}` : '—'}</td>
                        <td className="py-3.5 px-5">{p.provider}</td>
                        <td className="py-3.5 px-5">{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

