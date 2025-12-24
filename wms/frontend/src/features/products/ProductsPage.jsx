import { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { NumberInput } from '../../components/forms/NumberInput.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatters.js';
import { generateId } from '../../utils/id.js';
import toast from 'react-hot-toast';

const emptyProduct = {
  sku: '',
  name: '',
  categoryId: '',
  priceIn: 0,
  priceOut: 0,
  unit: '',
  barcode: '',
  image: '',
  description: '',
  supplierIds: [], // Deprecated in UI but kept for compatibility
};

export function ProductsPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const { searchTerm = '' } = useOutletContext() ?? {};
  const [categoryFilter, setCategoryFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // general | suppliers
  const [form, setForm] = useState(emptyProduct);

  // Supplier Product State
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  // Load suppliers when editing a product
  useEffect(() => {
    if (editing && activeTab === 'suppliers') {
      fetchSupplierProducts(editing.id);
    }
  }, [editing, activeTab]);

  const fetchSupplierProducts = async (productId) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      // Mock data logic for demonstration
      setSupplierProducts([
        { id: 'sp1', supplierId: { name: 'Samsung Vina' }, priceIn: 15000000, isPreferred: true, currency: 'VND' },
        { id: 'sp2', supplierId: { name: 'FPT Trading' }, priceIn: 15200000, isPreferred: false, currency: 'VND' }
      ]);
      return;
    }
    setIsLoadingSuppliers(true);
    try {
      const res = await apiClient(`/supplier-products?productId=${productId}`);
      setSupplierProducts(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load supplier data');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

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
    setActiveTab('general');
    setOpen(true);
  };

  const openEditModal = (product) => {
    setEditing(product);
    setForm(product);
    setActiveTab('general');
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
          {
            key: 'image',
            header: '',
            sortable: false,
            render: (value) => (
              value ? (
                <img src={value} alt="" className="h-10 w-10 rounded object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">img</div>
              )
            )
          },
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
        title={editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        maxWidth="max-w-3xl"
        actions={
          activeTab === 'general' ? (
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
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Đóng
            </button>
          )
        }
      >
        {/* Tabs */}
        <div className="mb-6 flex space-x-4 border-b border-slate-200 dark:border-slate-700">
          <button
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'general' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('general')}
          >
            Thông tin chung
          </button>
          {editing && (
            <button
              className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'suppliers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('suppliers')}
            >
              Nhà cung cấp
            </button>
          )}
        </div>

        {activeTab === 'general' ? (
          <form id="product-form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Image Upload Section */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('products.image', 'Product Image')}
              </span>
              <div className="flex items-center gap-4">
                {form.image ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <img src={form.image} alt="Product" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                      className="absolute right-0 top-0 bg-red-500 p-0.5 text-white hover:bg-red-600"
                    >
                      <div className="h-3 w-3">×</div>
                    </button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
                    <span className="text-xs text-slate-400">No Image</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const formData = new FormData();
                        formData.append('image', file);

                        const promise = apiClient('/upload/image', {
                          method: 'POST',
                          body: formData,
                          skipMock: true
                        });

                        toast.promise(promise, {
                          loading: 'Uploading...',
                          success: 'Image uploaded',
                          error: 'Upload failed'
                        });

                        const res = await promise;
                        setForm(prev => ({ ...prev, image: res.url }));
                      } catch (error) {
                        console.error(error);
                        if (import.meta.env.VITE_USE_MOCK === 'true') {
                          toast('Backend unavailable, using local placeholder', { icon: '⚠️' });
                          const reader = new FileReader();
                          reader.onload = (e) => setForm(prev => ({ ...prev, image: e.target.result }));
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    PNG, JPG, WEBP up to 5MB.
                  </p>
                </div>
              </div>
            </div>

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

            <Input
              label="Mô tả"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Chi tiết về sản phẩm..."
            />

            <div className="grid gap-3 md:grid-cols-2">
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
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <NumberInput
                label={t('products.priceIn') + ' (Giá chuẩn)'}
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
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Danh sách nhà cung cấp cho sản phẩm này</h3>
              <button className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">
                + Thêm NCC
              </button>
            </div>

            {isLoadingSuppliers ? (
              <p className="text-sm text-slate-500">Đang tải...</p>
            ) : (
              <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Nhà cung cấp</th>
                      <th className="px-4 py-2">Giá nhập</th>
                      <th className="px-4 py-2 text-center">Ưu tiên</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {supplierProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-slate-500">Chưa có nhà cung cấp nào được gán.</td>
                      </tr>
                    ) : (
                      supplierProducts.map((sp) => (
                        <tr key={sp.id}>
                          <td className="px-4 py-2 font-medium">{sp.supplierId?.name || 'N/A'}</td>
                          <td className="px-4 py-2 text-indigo-600 font-semibold">
                            {sp.priceIn?.toLocaleString()} {sp.currency}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {sp.isPreferred && <Check className="h-4 w-4 inline text-green-500" />}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button className="text-slate-400 hover:text-indigo-600 mr-2"><Pencil className="h-3 w-3" /></button>
                            <button className="text-slate-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
