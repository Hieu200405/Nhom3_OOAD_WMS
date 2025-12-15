import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { NumberInput } from '../../components/forms/NumberInput.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { generateId } from '../../utils/id.js';

const emptyProduct = {
  sku: '',
  name: '',
  categoryId: '',
  priceIn: 0,
  priceOut: 0,
  unit: '',
  barcode: '',
};

export function ProductsPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const { searchTerm = '' } = useOutletContext() ?? {};
  const [categoryFilter, setCategoryFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const categories = useMemo(
    () => data.categories.map((category) => ({ value: category.id, label: category.name })),
    [data.categories],
  );

  const filteredProducts = useMemo(() => {
    return data.products.filter((product) => {
      const byCategory = !categoryFilter || product.categoryId === categoryFilter;
      const lowered = searchTerm.toLowerCase();
      const bySearch =
        !searchTerm ||
        product.name.toLowerCase().includes(lowered) ||
        product.sku.toLowerCase().includes(lowered);
      return byCategory && bySearch;
    });
  }, [data.products, categoryFilter, searchTerm]);

  const openCreateModal = () => {
    setForm(emptyProduct);
    setEditing(null);
    setOpen(true);
  };

  const openEditModal = (product) => {
    setEditing(product);
    setForm(product);
    setOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editing) {
      actions.updateRecord('products', editing.id, form);
    } else {
      actions.createRecord('products', { ...form, id: generateId('prod') });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('products.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('products.categoryFilter')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            placeholder={t('products.categoryFilter')}
            options={[{ value: '', label: 'All' }, ...categories]}
          />
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t('products.create')}
          </button>
        </div>
      </div>

      <DataTable
        data={filteredProducts}
        columns={[
          { key: 'sku', header: t('products.sku') },
          { key: 'name', header: t('products.name') },
          {
            key: 'categoryId',
            header: t('products.category'),
            render: (value) => data.categories.find((cat) => cat.id === value)?.name ?? '—',
          },
          { key: 'unit', header: t('products.unit') },
          {
            key: 'priceIn',
            header: t('products.priceIn'),
            render: (value) => formatCurrency(value),
          },
          {
            key: 'priceOut',
            header: t('products.priceOut'),
            render: (value) => formatCurrency(value),
          },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <button
                type="button"
                onClick={() => openEditModal(row)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('app.edit')}
              </button>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Update product' : 'Create product'}
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
              form="product-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="product-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="SKU"
              value={form.sku}
              onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
              required
            />
            <Input
              label="Barcode"
              value={form.barcode}
              onChange={(event) => setForm((prev) => ({ ...prev, barcode: event.target.value }))}
            />
          </div>
          <Input
            label={t('products.name')}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Select
            label={t('products.category')}
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            options={categories}
            placeholder="Select category"
            required
          />
          <Input
            label={t('products.unit')}
            value={form.unit}
            onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <NumberInput
              label={t('products.priceIn')}
              min={0}
              value={form.priceIn}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  priceIn: Number(event.target.value),
                }))
              }
              required
            />
            <NumberInput
              label={t('products.priceOut')}
              min={0}
              value={form.priceOut}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  priceOut: Number(event.target.value),
                }))
              }
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
