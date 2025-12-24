import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';

const emptySupplier = {
  type: 'supplier',
  code: '',
  name: '',
  taxCode: '',
  contact: '',
  address: '',
  businessType: 'Distributor',
  notes: '',
  isActive: true,
};

const businessTypes = [
  { value: 'Manufacturer', label: 'Nhà sản xuất' },
  { value: 'Distributor', label: 'Nhà phân phối' },
  { value: 'Retailer', label: 'Nhà bán lẻ' },
];

export function SuppliersPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySupplier);

  const openCreateModal = () => {
    setForm(emptySupplier);
    setEditing(null);
    setOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditing(supplier);
    setForm(supplier);
    setOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editing) {
      actions.updateRecord('suppliers', editing.id, form);
    } else {
      actions.createRecord('suppliers', { ...form, id: generateId('sup') });
    }
    setOpen(false);
  };

  const handleDelete = (supplier) => {
    if (window.confirm('Delete this supplier?')) {
      actions.removeRecord('suppliers', supplier.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t('partners.suppliers')}
        </h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t('app.create')}
        </button>
      </div>

      <DataTable
        data={data.suppliers}
        columns={[
          { key: 'code', header: 'Mã NCC' },
          { key: 'name', header: 'Tên nhà cung cấp' },
          { key: 'contact', header: 'Liên hệ' },
          { key: 'businessType', header: 'Loại hình' },
          {
            key: 'isActive',
            header: 'Trạng thái',
            render: (val) => val ? <span className="text-green-600 text-xs font-medium">Hoạt động</span> : <span className="text-slate-400 text-xs">Ngừng GD</span>
          },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(row)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('app.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-600 transition hover:bg-rose-100 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('app.delete')}
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        actions={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('app.cancel')}
            </button>
            <button
              type="submit"
              form="supplier-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="supplier-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Mã NCC"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              required
              placeholder="VD: SUP001"
            />
            <Select
              label="Loại hình"
              value={form.businessType}
              onChange={(event) => setForm((prev) => ({ ...prev, businessType: event.target.value }))}
              options={businessTypes}
            />
          </div>

          <Input
            label="Tên nhà cung cấp"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Mã số thuế"
              value={form.taxCode}
              onChange={(event) => setForm((prev) => ({ ...prev, taxCode: event.target.value }))}
            />
            <Input
              label="Liên hệ"
              value={form.contact}
              onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
              placeholder="SĐT, Email..."
            />
          </div>

          <Input
            label="Địa chỉ"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="sup-active"
              checked={form.isActive}
              onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="sup-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Đang hoạt động
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
