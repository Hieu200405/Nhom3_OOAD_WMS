const STORAGE_KEY = 'wms-auth';

const USERS = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    fullName: 'Nguyễn Quản Trị',
  },
  {
    id: 'user-manager',
    username: 'manager',
    password: 'manager123',
    role: 'Manager',
    fullName: 'Trần Giám Sát',
  },
  {
    id: 'user-staff',
    username: 'staff',
    password: 'staff123',
    role: 'Staff',
    fullName: 'Phạm Nhân Viên',
  },
];

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
    // Check if we should use mock or real API
    const useMock = import.meta.env.VITE_USE_MOCK ?? 'true';

    if (useMock === 'true') {
      const user = USERS.find(
        (candidate) => candidate.username === username && candidate.password === password,
      );

      await new Promise((resolve) => setTimeout(resolve, 400));

      if (!user) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không hợp lệ');
      }

      const payload = {
        token: `mock-token-${user.id}`,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
        },
      };

      persistAuth(payload);
      return payload;
    } else {
      // Real API Login
      // We need to avoid circular dependency if apiClient depends on auth info, 
      // but apiClient mainly reads from localStorage.
      const { apiClient } = await import('./apiClient.js');
      try {
        const res = await apiClient('/auth/login', {
          method: 'POST',
          body: { email: username, password }, // Backend expects email
          skipMock: true
        });

        const payload = {
          token: res.data.accessToken,
          user: {
            id: res.data.user.id,
            username: res.data.user.email.split('@')[0],
            role: res.data.user.role,
            fullName: res.data.user.fullName,
          }
        };
        persistAuth(payload);
        return payload;
      } catch (error) {
        throw new Error(error.message || 'Đăng nhập thất bại');
      }
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
