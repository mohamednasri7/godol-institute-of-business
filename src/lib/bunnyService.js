/**
 * Bunny.net Stream & Storage CDN Service Utility
 * Provides secure client-side helpers for Bunny Stream embeds, Player.js controls,
 * and direct chunked/streamed uploads via backend proxy endpoints.
 */

const DEFAULT_LIBRARY_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '342890';
const DEFAULT_CDN_HOSTNAME = import.meta.env.VITE_BUNNY_CDN_HOSTNAME || 'godol-cdn.b-cdn.net';
const DEFAULT_CDN_BASE_URL = (import.meta.env.VITE_BUNNY_CDN_BASE_URL || `https://${DEFAULT_CDN_HOSTNAME}`).replace(/\/$/, '');

export const bunnyService = {
  /**
   * Generates a Bunny Stream iframe embed URL
   * @param {string|number} libraryId 
   * @param {string} videoId 
   * @param {Object} options 
   * @returns {string}
   */
  getEmbedUrl(libraryId = DEFAULT_LIBRARY_ID, videoId, options = {}) {
    if (!videoId) return '';
    const lib = libraryId || DEFAULT_LIBRARY_ID;
    const params = new URLSearchParams({
      autoplay: options.autoplay ? 'true' : 'false',
      loop: options.loop ? 'true' : 'false',
      muted: options.muted ? 'true' : 'false',
      preload: 'true',
      responsive: 'true',
      ...options.extraParams
    });
    return `https://iframe.mediadelivery.net/embed/${lib}/${videoId}?${params.toString()}`;
  },

  /**
   * Generates a CDN resource URL for documents, PDFs, or materials
   * @param {string} path 
   * @returns {string}
   */
  getCdnFileUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${DEFAULT_CDN_BASE_URL}/${cleanPath}`;
  },

  /**
   * Creates a video entry on Bunny Stream API
   * @param {string} title 
   * @param {Object} options 
   * @returns {Promise<{ videoId: string, libraryId: string, embedUrl: string }>}
   */
  async createVideo(title, options = {}) {
    const res = await fetch('/api/bunny/stream/create-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        collectionId: options.collectionId,
        lessonId: options.lessonId
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create video' }));
      throw new Error(err.error || 'Video initialization failed');
    }
    return res.json();
  },

  /**
   * Uploads a video directly to Bunny Stream with real-time progress callback
   * @param {File} file 
   * @param {string|Object} optionsOrTitle 
   * @param {function} onProgress - ({ percent, loaded, total }) => void
   * @returns {Promise<{ videoId: string, libraryId: string, embedUrl: string }>}
   */
  uploadVideo(file, optionsOrTitle, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('video', file);

      let title = file.name;
      let videoId = null;
      let lessonId = null;

      if (typeof optionsOrTitle === 'string') {
        title = optionsOrTitle;
      } else if (typeof optionsOrTitle === 'object' && optionsOrTitle !== null) {
        if (optionsOrTitle.title) title = optionsOrTitle.title;
        if (optionsOrTitle.videoId) videoId = optionsOrTitle.videoId;
        if (optionsOrTitle.lessonId) lessonId = optionsOrTitle.lessonId;
      }

      formData.append('title', title);
      if (videoId) formData.append('videoId', videoId);
      if (lessonId) formData.append('lessonId', lessonId);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress({ percent, loaded: e.loaded, total: e.total });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid response from upload server'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during video upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

      const endpoint = videoId
        ? `/api/bunny/stream/upload-video/${videoId}${lessonId ? `?lessonId=${lessonId}` : ''}`
        : `/api/bunny/stream/upload-video${lessonId ? `?lessonId=${lessonId}` : ''}`;

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  },

  /**
   * Deletes a video from Bunny Stream
   * @param {string} videoId 
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteVideo(videoId) {
    const res = await fetch(`/api/bunny/stream/${videoId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete video' }));
      throw new Error(err.error || 'Video deletion failed');
    }
    return res.json();
  },

  /**
   * Uploads course documents (PDFs, slides, worksheets) to Bunny Storage Zone
   * @param {File} file 
   * @param {string|Object} optionsOrFolder 
   * @param {function} onProgress - ({ percent, loaded, total }) => void
   * @returns {Promise<{ resource: Object, url: string, fileName: string, size: number }>}
   */
  uploadResource(file, optionsOrFolder = 'materials', onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      let courseId = 'general';
      let lessonId = 'general';
      let title = file.name;

      if (typeof optionsOrFolder === 'string') {
        courseId = optionsOrFolder;
      } else if (typeof optionsOrFolder === 'object' && optionsOrFolder !== null) {
        if (optionsOrFolder.courseId) courseId = optionsOrFolder.courseId;
        if (optionsOrFolder.lessonId) lessonId = optionsOrFolder.lessonId;
        if (optionsOrFolder.title) title = optionsOrFolder.title;
      }

      formData.append('courseId', courseId);
      formData.append('lessonId', lessonId);
      formData.append('title', title);
      formData.append('name', file.name);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress({ percent, loaded: e.loaded, total: e.total });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid response from resource upload'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || `Resource upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Resource upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during resource upload')));
      xhr.open('POST', '/api/bunny/storage/upload-resource');
      xhr.send(formData);
    });
  },

  /**
   * Deletes a resource from Bunny Storage Zone and database
   * @param {number|string} resourceId 
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteResource(resourceId) {
    const res = await fetch(`/api/bunny/storage/resource/${resourceId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete resource' }));
      throw new Error(err.error || 'Resource deletion failed');
    }
    return res.json();
  }
};
