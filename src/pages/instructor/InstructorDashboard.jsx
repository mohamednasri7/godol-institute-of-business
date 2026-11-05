import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  BookOpen, Users, Award, TrendingUp, LogOut, ExternalLink,
  Search, Mail, Phone, MessageSquare, Send, CheckCircle,
  Clock, Shield, Settings, Key, Check, AlertCircle, Sparkles,
  ChevronRight, Calendar
} from 'lucide-react';
import { auth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import ThemeToggleSwitch from '../../components/ThemeToggleSwitch';

export default function InstructorDashboard() {
  const [, setLocation] = useLocation();
  const [instructor, setInstructor] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Search in students
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    bio: '',
    phone: '',
    title: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Announcement state
  const [announcementForm, setAnnouncementForm] = useState({
    courseId: '',
    title: '',
    message: ''
  });
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  useEffect(() => {
    const current = auth.getInstructor();
    if (!current) {
      setLocation('/instructor/login');
      return;
    }
    setInstructor(current);
    loadDashboard(current.id);
  }, [setLocation]);

  const loadDashboard = (id) => {
    setIsLoading(true);
    apiFetch(`/api/instructor/dashboard?id=${id}`)
      .then((res) => {
        setData(res);
        if (res.instructor) {
          setProfileForm((prev) => ({
            ...prev,
            bio: res.instructor.bio || '',
            phone: res.instructor.phone || '',
            title: res.instructor.title || ''
          }));
        }
        if (res.courses && res.courses.length > 0) {
          setAnnouncementForm((prev) => ({
            ...prev,
            courseId: res.courses[0].id
          }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const handleSignOut = () => {
    auth.logoutInstructor();
    setLocation('/instructor/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveSuccess('');
    setProfileSaveError('');

    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileSaveError('New passwords do not match.');
        return;
      }
      if (profileForm.newPassword.length < 4) {
        setProfileSaveError('Password must be at least 4 characters long.');
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        id: instructor.id,
        bio: profileForm.bio,
        phone: profileForm.phone,
        title: profileForm.title
      };
      if (profileForm.newPassword) {
        payload.password = profileForm.newPassword;
      }

      const res = await apiFetch('/api/instructor/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setProfileSaveSuccess('Profile and settings updated successfully!');
        setProfileForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
        // Refresh local instructor cache
        const updated = { ...instructor, ...res.instructor };
        auth.setInstructor(updated);
        setInstructor(updated);
        loadDashboard(instructor.id);
      }
    } catch (err) {
      setProfileSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementSuccess('');
    setAnnouncementError('');

    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementError('Please provide both a title and message.');
      return;
    }

    setIsSendingAnnouncement(true);
    try {
      const res = await apiFetch('/api/instructor/announcements', {
        method: 'POST',
        body: JSON.stringify({
          instructorId: instructor.id,
          courseId: announcementForm.courseId,
          title: announcementForm.title,
          message: announcementForm.message
        })
      });

      if (res.success) {
        setAnnouncementSuccess(`Announcement delivered to ${res.recipients} enrolled student(s)!`);
        setAnnouncementForm((prev) => ({ ...prev, title: '', message: '' }));
      }
    } catch (err) {
      setAnnouncementError(err.message || 'Failed to broadcast announcement.');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  if (!instructor) return null;

  const courses = data?.courses || [];
  const enrollments = data?.enrollments || [];
  const stats = data?.stats || {
    totalCourses: 0,
    totalStudents: 0,
    completedStudents: 0,
    inProgressStudents: 0,
    avgProgress: 0,
    certificatesIssued: 0
  };

  // Filter students
  const filteredStudents = enrollments.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourseFilter === 'all' || e.courseId === Number(selectedCourseFilter);
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Banner */}
      <div className="bg-[hsl(215,72%,18%)] pt-28 pb-10 text-white shadow-md">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <img
                src={instructor.avatar || '/instructor-1.png'}
                alt={instructor.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/40 shadow-inner"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Faculty Instructor
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
                  {instructor.name}
                </h1>
                <p className="text-white/70 text-xs mt-0.5">{instructor.title || 'Faculty Member'}</p>
                <p className="text-white/50 text-[11px] font-mono mt-0.5">{instructor.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleSwitch isTransparent={true} />
              <Link
                href={`/instructors/${instructor.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <span>View Public Bio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Assigned Courses</span>
                <BookOpen className="w-4 h-4 text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.totalCourses}</div>
              <div className="text-[11px] text-white/50 mt-1">Active curriculum</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Enrolled Students</span>
                <Users className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.totalStudents}</div>
              <div className="text-[11px] text-white/50 mt-1">Learning under your courses</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Average Progress</span>
                <TrendingUp className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.avgProgress}%</div>
              <div className="text-[11px] text-white/50 mt-1">Overall completion rate</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-medium">Graduates & Certs</span>
                <Award className="w-4 h-4 text-purple-300" />
              </div>
              <div className="text-2xl font-bold text-white font-serif">{stats.completedStudents}</div>
              <div className="text-[11px] text-white/50 mt-1">Verified completions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Tabs */}
      <div className="container mx-auto px-4 md:px-6 -mt-4">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 inline-flex flex-wrap gap-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'courses', label: `My Courses (${courses.length})`, icon: BookOpen },
            { id: 'students', label: `My Students (${enrollments.length})`, icon: Users },
            { id: 'announcements', label: 'Announcements', icon: MessageSquare },
            { id: 'profile', label: 'Settings & Password', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs animate-pulse">
            Loading your instructor workspace...
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Courses Overview */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-gray-900">Your Assigned Courses</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Courses you are currently leading</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('courses')}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      View all courses <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {courses.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-700">No courses assigned yet</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        The administrator will link you to courses from the Admin Panel.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map((c) => (
                        <div
                          key={c.id}
                          className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span className="font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px]">
                                {c.categoryName || 'Business Program'}
                              </span>
                              <span>${c.price || 0}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2">{c.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                              {c.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              👥 {c.studentsCount || 0} Students
                            </span>
                            <Link
                              href={`/courses/${c.id}`}
                              target="_blank"
                              className="text-primary font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                            >
                              <span>Preview</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Students Table */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-gray-900">Recent Student Enrollments</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Students studying in your cohorts</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      All students ({enrollments.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {enrollments.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-700">No student enrollments yet</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        When students enroll in your courses, they will automatically appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                            <th className="pb-3">Student</th>
                            <th className="pb-3">Course</th>
                            <th className="pb-3">Progress</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {enrollments.slice(0, 5).map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-3 font-semibold text-gray-900">
                                <div>{e.studentName || 'Student'}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{e.studentEmail}</div>
                              </td>
                              <td className="py-3 text-gray-700 font-medium">{e.courseTitle}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-primary h-full rounded-full"
                                      style={{ width: `${e.progress || 0}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[11px] text-gray-700">
                                    {e.progress || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                {e.progress === 100 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                    Graduated
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                    In Progress
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                {e.studentPhone && (
                                  <a
                                    href={`https://wa.me/${e.studentPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg inline-block mr-1"
                                    title="WhatsApp student"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <a
                                  href={`mailto:${e.studentEmail}`}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg inline-block"
                                  title="Email student"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MY COURSES TAB */}
            {activeTab === 'courses' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-gray-900">My Teaching Courses</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    All courses configured with your instructor profile
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-bold text-sm text-gray-700">No courses linked</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Courses assigned to you in the Admin Panel will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {course.categoryName || 'Business'}
                            </span>
                            <span className="font-bold text-gray-900">${course.price}</span>
                          </div>
                          <h4 className="font-serif font-bold text-base text-gray-900 mb-2">
                            {course.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                            <span>👥 {course.studentsCount || 0} Enrolled Students</span>
                            <span>⏱ {course.durationHours || 4}h course</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/courses/${course.id}`}
                              target="_blank"
                              className="flex-1 text-center py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1"
                            >
                              <span>View Course</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <button
                              onClick={() => {
                                setAnnouncementForm((prev) => ({ ...prev, courseId: course.id }));
                                setActiveTab('announcements');
                              }}
                              className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                              title="Send announcement to this course"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY STUDENTS TAB */}
            {activeTab === 'students' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">Enrolled Students</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Monitor student progress and contact learners
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary w-44"
                      />
                    </div>

                    <select
                      value={selectedCourseFilter}
                      onChange={(e) => setSelectedCourseFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary"
                    >
                      <option value="all">All Courses</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-700">No students found</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {searchQuery
                        ? 'Try modifying your search filter.'
                        : 'No students have enrolled in this selection yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                          <th className="pb-3">Student Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Course</th>
                          <th className="pb-3">Course Progress</th>
                          <th className="pb-3">Certificate</th>
                          <th className="pb-3 text-right">Direct Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 font-bold text-gray-900">
                              {e.studentName || 'Student'}
                            </td>
                            <td className="py-3.5 text-gray-500 font-mono text-[11px]">
                              {e.studentEmail}
                            </td>
                            <td className="py-3.5 text-gray-800 font-medium">{e.courseTitle}</td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      e.progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${e.progress || 0}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[11px] text-gray-700">
                                  {e.progress || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              {e.progress === 100 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <Award className="w-3 h-3" />
                                  <span>Issued</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  In coursework
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {e.studentPhone && (
                                  <a
                                    href={`https://wa.me/${e.studentPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="WhatsApp student"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <a
                                  href={`mailto:${e.studentEmail}`}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Send Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'announcements' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm max-w-2xl">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-gray-900">Broadcast Announcement</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Send a class notification to all active students in your course
                  </p>
                </div>

                {announcementSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{announcementSuccess}</span>
                  </div>
                )}
                {announcementError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{announcementError}</span>
                  </div>
                )}

                <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Target Course</label>
                    <select
                      value={announcementForm.courseId}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, courseId: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-primary"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.studentsCount || 0} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Announcement Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Live Q&A Session this Thursday at 7:00 PM"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, title: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Message / Notice</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Enter update, reading materials, or instructions for students..."
                      value={announcementForm.message}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, message: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingAnnouncement}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Announcement</span>
                  </button>
                </form>
              </div>
            )}

            {/* PROFILE & PASSWORD SETTINGS TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm max-w-2xl">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-gray-900">
                    Profile & Password Settings
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your instructor credentials and profile details
                  </p>
                </div>

                {profileSaveSuccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{profileSaveSuccess}</span>
                  </div>
                )}
                {profileSaveError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{profileSaveError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={instructor.name}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Login Email</label>
                      <input
                        type="email"
                        disabled
                        value={instructor.email || ''}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-mono outline-none cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Managed by administrator</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        value={profileForm.title}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, title: e.target.value })
                        }
                        placeholder="e.g. Lead Marketing Executive"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">
                        WhatsApp / Phone Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder="+252 61 000 0000"
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Biography</label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      placeholder="Share your business and academic background..."
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none"
                    />
                  </div>

                  {/* Password Change Box */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-xs text-gray-900">Change Instructor Password</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium mb-1 text-gray-600 text-[11px]">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={profileForm.newPassword}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, newPassword: e.target.value })
                          }
                          placeholder="Min. 4 characters"
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1 text-gray-600 text-[11px]">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={profileForm.confirmPassword}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, confirmPassword: e.target.value })
                          }
                          placeholder="Re-enter password"
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

