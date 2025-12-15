import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { DatePicker } from '../../components/forms/DatePicker.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { LineItemsEditor } from '../../components/LineItemsEditor.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { DisposalReasons, Roles } from '../../utils/constants.js';
import { generateId } from '../../utils/id.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';

const DisposalStatus = {
  DRAFT: 'Draft',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
};

const defaultForm = {
  reason: DisposalReasons[0],
  date: new Date().toISOString().slice(0, 10),
  council: '',
  attachment: '',
  items: [
    {
      id: generateId('dsp-line'),
      productId: '',
      quantity: 1,
    },
  ],
};

const HIGH_VALUE_THRESHOLD = 5_000_000;

export function DisposalsPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const products = data.products;

  const reasons = useMemo(
    () => DisposalReasons.map((reason) => ({ value: reason, label: reason })),
    [],
  );

  const totalValue = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const product = data.products.find((prod) => prod.id === item.productId);
      if (!product) return sum;
      return sum + item.quantity * product.priceIn;
    }, 0);
  }, [form.items, data.products]);

  const handleSubmit = (event) => {
    event.preventDefault();
    actions.createRecord('disposals', {
      id: generateId('dsp'),
      reason: form.reason,
      date: form.date,
      council: form.council,
      attachment: form.attachment,
      status: DisposalStatus.DRAFT,
      items: form.items,
      total: totalValue,
    });
    setOpen(false);
    setForm(defaultForm);
  };

  const applyDisposal = (record) => {
    record.items.forEach((item) => {
      const inventoryItem = data.inventory.find((entry) => entry.productId === item.productId);
      if (inventoryItem) {
        const quantity = Math.max(inventoryItem.quantity - item.quantity, 0);
        actions.updateRecord('inventory', inventoryItem.id, {
          quantity,
          status: quantity === 0 ? 'Out of Stock' : inventoryItem.status,
        });
      }
    });
  };

  const transition = (record, status) => {
    actions.updateRecord('disposals', record.id, { status });
    if (status === DisposalStatus.COMPLETED) {
      applyDisposal(record);
      toast.success('Inventory updated after disposal.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('disposals.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dispose expired, damaged, or lost stock after manager approval.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t('disposals.create')}
        </button>
      </div>

      <DataTable
        data={data.disposals}
        columns={[
          { key: 'id', header: 'Disposal' },
          { key: 'reason', header: t('disposals.reason') },
          { key: 'date', header: t('deliveries.date'), render: (value) => formatDate(value) },
          { key: 'status', header: t('app.status'), render: (value) => <StatusBadge status={value} /> },
          { key: 'total', header: t('app.total'), render: (value) => formatCurrency(value ?? 0) },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <div className="flex items-center gap-2">
                {disposalActions(row).map((action) => (
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
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('disposals.create')}
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
              form="disposal-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="disposal-form" className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label={t('disposals.reason')}
            value={form.reason}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            options={reasons}
          />
          <DatePicker
            label={t('deliveries.date')}
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          {totalValue > HIGH_VALUE_THRESHOLD ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label={t('disposals.council')}
                value={form.council}
                onChange={(event) => setForm((prev) => ({ ...prev, council: event.target.value }))}
                required
              />
              <Input
                label={t('disposals.attachment')}
                value={form.attachment}
                onChange={(event) => setForm((prev) => ({ ...prev, attachment: event.target.value }))}
                placeholder="Disposal report link (mock)"
                required
              />
            </div>
          ) : null}
          <LineItemsEditor
            products={products}
            value={form.items}
            onChange={(items) => setForm((prev) => ({ ...prev, items }))}
            showPrice={false}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            {t('app.total')}: {formatCurrency(totalValue)}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function disposalActions(record) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];

  switch (record.status) {
    case DisposalStatus.DRAFT:
      return [{ status: DisposalStatus.PENDING, label: 'Submit', roles: managerRoles }];
    case DisposalStatus.PENDING:
      return [{ status: DisposalStatus.APPROVED, label: 'Approve', roles: managerRoles }];
    case DisposalStatus.APPROVED:
      return [{ status: DisposalStatus.COMPLETED, label: 'Complete', roles: managerRoles }];
    default:
      return [];
  }
}
