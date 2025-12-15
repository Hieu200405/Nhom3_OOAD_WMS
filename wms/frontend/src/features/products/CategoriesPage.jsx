import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';

const emptyCategory = {
  name: '',
  description: '',
};

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCategory);

  const openCreateModal = () => {
    setForm(emptyCategory);
    setEditing(null);
    setOpen(true);
  };

  const openEditModal = (category) => {
    setEditing(category);
    setForm(category);
    setOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editing) {
      actions.updateRecord('categories', editing.id, form);
    } else {
      actions.createRecord('categories', { ...form, id: generateId('cat') });
    }
    setOpen(false);
  };

  const handleDelete = (category) => {
    if (window.confirm('Xóa danh mục này?')) {
      actions.removeRecord('categories', category.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t('categories.title')}
        </h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t('categories.create')}
        </button>
      </div>

      <DataTable
        data={data.categories}
        columns={[
          { key: 'name', header: t('products.category') },
          { key: 'description', header: 'Mô tả' },
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
        title={editing ? 'Cập nhật danh mục' : 'Thêm danh mục'}
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
              form="category-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="category-form" className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label={t('products.category')}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            label="Mô tả"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
