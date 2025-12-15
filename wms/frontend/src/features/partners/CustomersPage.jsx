import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';

const emptyCustomer = {
  name: '',
  type: 'Retail',
  policy: '',
};

const customerTypes = [
  { value: 'Retail', label: 'Retail' },
  { value: 'Wholesale', label: 'Wholesale' },
  { value: 'Key Account', label: 'Key Account' },
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
          { key: 'name', header: 'Customer' },
          { key: 'type', header: 'Type' },
          { key: 'policy', header: 'Policy' },
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
        title={editing ? 'Update customer' : 'Create customer'}
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
          <Input
            label="Customer name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Select
            label="Customer type"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            options={customerTypes}
          />
          <Input
            label="Policy"
            value={form.policy}
            onChange={(event) => setForm((prev) => ({ ...prev, policy: event.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
