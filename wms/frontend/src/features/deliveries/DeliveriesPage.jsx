import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { DatePicker } from '../../components/forms/DatePicker.jsx';
import { LineItemsEditor } from '../../components/LineItemsEditor.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { DeliveryStatus, Roles } from '../../utils/constants.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { generateId } from '../../utils/id.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';
import { useAuth } from '../../app/auth-context.jsx';

const defaultForm = {
  customerId: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  lines: [
    {
      id: generateId('line'),
      productId: '',
      quantity: 1,
      price: 0,
    },
  ],
};

export function DeliveriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const customers = useMemo(
    () => data.customers.map((customer) => ({ value: customer.id, label: customer.name })),
    [data.customers],
  );

  const products = data.products;

  const inventoryMap = useMemo(() => {
    const map = new Map();
    data.inventory.forEach((item) => map.set(item.productId, item.quantity));
    return map;
  }, [data.inventory]);

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
    actions.createRecord('deliveries', {
      id: generateId('dvy'),
      customerId: form.customerId,
      date: form.date,
      status: DeliveryStatus.DRAFT,
      note: form.note,
      lines,
      total,
      inventoryApplied: false,
    });
    setOpen(false);
    setForm({
      ...defaultForm,
      lines: [{ ...defaultForm.lines[0], id: generateId('line') }],
    });
  };

  const checkInventory = (lines) =>
    lines.every((line) => (inventoryMap.get(line.productId) ?? 0) >= line.quantity);

  const transition = (delivery, status) => {
    if ([DeliveryStatus.PREPARED, DeliveryStatus.DELIVERED, DeliveryStatus.COMPLETED].includes(status)) {
      if (!checkInventory(delivery.lines)) {
        toast.error('Inventory is insufficient for this step.');
        return;
      }
    }
    actions.transitionDeliveryStatus(delivery.id, status);
    toast.success(t('notifications.statusChanged'));
  };

  const columns = [
    { key: 'id', header: 'Delivery' },
    {
      key: 'customerId',
      header: t('deliveries.customer'),
      render: (value) => data.customers.find((customer) => customer.id === value)?.name ?? value,
    },
    {
      key: 'date',
      header: t('deliveries.date'),
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
            onClick={() => navigate(`/deliveries/${row.id}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Detail
          </button>
          {availableActions(row).map((action) => (
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
            {t('deliveries.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor delivery statuses and stock availability.
          </p>
        </div>
        <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER, Roles.STAFF]}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t('deliveries.create')}
          </button>
        </RoleGuard>
      </div>

      <DataTable data={data.deliveries} columns={columns} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('deliveries.create')}
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
              form="delivery-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="delivery-form" className="space-y-4" onSubmit={handleSubmit}>
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
          <LineItemsEditor
            products={products}
            value={form.lines}
            onChange={(lines) => setForm((prev) => ({ ...prev, lines }))}
          />
          <textarea
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Delivery note"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            {t('app.total')}: {formatCurrency(form.lines.reduce((sum, line) => sum + line.quantity * line.price, 0))}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function availableActions(delivery) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];
  const staffRoles = [Roles.ADMIN, Roles.MANAGER, Roles.STAFF];

  switch (delivery.status) {
    case DeliveryStatus.DRAFT:
      return [{ status: DeliveryStatus.APPROVED, label: 'Approve', roles: managerRoles }];
    case DeliveryStatus.APPROVED:
      return [{ status: DeliveryStatus.PREPARED, label: 'Prepare', roles: staffRoles }];
    case DeliveryStatus.PREPARED:
      return [{ status: DeliveryStatus.DELIVERED, label: 'Deliver', roles: staffRoles }];
    case DeliveryStatus.DELIVERED:
      return [{ status: DeliveryStatus.COMPLETED, label: 'Complete', roles: managerRoles }];
    default:
      return [];
  }
}
