import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BUNNY_STREAM_LIBRARY_ID = (process.env.BUNNY_STREAM_LIBRARY_ID || '815251').trim();
const BUNNY_STREAM_API_KEY = (process.env.BUNNY_STREAM_API_KEY || '').trim();
const BUNNY_STORAGE_ZONE_NAME = (process.env.BUNNY_STORAGE_ZONE_NAME || 'godolresources').trim();
const BUNNY_STORAGE_API_KEY = (process.env.BUNNY_STORAGE_API_KEY || '').trim();
const BUNNY_STORAGE_HOST = (process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com')
  .replace(/^https?:\/\//i, '')
  .replace(/\/.*$/, '')
  .trim() || 'storage.bunnycdn.com';
const BUNNY_CDN_HOSTNAME = (process.env.BUNNY_CDN_HOSTNAME || 'godolresources.b-cdn.net')
  .replace(/^https?:\/\//i, '')
  .replace(/\/+$/, '')
  .trim();
const BUNNY_CDN_BASE_URL = (process.env.BUNNY_CDN_BASE_URL || `https://${BUNNY_CDN_HOSTNAME}`)
  .replace(/\/+$/, '')
  .trim();

export function createBunnyRouter(dbCtx = {}) {
  const router = express.Router();
  const { loadDB, saveDB, supabase, isSupabaseConfigured, syncRecordToSupabase } = dbCtx;

  // GET safe public configuration
  router.get('/config', (req, res) => {
    res.json({
      libraryId: BUNNY_STREAM_LIBRARY_ID,
      cdnHostname: BUNNY_CDN_HOSTNAME,
      cdnBaseUrl: BUNNY_CDN_BASE_URL,
      storageZone: BUNNY_STORAGE_ZONE_NAME,
      isConfigured: Boolean(BUNNY_STREAM_API_KEY && BUNNY_STREAM_LIBRARY_ID),
      isStorageConfigured: Boolean(BUNNY_STORAGE_API_KEY && BUNNY_STORAGE_ZONE_NAME)
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/bunny/stream/sign-tus
  // Server-side TUS signature for direct browser → Bunny Stream resumable upload
  // Flow:
  //   1. Creates a video object in Bunny Stream → gets videoId (guid)
  //   2. Computes SHA256 signature: sha256(libraryId + apiKey + expiration + videoId)
  //   3. Returns videoId, libraryId, AuthorizationSignature, AuthorizationExpire
  //      so the browser can upload directly to https://video.bunnycdn.com/tusupload
  // ─────────────────────────────────────────────────────────────────────────
  router.post('/stream/sign-tus', async (req, res) => {
    try {
      const { title, lessonId } = req.body;
      const videoTitle = title || `Lesson Video - ${Date.now()}`;

      let videoId;
      let libraryId = BUNNY_STREAM_LIBRARY_ID;

      if (!BUNNY_STREAM_API_KEY) {
        // No API key: return a mock token so the UI stays functional in dev
        const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return res.json({
          success: true,
          videoId: mockId,
          libraryId,
          authSignature: 'mock_signature',
          authExpire: Math.floor(Date.now() / 1000) + 3600,
          embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${mockId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
          mode: 'simulated'
        });
      }

      // 1. Create video record in Bunny Stream
      const createRes = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': BUNNY_STREAM_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ title: videoTitle })
        }
      );

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Bunny Stream video creation failed: ${createRes.status} — ${errText}`);
      }

      const createData = await createRes.json();
      videoId = createData.guid;

      // 2. Compute SHA256 signature
      //    Formula: SHA256(libraryId + apiKey + expirationTime + videoId)
      //    Expiry: 6 hours from now
      const expiration = Math.floor(Date.now() / 1000) + 21600; // 6 hours
      const rawSignature = `${libraryId}${BUNNY_STREAM_API_KEY}${expiration}${videoId}`;
      const signature = createHash('sha256').update(rawSignature).digest('hex');

      // 3. Optionally associate with lesson in DB (mark as uploading)
      if (lessonId && loadDB && saveDB) {
        const db = loadDB();
        const lesson = (db.course_lessons || []).find(l => l.id === Number(lessonId));
        if (lesson) {
          lesson.bunnyVideoId = videoId;
          lesson.videoLibraryId = libraryId;
          lesson.videoStatus = 'uploading';
          saveDB(db);
          if (isSupabaseConfigured && syncRecordToSupabase) {
            syncRecordToSupabase('course_lessons', lesson).catch(() => {});
          }
        }
      }

      res.json({
        success: true,
        videoId,
        libraryId,
        authSignature: signature,
        authExpire: expiration,
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`
      });
    } catch (err) {
      console.error('TUS sign error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate TUS upload credentials' });
    }
  });

  // Handler for creating video entry on Bunny Stream API
  const handleCreateVideo = async (req, res) => {
    try {
      const { title, collectionId, lessonId } = req.body;
      const videoTitle = title || `Lesson Video - ${Date.now()}`;

      if (BUNNY_STREAM_API_KEY && BUNNY_STREAM_LIBRARY_ID) {
        const response = await fetch(
          `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
          {
            method: 'POST',
            headers: {
              'AccessKey': BUNNY_STREAM_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              title: videoTitle,
              collectionId: collectionId || undefined
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Bunny API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const videoId = data.guid;

        // Optionally associate directly with lesson if lessonId provided
        if (lessonId && loadDB && saveDB) {
          const db = loadDB();
          const lesson = (db.course_lessons || []).find(l => l.id === Number(lessonId));
          if (lesson) {
            lesson.bunnyVideoId = videoId;
            lesson.videoLibraryId = BUNNY_STREAM_LIBRARY_ID;
            lesson.videoStatus = 'uploading';
            saveDB(db);
            if (isSupabaseConfigured && syncRecordToSupabase) {
              await syncRecordToSupabase('course_lessons', lesson);
            }
          }
        }

        return res.json({
          success: true,
          videoId,
          libraryId: BUNNY_STREAM_LIBRARY_ID,
          title: data.title,
          embedUrl: `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`
        });
      }

      // Seamless fallback if API key is not yet provided in .env
      const mockGuid = `bunny_vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      if (lessonId && loadDB && saveDB) {
        const db = loadDB();
        const lesson = (db.course_lessons || []).find(l => l.id === Number(lessonId));
        if (lesson) {
          lesson.bunnyVideoId = mockGuid;
          lesson.videoLibraryId = BUNNY_STREAM_LIBRARY_ID;
          lesson.videoStatus = 'ready';
          saveDB(db);
        }
      }

      res.json({
        success: true,
        videoId: mockGuid,
        libraryId: BUNNY_STREAM_LIBRARY_ID,
        title: videoTitle,
        embedUrl: `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${mockGuid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
        mode: 'simulated'
      });
    } catch (err) {
      console.error('Bunny create-video error:', err);
      res.status(500).json({ error: err.message || 'Failed to initialize Bunny video' });
    }
  };

  router.post('/create-video', handleCreateVideo);
  router.post('/stream/create-video', handleCreateVideo);

  // Handler for uploading video binary to Bunny Stream API
  const handleUploadVideo = async (req, res) => {
    try {
      const contentType = req.headers['content-type'] || '';
      const targetVideoId = req.params?.videoId || req.query?.videoId || req.body?.videoId;
      const lessonId = req.query?.lessonId || req.body?.lessonId;
      let videoTitle = req.body?.title || `Lesson Video - ${Date.now()}`;
      let videoBuffer = null;

      if (contentType.includes('application/json')) {
        const { base64, title } = req.body;
        if (title) videoTitle = title;
        if (base64) {
          const cleaned = base64.replace(/^data:video\/[a-zA-Z0-9]+;base64,/, '');
          videoBuffer = Buffer.from(cleaned, 'base64');
        }
      } else {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        videoBuffer = Buffer.concat(chunks);
      }

      let activeVideoId = targetVideoId;

      if (BUNNY_STREAM_API_KEY && BUNNY_STREAM_LIBRARY_ID && videoBuffer && videoBuffer.length > 0) {
        // 1. If videoId not provided, create entry first
        if (!activeVideoId) {
          const createRes = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
            {
              method: 'POST',
              headers: {
                'AccessKey': BUNNY_STREAM_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ title: videoTitle })
            }
          );
          if (createRes.ok) {
            const createData = await createRes.json();
            activeVideoId = createData.guid;
          } else {
            const errText = await createRes.text();
            throw new Error(`Failed to initialize video on Bunny: ${createRes.status} ${errText}`);
          }
        }

        // 2. Upload video binary via PUT
        const uploadRes = await fetch(
          `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${activeVideoId}`,
          {
            method: 'PUT',
            headers: {
              'AccessKey': BUNNY_STREAM_API_KEY,
              'Content-Type': 'application/octet-stream'
            },
            body: videoBuffer
          }
        );

        if (uploadRes.ok) {
          // Update lesson in DB
          if (lessonId && loadDB && saveDB) {
            const db = loadDB();
            const lesson = (db.course_lessons || []).find(l => l.id === Number(lessonId));
            if (lesson) {
              lesson.bunnyVideoId = activeVideoId;
              lesson.videoLibraryId = BUNNY_STREAM_LIBRARY_ID;
              lesson.videoStatus = 'ready';
              saveDB(db);
              if (isSupabaseConfigured && syncRecordToSupabase) {
                await syncRecordToSupabase('course_lessons', lesson);
              }
            }
          }

          return res.json({
            success: true,
            videoId: activeVideoId,
            libraryId: BUNNY_STREAM_LIBRARY_ID,
            status: 'ready',
            embedUrl: `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${activeVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`
          });
        } else {
          const uploadErr = await uploadRes.text();
          console.warn('Bunny binary upload warning:', uploadRes.status, uploadErr);
        }
      }

      // Mock/development fallback
      const mockGuid = activeVideoId || `bunny_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'videos');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      if (videoBuffer && videoBuffer.length > 0) {
        fs.writeFileSync(path.join(uploadsDir, `${mockGuid}.mp4`), videoBuffer);
      }

      if (lessonId && loadDB && saveDB) {
        const db = loadDB();
        const lesson = (db.course_lessons || []).find(l => l.id === Number(lessonId));
        if (lesson) {
          lesson.bunnyVideoId = mockGuid;
          lesson.videoLibraryId = BUNNY_STREAM_LIBRARY_ID;
          lesson.videoStatus = 'ready';
          saveDB(db);
        }
      }

      res.json({
        success: true,
        videoId: mockGuid,
        libraryId: BUNNY_STREAM_LIBRARY_ID,
        title: videoTitle,
        status: 'ready',
        embedUrl: `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${mockGuid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
        fallbackUrl: `/uploads/videos/${mockGuid}.mp4`
      });
    } catch (err) {
      console.error('Bunny upload-video error:', err);
      res.status(500).json({ error: err.message || 'Video upload failed' });
    }
  };

  router.post('/upload-video', handleUploadVideo);
  router.post('/stream/upload-video', handleUploadVideo);
  router.post('/stream/upload-video/:videoId', handleUploadVideo);
  router.put('/stream/upload-video/:videoId', handleUploadVideo);

  // DELETE video from Bunny Stream
  const handleDeleteVideo = async (req, res) => {
    try {
      const videoId = req.params.videoId;
      if (!videoId) return res.status(400).json({ error: 'videoId is required' });

      if (BUNNY_STREAM_API_KEY && BUNNY_STREAM_LIBRARY_ID && !videoId.startsWith('bunny_vid_')) {
        const response = await fetch(
          `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
          {
            method: 'DELETE',
            headers: {
              'AccessKey': BUNNY_STREAM_API_KEY
            }
          }
        );
        if (!response.ok && response.status !== 404) {
          const errText = await response.text();
          console.warn('Bunny delete video warning:', response.status, errText);
        }
      }

      // Detach video from any lessons referencing it
      if (loadDB && saveDB) {
        const db = loadDB();
        let changed = false;
        (db.course_lessons || []).forEach(l => {
          if (l.bunnyVideoId === videoId || l.bunny_video_id === videoId) {
            l.bunnyVideoId = '';
            l.bunny_video_id = '';
            l.videoStatus = 'pending';
            changed = true;
            if (isSupabaseConfigured && syncRecordToSupabase) {
              syncRecordToSupabase('course_lessons', l).catch(() => {});
            }
          }
        });
        if (changed) saveDB(db);
      }

      res.json({ success: true, deletedVideoId: videoId });
    } catch (err) {
      console.error('Bunny delete-video error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete video' });
    }
  };

  router.delete('/stream/:videoId', handleDeleteVideo);
  router.delete('/stream/videos/:videoId', handleDeleteVideo);

  // POST upload downloadable resource (PDF, DOCX, XLSX, ZIP) to Bunny Storage Zone
  const handleUploadResource = async (req, res) => {
    try {
      const contentType = req.headers['content-type'] || '';
      let courseId = req.body?.courseId || req.query?.courseId || 'general';
      let lessonId = req.body?.lessonId || req.query?.lessonId || 'general';
      let title = req.body?.title || '';
      let rawFilename = req.body?.name || req.query?.fileName || `resource-${Date.now()}.pdf`;
      let fileBuffer = null;

      if (contentType.includes('application/json')) {
        const { base64, name } = req.body;
        if (name) rawFilename = name;
        if (base64) {
          const cleaned = base64.replace(/^data:[^;]+;base64,/, '');
          fileBuffer = Buffer.from(cleaned, 'base64');
        }
      } else {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        fileBuffer = Buffer.concat(chunks);
      }

      const sanitizedName = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${sanitizedName}`;
      const fileExt = (sanitizedName.split('.').pop() || 'pdf').toLowerCase();

      // Clean hierarchical path: courses/{courseId}/lessons/{lessonId}/{uniqueFileName}
      const storagePath = `courses/${courseId}/lessons/${lessonId}/${uniqueFileName}`;
      const cdnUrl = `${BUNNY_CDN_BASE_URL}/${storagePath}`;

      if (BUNNY_STORAGE_API_KEY && BUNNY_STORAGE_ZONE_NAME && fileBuffer && fileBuffer.length > 0) {
        const storageHost = BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
        const storageRes = await fetch(
          `https://${storageHost}/${BUNNY_STORAGE_ZONE_NAME}/${storagePath}`,
          {
            method: 'PUT',
            headers: {
              'AccessKey': BUNNY_STORAGE_API_KEY,
              'Content-Type': 'application/octet-stream'
            },
            body: fileBuffer
          }
        );

        if (!storageRes.ok) {
          const errText = await storageRes.text();
          console.error(`Bunny storage upload error: ${storageRes.status} ${errText}`);
          throw new Error(`Bunny Storage upload error (${storageRes.status}): ${errText || 'Invalid Storage API Key or Storage Zone'}`);
        }
      }

      // Local storage fallback for seamless offline development
      const localDir = path.join(__dirname, '..', 'public', 'uploads', 'courses', String(courseId), 'lessons', String(lessonId));
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      if (fileBuffer && fileBuffer.length > 0) {
        fs.writeFileSync(path.join(localDir, uniqueFileName), fileBuffer);
      }

      // Construct resource record
      const db = loadDB ? loadDB() : { lesson_resources: [] };
      if (!db.lesson_resources) db.lesson_resources = [];

      const newResource = {
        id: db.lesson_resources.length > 0 ? Math.max(...db.lesson_resources.map(r => r.id)) + 1 : 1,
        lessonId: Number(lessonId) || 0,
        lesson_id: Number(lessonId) || 0,
        courseId: Number(courseId) || 0,
        course_id: Number(courseId) || 0,
        title: title || sanitizedName,
        fileType: fileExt,
        file_type: fileExt,
        fileSizeBytes: fileBuffer ? fileBuffer.length : 1024,
        file_size_bytes: fileBuffer ? fileBuffer.length : 1024,
        bunnyStoragePath: storagePath,
        bunny_storage_path: storagePath,
        fileUrl: cdnUrl,
        file_url: cdnUrl,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      db.lesson_resources.push(newResource);
      if (saveDB) saveDB(db);

      if (isSupabaseConfigured && syncRecordToSupabase) {
        await syncRecordToSupabase('lesson_resources', newResource);
      }

      // Also attach to lesson's legacy resourceUrls for backwards compatibility
      const targetLesson = (db.course_lessons || []).find(l => l.id === Number(lessonId));
      if (targetLesson) {
        if (!targetLesson.resourceUrls) targetLesson.resourceUrls = [];
        targetLesson.resourceUrls.push({
          id: newResource.id,
          title: newResource.title,
          url: newResource.fileUrl,
          size: `${(newResource.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
        });
        if (saveDB) saveDB(db);
        if (isSupabaseConfigured && syncRecordToSupabase) {
          syncRecordToSupabase('course_lessons', targetLesson).catch(() => {});
        }
      }

      res.status(201).json({
        success: true,
        resource: newResource,
        url: newResource.fileUrl,
        fileName: sanitizedName,
        size: newResource.fileSizeBytes
      });
    } catch (err) {
      console.error('Bunny upload-resource error:', err);
      res.status(500).json({ error: err.message || 'Resource upload failed' });
    }
  };

  router.post('/upload-resource', handleUploadResource);
  router.post('/storage/upload-resource', handleUploadResource);

  // DELETE resource from Bunny Storage Zone and database
  const handleDeleteResource = async (req, res) => {
    try {
      const resourceId = Number(req.params.resourceId || req.query.id);
      const db = loadDB ? loadDB() : { lesson_resources: [] };
      const resource = (db.lesson_resources || []).find(r => r.id === resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // 1. Delete from Bunny Storage Zone
      if (BUNNY_STORAGE_API_KEY && BUNNY_STORAGE_ZONE_NAME && resource.bunnyStoragePath) {
        const storageHost = BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
        try {
          await fetch(
            `https://${storageHost}/${BUNNY_STORAGE_ZONE_NAME}/${resource.bunnyStoragePath}`,
            {
              method: 'DELETE',
              headers: {
                'AccessKey': BUNNY_STORAGE_API_KEY
              }
            }
          );
        } catch (storageErr) {
          console.warn('Bunny Storage DELETE failed:', storageErr.message);
        }
      }

      // 2. Remove from local database
      db.lesson_resources = (db.lesson_resources || []).filter(r => r.id !== resourceId);

      // Remove from any lesson's resourceUrls array
      (db.course_lessons || []).forEach(l => {
        if (Array.isArray(l.resourceUrls)) {
          l.resourceUrls = l.resourceUrls.filter(u => u.id !== resourceId && u.url !== resource.fileUrl);
        }
      });

      if (saveDB) saveDB(db);

      // 3. Remove from Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('lesson_resources').delete().eq('id', resourceId);
        } catch (sbErr) {
          console.warn('Supabase lesson_resources delete warning:', sbErr.message);
        }
      }

      res.json({ success: true, deletedResourceId: resourceId });
    } catch (err) {
      console.error('Bunny delete-resource error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete resource' });
    }
  };

  router.delete('/storage/resource/:resourceId', handleDeleteResource);
  router.delete('/storage/resource', handleDeleteResource);

  return router;
}
