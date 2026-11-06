// API Client
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('godol_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    if (response.status === 401 && endpoint.includes('/admin') && !endpoint.includes('/admin/login')) {
      localStorage.removeItem('godol_admin_token');
      localStorage.removeItem('godol_admin_email');
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
        window.location.href = '/admin';
      }
    }
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

