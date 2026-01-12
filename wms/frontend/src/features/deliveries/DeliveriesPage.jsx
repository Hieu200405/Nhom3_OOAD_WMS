import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus, FileSpreadsheet, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { DatePicker } from '../../components/forms/DatePicker.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { apiClient } from '../../services/apiClient.js';
import { DeliveryStatus, Roles } from '../../utils/constants.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { RoleGuard } from '../../components/RoleGuard.jsx';
import { useAuth } from '../../app/auth-context.jsx';
import { useSocket } from '../../app/socket-context.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { NumberInput } from '../../components/forms/NumberInput.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

const defaultForm = {
  code: '',
  customerId: '',
  date: new Date().toISOString().slice(0, 10),
  expectedDate: new Date().toISOString().slice(0, 10),
  note: '',
  lines: [
    {
      productId: '',
      quantity: 1,
      price: 0,
      locationId: ''
    },
  ],
};

export function DeliveriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [delRes, custRes, prodRes, invRes, locRes] = await Promise.all([
        apiClient('/deliveries'),
        apiClient('/partners', { params: { type: 'customer' } }),
        apiClient('/products'),
        apiClient('/inventory'),
        apiClient('/warehouse')
      ]);
      setDeliveries(delRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setInventory(invRes.data || []);
      setLocations(locRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load deliveries data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (payload) => {
      if (payload.resource === 'delivery') {
        fetchData();
      }
    };
    socket.on('resource_update', handleUpdate);
    return () => {
      socket.off('resource_update', handleUpdate);
    };
  }, [socket, fetchData]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: c.name })),
    [customers],
  );

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.name}` })),
    [products]
  );

  const locationMap = useMemo(() => {
    const map = new Map();
    locations.forEach(l => map.set(l.id, l));
    return map;
  }, [locations]);

  // Helper to get available locations for a product
  const getProductInventory = (productId) => {
    const items = inventory.filter(
      (item) => item.productId === productId && item.quantity > 0 && item.status === 'available'
    );
    const byLocation = new Map();
    items.forEach((item) => {
      const current = byLocation.get(item.locationId) || 0;
      byLocation.set(item.locationId, current + item.quantity);
    });
    return Array.from(byLocation.entries()).map(([locationId, quantity]) => {
      const loc = locationMap.get(locationId);
      return {
        value: locationId,
        label: `${loc ? `${loc.code} - ${loc.name}` : 'Unknown'} (Qty: ${quantity})`,
        quantity
      };
    });
  };

  const getAvailableQty = (productId, locationId) => {
    if (!productId || !locationId) return 0;
    const items = inventory.filter(
      (item) => item.productId === productId && item.locationId === locationId && item.status === 'available'
    );
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }

    const lines = form.lines
      .filter((line) => line.productId && line.locationId)
      .map((line) => ({
        productId: line.productId,
        qty: Number(line.quantity),
        priceOut: Number(line.price),
        locationId: line.locationId
      }));

    if (lines.length === 0) {
      toast.error('Vui lòng thêm sản phẩm và chọn vị trí kho');
      return;
    }

    // Client-side stock check
    for (const line of lines) {
      const availableQty = getAvailableQty(line.productId, line.locationId);
      if (availableQty < line.qty) {
        toast.error(`Không đủ tồn kho cho sản phẩm ${line.productId} tại vị trí đã chọn`);
        return;
      }
    }

    const payload = {
      code: form.code || `PX-${Date.now()}`,
      customerId: form.customerId,
      date: form.date,
      expectedDate: form.expectedDate,
      lines,
      notes: form.note
    };

    try {
      await apiClient('/deliveries', { method: 'POST', body: payload });
      toast.success(t('notifications.saved'));
      setOpen(false);
      setForm(defaultForm);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi tạo phiếu xuất');
    }
  };

  const transition = async (delivery, status, note) => {
    try {
      await apiClient(`/deliveries/${delivery.id}/transition`, {
        method: 'POST',
        body: { to: status, note }
      });
      toast.success(t('notifications.statusChanged'));
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  const updateLine = (index, changes) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === index ? { ...l, ...changes } : l)
    }));
  };

  const addLine = () => {
    setForm(prev => ({
      ...prev,
      lines: [...prev.lines, { productId: '', quantity: 1, price: 0, locationId: '' }]
    }));
  };

  const removeLine = (index) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleAutoAllocate = async () => {
    const itemsToAllocate = form.lines
      .filter(l => l.productId && l.quantity > 0)
      .map(l => ({ productId: l.productId, quantity: Number(l.quantity) }));

    if (itemsToAllocate.length === 0) {
      toast.error('Vui lòng chọn sản phẩm và số lượng trước khi phân bổ');
      return;
    }

    try {
      const res = await apiClient.post('/deliveries/allocate', { items: itemsToAllocate });
      const allocations = res.data.data;

      const newLines = [];
      // Reconstruct lines based on allocation
      allocations.forEach(alloc => {
        if (alloc.error) {
          toast.error(`Sản phẩm ${alloc.productId}: ${alloc.error}`);
          // Keep original line if failed
          const original = form.lines.find(l => l.productId === alloc.productId);
          if (original) newLines.push(original);
        } else {
          // successful allocation, expand to multiple lines if needed
          alloc.picks.forEach(pick => {
            const original = form.lines.find(l => l.productId === alloc.productId);
            newLines.push({
              productId: alloc.productId,
              quantity: pick.quantity,
              price: original ? original.price : 0,
              locationId: pick.locationId,
              note: pick.batch ? `Batch: ${pick.batch}` : ''
            });
          });
          if (alloc.totalPicked < itemsToAllocate.find(i => i.productId === alloc.productId).quantity) {
            toast.warning(`Sản phẩm ${alloc.productId}: Chỉ phân bổ được ${alloc.totalPicked}`);
          }
        }
      });

      setForm(prev => ({ ...prev, lines: newLines }));
      toast.success('Đã phân bổ tồn kho tự động (FIFO)');
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi phân bổ tự động');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiClient('/deliveries/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Deliveries-List-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      toast.error('Failed to export deliveries');
    }
  };

  const columns = [
    { key: 'code', header: 'Mã' },
    {
      key: 'customerId',
      header: t('deliveries.customer'),
      render: (value, row) =>
        row?.customer?.name ??
        row?.customerName ??
        customers.find((customer) => customer.id === value)?.name ??
        value,
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
      key: 'totalAmount',
      header: t('app.total'),
      render: (value, row) => {
        if (typeof value === 'number') return formatCurrency(value);
        const total = (row?.lines || []).reduce(
          (sum, line) => sum + (Number(line.qty) || 0) * (Number(line.priceOut) || 0),
          0
        );
        return formatCurrency(total);
      },
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
                onClick={() => {
                  if (action.requiresNote) {
                    setRejectTarget(row);
                    setRejectNote('');
                    setRejectOpen(true);
                    return;
                  }
                  transition(row, action.status);
                }}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-white shadow-sm transition ${
                  action.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
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
      <PageHeader
        title={t('deliveries.title')}
        description="Monitor delivery statuses and stock availability."
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-500"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
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
        }
      />
      <DataTable data={deliveries} columns={columns} isLoading={loading} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('deliveries.create')}
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
              form="delivery-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="delivery-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã phiếu (Tự động)"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="PX-..."
            />
            <DatePicker
              label={t('deliveries.date')}
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
            <DatePicker
              label="Ngày giao dự kiến"
              value={form.expectedDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedDate: event.target.value }))}
              required
            />
          </div>
          <Select
            label={t('deliveries.customer')}
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            options={customerOptions}
            placeholder="Select customer"
            required
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm text-slate-900 dark:text-slate-100">Chi tiết sản phẩm</div>
              <button
                type="button"
                onClick={handleAutoAllocate}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              >
                <Wand2 className="h-3 w-3" />
                Tự động phân bổ (FIFO)
              </button>
            </div>
            {form.lines.map((line, index) => (
              <div key={index} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 grid md:grid-cols-4 gap-3 relative">
                <div className="md:col-span-2">
                  <Select
                    label="Sản phẩm"
                    value={line.productId}
                    onChange={(e) => updateLine(index, { productId: e.target.value, locationId: '' })}
                    options={productOptions}
                    placeholder="Chọn sản phẩm"
                    required
                  />
                  {line.note && <div className="text-xs text-indigo-600 mt-1">{line.note}</div>}
                </div>
                <div className="md:col-span-2">
                  <Select
                    label="Vị trí / Lô (Tồn kho)"
                    value={line.locationId}
                    onChange={(e) => updateLine(index, { locationId: e.target.value })}
                    options={getProductInventory(line.productId)}
                    placeholder={line.productId ? "Chọn vị trí" : "Chọn sản phẩm trước"}
                    disabled={!line.productId}
                    required
                  />
                </div>
                <NumberInput
                  label="Số lượng"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                  min={1}
                  required
                />
                <NumberInput
                  label="Giá xuất"
                  value={line.price}
                  onChange={(e) => updateLine(index, { price: Number(e.target.value) })}
                  min={0}
                />
                <div className="flex items-end">
                  <button type="button" onClick={() => removeLine(index)} className="text-red-500 text-sm mb-2 hover:underline">Xóa dòng</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addLine} className="text-sm text-indigo-600 font-medium hover:underline">+ Thêm dòng</button>
          </div>

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

      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectNote('');
          setRejectTarget(null);
        }}
        title="Từ chối phiếu xuất"
        maxWidth="max-w-xl"
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setRejectNote('');
                setRejectTarget(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('app.cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!rejectTarget) return;
                transition(rejectTarget, DeliveryStatus.REJECTED, rejectNote.trim());
                setRejectOpen(false);
                setRejectNote('');
                setRejectTarget(null);
              }}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
            >
              Reject
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn có thể ghi chú lý do từ chối để tiện theo dõi sau này.
          </p>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1 leading-none">
              Ghi chú (tùy chọn)
            </span>
            <textarea
              rows={4}
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              placeholder="VD: Sai khách hàng, sai số lượng..."
              className="input min-h-[96px] resize-y"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function availableActions(delivery) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];
  const staffRoles = [Roles.ADMIN, Roles.MANAGER, Roles.STAFF];

  switch (delivery.status) {
    case DeliveryStatus.DRAFT:
      return [
        { status: DeliveryStatus.APPROVED, label: 'Approve', roles: managerRoles },
        { status: DeliveryStatus.REJECTED, label: 'Reject', roles: managerRoles, requiresNote: true, variant: 'danger' }
      ];
    case DeliveryStatus.APPROVED:
      return [
        { status: DeliveryStatus.PREPARED, label: 'Prepare', roles: staffRoles }
      ];
    case DeliveryStatus.PREPARED:
      return [{ status: DeliveryStatus.DELIVERED, label: 'Deliver', roles: staffRoles }];
    case DeliveryStatus.DELIVERED:
      return [{ status: DeliveryStatus.COMPLETED, label: 'Complete', roles: managerRoles }];
    default:
      return [];
  }
}
