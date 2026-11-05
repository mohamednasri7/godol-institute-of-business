import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, BookOpen, FolderTree, Users, Calendar,
  GraduationCap, ClipboardList, FileText, Award, CreditCard,
  Settings, Menu, X, LogOut, ChevronRight, ExternalLink,
  Bell, TrendingUp, FolderOpen, ScrollText, Tag, BarChart3,
  ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Sun, Moon
} from 'lucide-react';
import { auth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggleSwitch from '../../components/ThemeToggleSwitch';

const adminNav = [
  { label: 'Overview', items: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ]},
  { label: 'Courses', items: [
    { path: '/admin/courses', label: 'Course Management', icon: BookOpen },
    { path: '/admin/course-content', label: 'Course Content', icon: FolderTree },
    { path: '/admin/categories', label: 'Categories', icon: Tag }
  ]},
  { label: 'People', items: [
    { path: '/admin/instructors', label: 'Instructors', icon: Users },
    { path: '/admin/students', label: 'Student Management', icon: GraduationCap }
  ]},
  { label: 'Payments & Access', items: [
    { path: '/admin/payments', label: 'Payment Verification', icon: ShieldCheck, badge: 'pending' },
    { path: '/admin/enrollments', label: 'Enrollments', icon: ClipboardList },
    { path: '/admin/revenue', label: 'Revenue & Reports', icon: BarChart3 }
  ]},
  { label: 'Content', items: [
    { path: '/admin/workshops', label: 'Workshops', icon: Calendar },
    { path: '/admin/blog', label: 'Blog Posts', icon: FileText },
    { path: '/admin/certificates', label: 'Certificates', icon: Award }
  ]},
  { label: 'System', items: [
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { path: '/admin/settings', label: 'Settings', icon: Settings }
  ]}
];

export default function AdminLayout({ children, title, subtitle }) {
  const { isDark, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState('admin@godolinstitute.so');
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const admin = auth.getAdmin();
    if (!admin) { setLocation('/admin'); return; }
    setAdminUser(admin.email || 'admin@godolinstitute.so');

    apiFetch('/api/admin/stats').then(stats => {
      setPendingCount(stats.pendingVerification || 0);
    }).catch(() => {});
  }, [setLocation]);

  const handleSignOut = () => {
    auth.logoutAdmin();
    setLocation('/admin');
  };

  const toggleSection = (label) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(215,72%,14%)] text-white flex flex-col transform transition-transform duration-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/godol-logo.png" alt="Godol" className="h-8 sm:h-9 max-w-[190px] w-auto brightness-0 invert object-contain" />
          </div>
          <div className="mt-1.5 text-[10px] text-white/40 font-semibold tracking-widest uppercase">Admin Console</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNav.map(({ label, items }) => (
            <div key={label} className="mb-1">
              <button
                onClick={() => toggleSection(label)}
                className="w-full flex items-center justify-between px-5 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors"
              >
                <span>{label}</span>
                {collapsedSections[label] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {!collapsedSections[label] && items.map(({ path, label: navLabel, icon: Icon, badge }) => {
                const isActive = location === path;
                return (
                  <Link key={path} href={path} onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors relative ${
                      isActive ? 'bg-white/10 text-white border-r-2 border-accent' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{navLabel}</span>
                    {badge === 'pending' && pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {pendingCount}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-accent" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Admin profile footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-accent text-[hsl(215,72%,16%)] flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(adminUser[0] || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate">{adminUser}</div>
              <div className="text-[10px] text-white/40">Super Administrator</div>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-semibold">
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button className="lg:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleSwitch />
            {pendingCount > 0 && (
              <Link href="/admin/payments"
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" />
                {pendingCount} pending
              </Link>
            )}
            <Link href="/" target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/15">
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
