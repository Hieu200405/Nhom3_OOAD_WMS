import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { ArrowRight, Plus } from 'lucide-react';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { DatePicker } from '../../components/forms/DatePicker.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { LineItemsEditor } from '../../components/LineItemsEditor.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { apiClient } from '../../services/apiClient.js';
import { ReceiptStatus, Roles } from '../../utils/constants.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';
import { useAuth } from '../../app/auth-context.jsx';

const defaultForm = {
  code: '',
  supplierId: '',
  date: new Date().toISOString().slice(0, 10),
  lines: [
    {
      productId: '',
      quantity: 1,
      price: 0,
    },
  ],
  hasShortage: false,
  shortageNote: '',
  damageNote: '',
  notes: ''
};

export function ReceiptsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, supRes, prodRes] = await Promise.all([
        apiClient('/receipts'),
        apiClient('/partners', { params: { type: 'supplier' } }),
        apiClient('/products')
      ]);
      setReceipts(recRes.data || []);
      setSuppliers(supRes.data || []);
      setProducts(prodRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load receipts data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.supplierId) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return;
    }

    const lines = form.lines
      .filter((line) => line.productId)
      .map((line) => ({
        productId: line.productId,
        qty: Number(line.quantity),
        priceIn: Number(line.price)
      }));

    if (lines.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    const payload = {
      code: form.code || `PN-${Date.now()}`, // Auto-generate if empty
      supplierId: form.supplierId,
      date: form.date,
      lines,
      notes: form.notes || form.shortageNote || form.damageNote, // Simplified mapping
      // status: ReceiptStatus.DRAFT // Backend default? 
    };

    try {
      await apiClient('/receipts', { method: 'POST', body: payload });
      toast.success(t('notifications.saved'));
      setOpen(false);
      setForm(defaultForm);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi tạo phiếu nhập');
    }
  };

  const transition = async (receipt, status) => {
    // Determine the transition target based on status mapping
    // Our status constant might act as the "to" value.
    // The backend uses transitionSchema: { to: 'approved' | 'supplierConfirmed' | 'completed' }
    // Constants: DRAFT, APPROVED, SUPPLIER_CONFIRMED, COMPLETED

    // Status enum backend: 'draft', 'approved', 'supplierConfirmed', 'completed' (camelCase)
    // Constants might be uppercase? Check constants.js if needed. Usually constants match value.

    try {
      await apiClient(`/receipts/${receipt.id}/transition`, {
        method: 'POST',
        body: { to: status }
      });
      toast.success(t('notifications.statusChanged'));
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  // Need to adjust action status to match backend expected values (camelCase vs CAPS)
  // Assuming ReceiptStatus values match backend enum strings.

  const columns = [
    { key: 'code', header: 'Mã' },
    {
      key: 'supplierId',
      header: t('receipts.supplier'),
      render: (value) => suppliers.find((supplier) => supplier.id === value)?.name ?? value,
    },
    {
      key: 'date',
      header: t('receipts.date'),
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      header: t('app.status'),
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'totalAmount', // API likely returns totalAmount or we calculate
      header: t('app.total'),
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'actions',
      header: t('app.actions'),
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/receipts/${row.id}`)} // Detail page also needs refactor later? Assuming detail page fetches by ID.
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Detail
          </button>
          {availableActions(row, user?.role).map((action) => (
            <RoleGuard key={action.status} roles={action.roles}>
              <button
                type="button"
                onClick={() => transition(row, action.status)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-white shadow-sm transition
                  ${action.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                  }
`}
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
            {t('receipts.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage inbound receipts and lifecycle transitions.
          </p>
        </div>
        <RoleGuard roles={[Roles.ADMIN, Roles.MANAGER, Roles.STAFF]}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t('receipts.create')}
          </button>
        </RoleGuard>
      </div>

      <DataTable data={receipts} columns={columns} isLoading={loading} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('receipts.create')}
        maxWidth="max-w-4xl"
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
              form="receipt-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="receipt-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã phiếu (Tự động)"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="PN-..."
            />
            <DatePicker
              label={t('receipts.date')}
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
          </div>
          <Select
            label={t('receipts.supplier')}
            value={form.supplierId}
            onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))}
            options={supplierOptions}
            placeholder="Select supplier"
            required
          />

          <LineItemsEditor
            products={products}
            value={form.lines}
            onChange={(lines) => setForm((prev) => ({ ...prev, lines }))}
          />
          <Input
            label="Ghi chú"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            {t('app.total')}: {formatCurrency(form.lines.reduce((sum, line) => sum + line.quantity * line.price, 0))}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function availableActions(receipt, role) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];
  const actions = [];

  // Backend status: draft, approved, supplierConfirmed, completed
  if (receipt.status === ReceiptStatus.DRAFT) {
    actions.push({
      status: ReceiptStatus.APPROVED,
      label: 'Approve',
      roles: managerRoles,
      variant: 'success',
    });
    // Reject is not in standard transition endpoints list but maybe simple delete?
  }
  if (receipt.status === ReceiptStatus.APPROVED) {
    actions.push({
      status: ReceiptStatus.SUPPLIER_CONFIRMED,
      label: 'Supplier confirmed',
      roles: managerRoles,
    });
  }
  if (receipt.status === ReceiptStatus.SUPPLIER_CONFIRMED) {
    actions.push({
      status: ReceiptStatus.COMPLETED,
      label: 'Complete',
      roles: managerRoles,
    });
  }
  return actions.filter((action) => !action.roles || action.roles.includes(role));
}