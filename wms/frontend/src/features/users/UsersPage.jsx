import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Roles } from '../../utils/constants.js';

const demoUsers = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Nguyen Quan Tri',
    role: Roles.ADMIN,
    description: 'Quản trị hệ thống, phân quyền, cấu hình danh mục.',
  },
  {
    id: 'user-manager',
    username: 'manager',
    fullName: 'Tran Giam Sat',
    role: Roles.MANAGER,
    description: 'Duyệt phiếu nhập/xuất, xử lý sự cố và kiểm kê.',
  },
  {
    id: 'user-staff',
    username: 'staff',
    fullName: 'Pham Nhan Vien',
    role: Roles.STAFF,
    description: 'Nhập liệu nghiệp vụ, lập phiếu sự cố/điều chỉnh.',
  },
];

export function UsersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t('navigation.users')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Danh sách tài khoản mẫu dùng cho môi trường mock.
        </p>
      </div>
      <DataTable
        data={demoUsers}
        columns={[
          { key: 'fullName', header: 'Họ tên' },
          { key: 'username', header: 'Username' },
          { key: 'role', header: 'Vai trò' },
          { key: 'description', header: 'Ghi chú' },
        ]}
        searchableFields={['fullName', 'username', 'role']}
      />
    </div>
  );
}
