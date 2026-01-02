const STORAGE_KEY = 'wms-auth';

function persistAuth(payload) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function readAuth() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const authService = {
  async login({ username, password }) {
    // Refactored to use ONLY Real API
    const { apiClient } = await import('./apiClient.js');
    try {
      // Assuming backend endpoint /auth/login exists
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: { email: username, password },
      });

      const payload = {
        token: res.data.accessToken,
        user: {
          id: res.data.user.id,
          username: res.data.user.email ? res.data.user.email.split('@')[0] : 'user',
          role: res.data.user.role,
          fullName: res.data.user.fullName,
        }
      };
      persistAuth(payload);
      return payload;
    } catch (error) {
      throw new Error(error.message || 'Đăng nhập thất bại. Kiểm tra kết nối backend.');
    }
  },

  logout() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  },

  getStoredAuth() {
    return readAuth();
  },
};
