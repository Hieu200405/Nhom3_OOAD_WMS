const DEFAULT_BASE_URL = 'http://localhost:4001/api/v1/';

export async function apiClient(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
  } = options;

  let authHeaders = {};
  try {
    const stored = localStorage.getItem('wms-auth');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // ignore
  }

  const envBase =
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL;
  const baseUrl = envBase.endsWith('/') ? envBase : `${envBase}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Reduced to pure real API call
  // console.log('[API Client] Calling:', normalizedPath);

  const url = new URL(normalizedPath, baseUrl);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        url.searchParams.set(key, value);
      }
    });
  }

  /* Determine headers. If body is FormData, let browser set Content-Type */
  const finalHeaders = { ...authHeaders, ...headers };
  let finalBody = body;

  if (body instanceof FormData) {
    // Browser sets multipart/form-data with boundary
  } else {
    finalHeaders['Content-Type'] = 'application/json';
    if (body) {
      finalBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: finalHeaders,
    body: finalBody,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}
