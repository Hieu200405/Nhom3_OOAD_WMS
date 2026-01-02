import { useMemo, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { NumberInput } from '../../components/forms/NumberInput.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { apiClient } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatters.js';
import { Roles } from '../../utils/constants.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';

const defaultForm = {
  code: '',
  customerId: '',
  items: [
    {
      productId: '',
      quantity: 1,
      reason: '',
    },
  ],
};

export function ReturnsPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [retRes, custRes, prodRes] = await Promise.all([
        apiClient('/returns'),
        apiClient('/partners', { params: { type: 'customer' } }),
        apiClient('/products')
      ]);
      setReturns(retRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load returns data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customerOptions = useMemo(
    () => customers.map((customer) => ({ value: customer.id, label: customer.name })),
    [customers],
  );

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` })),
    [products]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const items = form.items
      .filter((item) => item.productId)
      .map(item => ({
        productId: item.productId,
        qty: Number(item.quantity),
        reason: item.reason || 'Return',
      }));

    if (items.length === 0) return;

    const payload = {
      code: form.code || `RT-${Date.now()}`,
      from: 'customer',
      refId: form.customerId || undefined,
      items: items
    };

    try {
      await apiClient('/returns', { method: 'POST', body: payload });
      toast.success(t('notifications.saved'));
      setOpen(false);
      setForm(defaultForm);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to create return');
    }
  };

  const handleTransition = async (record, status) => {
    try {
      await apiClient(`/returns/${record.id}/transition`, {
        method: 'POST',
        body: { to: status }
      });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const updateItem = (index, changes) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, ...changes } : item)
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, reason: '' }]
    }));
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
        data={returns}
        isLoading={loading}
        columns={[
          { key: 'code', header: 'Return' },
          {
            key: 'refId',
            header: t('returns.from'),
            render: (value) => customers.find(c => c.id === value)?.name || value || 'Customer'
          },
          { key: 'createdAt', header: t('deliveries.date'), render: (value) => formatDate(value) },
          {
            key: 'status',
            header: t('app.status'),
            render: (value) => <StatusBadge status={value} />,
          },
          {
            key: 'items',
            header: 'Items',
            render: (items) => items?.length || 0
          },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <div className="flex items-center gap-2">
                {(row.status !== 'approved' && row.status !== 'completed') && (
                  <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER]}>
                    <button
                      type="button"
                      onClick={() => handleTransition(row, 'approved')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  </RoleGuard>
                )}
                {(row.status === 'approved') && (
                  <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER]}>
                    <button
                      type="button"
                      onClick={() => handleTransition(row, 'completed')}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                    >
                      Complete
                    </button>
                  </RoleGuard>
                )}
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã phiếu (Tự động)"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="RT-..."
            />
            <Select
              label={t('deliveries.customer')}
              value={form.customerId}
              onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
              options={customerOptions}
              placeholder="Select customer"
            />
          </div>

          <div className="space-y-3">
            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">Items</div>
            {form.items.map((item, index) => (
              <div key={index} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 grid md:grid-cols-2 gap-3">
                <Select
                  label="Sản phẩm"
                  value={item.productId}
                  onChange={(e) => updateItem(index, { productId: e.target.value })}
                  options={productOptions}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Số lượng"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    min={1}
                    required
                  />
                  <Input
                    label="Lý do"
                    value={item.reason}
                    onChange={(e) => updateItem(index, { reason: e.target.value })}
                    placeholder="Reason"
                    required
                  />
                </div>
                <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-xs">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm text-indigo-600 font-medium">+ Add Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}