import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';
import { formatDate } from '../../utils/formatters.js';

const emptyIncident = {
  type: '',
  note: '',
  action: '',
  relatedId: '',
};

export function IncidentsPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyIncident);

  const handleSubmit = (event) => {
    event.preventDefault();
    actions.createRecord('incidents', {
      ...form,
      id: generateId('inc'),
      date: new Date().toISOString(),
    });
    setForm(emptyIncident);
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
          { key: 'type', header: t('incidents.type') },
          { key: 'note', header: t('incidents.note') },
          { key: 'action', header: t('incidents.action') },
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
          <Input
            label={t('incidents.type')}
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            required
          />
          <Input
            label={t('incidents.note')}
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            required
          />
          <Input
            label={t('incidents.action')}
            value={form.action}
            onChange={(event) => setForm((prev) => ({ ...prev, action: event.target.value }))}
            required
          />
          <Input
            label="Related reference"
            value={form.relatedId}
            onChange={(event) => setForm((prev) => ({ ...prev, relatedId: event.target.value }))}
            placeholder="Linked receipt or delivery code"
          />
        </form>
      </Modal>
    </div>
  );
}
