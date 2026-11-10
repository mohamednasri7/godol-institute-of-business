import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Video,
  CheckCircle,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  Play,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { bunnyService } from '../../lib/bunnyService';

export default function AdminCourseContent() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [curriculum, setCurriculum] = useState({ course: null, modules: [] });
  const [courseStats, setCourseStats] = useState({ totalEnrolled: 0, completedCount: 0, avgProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // New module modal / state
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  // Add lesson form state
  const [activeModuleForLesson, setActiveModuleForLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    durationSeconds: 900,
    isFreePreview: false,
    bunnyVideoId: '',
    bunnyLibraryId: '342890',
    resourceUrls: []
  });

  // Video upload progress state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(null); // null | { percent, loaded, total }
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Resource upload progress state
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceUploadProgress, setResourceUploadProgress] = useState(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);

  const fetchCourses = () => {
    setIsLoading(true);
    apiFetch('/api/admin/courses')
      .then((data) => {
        setCourses(data);
        if (data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch curriculum & stats when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;

    apiFetch(`/api/courses/${selectedCourseId}/curriculum`)
      .then((data) => setCurriculum(data))
      .catch(() => setCurriculum({ course: null, modules: [] }));

    apiFetch(`/api/courses/${selectedCourseId}/stats`)
      .then((stats) => setCourseStats(stats))
      .catch(() => setCourseStats({ totalEnrolled: 0, completedCount: 0, avgProgress: 0 }));
  }, [selectedCourseId]);

  const selectedCourse = curriculum.course || courses.find((c) => c.id === Number(selectedCourseId));

  // Add Module
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !selectedCourseId) return;

    try {
      await apiFetch(`/api/courses/${selectedCourseId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ title: newModuleTitle })
      });
      setNewModuleTitle('');
      setIsAddingModule(false);
      // Refresh curriculum
      const updated = await apiFetch(`/api/courses/${selectedCourseId}/curriculum`);
      setCurriculum(updated);
    } catch (err) {
      alert('Could not add module: ' + err.message);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;
    try {
      await apiFetch(`/api/courses/${selectedCourseId}/modules/${moduleId}`, {
        method: 'DELETE'
      });
      const updated = await apiFetch(`/api/courses/${selectedCourseId}/curriculum`);
      setCurriculum(updated);
    } catch (err) {
      alert('Could not delete module: ' + err.message);
    }
  };

  // Direct Video Upload to Bunny Stream
  const handleUploadVideoToBunny = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setIsUploadingVideo(true);
    setVideoUploadProgress({ percent: 0, loaded: 0, total: file.size });

    try {
      const result = await bunnyService.uploadVideo(file, file.name, (progress) => {
        setVideoUploadProgress(progress);
      });

      setLessonForm((prev) => ({
        ...prev,
        bunnyVideoId: result.videoId,
        bunnyLibraryId: result.libraryId || prev.bunnyLibraryId
      }));
    } catch (err) {
      alert('Video upload error: ' + err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Direct Resource Upload to Bunny Storage CDN
  const handleUploadResourceToBunny = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResourceFile(file);
    setIsUploadingResource(true);
    setResourceUploadProgress({ percent: 0, loaded: 0, total: file.size });

    try {
      const result = await bunnyService.uploadResource(file, 'materials', (progress) => {
        setResourceUploadProgress(progress);
      });

      const newAttachment = {
        title: file.name,
        url: result.cdnUrl || result.url,
        size: `${Math.round(file.size / 1024)} KB`
      };

      setLessonForm((prev) => ({
        ...prev,
        resourceUrls: [...prev.resourceUrls, newAttachment]
      }));
    } catch (err) {
      alert('Resource upload error: ' + err.message);
    } finally {
      setIsUploadingResource(false);
      setResourceUploadProgress(null);
    }
  };

  // Submit New Lesson
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim() || !activeModuleForLesson) return;

    try {
      await apiFetch(`/api/courses/${selectedCourseId}/modules/${activeModuleForLesson}/lessons`, {
        method: 'POST',
        body: JSON.stringify(lessonForm)
      });

      // Reset form
      setLessonForm({
        title: '',
        description: '',
        durationSeconds: 900,
        isFreePreview: false,
        bunnyVideoId: '',
        bunnyLibraryId: '342890',
        resourceUrls: []
      });
      setActiveModuleForLesson(null);
      setVideoUploadProgress(null);

      // Refresh curriculum
      const updated = await apiFetch(`/api/courses/${selectedCourseId}/curriculum`);
      setCurriculum(updated);
    } catch (err) {
      alert('Could not save lesson: ' + err.message);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await apiFetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      const updated = await apiFetch(`/api/courses/${selectedCourseId}/curriculum`);
      setCurriculum(updated);
    } catch (err) {
      alert('Could not delete lesson: ' + err.message);
    }
  };

  // Toggle Course Publish Status
  const handleTogglePublish = async () => {
    if (!selectedCourse) return;
    const nextStatus = selectedCourse.status === 'published' ? 'draft' : 'published';
    try {
      await apiFetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      fetchCourses();
    } catch (err) {
      alert('Could not update status: ' + err.message);
    }
  };

  return (
    <AdminLayout
      title="Course & Curriculum Manager"
      subtitle="Manage video modules, Bunny.net Stream transcoding, CDN storage, and student completion"
    >
      <div className="space-y-8">
        {/* Course Selector & Global Course KPI Strip */}
        <div className="liquid-glass liquid-glass-squircle p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/20">
          <div className="space-y-1.5 flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Select Active Course
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary w-full max-w-md shadow-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status === 'published' ? 'Live' : 'Draft'})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Metrics from Supabase */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center px-3 py-1 border-r border-border/80">
              <div className="text-lg font-black text-foreground">{courseStats.totalEnrolled}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Enrolled Students
              </div>
            </div>
            <div className="text-center px-3 py-1 border-r border-border/80">
              <div className="text-lg font-black text-accent">{courseStats.avgProgress}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Avg Completion
              </div>
            </div>
            <div className="text-center px-3 py-1">
              <div className="text-lg font-black text-emerald-600">{courseStats.completedCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Graduates
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {selectedCourse && (
              <>
                <button
                  onClick={handleTogglePublish}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCourse.status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                  }`}
                >
                  {selectedCourse.status === 'published' ? 'Status: Published ✓' : 'Status: Draft'}
                </button>
                <a
                  href={`/courses/${selectedCourse.slug || selectedCourse.id}/learn`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Player</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Modules & Lessons Curriculum Engine */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Structured Modules & Lessons
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload videos directly to Bunny.net Stream API and attach CDN slide materials
              </p>
            </div>
            <button
              onClick={() => setIsAddingModule(true)}
              className="px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md transition-transform hover:scale-105"
              style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Module</span>
            </button>
          </div>

          {/* Add Module Modal */}
          {isAddingModule && (
            <form
              onSubmit={handleAddModule}
              className="liquid-glass liquid-glass-squircle p-6 border border-accent/40 space-y-4 shadow-lg animate-fadeIn"
            >
              <h4 className="font-bold text-sm text-foreground">Create New Course Module</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="Module Title (e.g. Module 4: Corporate Governance & Risk)..."
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingModule(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                  >
                    Save Module
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Modules List */}
          {curriculum.modules && curriculum.modules.length > 0 ? (
            <div className="space-y-6">
              {curriculum.modules.map((mod, modIdx) => (
                <div
                  key={mod.id || modIdx}
                  className="liquid-glass liquid-glass-squircle p-6 shadow-sm space-y-4 border border-border/80"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {modIdx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{mod.title}</h4>
                        <span className="text-[10px] text-muted-foreground">
                          {mod.lessons?.length || 0} lessons registered in Supabase
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveModuleForLesson(mod.id)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lesson</span>
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons in Module */}
                  <div className="space-y-2">
                    {mod.lessons && mod.lessons.length > 0 ? (
                      mod.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id || lIdx}
                          className="p-3.5 bg-card/60 hover:bg-card border border-border/60 rounded-xl flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Video className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground truncate block">
                                {lIdx + 1}. {lesson.title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span>{lesson.durationSeconds ? `${Math.round(lesson.durationSeconds / 60)} min` : '15 min'}</span>
                                {lesson.bunnyVideoId && (
                                  <span className="text-accent font-mono">
                                    • Bunny ID: {lesson.bunnyVideoId.slice(0, 16)}...
                                  </span>
                                )}
                                {lesson.resourceUrls?.length > 0 && (
                                  <span className="text-blue-500 font-medium">
                                    • {lesson.resourceUrls.length} CDN files
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {lesson.isFreePreview && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                Free Preview
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="text-muted-foreground hover:text-rose-600 p-1"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic py-2">
                        No lessons in this module yet. Click "+ Add Lesson" to upload videos.
                      </p>
                    )}
                  </div>

                  {/* Add Lesson Form Expansion */}
                  {activeModuleForLesson === mod.id && (
                    <form
                      onSubmit={handleSaveLesson}
                      className="mt-4 p-5 rounded-2xl bg-muted/40 border border-border space-y-4 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Add Lesson to "{mod.title}"
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveModuleForLesson(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            Lesson Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Navigating Currency Fluctuations"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            Estimated Duration (Seconds)
                          </label>
                          <input
                            type="number"
                            value={lessonForm.durationSeconds}
                            onChange={(e) =>
                              setLessonForm({ ...lessonForm, durationSeconds: Number(e.target.value) })
                            }
                            className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-foreground mb-1">
                          Lesson Summary / Takeaways
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Brief description of the skills and frameworks covered..."
                          value={lessonForm.description}
                          onChange={(e) =>
                            setLessonForm({ ...lessonForm, description: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl p-3 text-xs outline-none focus:border-primary resize-none"
                        />
                      </div>

                      {/* Bunny Stream Video Uploader */}
                      <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-accent" />
                            <span>Bunny.net Stream Video</span>
                          </label>
                          {lessonForm.bunnyVideoId && (
                            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                              ✓ Ready ({lessonForm.bunnyVideoId.slice(0, 12)}...)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="video/*"
                            disabled={isUploadingVideo}
                            onChange={handleUploadVideoToBunny}
                            className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                        </div>

                        {/* Live Upload Progress Bar */}
                        {isUploadingVideo && videoUploadProgress && (
                          <div className="space-y-1 pt-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Streaming to Bunny.net library...</span>
                              <span className="font-bold text-accent">{videoUploadProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-accent h-full transition-all duration-200"
                                style={{ width: `${videoUploadProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bunny Storage CDN Resource Uploader */}
                      <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span>Attach PDF Slides / Worksheet (Bunny Storage CDN)</span>
                        </label>

                        <input
                          type="file"
                          accept=".pdf,.xlsx,.doc,.docx"
                          disabled={isUploadingResource}
                          onChange={handleUploadResourceToBunny}
                          className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        />

                        {isUploadingResource && (
                          <div className="text-[10px] text-blue-600 animate-pulse">
                            Uploading to Bunny Storage CDN zone...
                          </div>
                        )}

                        {lessonForm.resourceUrls.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {lessonForm.resourceUrls.map((r, ri) => (
                              <div
                                key={ri}
                                className="text-[11px] text-muted-foreground flex items-center justify-between"
                              >
                                <span>📄 {r.title} ({r.size})</span>
                                <span className="text-emerald-600 font-bold">Attached</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Free Preview Toggle */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="freePreviewCheckbox"
                          checked={lessonForm.isFreePreview}
                          onChange={(e) =>
                            setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-primary focus:ring-0"
                        />
                        <label
                          htmlFor="freePreviewCheckbox"
                          className="text-xs font-semibold text-foreground cursor-pointer"
                        >
                          Enable Free Preview for Website Visitors (unauthenticated preview)
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveModuleForLesson(null)}
                          className="px-4 py-2 rounded-xl border border-border text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUploadingVideo || isUploadingResource}
                          className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md"
                        >
                          Save Lesson & Sync Supabase
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="liquid-glass rounded-2xl p-12 text-center border border-dashed border-border">
              <FolderPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="font-bold text-base text-foreground mb-1">
                No modules configured for this course yet
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Create your first module above to begin organizing lessons and streaming video materials.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
