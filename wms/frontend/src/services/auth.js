const STORAGE_KEY = 'wms-auth';

const USERS = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    fullName: 'Nguy?n Qu?n Tr?',
  },
  {
    id: 'user-manager',
    username: 'manager',
    password: 'manager123',
    role: 'Manager',
    fullName: 'Tr?n Giám Sát',
  },
  {
    id: 'user-staff',
    username: 'staff',
    password: 'staff123',
    role: 'Staff',
    fullName: 'Ph?m Nhân Viên',
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
    const user = USERS.find(
      (candidate) => candidate.username === username && candidate.password === password,
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!user) {
      throw new Error('Tên dang nh?p ho?c m?t kh?u không h?p l?');
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
  },

  logout() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  },

  getStoredAuth() {
    return readAuth();
  },
};
