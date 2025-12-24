import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { NumberInput } from '../../components/forms/NumberInput.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';

const emptyCustomer = {
  type: 'customer',
  code: '',
  name: '',
  customerType: 'Individual',
  policy: '',
  creditLimit: 0,
  paymentTerm: 'Net 30', // Terms like Net 30, COD
  contact: '',
  isActive: true,
};

const customerTypes = [
  { value: 'Individual', label: 'Cá nhân' },
  { value: 'Corporate', label: 'Doanh nghiệp' },
];

const paymentTerms = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
  { value: 'Net 15', label: 'Công nợ 15 ngày' },
  { value: 'Net 30', label: 'Công nợ 30 ngày' },
  { value: 'Prepaid', label: 'Trả trước' },
];

export function CustomersPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCustomer);

  const openCreateModal = () => {
    setForm(emptyCustomer);
    setEditing(null);
    setOpen(true);
  };

  const openEditModal = (customer) => {
    setEditing(customer);
    setForm(customer);
    setOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editing) {
      actions.updateRecord('customers', editing.id, form);
    } else {
      actions.createRecord('customers', { ...form, id: generateId('cus') });
    }
    setOpen(false);
  };

  const handleDelete = (customer) => {
    if (window.confirm('Delete this customer?')) {
      actions.removeRecord('customers', customer.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t('partners.customers')}
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
        data={data.customers}
        columns={[
          { key: 'code', header: 'Mã KH' },
          { key: 'name', header: 'Tên Khách Hàng' },
          { key: 'customerType', header: 'Loại khách' },
          { key: 'creditLimit', header: 'Hạn mức nợ', render: (val) => val?.toLocaleString() ?? 0 },
          { key: 'paymentTerm', header: 'Điều khoản TT' },
          {
            key: 'isActive',
            header: 'Trạng thái',
            render: (val) => val ? <span className="text-green-600 text-xs font-medium">Hoạt động</span> : <span className="text-slate-400 text-xs">Ngừng GD</span>
          },
          {
            key: 'debt',
            header: t('financials.debtAmount'),
            render: (_, row) => {
              const transactions = data.financialTransactions.filter(t => t.partnerId === row.id);
              const totalReceivable = transactions.reduce((acc, curr) => acc + (curr.type === 'receivable' ? curr.amount : 0), 0);
              const totalPaid = transactions.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
              const remainingDebt = transactions.reduce((acc, curr) => acc + (curr.debtAmount || 0), 0);
              const overdueCount = transactions.filter(t => {
                const dueDate = t.paymentDueDate ? new Date(t.paymentDueDate) : null;
                return dueDate && dueDate < new Date() && t.debtAmount > 0;
              }).length;

              return (
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-rose-600">{remainingDebt.toLocaleString('vi-VN')}</span>
                  {overdueCount > 0 && (
                    <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                      {t('financials.overdueReceipts')}: {overdueCount}
                    </span>
                  )}
                </div>
              );
            }
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
        title={editing ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
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
              form="customer-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="customer-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Mã KH"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              required
              placeholder="VD: KH001"
            />
            <Select
              label="Loại khách hàng"
              value={form.customerType}
              onChange={(event) => setForm((prev) => ({ ...prev, customerType: event.target.value }))}
              options={customerTypes}
            />
          </div>

          <Input
            label="Tên khách hàng"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput
              label="Hạn mức nợ"
              value={form.creditLimit}
              onChange={(e) => setForm(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
              min={0}
            />
            <Select
              label="Điều khoản thanh toán"
              value={form.paymentTerm}
              onChange={(e) => setForm(prev => ({ ...prev, paymentTerm: e.target.value }))}
              options={paymentTerms}
            />
          </div>

          <Input
            label="Liên hệ"
            value={form.contact}
            onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
            placeholder="SĐT, Email..."
          />

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="cus-active"
              checked={form.isActive}
              onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="cus-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Đang hoạt động
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
