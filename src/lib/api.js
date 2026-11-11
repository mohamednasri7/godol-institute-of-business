import { broadcastDataChange } from '../hooks/useRealtimeSync';

// API Client with no-store caching and automatic inter-tab broadcast synchronization
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('godol_admin_token');
  const method = (options.method || 'GET').toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // Prevent browser caching on GET requests by adding a timestamp query param
  let url = endpoint;
  if (method === 'GET') {
    const separator = endpoint.includes('?') ? '&' : '?';
    url = `${endpoint}${separator}_t=${Date.now()}`;
  }

  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    // Only redirect if unauthenticated on an admin page and no token exists
    if (response.status === 401 && endpoint.includes('/admin') && !endpoint.includes('/admin/login')) {
      if (!token && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
        window.location.href = '/admin';
      }
    }
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  // If this was a successful mutation (POST, PUT, PATCH, DELETE), notify other open tabs immediately!
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      let targetTable = '*';
      if (endpoint.includes('/courses')) targetTable = 'courses';
      else if (endpoint.includes('/payments')) targetTable = 'payments';
      else if (endpoint.includes('/enrollments')) targetTable = 'enrollments';
      else if (endpoint.includes('/instructors')) targetTable = 'instructors';
      else if (endpoint.includes('/categories')) targetTable = 'categories';
      else if (endpoint.includes('/posts') || endpoint.includes('/blog')) targetTable = 'posts';

      broadcastDataChange(targetTable, method.toLowerCase());
    } catch {}
  }

  return data;
}
