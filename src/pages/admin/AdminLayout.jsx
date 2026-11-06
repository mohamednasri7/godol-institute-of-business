import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, BookOpen, FolderTree, Users, Calendar,
  GraduationCap, ClipboardList, FileText, Award, CreditCard,
  Settings, Menu, X, LogOut, ChevronRight, ExternalLink,
  Bell, TrendingUp, FolderOpen, ScrollText, Tag, BarChart3,
  ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Sun, Moon, User
} from 'lucide-react';
import { auth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggleSwitch from '../../components/ThemeToggleSwitch';
import ErrorBoundary from '../../components/ErrorBoundary';
import { supabase, isSupabaseClientConfigured } from '../../lib/supabase';

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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    document.title = title ? `${title} | Godol Admin` : 'Admin | Godol';
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
  }, [title]);

  useEffect(() => {
    const admin = auth.getAdmin();
    if (!admin) { setLocation('/admin'); return; }
    setAdminUser(admin.email || 'admin@godolinstitute.so');

    const updatePending = () => {
      apiFetch('/api/admin/stats').then(stats => {
        setPendingCount(stats.pendingVerification || 0);
      }).catch(() => {});
    };

    updatePending();

    if (!isSupabaseClientConfigured || !supabase) return;

    // Realtime badge update
    const channel = supabase
      .channel('admin-layout-pending-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        updatePending();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setLocation]);

  const handleSignOut = () => {
    auth.logoutAdmin();
    setLocation('/admin');
  };

  const toggleSection = (label) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-x-hidden">
      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(215,72%,14%)] text-white flex flex-col transform transition-transform duration-200 ease-in-out shadow-2xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex flex-shrink-0`}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <img src="/godol-logo.png" alt="Godol" className="h-8 sm:h-9 max-w-[170px] w-auto brightness-0 invert object-contain" />
            </div>
            <div className="mt-1.5 text-[10px] text-white/40 font-semibold tracking-widest uppercase">Admin Console</div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
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
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Top header */}
        <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 sticky top-0 z-30 shadow-xs">
          <button
            className="lg:hidden p-2 text-foreground/70 hover:text-foreground rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open sidebar navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggleSwitch />

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsUserMenuOpen(false); }}
                className="p-2 text-foreground/70 hover:text-foreground hover:bg-muted rounded-xl transition-colors relative"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-card border border-border rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    <span className="text-[10px] text-muted-foreground">{pendingCount} pending</span>
                  </div>
                  {pendingCount > 0 ? (
                    <Link
                      href="/admin/payments"
                      onClick={() => setIsNotificationOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors text-xs"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">{pendingCount} payment{pendingCount > 1 ? 's' : ''} awaiting review</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Students submitted transactions requiring your verification.</p>
                      </div>
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No new notifications</p>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Menu with Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationOpen(false); }}
                className="flex items-center gap-2 p-1 pl-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(adminUser[0] || 'A').toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-foreground hidden md:inline truncate max-w-[120px]">
                  {adminUser.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-card border border-border rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-bold text-foreground truncate">{adminUser}</p>
                    <p className="text-[10px] text-muted-foreground">Administrator</p>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>System Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <Link href="/" target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 px-2.5 sm:px-3 py-1.5 rounded-lg border border-primary/20">
              <span className="hidden sm:inline">View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-x-hidden min-w-0 max-w-full">
          <ErrorBoundary title={`${title || 'Admin Section'} Error`}>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
