import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Users, BookOpen, DollarSign, ClipboardList, Award, CreditCard,
  TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3,
  ArrowRight, RefreshCw, ShieldCheck
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

function StatCard({ label, value, sub, icon: Icon, color, linkTo }) {
  const card = (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${linkTo ? 'cursor-pointer' : ''}`}>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
  return linkTo ? <Link href={linkTo}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      apiFetch('/api/admin/stats'),
      apiFetch('/api/admin/payments?status=pending_verification'),
      apiFetch('/api/admin/enrollments'),
      apiFetch('/api/admin/enquiries').catch(() => [])
    ]).then(([s, pays, enrs, inqs]) => {
      setStats(s);
      setRecentPayments(pays.slice(0, 5));
      setRecentEnrollments(enrs.slice(0, 6));
      setRecentInquiries((inqs || []).slice(0, 5));
      setLastRefreshed(new Date());
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleDeleteInquiry = async (id) => {
    if (confirm('Delete this inquiry?')) {
      await apiFetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => Number(n || 0).toLocaleString();
  const fmtUSD = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-emerald-100 text-emerald-700',
      pending_verification: 'bg-amber-100 text-amber-700',
      pending_payment: 'bg-gray-100 text-gray-600',
      rejected: 'bg-red-100 text-red-600',
      completed: 'bg-blue-100 text-blue-700',
      verified: 'bg-emerald-100 text-emerald-700',
    };
    const labels = {
      approved: 'Approved',
      pending_verification: 'Awaiting Verification',
      pending_payment: 'Pending Payment',
      rejected: 'Rejected',
      completed: 'Completed',
      verified: 'Verified'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-gray-100 text-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <AdminLayout title="Dashboard Overview" subtitle="Real-time platform analytics and management controls">
      <div className="space-y-8">
        {/* Refresh */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Last updated: {lastRefreshed.toLocaleTimeString()}</p>
          <button onClick={fetchData} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Pending alert banner */}
        {stats?.pendingVerification > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">
                {stats.pendingVerification} payment{stats.pendingVerification > 1 ? 's' : ''} awaiting your verification
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Students are waiting for course access. Review and verify their transactions.</p>
            </div>
            <Link href="/admin/payments"
              className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors">
              Verify Now
            </Link>
          </div>
        )}

        {/* Metric Cards Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Verified Revenue" value={fmtUSD(stats?.verifiedRevenue)} sub="Confirmed payments only" icon={DollarSign} color="bg-emerald-600" linkTo="/admin/revenue" />
          <StatCard label="Revenue This Month" value={fmtUSD(stats?.revenueThisMonth)} sub="Verified this calendar month" icon={TrendingUp} color="bg-blue-600" linkTo="/admin/revenue" />
          <StatCard label="Total Students" value={fmt(stats?.totalStudents)} sub="Registered accounts" icon={Users} color="bg-indigo-600" linkTo="/admin/students" />
          <StatCard label="Pending Verification" value={fmt(stats?.pendingVerification)} sub="Need admin review" icon={AlertCircle} color="bg-amber-500" linkTo="/admin/payments" />
        </div>

        {/* Metric Cards Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Courses" value={fmt(stats?.totalCourses)} sub={`${fmt(stats?.publishedCourses)} published`} icon={BookOpen} color="bg-purple-600" linkTo="/admin/courses" />
          <StatCard label="Active Enrollments" value={fmt(stats?.activeEnrollments)} sub="Students with course access" icon={ClipboardList} color="bg-cyan-600" linkTo="/admin/enrollments" />
          <StatCard label="Instructors" value={fmt(stats?.totalInstructors)} sub="Course instructors" icon={Users} color="bg-pink-600" linkTo="/admin/instructors" />
          <StatCard label="Certificates Issued" value={fmt(stats?.completedCertificates)} sub="Across all courses" icon={Award} color="bg-orange-600" linkTo="/admin/certificates" />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Payments */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Payments Awaiting Verification</h3>
                <p className="text-xs text-gray-500 mt-0.5">Students waiting for course access approval</p>
              </div>
              <Link href="/admin/payments" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No payments pending verification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(p.studentName || 'S')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.studentName}</p>
                      <p className="text-xs text-gray-500 truncate">{p.courseTitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">${p.claimedAmount}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.provider}</p>
                    </div>
                    <Link href="/admin/payments"
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">
                      Verify
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions + stats */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Verify Payments', sub: 'Review transactions', path: '/admin/payments', color: 'text-amber-600 bg-amber-50' },
                  { label: 'Add New Course', sub: 'Create curriculum', path: '/admin/courses', color: 'text-primary bg-primary/5' },
                  { label: 'View Revenue', sub: 'Financial reports', path: '/admin/revenue', color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Manage Students', sub: 'All registered users', path: '/admin/students', color: 'text-purple-600 bg-purple-50' },
                ].map(a => (
                  <Link key={a.path} href={a.path}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 group">
                    <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{a.label}</p>
                      <p className="text-xs text-gray-400">{a.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform health */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Platform Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Paid Enrollments', value: fmt(stats?.paidEnrollments) },
                  { label: 'Pending Requests', value: fmt(stats?.pendingEnrollments), warn: (stats?.pendingEnrollments || 0) > 0 },
                  { label: 'Rejected Payments', value: fmt(stats?.rejectedPayments) },
                  { label: 'Certificates Issued', value: fmt(stats?.completedCertificates) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{item.label}</span>
                    <span className={`font-bold ${item.warn ? 'text-amber-600' : 'text-gray-900'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Recent Enrollments</h3>
            <Link href="/admin/enrollments" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-6">Course</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentEnrollments.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{e.studentName}</td>
                    <td className="py-3.5 px-6 text-gray-600 truncate max-w-[200px]">{e.courseTitle}</td>
                    <td className="py-3.5 px-6 font-bold">${e.coursePrice || 0}</td>
                    <td className="py-3.5 px-6">{statusBadge(e.enrollmentStatus)}</td>
                    <td className="py-3.5 px-6 text-gray-400">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Inbound Inquiries */}
        {recentInquiries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Recent Inquiries & Contact Requests</h3>
                <p className="text-xs text-gray-400 mt-0.5">Prospective students and admissions leads</p>
              </div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                {recentInquiries.length} Lead{recentInquiries.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-6">Prospect</th>
                    <th className="py-3 px-6">Subject</th>
                    <th className="py-3 px-6">Message</th>
                    <th className="py-3 px-6">Received</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {recentInquiries.map(inq => (
                    <tr key={inq.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        <div>{inq.name}</div>
                        <div className="text-[11px] text-gray-400 font-normal">{inq.email} {inq.phone ? `• ${inq.phone}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-6 text-gray-800 font-medium truncate max-w-[180px]">{inq.subject}</td>
                      <td className="py-3.5 px-6 text-gray-600 line-clamp-1 max-w-[280px]">{inq.message}</td>
                      <td className="py-3.5 px-6 text-gray-400">{new Date(inq.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                        >
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
