import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import {
  Star, Clock, BookOpen, CheckCircle, PlayCircle, Lock,
  Share2, Award, ChevronDown, ChevronUp, X, ShieldCheck,
  AlertCircle, CreditCard
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/auth';

export default function CourseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const [course, setCourse] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [accessStatus, setAccessStatus] = useState(null); // null | 'approved' | 'pending_payment' | 'pending_verification'
  const [enrollment, setEnrollment] = useState(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    apiFetch(`/api/courses/${id}`)
      .then(data => {
        setCourse(data);
        if (data.sections?.[0]?.id) setActiveSection(data.sections[0].id);
        if (data.instructorId) {
          apiFetch(`/api/instructors/${data.instructorId}`).then(setInstructor).catch(() => { });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Check enrollment/access status
  useEffect(() => {
    const user = auth.getUser();
    if (user && course) {
      apiFetch(`/api/enrollments/access?courseId=${course.id}&email=${encodeURIComponent(user.email)}`)
        .then(res => {
          if (res.hasAccess) {
            setAccessStatus('approved');
            setEnrollment(res.enrollment);
          } else {
            // Check if there's a pending enrollment
            apiFetch(`/api/enrollments?email=${encodeURIComponent(user.email)}`)
              .then(enrollments => {
                const pending = enrollments.find(e =>
                  e.courseId === course.id &&
                  ['pending_payment', 'pending_verification', 'pending_approval'].includes(e.enrollmentStatus)
                );
                if (pending) {
                  setAccessStatus(pending.enrollmentStatus);
                  setEnrollment(pending);
                } else {
                  setAccessStatus(null);
                }
              }).catch(() => { });
          }
        }).catch(() => { });
    }
  }, [course]);

  const handleEnrollClick = async () => {
    const user = auth.getUser();
    if (!user) {
      setLocation(`/login?next=/courses/${id}`);
      return;
    }

    if (accessStatus === 'approved') {
      setLocation('/dashboard');
      return;
    }

    if (accessStatus === 'pending_verification') {
      setLocation('/dashboard');
      return;
    }

    if (enrollment && accessStatus === 'pending_payment') {
      setLocation(`/checkout/${enrollment.id}`);
      return;
    }

    // Create checkout
    setIsStartingCheckout(true);
    try {
      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          courseId: course.id,
          studentEmail: user.email,
          studentName: user.name
        })
      });

      if (res.enrollment?.accessGranted) {
        setAccessStatus('approved');
        setEnrollment(res.enrollment);
        return;
      }

      setLocation(`/checkout/${res.enrollment.id}`);
    } catch (err) {
      alert('Could not initiate enrollment: ' + (err.message || 'Please try again'));
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const toggleLessonCompleted = async (lessonId) => {
    if (completedLessonIds.includes(lessonId)) {
      setCompletedLessonIds(prev => prev.filter(i => i !== lessonId));
    } else {
      setCompletedLessonIds(prev => [...prev, lessonId]);
      // Update progress on backend
      if (enrollment) {
        const allLessons = course?.sections?.flatMap(s => s.lessons) || [];
        const newCompleted = [...completedLessonIds, lessonId];
        const progress = Math.round((newCompleted.length / allLessons.length) * 100);
        apiFetch(`/api/enrollments/${enrollment.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ progress })
        }).catch(() => { });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 container mx-auto px-4 md:px-6">
        <div className="h-64 bg-muted/40 animate-pulse rounded-3xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-muted/30 animate-pulse rounded-2xl" />
            <div className="h-60 bg-muted/30 animate-pulse rounded-2xl" />
          </div>
          <div className="h-96 bg-muted/30 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-36 text-center container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Link href="/courses" className="text-primary hover:underline font-semibold">← Back to all courses</Link>
      </div>
    );
  }

  const allLessons = course.sections?.flatMap(s => s.lessons) || [];
  const progressPercent = allLessons.length > 0
    ? Math.round((completedLessonIds.length / allLessons.length) * 100) : 0;
  const isApproved = accessStatus === 'approved';

  const getActionButton = () => {
    if (isApproved) {
      return (
        <Link href="/dashboard"
          className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center block shadow-md transition-all">
          Go to Student Dashboard
        </Link>
      );
    }
    if (accessStatus === 'pending_verification') {
      return (
        <div className="w-full py-3.5 rounded-full bg-amber-100 text-amber-800 font-bold text-sm text-center border border-amber-200">
          ⏳ Payment Awaiting Verification
        </div>
      );
    }
    if (accessStatus === 'pending_payment') {
      return (
        <button onClick={handleEnrollClick}
          className="w-full py-4 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}>
          <CreditCard className="w-5 h-5" />
          Complete Payment
        </button>
      );
    }
    return (
      <button onClick={handleEnrollClick} disabled={isStartingCheckout}
        className="w-full py-4 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}>
        <ShieldCheck className="w-5 h-5" />
        {isStartingCheckout ? 'Preparing...' : (course.price === 0 ? 'Enroll for Free' : 'Enroll Now')}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Course Header Banner */}
      <div className="bg-[hsl(215,72%,18%)] pt-32 pb-16 text-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
            <span>/</span>
            <span className="text-white/90 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-[hsl(215,72%,12%)]">
                  {course.categoryName || 'Business'}
                </span>
                <span className="text-xs text-white/70 font-medium">{course.level || 'All Levels'}</span>
                {course.badge && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white/90">{course.badge}</span>
                )}
              </div>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                title="Share this course"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Link Copied!' : 'Share'}
              </button>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 leading-tight">{course.title}</h1>
            <p className="text-white/70 text-base md:text-lg mb-6 leading-relaxed">{course.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold">{course.rating ? Number(course.rating).toFixed(1) : '5.0'}</span>
                <span className="text-white/50">({course.enrolledCount ?? 0} enrolled)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-white/60" />
                <span>{course.durationHours ? `${course.durationHours} hours` : 'Flexible Pace'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-white/60" />
                <span>{allLessons.length > 0 ? `${allLessons.length} lessons` : (course.lessonCount ? `${course.lessonCount} lessons` : 'Curriculum')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-white/60" />
                <span>Certificate Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending verification banner */}
      {accessStatus === 'pending_verification' && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Payment submitted</strong> — Your transaction is awaiting verification. Course access will be granted once your payment is confirmed.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 md:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {isApproved && (
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-foreground">Your Learning Progress</span>
                  <span className="text-sm font-bold text-primary">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}

            {/* What You'll Learn */}
            {course.whatYouLearn?.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-bold mb-6 text-foreground">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.whatYouLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Requirements */}
            {course.requirements?.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-bold mb-4 text-foreground">Course Requirements</h2>
                <ul className="space-y-3">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course Syllabus */}
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">Course Syllabus</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.sections?.length || 0} sections • {allLessons.length} lessons
                  </p>
                </div>
              </div>
              {course.sections && course.sections.length > 0 ? (
                <div className="space-y-4">
                  {course.sections.map(section => {
                    const isOpen = activeSection === section.id;
                    return (
                      <div key={section.id} className="border border-border rounded-xl overflow-hidden">
                        <button onClick={() => setActiveSection(isOpen ? null : section.id)}
                          className="w-full bg-muted/30 px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors">
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">{section.title}</h4>
                            <span className="text-xs text-muted-foreground">{section.lessons?.length || 0} lessons</span>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-border bg-white px-6">
                            {section.lessons?.map(lesson => {
                              const isCompleted = completedLessonIds.includes(lesson.id);
                              return (
                                <div key={lesson.id} className="py-3.5 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    {isApproved ? (
                                      <button onClick={() => toggleLessonCompleted(lesson.id)}
                                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'border border-border hover:border-primary'}`}>
                                        {isCompleted && <CheckCircle className="w-4 h-4" />}
                                      </button>
                                    ) : (
                                      <PlayCircle className="w-4 h-4 text-primary" />
                                    )}
                                    <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">{lesson.durationMinutes}m</span>
                                    {lesson.isFree || isApproved ? (
                                      <button onClick={() => setSelectedLesson(lesson)}
                                        className="text-xs font-semibold px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        {lesson.isFree && !isApproved ? 'Free Preview' : 'Watch'}
                                      </button>
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-muted/20 rounded-xl border border-dashed border-border">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">Curriculum Outline Being Finalized</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Lecture modules, downloadable frameworks, and coursework will be unlocked upon cohort start.
                  </p>
                </div>
              )}
            </div>

            {/* Instructor Bio */}
            {instructor && (
              <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="font-serif text-xl font-bold mb-6 text-foreground">Your Instructor</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <img src={instructor.avatar || '/instructor-1.png'} alt={instructor.name}
                    className="w-20 h-20 rounded-full object-cover border border-border" />
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{instructor.name}</h4>
                    <p className="text-sm text-primary font-medium mb-3">{instructor.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{instructor.bio}</p>
                    <Link href={`/instructors/${instructor.id}`} className="text-xs font-bold text-primary hover:underline">
                      View full instructor profile →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Pricing Card */}
          <div>
            <div className="bg-white border border-border rounded-3xl p-8 shadow-lg sticky top-24 space-y-6">
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted relative">
                <img src={course.thumbnail || '/course-business.png'} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                  {course.price > 0 && (
                    <span className="text-sm text-muted-foreground line-through">${course.price + 50}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Full lifetime access with certificate</p>
              </div>

              {getActionButton()}

              <a
                href={`https://wa.me/252905139816?text=${encodeURIComponent(`Hi Godol Institute, I have questions regarding the "${course.title}" program.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-full border border-emerald-500/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Ask Admissions on WhatsApp</span>
              </a>

              <div className="space-y-3 pt-4 border-t border-border text-sm">
                <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">This course includes:</div>
                <div className="flex items-center gap-3 text-xs text-foreground/80">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{course.durationHours ? `${course.durationHours} hours of practical training` : 'Comprehensive curriculum'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/80">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{allLessons.length > 0 ? `${allLessons.length} structured practical lessons` : 'Structured modular syllabus'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/80">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Accredited Certificate of Completion</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/80">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Local mobile money: EVC Plus, Zaad, Sahal, Premier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Video Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl">
            <div className="bg-primary text-primary-foreground p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">{selectedLesson.title}</h3>
              <button onClick={() => setSelectedLesson(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {selectedLesson.videoUrl ? (
                <iframe src={selectedLesson.videoUrl} title={selectedLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div className="text-white text-center p-6">
                  <PlayCircle className="w-16 h-16 mx-auto mb-3 text-accent" />
                  <p className="text-base font-semibold">{selectedLesson.title}</p>
                  <p className="text-xs text-white/50 mt-1">Video will be uploaded soon.</p>
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{selectedLesson.content || 'Comprehensive business frameworks and practical guidance.'}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { toggleLessonCompleted(selectedLesson.id); setSelectedLesson(null); }}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
