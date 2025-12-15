import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { DatePicker } from '../../components/forms/DatePicker.jsx';
import { LineItemsEditor } from '../../components/LineItemsEditor.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatDate } from '../../utils/formatters.js';
import { generateId } from '../../utils/id.js';
import { Roles } from '../../utils/constants.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';

const ReturnStatus = {
  AWAITING: 'Awaiting Inspection',
  RESTOCKED: 'Restocked',
  DISPOSED: 'Disposed',
};

const defaultForm = {
  customerId: '',
  date: new Date().toISOString().slice(0, 10),
  reason: '',
  items: [
    {
      id: generateId('ret-line'),
      productId: '',
      quantity: 1,
      price: 0,
    },
  ],
};

export function ReturnsPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const customers = useMemo(
    () => data.customers.map((customer) => ({ value: customer.id, label: customer.name })),
    [data.customers],
  );

  const products = data.products;

  const handleSubmit = (event) => {
    event.preventDefault();
    const items = form.items.filter((item) => item.productId);
    if (items.length === 0) return;

    actions.createRecord('returns', {
      id: generateId('ret'),
      customerId: form.customerId,
      date: form.date,
      reason: form.reason,
      items,
      status: ReturnStatus.AWAITING,
    });
    setOpen(false);
    setForm(defaultForm);
  };

  const handleTransition = (record, status) => {
    actions.updateRecord('returns', record.id, { status });
    if (status === ReturnStatus.RESTOCKED) {
      record.items.forEach((item) => {
        const inventoryItem = data.inventory.find((entry) => entry.productId === item.productId);
        if (inventoryItem) {
          actions.updateRecord('inventory', inventoryItem.id, {
            quantity: inventoryItem.quantity + item.quantity,
          });
        } else {
          actions.createRecord('inventory', {
            id: generateId('inv'),
            productId: item.productId,
            quantity: item.quantity,
            status: 'Available',
          });
        }
      });
      toast.success('Return items restocked into inventory');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('returns.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Capture customer returns and decide whether to restock or dispose.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t('returns.create')}
        </button>
      </div>

      <DataTable
        data={data.returns}
        columns={[
          { key: 'id', header: 'Return' },
          {
            key: 'customerId',
            header: t('deliveries.customer'),
            render: (value) => data.customers.find((customer) => customer.id === value)?.name ?? value,
          },
          { key: 'date', header: t('deliveries.date'), render: (value) => formatDate(value) },
          { key: 'reason', header: t('returns.reason') },
          {
            key: 'status',
            header: t('app.status'),
            render: (value) => <StatusBadge status={value} />,
          },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <div className="flex items-center gap-2">
                {row.status === ReturnStatus.AWAITING ? (
                  <>
                    <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER]}>
                      <button
                        type="button"
                        onClick={() => handleTransition(row, ReturnStatus.RESTOCKED)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                      >
                        Restock
                      </button>
                    </RoleGuard>
                    <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER]}>
                      <button
                        type="button"
                        onClick={() => handleTransition(row, ReturnStatus.DISPOSED)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
                      >
                        Dispose
                      </button>
                    </RoleGuard>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('returns.create')}
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
              form="return-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="return-form" className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label={t('deliveries.customer')}
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            options={customers}
            placeholder="Select customer"
            required
          />
          <DatePicker
            label={t('deliveries.date')}
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <textarea
            value={form.reason}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            placeholder="Return reason"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            required
          />
          <LineItemsEditor
            products={products}
            value={form.items}
            onChange={(items) => setForm((prev) => ({ ...prev, items }))}
            showPrice={false}
          />
        </form>
      </Modal>
    </div>
  );
}