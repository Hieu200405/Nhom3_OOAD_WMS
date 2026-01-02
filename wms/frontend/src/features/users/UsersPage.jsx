import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Check, X, Shield, User } from 'lucide-react';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { apiClient } from '../../services/apiClient.js';
import toast from 'react-hot-toast';

const emptyUser = {
  fullName: '',
  email: '',
  role: 'Staff',
  password: '',
  isActive: true,
};

const ROLES = [
  { value: 'Admin', label: 'Admin (Quản trị viên)' },
  { value: 'Manager', label: 'Manager (Quản lý)' },
  { value: 'Staff', label: 'Staff (Nhân viên)' },
];

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUser);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient('/users');
      // Backend returns { data: [...], meta: ... } or just array? 
      // Controller list calls buildPagedResponse which returns { data, meta }.
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setForm(emptyUser);
    setEditing(null);
    setOpen(true);
  };

  const openEditModal = (user) => {
    setEditing(user);
    setForm({ ...user, password: '' }); // Don't show numeric hash or actual password
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.fullName) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password; // Don't send empty password

        await apiClient(`/users/${editing.id}`, {
          method: 'PUT',
          body: payload
        });
        toast.success('Cập nhật thành công');
      } else {
        if (!form.password) {
          toast.error('Vui lòng nhập mật khẩu');
          return;
        }
        await apiClient('/users', {
          method: 'POST',
          body: form
        });
        toast.success('Tạo tài khoản thành công');
      }
      setOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa tài khoản này?')) {
      try {
        await apiClient(`/users/${id}`, { method: 'DELETE' });
        toast.success('Xóa tài khoản thành công');
        fetchUsers();
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Không thể xóa tài khoản');
      }
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Họ và tên',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">{value}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Phân quyền',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border ${value === 'Admin'
          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
          : value === 'Manager'
            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}>
          <Shield className="h-3 w-3" />
          {value}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (value) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
          {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {value ? 'Hoạt động' : 'Đã khóa'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—',
    },
    {
      key: 'actions',
      header: 'Hành động',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Chỉnh sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý tài khoản, phân quyền và cấp phép truy cập
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Thêm tài khoản
        </button>
      </div>

      <DataTable
        data={users}
        columns={columns}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
        actions={
          <>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="user-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ và tên"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            placeholder="Ví dụ: Nguyễn Văn A"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="user@example.com"
          />
          <Select
            label="Phân quyền (Role)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={ROLES}
          />

          {!editing && (
            <Input
              label="Mật khẩu"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="********"
            />
          )}

          {editing && (
            <Input
              label="Mật khẩu mới (Để trống nếu không đổi)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="********"
            />
          )}

          {editing && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Kích hoạt tài khoản
              </label>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
