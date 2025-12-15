import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus } from 'lucide-react';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { DatePicker } from '../../components/forms/DatePicker.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { LineItemsEditor } from '../../components/LineItemsEditor.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { ReceiptStatus, Roles } from '../../utils/constants.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { generateId } from '../../utils/id.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';
import { useAuth } from '../../app/auth-context.jsx';

const defaultForm = {
  supplierId: '',
  date: new Date().toISOString().slice(0, 10),
  lines: [
    {
      id: generateId('line'),
      productId: '',
      quantity: 1,
      price: 0,
    },
  ],
  hasShortage: false,
  shortageNote: '',
  damageNote: '',
};

export function ReceiptsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const suppliers = useMemo(
    () => data.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
    [data.suppliers],
  );

  const products = data.products;

  const handleSubmit = (event) => {
    event.preventDefault();
    const lines = form.lines
      .filter((line) => line.productId)
      .map((line) => {
        const product = products.find((item) => item.id === line.productId);
        return {
          ...line,
          sku: product?.sku ?? '',
          name: product?.name ?? '',
        };
      });

    if (lines.length === 0) return;

    const total = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
    actions.createRecord('receipts', {
      id: generateId('rcp'),
      supplierId: form.supplierId,
      date: form.date,
      status: ReceiptStatus.DRAFT,
      lines,
      total,
      hasShortage: form.hasShortage,
      shortageNote: form.shortageNote,
      damageNote: form.damageNote,
      inventoryApplied: false,
    });
    setOpen(false);
    setForm({
      ...defaultForm,
      lines: [{ ...defaultForm.lines[0], id: generateId('line') }],
    });
  };

  const transition = (receipt, status) => {
    actions.transitionReceiptStatus(receipt.id, status);
  };

  const columns = [
    { key: 'id', header: 'Receipt' },
    {
      key: 'supplierId',
      header: t('receipts.supplier'),
      render: (value) => data.suppliers.find((supplier) => supplier.id === value)?.name ?? value,
    },
    {
      key: 'date',
      header: t('receipts.date'),
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      header: t('app.status'),
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'total',
      header: t('app.total'),
      render: (value) => formatCurrency(value),
    },
    {
      key: 'actions',
      header: t('app.actions'),
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/receipts/${row.id}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Detail
          </button>
          {availableActions(row, user?.role).map((action) => (
            <RoleGuard key={action.status} roles={action.roles}>
              <button
                type="button"
                onClick={() => transition(row, action.status)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                {action.label}
              </button>
            </RoleGuard>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('receipts.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage inbound receipts and lifecycle transitions.
          </p>
        </div>
        <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER, Roles.STAFF]}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t('receipts.create')}
          </button>
        </RoleGuard>
      </div>

      <DataTable data={data.receipts} columns={columns} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('receipts.create')}
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
              form="receipt-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="receipt-form" className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label={t('receipts.supplier')}
            value={form.supplierId}
            onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))}
            options={suppliers}
            placeholder="Select supplier"
            required
          />
          <DatePicker
            label={t('receipts.date')}
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <LineItemsEditor
            products={products}
            value={form.lines}
            onChange={(lines) => setForm((prev) => ({ ...prev, lines }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.hasShortage}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hasShortage: event.target.checked }))
                }
              />
              {t('receipts.hasShortage')}
            </label>
            <Input
              label={t('receipts.damageNote')}
              value={form.damageNote}
              onChange={(event) => setForm((prev) => ({ ...prev, damageNote: event.target.value }))}
            />
          </div>
          {form.hasShortage ? (
            <Input
              label={t('receipts.shortageNote')}
              value={form.shortageNote}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, shortageNote: event.target.value }))
              }
              required
            />
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            {t('app.total')}: {formatCurrency(form.lines.reduce((sum, line) => sum + line.quantity * line.price, 0))}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function availableActions(receipt, role) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];
  const actions = [];

  if (receipt.status === ReceiptStatus.DRAFT) {
    actions.push({
      status: ReceiptStatus.APPROVED,
      label: 'Approve',
      roles: managerRoles,
    });
  }
  if (receipt.status === ReceiptStatus.APPROVED) {
    actions.push({
      status: ReceiptStatus.SUPPLIER_CONFIRMED,
      label: 'Supplier confirmed',
      roles: managerRoles,
    });
  }
  if (receipt.status === ReceiptStatus.SUPPLIER_CONFIRMED) {
    actions.push({
      status: ReceiptStatus.COMPLETED,
      label: 'Complete',
      roles: managerRoles,
    });
  }
  return actions.filter((action) => !action.roles || action.roles.includes(role));
}