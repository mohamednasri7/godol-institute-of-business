import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  FolderPlus,
  Video,
  CheckCircle,
  UploadCloud,
  FileText,
  Clock,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  X,
  Edit2,
  File,
  Download,
  Play,
  Film,
  Layers,
  Check,
  RefreshCw,
  Folder,
  Sparkles
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';
import { bunnyService } from '../../lib/bunnyService';
import * as tus from 'tus-js-client';

const DEFAULT_LIBRARY_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '815251';

// Helper for human-readable file sizes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Helper for file type badges
function getFileTypeBadge(ext = 'pdf') {
  const clean = ext.replace('.', '').toLowerCase();
  switch (clean) {
    case 'pdf':
      return { label: 'PDF', bg: 'bg-rose-500/15 text-rose-600 border-rose-500/30' };
    case 'doc':
    case 'docx':
      return { label: 'DOCX', bg: 'bg-blue-500/15 text-blue-600 border-blue-500/30' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { label: 'SHEET', bg: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' };
    case 'ppt':
    case 'pptx':
      return { label: 'SLIDES', bg: 'bg-amber-500/15 text-amber-600 border-amber-500/30' };
    case 'zip':
    case 'rar':
      return { label: 'ZIP', bg: 'bg-purple-500/15 text-purple-600 border-purple-500/30' };
    default:
      return { label: clean.toUpperCase(), bg: 'bg-slate-500/15 text-slate-600 border-slate-500/30' };
  }
}

export default function AdminCourseContent() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [curriculum, setCurriculum] = useState({ course: null, modules: [] });
  const [courseStats, setCourseStats] = useState({ totalEnrolled: 0, completedCount: 0, avgProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // New module modal / inline states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');

  // Add lesson form state per module
  const [addingLessonModuleId, setAddingLessonModuleId] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState(15); // in minutes

  // Dedicated Lesson Content Manager Drawer / Modal
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLessonModule, setActiveLessonModule] = useState(null);
  const [drawerTab, setDrawerTab] = useState('video'); // 'video' | 'resources'
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // Video Streaming State
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(null); // { percent, loaded, total }
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [customBunnyVideoId, setCustomBunnyVideoId] = useState('');
  const [customBunnyLibraryId, setCustomBunnyLibraryId] = useState(DEFAULT_LIBRARY_ID);
  const [videoStatus, setVideoStatus] = useState('ready'); // 'pending' | 'uploading' | 'processing' | 'ready'
  const videoInputRef = useRef(null);

  // Downloadable Resources State
  const [resourceDragOver, setResourceDragOver] = useState(false);
  const [resourceUploadProgress, setResourceUploadProgress] = useState(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const resourceInputRef = useRef(null);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const [schemaError, setSchemaError] = useState(false);
  const [isReloadingSchema, setIsReloadingSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleCopySql = () => {
    const sql = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.course_modules (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT,
  video_library_id TEXT DEFAULT '815251',
  video_status TEXT DEFAULT 'pending',
  duration_seconds INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL,
  course_id BIGINT,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can manage course_modules" ON public.course_modules;
CREATE POLICY "Public can manage course_modules" ON public.course_modules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage course_lessons" ON public.course_lessons;
CREATE POLICY "Public can manage course_lessons" ON public.course_lessons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage lesson_resources" ON public.lesson_resources;
CREATE POLICY "Public can manage lesson_resources" ON public.lesson_resources FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      showToast('SQL migration copied to clipboard! Paste and Run in Supabase SQL Editor.');
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleReloadSchema = async () => {
    setIsReloadingSchema(true);
    try {
      const res = await apiFetch('/api/admin/supabase/reload-schema', { method: 'POST' });
      if (res.success) {
        setSchemaError(false);
        showToast('✅ Supabase course_modules table is connected and ready!');
        fetchCurriculum();
      } else {
        setSchemaError(true);
        showToast(res.message || 'Table not found yet. Run the SQL script in Supabase first.', 'warning');
      }
    } catch (err) {
      showToast('Connection check failed: ' + err.message, 'error');
    } finally {
      setIsReloadingSchema(false);
    }
  };

  // Fetch all courses and honor ?courseId= from URL
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/admin/courses');
      setCourses(data);

      const urlParams = new URLSearchParams(window.location.search);
      const paramId = urlParams.get('courseId');

      if (paramId && data.some((c) => String(c.id) === String(paramId))) {
        setSelectedCourseId(String(paramId));
      } else if (data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(String(data[0].id));
      }
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch curriculum & stats in parallel when selectedCourseId changes
  const fetchCurriculum = async () => {
    if (!selectedCourseId) return;
    try {
      const [currRes, statsRes] = await Promise.allSettled([
        apiFetch(`/api/courses/${selectedCourseId}/curriculum`),
        apiFetch(`/api/courses/${selectedCourseId}/stats`)
      ]);

      if (currRes.status === 'fulfilled' && currRes.value) {
        const data = currRes.value;
        setCurriculum(data);
        // Keep activeLesson updated if it's currently open in modal
        if (activeLesson) {
          let refreshedLesson = null;
          for (const mod of data.modules || []) {
            const found = (mod.lessons || []).find((l) => l.id === activeLesson.id);
            if (found) {
              refreshedLesson = found;
              break;
            }
          }
          if (refreshedLesson) {
            setActiveLesson(refreshedLesson);
            setCustomBunnyVideoId(refreshedLesson.bunnyVideoId || refreshedLesson.bunny_video_id || '');
            setCustomBunnyLibraryId(refreshedLesson.videoLibraryId || refreshedLesson.video_library_id || DEFAULT_LIBRARY_ID);
            setVideoStatus(refreshedLesson.videoStatus || (refreshedLesson.bunnyVideoId ? 'ready' : 'pending'));
          }
        }
      } else {
        setCurriculum({ course: null, modules: [] });
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setCourseStats(statsRes.value);
      } else {
        setCourseStats({ totalEnrolled: 0, completedCount: 0, avgProgress: 0 });
      }
    } catch {
      setCurriculum({ course: null, modules: [] });
      setCourseStats({ totalEnrolled: 0, completedCount: 0, avgProgress: 0 });
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, [selectedCourseId]);

  const selectedCourse = curriculum.course || courses.find((c) => String(c.id) === String(selectedCourseId));

  // -------------------------------------------------------------
  // MODULES: Add, Rename, Reorder, Delete
  // -------------------------------------------------------------
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !selectedCourseId) return;

    try {
      const res = await apiFetch(`/api/courses/${selectedCourseId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ title: newModuleTitle.trim() })
      });
      setNewModuleTitle('');
      setIsAddingModule(false);
      if (res && res.warning) {
        showToast('Module created! (Saved locally & synced to course sections)');
      } else {
        showToast('Module created successfully');
      }
      fetchCurriculum();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('PGRST205') || msg.includes('schema cache') || msg.includes('does not exist')) {
        setSchemaError(true);
      }
      showToast('Could not add module: ' + msg, 'error');
    }
  };

  const handleStartRenameModule = (mod) => {
    setEditingModuleId(mod.id);
    setEditingModuleTitle(mod.title);
  };

  const handleSaveRenameModule = async (moduleId) => {
    if (!editingModuleTitle.trim()) return;
    try {
      await apiFetch(`/api/courses/${selectedCourseId}/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editingModuleTitle.trim() })
      });
      setEditingModuleId(null);
      showToast('Module renamed');
      fetchCurriculum();
    } catch (err) {
      showToast('Rename failed: ' + err.message, 'error');
    }
  };

  const handleMoveModule = async (modIndex, direction) => {
    const modules = [...(curriculum.modules || [])];
    const targetIndex = direction === 'up' ? modIndex - 1 : modIndex + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const currentMod = modules[modIndex];
    const swapMod = modules[targetIndex];

    const currentOrder = currentMod.sortOrder || currentMod.sort_order || modIndex + 1;
    const swapOrder = swapMod.sortOrder || swapMod.sort_order || targetIndex + 1;

    try {
      await Promise.all([
        apiFetch(`/api/courses/${selectedCourseId}/modules/${currentMod.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: swapOrder })
        }),
        apiFetch(`/api/courses/${selectedCourseId}/modules/${swapMod.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: currentOrder })
        })
      ]);
      fetchCurriculum();
    } catch (err) {
      showToast('Could not reorder modules: ' + err.message, 'error');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module and all its attached lessons and media?')) return;
    try {
      await apiFetch(`/api/courses/${selectedCourseId}/modules/${moduleId}`, {
        method: 'DELETE'
      });
      showToast('Module deleted');
      fetchCurriculum();
    } catch (err) {
      showToast('Could not delete module: ' + err.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // LESSONS: Add, Reorder, Delete
  // -------------------------------------------------------------
  const handleAddLessonQuick = async (e, moduleId) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    try {
      const created = await apiFetch(`/api/courses/${selectedCourseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        body: JSON.stringify({
          title: newLessonTitle.trim(),
          durationSeconds: (Number(newLessonDuration) || 15) * 60,
          videoStatus: 'pending'
        })
      });

      setNewLessonTitle('');
      setAddingLessonModuleId(null);
      showToast(`Lesson "${created.title}" created. Opening media drawer...`);
      await fetchCurriculum();

      // Immediately open the newly created lesson in the drawer!
      const targetMod = curriculum.modules?.find((m) => m.id === moduleId);
      openLessonDrawer(created, targetMod);
    } catch (err) {
      showToast('Could not create lesson: ' + err.message, 'error');
    }
  };

  const handleMoveLesson = async (mod, lessonIndex, direction) => {
    const lessons = [...(mod.lessons || [])];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const currentLesson = lessons[lessonIndex];
    const swapLesson = lessons[targetIndex];

    const currentOrder = currentLesson.sortOrder || currentLesson.sort_order || lessonIndex + 1;
    const swapOrder = swapLesson.sortOrder || swapLesson.sort_order || targetIndex + 1;

    try {
      await Promise.all([
        apiFetch(`/api/lessons/${currentLesson.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: swapOrder })
        }),
        apiFetch(`/api/lessons/${swapLesson.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: currentOrder })
        })
      ]);
      fetchCurriculum();
    } catch (err) {
      showToast('Could not reorder lessons: ' + err.message, 'error');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson and its media?')) return;
    try {
      await apiFetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      if (activeLesson?.id === lessonId) {
        closeLessonDrawer();
      }
      showToast('Lesson deleted');
      fetchCurriculum();
    } catch (err) {
      showToast('Could not delete lesson: ' + err.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // LESSON MEDIA & RESOURCE DRAWER / MODAL
  // -------------------------------------------------------------
  const openLessonDrawer = (lesson, mod) => {
    setActiveLesson(lesson);
    setActiveLessonModule(mod);
    setDrawerTab('video');
    setCustomBunnyVideoId(lesson.bunnyVideoId || lesson.bunny_video_id || '');
    setCustomBunnyLibraryId(lesson.videoLibraryId || lesson.video_library_id || DEFAULT_LIBRARY_ID);
    setVideoStatus(lesson.videoStatus || (lesson.bunnyVideoId || lesson.bunny_video_id ? 'ready' : 'pending'));
    setVideoUploadProgress(null);
    setResourceUploadProgress(null);
  };

  const closeLessonDrawer = () => {
    setActiveLesson(null);
    setActiveLessonModule(null);
    setVideoUploadProgress(null);
    setResourceUploadProgress(null);
  };

  const handleUpdateLessonField = async (fields) => {
    if (!activeLesson) return;
    setIsSavingLesson(true);
    try {
      const updated = await apiFetch(`/api/lessons/${activeLesson.id}`, {
        method: 'PUT',
        body: JSON.stringify(fields)
      });
      setActiveLesson((prev) => ({ ...prev, ...updated, ...fields }));
      showToast('Lesson updated');
      fetchCurriculum();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    } finally {
      setIsSavingLesson(false);
    }
  };

  // TAB 1: Bunny Stream Video Upload via TUS resumable protocol
  const handleProcessVideoFile = async (file) => {
    if (!file || !activeLesson) return;
    const validExts = ['.mp4', '.mov', '.mkv', '.webm'];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      showToast('Please select a valid video file (.mp4, .mov, .mkv)', 'error');
      return;
    }

    setIsUploadingVideo(true);
    setVideoStatus('uploading');
    setVideoUploadProgress({ percent: 0, loaded: 0, total: file.size });

    try {
      // 1. Get TUS credentials from server (creates video object + signs)
      const creds = await apiFetch('/api/bunny/stream/sign-tus', {
        method: 'POST',
        body: JSON.stringify({
          title: `${selectedCourse?.title || 'Course'} - ${activeLesson.title}`,
          lessonId: activeLesson.id
        })
      });

      // 2. Simulated mode (no API key configured yet)
      if (creds.mode === 'simulated') {
        setCustomBunnyVideoId(creds.videoId);
        setVideoStatus('ready');
        await handleUpdateLessonField({
          bunnyVideoId: creds.videoId,
          videoLibraryId: creds.libraryId,
          videoStatus: 'ready'
        });
        showToast('Video linked (simulated — add BUNNY_STREAM_API_KEY to go live)');
        return;
      }

      // 3. Direct browser → Bunny TUS resumable upload (bypasses server body limits, supports 1GB+)
      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: 'https://video.bunnycdn.com/tusupload',
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 5 * 1024 * 1024, // 5 MB chunks
          metadata: {
            filetype: file.type,
            title: `${selectedCourse?.title || 'Course'} - ${activeLesson.title}`,
            filename: file.name
          },
          headers: {
            AuthorizationSignature: creds.authSignature,
            AuthorizationExpire: String(creds.authExpire),
            VideoId: creds.videoId,
            LibraryId: String(creds.libraryId)
          },
          onProgress(bytesUploaded, bytesTotal) {
            const percent = Math.round((bytesUploaded / bytesTotal) * 100);
            setVideoUploadProgress({ percent, loaded: bytesUploaded, total: bytesTotal });
          },
          onSuccess() {
            resolve();
          },
          onError(err) {
            reject(err);
          }
        });
        upload.start();
      });

      // 4. Upload finished — Bunny transcodes async; mark as processing
      setCustomBunnyVideoId(creds.videoId);
      setVideoStatus('processing');
      await handleUpdateLessonField({
        bunnyVideoId: creds.videoId,
        videoLibraryId: creds.libraryId,
        videoStatus: 'processing'
      });
      showToast('Video uploaded to Bunny Stream — transcoding in progress!');

      // After a short delay, optimistically mark ready
      setTimeout(() => setVideoStatus('ready'), 4000);

    } catch (tusErr) {
      console.warn('Direct TUS upload encountered error, attempting server fallback upload...', tusErr);
      try {
        showToast('Direct upload blocked — uploading via secure server proxy...');
        const fallbackRes = await bunnyService.uploadVideo(
          file,
          {
            title: `${selectedCourse?.title || 'Course'} - ${activeLesson.title}`,
            lessonId: activeLesson.id
          },
          (progress) => {
            setVideoUploadProgress(progress);
          }
        );

        const vId = fallbackRes.videoId || customBunnyVideoId;
        setCustomBunnyVideoId(vId);
        setVideoStatus('ready');
        await handleUpdateLessonField({
          bunnyVideoId: vId,
          videoLibraryId: fallbackRes.libraryId || DEFAULT_LIBRARY_ID,
          videoStatus: 'ready'
        });
        showToast('Video uploaded and linked successfully!');
      } catch (fallbackErr) {
        setVideoStatus('pending');
        showToast('Video upload error: ' + (fallbackErr?.message || tusErr?.message || 'Upload failed'), 'error');
      }
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleManualVideoIdSave = async () => {
    if (!activeLesson) return;
    const cleanVideoId = customBunnyVideoId.trim();
    const cleanLibraryId = (customBunnyLibraryId || '').trim() || DEFAULT_LIBRARY_ID;

    try {
      await handleUpdateLessonField({
        bunnyVideoId: cleanVideoId,
        bunny_video_id: cleanVideoId,
        videoLibraryId: cleanLibraryId,
        video_library_id: cleanLibraryId,
        videoStatus: cleanVideoId ? 'ready' : 'pending',
        video_status: cleanVideoId ? 'ready' : 'pending'
      });
      setVideoStatus(cleanVideoId ? 'ready' : 'pending');
      showToast(cleanVideoId ? 'Bunny Video ID linked successfully (Status: ready)' : 'Video ID removed');
    } catch (err) {
      showToast('Failed to link Video ID: ' + err.message, 'error');
    }
  };

  const handleDetachVideo = async () => {
    if (!confirm('Remove video link from this lesson?')) return;
    try {
      await handleUpdateLessonField({
        bunnyVideoId: '',
        bunny_video_id: '',
        videoStatus: 'pending',
        video_status: 'pending'
      });
      setCustomBunnyVideoId('');
      setVideoStatus('pending');
      showToast('Video unlinked');
    } catch (err) {
      showToast('Failed to remove video: ' + err.message, 'error');
    }
  };

  // TAB 2: Downloadable Course Resources (Bunny Storage Zone)
  const handleProcessResourceFiles = async (fileList) => {
    if (!fileList || fileList.length === 0 || !activeLesson) return;
    setIsUploadingResource(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setResourceUploadProgress({
          fileName: file.name,
          percent: 0,
          current: i + 1,
          total: fileList.length
        });

        await bunnyService.uploadResource(
          file,
          {
            courseId: selectedCourseId,
            lessonId: activeLesson.id,
            title: file.name
          },
          (progress) => {
            setResourceUploadProgress((prev) => ({
              ...prev,
              percent: progress.percent
            }));
          }
        );
      }

      showToast(`Uploaded ${fileList.length} resource(s) to Bunny Storage CDN`);
      await fetchCurriculum();
    } catch (err) {
      showToast('Resource upload error: ' + err.message, 'error');
    } finally {
      setIsUploadingResource(false);
      setResourceUploadProgress(null);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Permanently delete this resource from Bunny Storage CDN?')) return;
    try {
      await bunnyService.deleteResource(resourceId);
      showToast('Resource removed');
      await fetchCurriculum();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async () => {
    if (!selectedCourse) return;
    const nextStatus = selectedCourse.status === 'published' ? 'draft' : 'published';
    try {
      await apiFetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      showToast(`Course status updated to ${nextStatus}`);
      fetchCourses();
    } catch (err) {
      showToast('Could not update status: ' + err.message, 'error');
    }
  };

  const activeVideoId = activeLesson?.bunnyVideoId || activeLesson?.bunny_video_id || customBunnyVideoId;
  const activeLibraryId = (customBunnyLibraryId || '').trim() || activeLesson?.videoLibraryId || activeLesson?.video_library_id || DEFAULT_LIBRARY_ID;
  const activeResources = activeLesson?.resources || [];

  return (
    <AdminLayout
      title="Course Curriculum & Media Manager"
      subtitle="Manage video modules, Bunny Stream transcoding, CDN storage, and student downloadable resources"
    >
      <div className="space-y-8">
        {/* Toast alert */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn border max-w-sm ${toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-slate-900/90 text-white border-white/20'
              }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span className="leading-snug">{toast.msg}</span>
          </div>
        )}

        {/* Supabase Table Setup Notice / Helper */}
        {schemaError && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    Supabase dedicated curriculum tables (<code className="font-mono text-xs">course_modules</code>) not created yet
                  </p>
                  <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                    Your modules and lessons are being saved locally and synced to course sections. To create the tables directly in Supabase:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSchemaError(false)}
                className="text-muted-foreground hover:text-foreground p-1 text-xs"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>{copiedSql ? '✓ Copied SQL!' : 'Copy SQL Migration'}</span>
              </button>
              <a
                href="https://supabase.com/dashboard/project/vljphjdpaflahytyszaq/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl border border-amber-600/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Supabase SQL Editor</span>
              </a>
              <button
                onClick={handleReloadSchema}
                disabled={isReloadingSchema}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReloadingSchema ? 'animate-spin' : ''}`} />
                <span>{isReloadingSchema ? 'Checking...' : 'Verify Supabase Connection'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Header Card: Course Selector & Global Course KPI Strip */}
        <div className="liquid-glass liquid-glass-squircle p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/20">
          <div className="space-y-1.5 flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Select Active Course
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(String(e.target.value))}
                className="bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary w-full max-w-md shadow-sm"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.status === 'published' ? 'Live' : 'Draft'})
                  </option>
                ))}
              </select>
              <button
                onClick={fetchCurriculum}
                title="Refresh curriculum"
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-muted-foreground transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Realtime Metrics */}
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
                Avg Progress
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCourse.status === 'published'
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

        {/* Modules & Lessons Hierarchy Engine */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Curriculum Structure & Lessons
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any lesson to open the <strong>Bunny Stream Video</strong> & <strong>Bunny Storage CDN</strong> manager drawer.
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

          {/* Add Module Modal Form */}
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
                  placeholder="Module Title (e.g. Module 1: East African Market Dynamics)..."
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {modIdx + 1}
                      </span>

                      {editingModuleId === mod.id ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <input
                            type="text"
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => handleSaveRenameModule(mod.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Save Rename"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingModuleId(null)}
                            className="p-1.5 text-muted-foreground hover:text-foreground"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground truncate">{mod.title}</h4>
                            <button
                              onClick={() => handleStartRenameModule(mod)}
                              className="text-muted-foreground hover:text-primary p-1"
                              title="Rename Module"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {mod.lessons?.length || 0} {(mod.lessons?.length || 0) === 1 ? 'lesson' : 'lessons'} configured
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Module Controls: Reorder, Add Lesson, Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveModule(modIdx, 'up')}
                        disabled={modIdx === 0}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-muted/40"
                        title="Move Module Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'down')}
                        disabled={modIdx === (curriculum.modules?.length || 1) - 1}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-muted/40"
                        title="Move Module Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setAddingLessonModuleId(addingLessonModuleId === mod.id ? null : mod.id)}
                        className="ml-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lesson</span>
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List in Module */}
                  <div className="space-y-2">
                    {mod.lessons && mod.lessons.length > 0 ? (
                      mod.lessons.map((lesson, lIdx) => {
                        const hasVideo = Boolean(lesson.bunnyVideoId || lesson.bunny_video_id);
                        const resourceCount = (lesson.resources?.length || 0) + (lesson.resourceUrls?.length || 0);
                        const isSelected = activeLesson?.id === lesson.id;

                        return (
                          <div
                            key={lesson.id || lIdx}
                            onClick={() => openLessonDrawer(lesson, mod)}
                            className={`p-3.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer border ${isSelected
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-card/70 hover:bg-card border-border/60 hover:border-primary/40'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hasVideo ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                                  }`}
                              >
                                {hasVideo ? <Film className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                              </div>

                              <div className="min-w-0">
                                <span className="font-semibold text-foreground truncate block">
                                  {lIdx + 1}. {lesson.title}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  <span>{lesson.durationSeconds ? `${Math.round(lesson.durationSeconds / 60)} min` : '15 min'}</span>
                                  {hasVideo ? (
                                    <span className="text-emerald-600 font-medium">✓ Bunny Video Ready</span>
                                  ) : (
                                    <span className="text-amber-600">Pending Video Upload</span>
                                  )}
                                  {resourceCount > 0 && (
                                    <span className="text-blue-500 font-medium">
                                      • {resourceCount} {resourceCount === 1 ? 'file' : 'files'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Lesson Quick Actions */}
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {lesson.isFreePreview && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                  Free Preview
                                </span>
                              )}
                              <button
                                onClick={() => handleMoveLesson(mod, lIdx, 'up')}
                                disabled={lIdx === 0}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                                title="Move Lesson Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveLesson(mod, lIdx, 'down')}
                                disabled={lIdx === (mod.lessons?.length || 1) - 1}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                                title="Move Lesson Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="text-muted-foreground hover:text-rose-600 p-1"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic py-2">
                        No lessons in this module yet. Click "+ Add Lesson" to create your first lesson.
                      </p>
                    )}
                  </div>

                  {/* Inline Add Lesson Form */}
                  {addingLessonModuleId === mod.id && (
                    <form
                      onSubmit={(e) => handleAddLessonQuick(e, mod.id)}
                      className="mt-3 p-4 rounded-xl bg-muted/30 border border-border space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Quick Add Lesson to "{mod.title}"
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddingLessonModuleId(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Lesson Title (e.g. Navigating Dual-Currency Cashflows)..."
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            placeholder="Duration (Minutes)"
                            value={newLessonDuration}
                            onChange={(e) => setNewLessonDuration(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAddingLessonModuleId(null)}
                          className="px-3.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                        >
                          Create Lesson & Open Drawer
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
                Click "Add Module" above to begin structuring lessons and uploading video materials.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* STEP 4: LESSON MEDIA & RESOURCE DRAWER / MODAL */}
      {/* ===================================================================== */}
      {activeLesson && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUploadingVideo && !isUploadingResource) {
              closeLessonDrawer();
            }
          }}
        >
          <div className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-md">
                      {activeLessonModule?.title || 'Module Lesson'}
                    </span>
                    {activeLesson.isFreePreview && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded-md">
                        Free Preview Active
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg truncate mt-0.5 text-white">
                    {activeLesson.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={closeLessonDrawer}
                disabled={isUploadingVideo || isUploadingResource}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata Bar & Tabs */}
            <div className="bg-muted/40 border-b border-border px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
              {/* Tab Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerTab('video')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${drawerTab === 'video'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Tab 1: Video Streaming (Bunny Stream)</span>
                </button>
                <button
                  onClick={() => setDrawerTab('resources')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${drawerTab === 'resources'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Tab 2: Downloadable Resources ({activeResources.length})</span>
                </button>
              </div>

              {/* Free Preview Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(activeLesson.isFreePreview)}
                    onChange={(e) => handleUpdateLessonField({ isFreePreview: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-0"
                  />
                  <span>Free Preview for Visitors</span>
                </label>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* ============================================================== */}
              {/* TAB 1: VIDEO STREAMING (BUNNY STREAM) */}
              {/* ============================================================== */}
              {drawerTab === 'video' && (
                <div className="space-y-6">
                  {/* Status Strip */}
                  <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-foreground">Video Streaming Status</div>
                      <div className="text-[11px] text-muted-foreground">
                        High-performance HLS & MP4 transcoding on Bunny.net Global CDN
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUploadingVideo ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading ({videoUploadProgress?.percent || 0}%)</span>
                        </span>
                      ) : videoStatus === 'processing' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Transcoding on Bunny Stream…</span>
                        </span>
                      ) : activeVideoId ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Ready on Bunny Stream</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-500 border border-slate-500/30">
                          No Video Attached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drag-and-Drop Video Uploader */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setVideoDragOver(true);
                    }}
                    onDragLeave={() => setVideoDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setVideoDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessVideoFile(file);
                    }}
                    onClick={() => videoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${videoDragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-border hover:border-primary/50 bg-card/40 hover:bg-card'
                      }`}
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept=".mp4,.mov,.mkv,.webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessVideoFile(file);
                      }}
                    />

                    <UploadCloud className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h4 className="font-bold text-sm text-foreground mb-1">
                      Drag & Drop Lesson Video File Here
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Accepts high-definition <strong>.mp4</strong>, <strong>.mov</strong>, or <strong>.mkv</strong> video files
                    </p>
                    <button
                      type="button"
                      disabled={isUploadingVideo}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                    >
                      {isUploadingVideo ? 'Uploading...' : 'Browse Video File'}
                    </button>
                  </div>

                  {/* Live Upload Progress Bar */}
                  {isUploadingVideo && videoUploadProgress && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Streaming binary to Bunny.net Video Library ({activeLibraryId})...
                        </span>
                        <span className="font-bold">{videoUploadProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-amber-500/20 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${videoUploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Direct Bunny Video ID Field (Paste Existing ID) */}
                  <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-foreground">
                        Link Existing Bunny Stream Video
                      </label>
                      {activeVideoId && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Video Linked & Ready</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Bunny Video ID (GUID) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. fd675d92-63bc-458d-a831-9bdfdb26c2db"
                          value={customBunnyVideoId}
                          onChange={(e) => setCustomBunnyVideoId(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Library ID
                        </label>
                        <input
                          type="text"
                          placeholder={DEFAULT_LIBRARY_ID}
                          value={customBunnyLibraryId}
                          onChange={(e) => setCustomBunnyLibraryId(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <p className="text-[11px] text-muted-foreground">
                        Paste any video GUID from Bunny Stream library <strong>{DEFAULT_LIBRARY_ID}</strong> to attach it directly.
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleManualVideoIdSave}
                          disabled={isSavingLesson}
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSavingLesson ? 'Saving...' : 'Save & Link Video'}</span>
                        </button>
                        {activeVideoId && (
                          <button
                            type="button"
                            onClick={handleDetachVideo}
                            className="px-3 py-2 rounded-xl border border-rose-500/30 text-xs text-rose-600 hover:bg-rose-500/10 font-semibold transition-colors"
                            title="Unlink Video from Lesson"
                          >
                            Unlink
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Embedded Preview (Bunny Stream iframe player) */}
                  {activeVideoId ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Play className="w-4 h-4 text-emerald-500" />
                          <span>Live Bunny Stream Player Preview</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ID: {activeVideoId}
                        </span>
                      </div>
                      <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10">
                        <iframe
                          src={`https://iframe.mediadelivery.net/embed/${activeLibraryId}/${activeVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: DOWNLOADABLE RESOURCES & PDFS (BUNNY STORAGE) */}
              {/* ============================================================== */}
              {drawerTab === 'resources' && (
                <div className="space-y-6">
                  {/* Multi-file Drag & Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setResourceDragOver(true);
                    }}
                    onDragLeave={() => setResourceDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setResourceDragOver(false);
                      if (e.dataTransfer.files) handleProcessResourceFiles(e.dataTransfer.files);
                    }}
                    onClick={() => resourceInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${resourceDragOver
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                      : 'border-border hover:border-blue-500/50 bg-card/40 hover:bg-card'
                      }`}
                  >
                    <input
                      ref={resourceInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.zip"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleProcessResourceFiles(e.target.files);
                      }}
                    />

                    <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <h4 className="font-bold text-sm text-foreground mb-1">
                      Drag & Drop PDFs, Slides & Worksheets
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Accepts <strong>PDF</strong>, <strong>DOCX</strong>, <strong>PPTX</strong>, <strong>XLSX</strong>, and <strong>ZIP</strong> packages (uploaded directly to Bunny Storage CDN Zone)
                    </p>
                    <button
                      type="button"
                      disabled={isUploadingResource}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                    >
                      {isUploadingResource ? 'Uploading...' : 'Browse Files'}
                    </button>
                  </div>

                  {/* Resource Upload Progress */}
                  {isUploadingResource && resourceUploadProgress && (
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Uploading {resourceUploadProgress.fileName} ({resourceUploadProgress.current}/{resourceUploadProgress.total})...
                        </span>
                        <span className="font-bold">{resourceUploadProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-blue-500/20 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${resourceUploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* List of Attached Lesson Resources */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Attached Resources ({activeResources.length})
                      </h4>
                    </div>

                    {activeResources.length > 0 ? (
                      <div className="space-y-2.5">
                        {activeResources.map((res, i) => {
                          const badge = getFileTypeBadge(res.fileType || res.file_type || res.title?.split('.').pop());
                          const url = res.fileUrl || res.file_url || res.url;
                          const sizeDisplay = res.fileSizeBytes || res.file_size_bytes
                            ? formatBytes(Number(res.fileSizeBytes || res.file_size_bytes))
                            : res.size || '—';

                          return (
                            <div
                              key={res.id || i}
                              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 text-xs hover:border-primary/40 transition-colors shadow-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-foreground truncate block">
                                    {res.title}
                                  </span>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <span>Size: {sizeDisplay}</span>
                                    {res.createdAt && (
                                      <span>• Uploaded: {new Date(res.createdAt).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {url && (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Preview / Download</span>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResource(res.id)}
                                  className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Delete Resource"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl bg-card/40 border border-dashed border-border text-muted-foreground text-xs">
                        No downloadable resources attached to this lesson yet. Drop files above to upload to Bunny Storage.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 sm:p-5 bg-muted/40 border-t border-border flex items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground">
                Synced with Supabase & Bunny.net CDN
              </span>
              <button
                type="button"
                onClick={closeLessonDrawer}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
