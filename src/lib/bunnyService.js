/**
 * Bunny.net Stream & Storage CDN Service Utility
 * Provides secure client-side helpers for Bunny Stream embeds, Player.js controls,
 * and direct chunked/streamed uploads via backend proxy endpoints.
 */

const DEFAULT_LIBRARY_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '342890';
const DEFAULT_CDN_HOSTNAME = import.meta.env.VITE_BUNNY_CDN_HOSTNAME || 'godol-cdn.b-cdn.net';

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
    return `https://${DEFAULT_CDN_HOSTNAME}/${cleanPath}`;
  },

  /**
   * Uploads a video directly to Bunny Stream with real-time progress callback
   * @param {File} file 
   * @param {string} title 
   * @param {function} onProgress - ({ percent, loaded, total }) => void
   * @returns {Promise<{ videoId: string, libraryId: string, embedUrl: string }>}
   */
  uploadVideo(file, title, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title || file.name);

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
          } catch (err) {
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

      xhr.open('POST', '/api/bunny/upload-video');
      xhr.send(formData);
    });
  },

  /**
   * Uploads course documents (PDFs, slides, worksheets) to Bunny Storage Zone
   * @param {File} file 
   * @param {string} folder 
   * @param {function} onProgress - ({ percent, loaded, total }) => void
   * @returns {Promise<{ url: string, fileName: string, size: number }>}
   */
  uploadResource(file, folder = 'materials', onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

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
          } catch (err) {
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
      xhr.open('POST', '/api/bunny/upload-resource');
      xhr.send(formData);
    });
  }
};

