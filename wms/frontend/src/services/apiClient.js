const DEFAULT_BASE_URL = 'http://localhost:4000/api/v1/';

let mockHandler = null;

export function registerMockHandler(handler) {
  mockHandler = handler;
}

export async function apiClient(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    skipMock = false,
  } = options;

  const envBase =
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL;
  const baseUrl = envBase.endsWith('/') ? envBase : `${envBase}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const useMock = import.meta.env.VITE_USE_MOCK ?? 'true';

  if (useMock !== 'false' && !skipMock && typeof mockHandler === 'function') {
    return mockHandler(path, { method, body });
  }

  const url = new URL(normalizedPath, baseUrl);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
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
