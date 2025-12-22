import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { NumberInput } from '../../components/forms/NumberInput.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';
import { formatDate } from '../../utils/formatters.js';
import { IncidentStatus } from '../../utils/constants.js';

const emptyLine = {
  productId: '',
  quantity: 1,
};

const createEmptyIncident = () => ({
  type: '',
  status: IncidentStatus.OPEN,
  refType: 'receipt',
  refId: '',
  note: '',
  action: '',
  lines: [{ ...emptyLine, id: generateId('line') }],
});

export function IncidentsPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(createEmptyIncident);

  const productOptions = useMemo(
    () =>
      data.products.map((product) => ({
        value: product.id,
        label: `${product.sku} - ${product.name}`,
      })),
    [data.products],
  );

  const typeOptions = [
    { value: 'shortage', label: t('incidents.types.shortage') },
    { value: 'late', label: t('incidents.types.late') },
    { value: 'damaged', label: t('incidents.types.damaged') },
    { value: 'rejected', label: t('incidents.types.rejected') },
  ];

  const actionOptions = [
    { value: 'replenish', label: t('incidents.actions.replenish') },
    { value: 'return', label: t('incidents.actions.return') },
    { value: 'refund', label: t('incidents.actions.refund') },
  ];

  const statusOptions = [
    { value: IncidentStatus.OPEN, label: t('incidents.statusValues.open') },
    { value: IncidentStatus.IN_PROGRESS, label: t('incidents.statusValues.inProgress') },
    { value: IncidentStatus.RESOLVED, label: t('incidents.statusValues.resolved') },
  ];

  const refTypeOptions = [
    { value: 'receipt', label: t('incidents.refTypes.receipt') },
    { value: 'delivery', label: t('incidents.refTypes.delivery') },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    actions.createRecord('incidents', {
      ...form,
      id: generateId('inc'),
      date: new Date().toISOString(),
    });
    setForm(createEmptyIncident());
    setOpen(false);
  };

  const handleDelete = (incident) => {
    if (window.confirm('Delete incident?')) {
      actions.removeRecord('incidents', incident.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('incidents.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log shortages, damages, late deliveries or customer refusals and capture the follow-up action.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t('incidents.create')}
        </button>
      </div>

      <DataTable
        data={data.incidents}
        columns={[
          {
            key: 'type',
            header: t('incidents.type'),
            render: (value) => (value ? t(`incidents.types.${value}`, value) : '-'),
          },
          {
            key: 'status',
            header: t('app.status'),
            render: (value) => (value ? t(`incidents.statusValues.${value}`, value) : '-'),
          },
          { key: 'refType', header: t('incidents.refType') },
          { key: 'refId', header: t('incidents.refId') },
          { key: 'note', header: t('incidents.note') },
          {
            key: 'action',
            header: t('incidents.action'),
            render: (value) => (value ? t(`incidents.actions.${value}`, value) : '-'),
          },
          {
            key: 'lines',
            header: t('app.lineItems'),
            render: (value) => value?.length ?? 0,
          },
          {
            key: 'date',
            header: 'Date',
            render: (value) => formatDate(value),
          },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <button
                type="button"
                onClick={() => handleDelete(row)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-600 transition hover:bg-rose-100 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('app.delete')}
              </button>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('incidents.create')}
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
              form="incident-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="incident-form" className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label={t('incidents.type')}
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            options={typeOptions}
            placeholder={t('incidents.typePlaceholder')}
            required
          />
          <Select
            label={t('app.status')}
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            options={statusOptions}
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label={t('incidents.refType')}
              value={form.refType}
              onChange={(event) => setForm((prev) => ({ ...prev, refType: event.target.value }))}
              options={refTypeOptions}
              required
            />
            <Input
              label={t('incidents.refId')}
              value={form.refId}
              onChange={(event) => setForm((prev) => ({ ...prev, refId: event.target.value }))}
              placeholder={t('incidents.refPlaceholder')}
              required
            />
          </div>
          <div className="space-y-3">
            {form.lines.map((line, index) => (
              <div
                key={line.id ?? index}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    label={t('incidents.product')}
                    value={line.productId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lines: prev.lines.map((item, idx) =>
                          idx === index ? { ...item, productId: event.target.value } : item,
                        ),
                      }))
                    }
                    options={productOptions}
                    placeholder={t('incidents.productPlaceholder')}
                    required
                  />
                  <NumberInput
                    label={t('incidents.quantity')}
                    min={1}
                    value={line.quantity}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lines: prev.lines.map((item, idx) =>
                          idx === index
                            ? { ...item, quantity: Number(event.target.value) }
                            : item,
                        ),
                      }))
                    }
                    required
                  />
                </div>
                {form.lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        lines: prev.lines.filter((_, idx) => idx !== index),
                      }))
                    }
                    className="mt-2 text-xs text-rose-500"
                  >
                    {t('incidents.removeLine')}
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  lines: [...prev.lines, { ...emptyLine, id: generateId('line') }],
                }))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {t('incidents.addLine')}
            </button>
          </div>
          <Input
            label={t('incidents.note')}
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            required
          />
          <Select
            label={t('incidents.action')}
            value={form.action}
            onChange={(event) => setForm((prev) => ({ ...prev, action: event.target.value }))}
            options={actionOptions}
            placeholder={t('incidents.actionPlaceholder')}
            required
          />
        </form>
      </Modal>
    </div>
  );
}
