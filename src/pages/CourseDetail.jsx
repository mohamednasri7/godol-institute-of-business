import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import {
  Star, Clock, BookOpen, CheckCircle, PlayCircle, Lock,
  Share2, Award, ChevronDown, ChevronUp, X, ShieldCheck,
  AlertCircle, CreditCard, Play, ArrowRight, Sparkles
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/auth';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import BunnyVideoPlayer from '../components/course/BunnyVideoPlayer';

export default function CourseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModuleId, setActiveModuleId] = useState(null);

  // Video modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);

  const [accessStatus, setAccessStatus] = useState(null); // null | 'approved' | 'pending_payment' | 'pending_verification'
  const [enrollment, setEnrollment] = useState(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
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

    apiFetch(`/api/courses/${id}/curriculum`)
      .then((data) => {
        setCourse(data.course);
        setModules(data.modules || []);
        if (data.modules && data.modules.length > 0) {
          setActiveModuleId(data.modules[0].id);
        }
        if (data.course?.instructorId) {
          apiFetch(`/api/instructors/${data.course.instructorId}`)
            .then(setInstructor)
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Curriculum fetch error, falling back to course detail:', err);
        apiFetch(`/api/courses/${id}`)
          .then((courseData) => {
            setCourse(courseData);
            if (courseData.instructorId) {
              apiFetch(`/api/instructors/${courseData.instructorId}`)
                .then(setInstructor)
                .catch(() => {});
            }
          })
          .catch(console.error);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const checkAccessStatus = () => {
    const user = auth.getUser();
    if (user && course) {
      apiFetch(`/api/enrollments/access?courseId=${course.id}&email=${encodeURIComponent(user.email)}`)
        .then((res) => {
          if (res.hasAccess) {
            setAccessStatus('approved');
            setEnrollment(res.enrollment);
          } else {
            apiFetch(`/api/enrollments?email=${encodeURIComponent(user.email)}`)
              .then((enrollments) => {
                const pending = enrollments.find(
                  (e) =>
                    e.courseId === course.id &&
                    ['pending_payment', 'pending_verification', 'pending_approval'].includes(e.enrollmentStatus)
                );
                if (pending) {
                  setAccessStatus(pending.enrollmentStatus);
                  setEnrollment(pending);
                } else {
                  setAccessStatus(null);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  };

  // Check enrollment/access status
  useEffect(() => {
    checkAccessStatus();
  }, [course]);

  // Realtime synchronization for course info, payment verification, and enrollment approval
  useRealtimeSync(['courses', 'enrollments', 'payments'], () => {
    checkAccessStatus();
    if (id) {
      apiFetch(`/api/courses/${id}`)
        .then(setCourse)
        .catch(() => {});
    }
  });

  const handleEnrollClick = async () => {
    const user = auth.getUser();
    if (!user) {
      setLocation(`/login?next=/courses/${id}`);
      return;
    }

    if (accessStatus === 'approved') {
      setLocation(`/courses/${course.slug || course.id}/learn`);
      return;
    }

    if (accessStatus === 'pending_verification') {
      if (enrollment?.id) {
        setLocation(`/checkout/${enrollment.id}`);
        return;
      }
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
        setLocation(`/courses/${course.slug || course.id}/learn`);
        return;
      }

      setLocation(`/checkout/${res.enrollment.id}`);
    } catch (err) {
      alert('Could not initiate enrollment: ' + (err.message || 'Please try again'));
    } finally {
      setIsStartingCheckout(false);
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
        <Link href="/courses" className="text-primary hover:underline font-semibold">
          ← Back to all courses
        </Link>
      </div>
    );
  }

  const allLessons = modules.flatMap((m) => m.lessons || []);
  const realLessonCount = allLessons.length > 0
    ? allLessons.length
    : (Number(course?.lessonCount) || 0);

  const realModuleCount = modules.length > 0
    ? modules.length
    : (Number(course?.moduleCount) || (Array.isArray(course?.sections) ? course.sections.length : 0));

  const totalLessonDurationSeconds = allLessons.reduce(
    (sum, l) => sum + (Number(l.durationSeconds || l.duration_seconds) || 0),
    0
  );

  const realDurationHours = totalLessonDurationSeconds > 0
    ? Math.round((totalLessonDurationSeconds / 3600) * 10) / 10
    : (Number(course?.durationHours) || 0);

  const realEnrolledCount = Number(course?.enrolledCount) || 0;
  const isApproved = accessStatus === 'approved';

  const getActionButton = () => {
    if (isApproved) {
      return (
        <Link
          href={`/courses/${course.slug || course.id}/learn`}
          className="w-full py-4 rounded-full font-bold text-sm text-center shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 group"
          style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Continue Learning ({enrollment?.progress || 0}% Complete)</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      );
    }
    if (accessStatus === 'pending_verification') {
      return (
        <button
          onClick={() => enrollment?.id && setLocation(`/checkout/${enrollment.id}`)}
          className="w-full py-3.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold text-xs text-center border border-amber-400/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>⏳ Payment Awaiting Verification (Click to View)</span>
        </button>
      );
    }
    if (accessStatus === 'pending_payment') {
      return (
        <button
          onClick={handleEnrollClick}
          className="w-full py-4 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
        >
          <CreditCard className="w-5 h-5" />
          Complete Payment
        </button>
      );
    }
    return (
      <button
        onClick={handleEnrollClick}
        disabled={isStartingCheckout}
        className="w-full py-4 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
      >
        <ShieldCheck className="w-5 h-5" />
        {isStartingCheckout ? 'Preparing...' : (course.price === 0 ? 'Enroll for Free' : 'Enroll Now')}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Course Header Banner */}
      <div className="bg-[hsl(215,72%,18%)] pt-32 pb-16 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 30%, rgba(245, 166, 20, 0.4) 0%, transparent 60%)'
          }}
        />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-white/90 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-[hsl(215,72%,12%)]">
                  {course.categoryName || course.category || 'Business'}
                </span>
                <span className="text-xs text-white/70 font-medium px-2.5 py-0.5 rounded-full bg-white/10">
                  {course.level || 'All Levels'}
                </span>
                {course.badge && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/15 text-white/90">
                    {course.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/20 hover:bg-accent/30 text-xs font-bold text-accent border border-accent/30 transition-all shadow-sm"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Watch Promo</span>
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                  title="Share this course"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copiedLink ? 'Link Copied!' : 'Share'}
                </button>
              </div>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-white/70 text-base md:text-lg mb-6 leading-relaxed">
              {course.description ||
                'Practical business education delivered by regional founders and executives, tailored specifically for the East African commercial market.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold">
                  {course.rating ? Number(course.rating).toFixed(1) : '5.0'}
                </span>
                <span className="text-white/50">({realEnrolledCount} {realEnrolledCount === 1 ? 'enrolled' : 'enrolled'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-white/60" />
                <span>
                  {realDurationHours > 0
                    ? `${realDurationHours} ${realDurationHours === 1 ? 'hour' : 'hours'}`
                    : (realLessonCount > 0 ? 'Self-paced' : 'Flexible Pace')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-white/60" />
                <span>
                  {realLessonCount} {realLessonCount === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-white/60" />
                <span>Certificate Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 md:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Outcomes */}
            <div className="liquid-glass liquid-glass-squircle p-8 shadow-sm space-y-4">
              <h2 className="font-serif text-2xl font-bold text-foreground">
                What You'll Master in this Course
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {(course.whatYouLearn && course.whatYouLearn.length > 0
                  ? course.whatYouLearn
                  : [
                      'East African market dynamics and localized product-market fit',
                      'Financial cashflow modeling with mobile money (EVC Plus, Zaad, Sahal)',
                      'Cross-border supply chain operations and regional trade compliance',
                      'Executive decision frameworks and real-world cohort case studies'
                    ]
                ).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80 leading-relaxed font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Course Syllabus Accordion */}
            <div className="liquid-glass liquid-glass-squircle p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Curriculum Syllabus
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {realModuleCount} {realModuleCount === 1 ? 'module' : 'modules'} • {realLessonCount} {realLessonCount === 1 ? 'comprehensive lesson' : 'comprehensive lessons'}
                  </p>
                </div>
                {allLessons.some((l) => l.isFreePreview) && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Free Previews Available
                  </span>
                )}
              </div>

              {modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((mod) => {
                    const isOpen = activeModuleId === mod.id;
                    const modLessons = mod.lessons || [];

                    return (
                      <div
                        key={mod.id}
                        className="border border-border/80 rounded-2xl overflow-hidden bg-card/40"
                      >
                        <button
                          onClick={() => setActiveModuleId(isOpen ? null : mod.id)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
                        >
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{mod.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {modLessons.length} {modLessons.length === 1 ? 'lesson' : 'lessons'}
                            </span>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="divide-y divide-border/60 bg-card/60 px-6">
                            {modLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="py-4 flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3">
                                  <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                                  <div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                      {lesson.title}
                                    </span>
                                    {lesson.description && (
                                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {lesson.durationSeconds
                                      ? `${Math.round(lesson.durationSeconds / 60)}m`
                                      : '15m'}
                                  </span>

                                  {lesson.isFreePreview ? (
                                    <button
                                      onClick={() => setPreviewLesson(lesson)}
                                      className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 transition-all flex items-center gap-1 border border-emerald-500/30"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Free Preview</span>
                                    </button>
                                  ) : isApproved ? (
                                    <Link
                                      href={`/courses/${course.slug || course.id}/learn?lesson=${lesson.id}`}
                                      className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                      Play
                                    </Link>
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">Curriculum Outline Being Prepared</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Full video modules, downloadable frameworks, and coursework will be unlocked.
                  </p>
                </div>
              )}
            </div>

            {/* Instructor Profile Card */}
            {instructor && (
              <div className="liquid-glass liquid-glass-squircle p-8 shadow-sm space-y-4">
                <h3 className="font-serif text-xl font-bold text-foreground">Your Faculty Mentor</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <img
                    src={instructor.avatar || '/instructor-1.png'}
                    alt={instructor.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-md shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{instructor.name}</h4>
                    <p className="text-xs text-primary font-semibold mb-2">{instructor.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {instructor.bio}
                    </p>
                    <Link
                      href={`/instructors/${instructor.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View full instructor profile →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Pricing & CTA Card */}
          <div>
            <div className="liquid-glass liquid-glass-squircle p-8 shadow-xl sticky top-24 space-y-6 border border-white/20">
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted relative group">
                <img
                  src={course.thumbnailUrl || course.thumbnail || '/course-business.png'}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-accent text-slate-950 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </button>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-foreground">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                  {course.price > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${course.price + 50}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Full lifetime access with accredited certificate</p>
              </div>

              {getActionButton()}

              <a
                href={`https://wa.me/252905139816?text=${encodeURIComponent(
                  `Hi Godol Institute, I have questions regarding the "${course.title}" program.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-full border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Ask Admissions on WhatsApp</span>
              </a>

              <div className="space-y-3 pt-4 border-t border-border/80 text-xs text-muted-foreground">
                <div className="font-bold uppercase tracking-wider text-foreground text-[11px]">
                  This course includes:
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>
                    {realDurationHours > 0
                      ? `${realDurationHours} ${realDurationHours === 1 ? 'hour' : 'hours'} on-demand training`
                      : 'Comprehensive modular curriculum'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>
                    {realLessonCount > 0
                      ? `${realLessonCount} ${realLessonCount === 1 ? 'practical lesson' : 'practical lessons'}`
                      : 'Structured video modules'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Accredited Certificate of Completion</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>EVC Plus, Zaad, Sahal, and Premier Wallet support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bunny Stream Promo Video Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-modal max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                <h3 className="font-bold text-sm truncate max-w-md">
                  Course Promo: {course.title}
                </h3>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black">
              <BunnyVideoPlayer
                videoId={course.promoVideoId || course.promo_video_id || 'bunny_promo_masterclass'}
                title={`${course.title} - Official Promo`}
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Free Preview Video Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-modal max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  Free Preview
                </span>
                <h3 className="font-bold text-sm truncate max-w-md">{previewLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black">
              <BunnyVideoPlayer
                videoId={previewLesson.bunnyVideoId || previewLesson.bunny_video_id}
                title={previewLesson.title}
                autoPlay={true}
              />
            </div>
            <div className="p-6 bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <p className="text-xs text-white/70">
                Enjoyed this preview? Enroll now to unlock all {realLessonCount} {realLessonCount === 1 ? 'lesson' : 'lessons'}, downloadable templates, and accredited certification.
              </p>
              <button
                onClick={() => {
                  setPreviewLesson(null);
                  handleEnrollClick();
                }}
                className="px-6 py-2.5 rounded-full text-xs font-bold shrink-0 transition-transform hover:scale-105"
                style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
              >
                Unlock Full Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
