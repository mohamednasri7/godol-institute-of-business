import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Play,
  PlayCircle,
  Clock,
  Download,
  FileText,
  Bookmark,
  MessageSquare,
  HelpCircle,
  Maximize2,
  Minimize2,
  Check,
  Send,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Award
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/auth';
import BunnyVideoPlayer from '../components/course/BunnyVideoPlayer';

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CoursePlayer() {
  const params = useParams();
  const courseSlugOrId = params.slug || params.id;
  const [, setLocation] = useLocation();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [lastAccessedLessonId, setLastAccessedLessonId] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources' | 'notes' | 'discussion'
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsedModuleIds, setCollapsedModuleIds] = useState([]);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Discussion state
  const [discussions, setDiscussions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Knowledge check / quiz state
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const playerRef = useRef(null);
  const currentUser = auth.getUser();

  // Load Course Curriculum & Player State
  useEffect(() => {
    if (!courseSlugOrId) return;
    setIsLoading(true);

    const email = currentUser?.email || '';

    Promise.all([
      apiFetch(`/api/courses/${courseSlugOrId}/curriculum`),
      apiFetch(`/api/courses/${courseSlugOrId}/player-state?email=${encodeURIComponent(email)}`)
    ])
      .then(([curriculumData, playerData]) => {
        setCourse(curriculumData.course);
        setModules(curriculumData.modules || []);
        setHasAccess(playerData.hasAccess);
        setCompletedLessonIds(playerData.completedLessonIds || []);
        setProgressPercent(playerData.progressPercent || 0);

        // Determine active lesson from URL param ?lesson=ID or playerData or first lesson
        const urlParams = new URLSearchParams(window.location.search);
        const requestedLessonId = Number(urlParams.get('lesson'));

        const allLessons = (curriculumData.modules || []).flatMap(m => m.lessons || []);
        let initialLesson = null;

        if (requestedLessonId) {
          initialLesson = allLessons.find(l => l.id === requestedLessonId);
        }
        if (!initialLesson && playerData.lastAccessedLessonId) {
          initialLesson = allLessons.find(l => l.id === playerData.lastAccessedLessonId);
        }
        if (!initialLesson) {
          initialLesson = allLessons[0];
        }

        setActiveLesson(initialLesson || null);
        if (initialLesson) {
          setLastAccessedLessonId(initialLesson.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load course player:', err);
      })
      .finally(() => setIsLoading(false));
  }, [courseSlugOrId]);

  // Load lesson notes & discussions when activeLesson changes
  useEffect(() => {
    if (!activeLesson) return;

    // Fetch notes
    const email = currentUser?.email || '';
    apiFetch(`/api/lessons/${activeLesson.id}/notes?email=${encodeURIComponent(email)}`)
      .then(setNotes)
      .catch(() => {});

    // Fetch discussions
    apiFetch(`/api/lessons/${activeLesson.id}/discussions`)
      .then(setDiscussions)
      .catch(() => {});

    // Reset quiz state
    setQuizAnswer(null);
    setQuizSubmitted(false);
  }, [activeLesson]);

  // All lessons flat array for navigation
  const allLessons = modules.flatMap(m => m.lessons || []);
  const currentIndex = allLessons.findIndex(l => l.id === activeLesson?.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Change active lesson
  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setLastAccessedLessonId(lesson.id);
    const newUrl = `${window.location.pathname}?lesson=${lesson.id}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Toggle completion with optimistic UI update
  const handleToggleComplete = async (lessonId = activeLesson?.id) => {
    if (!lessonId || !course) return;

    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const nextCompleted = isCurrentlyCompleted
      ? completedLessonIds.filter(id => id !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(nextCompleted);

    // Optimistically update progress %
    const newPercent = allLessons.length > 0 ? Math.round((nextCompleted.length / allLessons.length) * 100) : 0;
    setProgressPercent(newPercent);

    try {
      await apiFetch(`/api/courses/${course.id}/lessons/${lessonId}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          user_email: currentUser?.email || 'student',
          is_completed: !isCurrentlyCompleted,
          watched_seconds: playerRef.current ? playerRef.current.getCurrentTime() : 0
        })
      });
    } catch (err) {
      console.warn('Progress sync error:', err.message);
    }
  };

  // Add Timestamped Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeLesson) return;

    const currentSeconds = playerRef.current ? Math.floor(playerRef.current.getCurrentTime()) : 0;
    setIsSavingNote(true);

    try {
      const savedNote = await apiFetch(`/api/lessons/${activeLesson.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          user_email: currentUser?.email || 'student',
          video_timestamp_seconds: currentSeconds,
          content: newNoteContent
        })
      });

      setNotes(prev => [savedNote, ...prev]);
      setNewNoteContent('');
    } catch (err) {
      alert('Could not save note: ' + err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    try {
      await apiFetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  // Jump to video timestamp
  const handleJumpToTimestamp = (seconds) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      playerRef.current.play();
    }
  };

  // Post Discussion
  const handlePostDiscussion = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeLesson) return;

    setIsPostingComment(true);
    try {
      const savedDiscussion = await apiFetch(`/api/lessons/${activeLesson.id}/discussions`, {
        method: 'POST',
        body: JSON.stringify({
          user_email: currentUser?.email || 'student',
          user_name: currentUser?.name || 'Godol Scholar',
          content: newComment
        })
      });

      setDiscussions(prev => [savedDiscussion, ...prev]);
      setNewComment('');
    } catch (err) {
      alert('Could not post comment: ' + err.message);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
        <h3 className="font-serif text-xl font-bold">Preparing Your Learning Theater...</h3>
        <p className="text-xs text-white/50 mt-1">Connecting to Bunny.net High-Velocity Stream CDN</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-serif text-3xl font-bold mb-3">Course Not Found</h2>
        <p className="text-white/60 text-sm mb-6 max-w-md">
          The requested course could not be retrieved from the learning engine.
        </p>
        <Link
          href="/courses"
          className="px-6 py-2.5 rounded-full font-bold text-xs"
          style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
        >
          Return to Course Catalog
        </Link>
      </div>
    );
  }

  const isCurrentCompleted = completedLessonIds.includes(activeLesson?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-accent selection:text-slate-950">
      {/* Top Glass Navigation Bar */}
      <header className="h-16 px-4 md:px-6 liquid-glass border-b border-white/10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${course.slug || course.id}`}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Course Overview</span>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div>
            <h1 className="font-bold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">
              {course.title}
            </h1>
            <p className="text-[10px] text-white/50 hidden md:block">
              {activeLesson ? activeLesson.title : 'Select a lesson'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Course Progress Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
            <div className="w-20 bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-accent h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-accent font-bold">
              {progressPercent}%
            </span>
            <span className="text-[10px] text-white/40">
              ({completedLessonIds.length}/{allLessons.length})
            </span>
          </div>

          {/* Theater Mode Toggle */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all"
            title={isTheaterMode ? 'Exit Theater Mode' : 'Theater Mode'}
          >
            {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
              isSidebarOpen ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/5 text-white/70 hover:bg-white/15'
            }`}
            title="Toggle Curriculum Sidebar"
          >
            <span className="hidden sm:inline">Curriculum</span>
            <span className="sm:hidden">Menu</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column: Video Player Stage & Interactive Tabs */}
        <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${isTheaterMode ? 'w-full' : ''}`}>
          {/* Video Player Stage */}
          <div className="p-4 md:p-6 bg-slate-900/40 border-b border-white/5">
            <div className={`mx-auto transition-all duration-300 ${isTheaterMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
              <BunnyVideoPlayer
                ref={playerRef}
                videoId={activeLesson?.bunnyVideoId || activeLesson?.bunny_video_id}
                libraryId={activeLesson?.bunnyLibraryId || activeLesson?.bunny_library_id}
                title={activeLesson?.title}
                autoPlay={false}
                hasNextLesson={Boolean(nextLesson)}
                onPlayNextLesson={() => nextLesson && handleSelectLesson(nextLesson)}
                onLessonComplete={() => {
                  if (activeLesson) handleToggleComplete(activeLesson.id);
                }}
              />

              {/* Player Stage Controls & Navigation */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    disabled={!previousLesson}
                    onClick={() => previousLesson && handleSelectLesson(previousLesson)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white/80 transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white/80 transition-all flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleComplete(activeLesson?.id)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                      isCurrentCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {isCurrentCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed ✓</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Workspace Tabs (Below Video) */}
          <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex-1">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                {
                  id: 'resources',
                  label: `Resources (${activeLesson?.resourceUrls?.length || 0})`,
                  icon: Download
                },
                { id: 'notes', label: `My Notes (${notes.length})`, icon: Bookmark },
                {
                  id: 'discussion',
                  label: `Q&A & Discussion (${discussions.length})`,
                  icon: MessageSquare
                }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'liquid-glass text-white border border-accent/40 shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    style={isActive ? { background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 60%)' } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs text-accent font-semibold mb-1">
                    <span>Active Lesson</span>
                    <span>•</span>
                    <span>{activeLesson?.durationSeconds ? `${Math.round(activeLesson.durationSeconds / 60)} mins` : '15 mins'}</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-white mb-3">
                    {activeLesson?.title}
                  </h2>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                    {activeLesson?.description ||
                      'Comprehensive case analysis and operational frameworks developed by experienced East African executives and founders.'}
                  </p>
                </div>

                {/* Key Takeaways Card */}
                <div className="liquid-glass liquid-glass-squircle p-6 space-y-3 border border-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                    <Sparkles className="w-4 h-4" />
                    <span>Key Lesson Takeaways</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-white/80">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Direct application to regional currency dynamics, customer segments, and mobile money rails.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Review accompanying Bunny Storage CDN worksheets and financial models in the Resources tab.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Record timestamped thoughts in the Notes tab to revisit key timestamps anytime.</span>
                    </li>
                  </ul>
                </div>

                {/* Interactive Mini Quiz / Knowledge Check */}
                <div className="liquid-glass liquid-glass-squircle p-6 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4" />
                      <span>Knowledge Check</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">Quick Concept Check</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    What is the primary commercial priority when scaling high-velocity inventory across East African trade corridors?
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: 'A', text: 'Minimizing local mobile money fees by enforcing foreign paper invoices' },
                      { id: 'B', text: 'Dynamic cashflow buffering across dual-currency exchange corridors (USD / Local Mobile Money)', isCorrect: true },
                      { id: 'C', text: 'Eliminating local supplier partnerships in favor of distant sea freight' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setQuizAnswer(opt.id);
                          setQuizSubmitted(true);
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          quizAnswer === opt.id
                            ? opt.isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                              : 'bg-rose-950/60 border-rose-500 text-rose-200'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <span>{opt.id}. {opt.text}</span>
                        {quizSubmitted && quizAnswer === opt.id && (
                          opt.isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  {quizSubmitted && (
                    <p className="text-[11px] text-emerald-400 font-medium">
                      ✓ Correct! Liquid cashflow buffers protect working capital against fluctuating cross-border exchange rates.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: RESOURCES */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-white">
                    Course Materials & Bunny Storage CDN Files
                  </h3>
                  <span className="text-xs text-white/50">
                    High-speed direct CDN downloads
                  </span>
                </div>

                {activeLesson?.resourceUrls && activeLesson.resourceUrls.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeLesson.resourceUrls.map((res, i) => (
                      <div
                        key={i}
                        className="liquid-glass liquid-glass-squircle p-5 border border-white/10 flex items-center justify-between gap-4 hover:border-accent/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {res.title || res.name || `Material-${i + 1}`}
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {res.size || 'PDF Document'} • Bunny Storage CDN
                            </p>
                          </div>
                        </div>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-2.5 rounded-xl bg-white/10 hover:bg-accent hover:text-slate-950 text-white transition-all shrink-0"
                          title="Download from CDN"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="liquid-glass rounded-2xl p-10 text-center border border-dashed border-white/10">
                    <Download className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-xs font-bold text-white">No external file attachments for this lesson</p>
                    <p className="text-[11px] text-white/40 mt-1">
                      Check upcoming lessons or the course capstone module for additional templates.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TIMESTAMPED NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white mb-1">
                    Timestamped Study Notes
                  </h3>
                  <p className="text-xs text-white/50">
                    Type a thought below. The current video second is captured automatically so you can jump straight back to it.
                  </p>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="liquid-glass liquid-glass-squircle p-4 border border-white/10 space-y-3">
                  <textarea
                    rows={3}
                    required
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Capture key strategy insight or takeaway..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 outline-none focus:border-accent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-accent font-mono font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Current Video Timestamp: {formatSeconds(playerRef.current ? playerRef.current.getCurrentTime() : 0)}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingNote || !newNoteContent.trim()}
                      className="px-5 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-50"
                      style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                    >
                      {isSavingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="liquid-glass rounded-2xl p-8 text-center border border-dashed border-white/10 text-white/40 text-xs">
                      No notes written for this lesson yet.
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="liquid-glass liquid-glass-squircle p-4 border border-white/10 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <button
                            onClick={() => handleJumpToTimestamp(note.videoTimestampSeconds || note.video_timestamp_seconds || 0)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-accent/20 text-accent hover:bg-accent hover:text-slate-950 transition-colors"
                            title="Click to jump video to this second"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{formatSeconds(note.videoTimestampSeconds || note.video_timestamp_seconds || 0)}</span>
                          </button>
                          <p className="text-xs text-white/90 leading-relaxed whitespace-pre-line">
                            {note.content}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-white/30 hover:text-rose-400 transition-colors p-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: DISCUSSION & Q&A */}
            {activeTab === 'discussion' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white mb-1">
                    Lesson Discussion & Academic Q&A
                  </h3>
                  <p className="text-xs text-white/50">
                    Ask questions or collaborate with fellow cohort leaders and Godol faculty mentors.
                  </p>
                </div>

                {/* Comment Form */}
                <form onSubmit={handlePostDiscussion} className="liquid-glass liquid-glass-squircle p-4 border border-white/10 space-y-3">
                  <textarea
                    rows={3}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or share regional insights..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 outline-none focus:border-accent resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPostingComment || !newComment.trim()}
                      className="px-5 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPostingComment ? 'Posting...' : 'Post Question'}</span>
                    </button>
                  </div>
                </form>

                {/* Discussions List */}
                <div className="space-y-3">
                  {discussions.length === 0 ? (
                    <div className="liquid-glass rounded-2xl p-8 text-center border border-dashed border-white/10 text-white/40 text-xs">
                      No questions posted for this lesson yet. Be the first to start the discussion!
                    </div>
                  ) : (
                    discussions.map((d) => (
                      <div
                        key={d.id}
                        className="liquid-glass liquid-glass-squircle p-4 border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {d.userName || d.user_name || 'Scholar'}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {new Date(d.createdAt || d.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                          {d.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Collapsible Glass Curriculum Sidebar */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-96 liquid-glass border-l border-white/10 flex flex-col h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="font-serif font-bold text-sm text-white">Curriculum Syllabus</span>
                <span className="text-xs text-accent font-semibold">{progressPercent}% Completed</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-white/40 mt-2">
                {completedLessonIds.length} of {allLessons.length} lessons finished
              </p>
            </div>

            {/* Modules Accordion */}
            <div className="divide-y divide-white/5 flex-1">
              {modules.map((mod, modIdx) => {
                const isCollapsed = collapsedModuleIds.includes(mod.id);
                const modLessons = mod.lessons || [];
                const modCompletedCount = modLessons.filter(l => completedLessonIds.includes(l.id)).length;

                return (
                  <div key={mod.id || modIdx} className="bg-white/[0.01]">
                    <button
                      onClick={() => {
                        setCollapsedModuleIds(prev =>
                          prev.includes(mod.id) ? prev.filter(id => id !== mod.id) : [...prev, mod.id]
                        );
                      }}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-white leading-snug">
                          {mod.title}
                        </h4>
                        <span className="text-[10px] text-white/50">
                          {modCompletedCount}/{modLessons.length} Completed
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-white/40" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-white/40" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="divide-y divide-white/5 bg-black/20">
                        {modLessons.map((lesson) => {
                          const isActive = activeLesson?.id === lesson.id;
                          const isDone = completedLessonIds.includes(lesson.id);

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              className={`w-full p-3.5 flex items-start gap-3 text-left transition-all ${
                                isActive
                                  ? 'bg-accent/15 border-l-4 border-accent'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              {/* Completion Indicator */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(lesson.id);
                                }}
                                className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                  isDone
                                    ? 'bg-emerald-500 text-slate-950 font-bold'
                                    : 'border border-white/20 hover:border-accent text-transparent'
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-accent font-bold' : 'text-white/90'}`}>
                                    {lesson.title}
                                  </span>
                                  {isActive && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-accent text-slate-950 shrink-0">
                                      Playing
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                                  <Clock className="w-3 h-3" />
                                  <span>{lesson.durationSeconds ? `${Math.round(lesson.durationSeconds / 60)}m` : '15m'}</span>
                                  {lesson.isFreePreview && (
                                    <span className="text-emerald-400 font-semibold">• Preview</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

