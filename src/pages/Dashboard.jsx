import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Award,
  LogOut,
  Calendar,
  Play,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Settings
} from 'lucide-react';
import { auth } from '../lib/auth';
import { apiFetch } from '../lib/api';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');

  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // View certificate modal
  const [activeCert, setActiveCert] = useState(null);

  useEffect(() => {
    const user = auth.getUser();
    if (!user) {
      setLocation('/login');
      return;
    }
    setCurrentUser(user);

    setIsLoading(true);
    Promise.all([
      apiFetch(`/api/enrollments?email=${encodeURIComponent(user.email)}`),
      apiFetch(`/api/certificates?email=${encodeURIComponent(user.email)}`),
      apiFetch('/api/workshops')
    ])
      .then(([enrollData, certData, workshopData]) => {
        // Only show approved/completed enrollments where access is granted
        setEnrollments(enrollData.filter(e => e.accessGranted === true || e.enrollmentStatus === 'approved' || e.enrollmentStatus === 'completed'));
        setCertificates(certData);
        setWorkshops(workshopData);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [setLocation]);

  const handleSignOut = () => {
    auth.logout();
    setLocation('/');
  };

  const handleIncrementProgress = async (enrollmentId, currentProgress) => {
    const newProgress = Math.min(100, currentProgress + 10);
    try {
      const updated = await apiFetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: { progress: newProgress } })
      });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, ...updated } : e))
      );
      // Refresh certificates in case a new one was auto-issued
      if (newProgress === 100 && currentUser) {
        apiFetch(`/api/certificates?email=${encodeURIComponent(currentUser.email)}`)
          .then(setCertificates)
          .catch(() => { });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) return null;

  const completed = enrollments.filter((e) => e.progress === 100);
  const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100);
  const notStarted = enrollments.filter((e) => e.progress === 0);
  const activeCourse = inProgress[0] || notStarted[0] || enrollments[0];

  const initials = currentUser.name
    ? currentUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : currentUser.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Student Profile Banner */}
      <div className="bg-[hsl(215,72%,18%)] pt-28 pb-8 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 text-white flex items-center justify-center text-xl font-bold border border-white/20 shadow-inner">
                {initials}
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider font-semibold">
                  Student Portal
                </p>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
                  Welcome back, {currentUser.name.split(' ')[0]}
                </h1>
                <p className="text-white/60 text-xs mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* 4 Quick Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              {
                label: 'Enrolled Courses',
                val: enrollments.length,
                icon: BookOpen,
                color: 'text-blue-300',
                bg: 'bg-blue-400/10'
              },
              {
                label: 'In Progress',
                val: inProgress.length,
                icon: Clock,
                color: 'text-amber-300',
                bg: 'bg-amber-400/10'
              },
              {
                label: 'Completed',
                val: completed.length,
                icon: CheckCircle,
                color: 'text-green-300',
                bg: 'bg-green-400/10'
              },
              {
                label: 'Certificates',
                val: certificates.length,
                icon: Award,
                color: 'text-purple-300',
                bg: 'bg-purple-400/10'
              }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`${stat.bg} border border-white/10 rounded-2xl p-4 flex items-center gap-3.5`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stat.val}</div>
                    <div className="text-xs text-white/60 font-medium">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs header */}
          <div className="flex gap-2 border-b border-white/10 mt-8 pt-2">
            {[
              { id: 'courses', label: `My Courses (${enrollments.length})` },
              { id: 'certificates', label: `Certificates (${certificates.length})` },
              { id: 'schedule', label: 'Workshops & Schedule' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id
                  ? 'border-accent text-white font-bold'
                  : 'border-transparent text-white/50 hover:text-white/80'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* TAB 1: COURSES */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* Active course banner */}
            {activeCourse && (
              <div className="bg-gradient-to-r from-[hsl(215,72%,18%)] to-[hsl(215,72%,26%)] text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/15 px-3 py-1 rounded-full">
                    Resume Current Course
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    {activeCourse.courseTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span>Progress: {activeCourse.progress}%</span>
                    <span>•</span>
                    <span>Status: {activeCourse.status}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-3 max-w-md">
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${activeCourse.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleIncrementProgress(activeCourse.id, activeCourse.progress)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                  >
                    +10% Practice Progress
                  </button>
                  <Link
                    href={`/courses/${activeCourse.courseId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs shadow-lg transition-transform hover:scale-105"
                    style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Open Classroom</span>
                  </Link>
                </div>
              </div>
            )}

            {/* All enrolled courses */}
            <div>
              <h3 className="font-serif text-xl font-bold mb-4 text-foreground">
                All Enrolled Courses
              </h3>

              {enrollments.length === 0 ? (
                <div className="bg-white border border-border rounded-2xl p-12 text-center max-w-md mx-auto">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h4 className="font-bold text-base text-foreground mb-1">
                    No active courses yet
                  </h4>
                  <p className="text-xs text-muted-foreground mb-6">
                    Browse our business catalog and enroll in practical courses.
                  </p>
                  <Link
                    href="/courses"
                    className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${enr.progress === 100
                              ? 'bg-green-100 text-green-700'
                              : 'bg-primary/10 text-primary'
                              }`}
                          >
                            {enr.progress === 100 ? 'Completed' : 'Active'}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {enr.progress}%
                          </span>
                        </div>

                        <h4 className="font-bold text-base text-foreground mb-2">
                          {enr.courseTitle}
                        </h4>

                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-6">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${enr.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
                        <button
                          onClick={() => handleIncrementProgress(enr.id, enr.progress)}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          +10% Progress
                        </button>

                        <Link
                          href={`/courses/${enr.courseId}`}
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Go to Course
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold mb-4 text-foreground">
              Your Professional Certificates
            </h3>

            {certificates.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center max-w-md mx-auto">
                <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h4 className="font-bold text-base text-foreground mb-1">
                  No certificates yet
                </h4>
                <p className="text-xs text-muted-foreground mb-6">
                  Complete 100% of any enrolled course to automatically receive your verified Godol Institute Certificate of Completion.
                </p>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs"
                >
                  View My Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Award className="w-8 h-8 text-accent" />
                        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground">
                          {cert.certificateNumber}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-foreground mb-1">
                        {cert.courseTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Issued to <span className="font-semibold text-foreground">{cert.studentName}</span> on {cert.issueDate}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                      </span>
                      <button
                        onClick={() => setActiveCert(cert)}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        View Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SCHEDULE & WORKSHOPS */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold mb-4 text-foreground">
              Upcoming Live Workshops & Cohort Dates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workshops.map((w) => (
                <div
                  key={w.id}
                  className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/20 text-accent-foreground mb-3 inline-block">
                      {w.tag || 'Bosaso Cohort'}
                    </span>
                    <h4 className="font-bold text-base text-foreground mb-2">{w.title}</h4>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      {w.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{w.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{w.location || 'Bosaso, Somalia'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verified Certificate Modal */}
      {activeCert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-8 md:p-12 border-8 border-[hsl(215,72%,18%)] relative">
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4">
              <img
                src="/godol-logo.png"
                alt="Godol Institute"
                className="h-14 mx-auto object-contain"
              />
              <div className="text-xs tracking-widest uppercase font-semibold text-primary">
                Certificate of Completion
              </div>
              <p className="text-xs text-muted-foreground italic">
                This is proudly presented to
              </p>
              <h2 className="font-serif text-3xl font-extrabold text-foreground border-b border-border pb-3 max-w-md mx-auto">
                {activeCert.studentName}
              </h2>
              <p className="text-sm text-foreground/80 max-w-lg mx-auto">
                For successfully fulfilling all academic requirements and coursework in
              </p>
              <h3 className="font-serif text-xl font-bold text-primary">
                {activeCert.courseTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                Instructor: {activeCert.instructorName || 'Godol Institute Faculty'}
              </p>

              <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Date: {activeCert.issueDate}</p>
                  <p>Bosaso, Somalia</p>
                </div>
                <div>
                  <p className="font-mono font-semibold text-foreground">
                    ID: {activeCert.certificateNumber}
                  </p>
                  <span className="text-emerald-600 font-bold">Verified Credential</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => alert(`Certificate ${activeCert.certificateNumber} downloaded!`)}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:bg-primary/90 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

