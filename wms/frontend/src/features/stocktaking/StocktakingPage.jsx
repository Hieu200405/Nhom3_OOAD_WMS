import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { DataTable } from "../../components/DataTable.jsx";
import { Modal } from "../../components/Modal.jsx";
import { Input } from "../../components/forms/Input.jsx";
import { DatePicker } from "../../components/forms/DatePicker.jsx";
import { NumberInput } from "../../components/forms/NumberInput.jsx";
import { Select } from "../../components/forms/Select.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ConfirmDialog } from "../../components/ConfirmDialog.jsx";
import { apiClient } from "../../services/apiClient.js";
import { StocktakingStatus, Roles } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";
import { RoleGuard } from "../../components/RoleGuard.jsx";

const emptyLine = {
  productId: "",
  locationId: "",
  actualQuantity: 0,
  reason: ""
};

export function StocktakingPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [stocktakingList, setStocktakingList] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, record: null, status: null });
  const [approval, setApproval] = useState({
    open: false,
    record: null,
    minutes: "",
    attachments: ""
  });
  const [form, setForm] = useState({
    name: "",
    code: "", // Added code field
    date: new Date().toISOString().slice(0, 10),
    lines: [{ ...emptyLine }]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, prodRes, locRes, invRes] = await Promise.all([
        apiClient('/stocktakes'),
        apiClient('/products'),
        apiClient('/warehouse'),
        apiClient('/inventory')
      ]);
      setStocktakingList(stRes.data || []);
      setProducts(prodRes.data || []);
      setLocations(locRes.data || []);
      setInventory(invRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load stocktaking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const productOptions = useMemo(() =>
    products.map((product) => ({
      value: product.id,
      label: `${product.sku} - ${product.name}`
    })),
    [products]);

  const locationOptions = useMemo(() =>
    locations.map((loc) => ({
      value: loc.id,
      label: loc.code
    })),
    [locations]);

  // Map inventory by key `${productId}-${locationId}` for easy lookup
  const inventoryMap = useMemo(() => {
    const map = new Map();
    inventory.forEach((item) => {
      map.set(`${item.productId}-${item.locationId}`, item.quantity);
    });
    return map;
  }, [inventory]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prepare payload matching server expectation
    // router.post('/', ... validate({ body: createSchema }), controller.create);
    // createSchema: code, date, items: [{ productId, locationId, countedQty, systemQty... }], minutes, attachments

    const items = form.lines.map(line => {
      const systemQty = inventoryMap.get(`${line.productId}-${line.locationId}`) ?? 0;
      return {
        productId: line.productId,
        locationId: line.locationId,
        countedQty: line.actualQuantity,
        systemQty: systemQty
      };
    }).filter(i => i.productId && i.locationId);

    if (items.length === 0) {
      toast.error('Please add valid lines with Product and Location');
      return;
    }

    const payload = {
      code: form.code || `ST-${Date.now()}`,
      name: form.name, // Extra field, backend might ignore or handle
      date: new Date(form.date),
      items: items
    };

    try {
      await apiClient('/stocktakes', { method: 'POST', body: payload });
      toast.success('Stocktaking created');
      setOpen(false);
      setForm({
        name: "",
        code: "",
        date: new Date().toISOString().slice(0, 10),
        lines: [{ ...emptyLine }]
      });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to create');
    }
  };

  const handleTransition = async (record, nextStatus) => {
    try {
      if (nextStatus === StocktakingStatus.APPLIED) {
        await apiClient(`/stocktakes/${record.id}/apply`, { method: 'POST' });
        toast.success('Inventory applied successfully');
      }
      // If other statuses supported via simple PUT update?
      // The mock Logic was simple update. Real API only has specific endpoints like approve/apply.
      // Submit (Open -> Pending) might be a simple update or specific endpoint.
      // Backend: PUT /:id updates data. 
      // Need endpoint for status transition if not strictly Approve/Apply.
      // The backend `updateSchema` allows updating items/date etc.
      // But status transition logic is usually specific.
      // Looking at routes: 
      // POST /:id/approve -> Approved
      // POST /:id/apply -> Applied
      // How to 'Submit' (Open -> Pending)? 
      // Maybe PUT update status directly if role allows? 
      // Backend controller usually handles status transition via specific action or check. 
      // If no explicit 'submit' endpoint, maybe just edit?
      // Let's assume for now we only have Approve and Apply actions exposed via API.
      // Wait, `StocktakingStatus` has OPEN, PENDING, APPROVED, APPLIED.
      // If I am Staff, I create (OPEN). Then I want to SUBMIT (PENDING).
      // If backend doesn't support explicit 'submit', maybe it's auto or via update.
      // Let's assume approval is the main gate. 

      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Action failed');
    }
  };

  const requestTransition = (record, nextStatus) => {
    if (nextStatus === StocktakingStatus.APPROVED) {
      setApproval({
        open: true,
        record,
        minutes: record.minutes ?? "",
        attachments: (record.attachments ?? []).join(", ")
      });
      return;
    }
    if (nextStatus === StocktakingStatus.APPLIED) {
      setConfirm({ open: true, record, status: nextStatus });
      return;
    }
    // For Submit (Pending), we create a simplified logic or if 'pending' is just a state
    // Let's skip Submit button action if no API for it, or use generic Update if allowed.
    // Real backend usually enforces flow.
    handleTransition(record, nextStatus);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approval.record) return;

    const payload = {
      minutes: approval.minutes,
      attachments: approval.attachments.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      await apiClient(`/stocktakes/${approval.record.id}/approve`, {
        method: 'POST',
        body: payload
      });
      toast.success('Approved');
      setApproval({ open: false, record: null, minutes: "", attachments: "" });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Approval failed');
    }
  };

  const addLine = () =>
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...emptyLine }]
    }));

  const removeLine = (index) =>
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));

  const updateLine = (index, changes) =>
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, idx) => (idx === index ? { ...line, ...changes } : line))
    }));

  const linesTotal = form.lines.reduce((sum, line) => sum + line.actualQuantity, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('stocktaking.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare recorded versus actual stock and create adjustment slips.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t('stocktaking.create')}
        </button>
      </div>

      <DataTable
        data={stocktakingList}
        isLoading={loading}
        columns={[
          { key: 'code', header: 'Mã' },
          { key: 'date', header: t('deliveries.date'), render: (value) => formatDate(value) },
          { key: 'status', header: t('app.status'), render: (value) => <StatusBadge status={value} /> },
          { key: 'approvedBy', header: t('stocktaking.approvedBy'), render: (value) => value ?? '-' },
          {
            key: 'items',
            header: 'Items',
            render: (value) => value?.length || 0,
          },
          {
            key: 'actions',
            header: t('app.actions'),
            sortable: false,
            render: (_, row) => (
              <div className="flex items-center gap-2">
                {stocktakingActions(row).map((action) => (
                  <RoleGuard key={action.status} roles={action.roles}>
                    <button
                      type="button"
                      onClick={() => requestTransition(row, action.status)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                    >
                      {action.label}
                    </button>
                  </RoleGuard>
                ))}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('stocktaking.create')}
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
              form="stocktaking-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form id="stocktaking-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã phiếu (Tự động)"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="ST-..."
            />
            <DatePicker
              label={t('deliveries.date')}
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-3">
            {form.lines.map((line, index) => {
              const recorded = inventoryMap.get(`${line.productId}-${line.locationId}`) ?? 0;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select
                      label="Product"
                      value={line.productId}
                      onChange={(event) => updateLine(index, { productId: event.target.value })}
                      options={productOptions}
                      placeholder="Select product"
                      required
                    />
                    <Select
                      label="Location"
                      value={line.locationId}
                      onChange={(event) => updateLine(index, { locationId: event.target.value })}
                      options={locationOptions}
                      placeholder="Select location"
                      required
                    />
                    <NumberInput label="Recorded (System)" value={recorded} readOnly />
                    <NumberInput
                      label="Actual (Counted)"
                      min={0}
                      value={line.actualQuantity}
                      onChange={(event) =>
                        updateLine(index, { actualQuantity: Number(event.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-500">
                    Diff: {line.productId && line.locationId ? line.actualQuantity - recorded : 0}
                  </div>

                  {form.lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="mt-2 text-xs text-rose-500"
                    >
                      Remove line
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            Total counted quantity: {linesTotal}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Apply stock"
        message="This will overwrite inventory quantities with the actual counts. Continue?"
        onCancel={() => setConfirm({ open: false, record: null, status: null })}
        onConfirm={() => {
          if (confirm.record && confirm.status) {
            handleTransition(confirm.record, confirm.status);
          }
          setConfirm({ open: false, record: null, status: null });
        }}
      />

      <Modal
        open={approval.open}
        onClose={() => setApproval({ open: false, record: null, minutes: "", attachments: "" })}
        title={t('stocktaking.approve')}
        actions={
          <>
            <button
              type="button"
              onClick={() => setApproval({ open: false, record: null, minutes: "", attachments: "" })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('app.cancel')}
            </button>
            <button
              type="submit"
              form="stocktake-approval-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t('app.save')}
            </button>
          </>
        }
      >
        <form
          id="stocktake-approval-form"
          className="space-y-4"
          onSubmit={handleApprove}
        >
          <Input
            label={t('stocktaking.minutes')}
            value={approval.minutes}
            onChange={(event) => setApproval((prev) => ({ ...prev, minutes: event.target.value }))}
            placeholder={t('stocktaking.minutesPlaceholder')}
          />
          <Input
            label={t('stocktaking.attachments')}
            value={approval.attachments}
            onChange={(event) => setApproval((prev) => ({ ...prev, attachments: event.target.value }))}
            placeholder={t('stocktaking.attachmentsPlaceholder')}
          />
        </form>
      </Modal>
    </div>
  );
}

function stocktakingActions(record) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];
  // Assuming Backend supports simplified flow for now
  switch (record.status) {
    case StocktakingStatus.OPEN:
      // If no Submit endpoint, maybe just show Wait for Manager (or edit)
      return [];
    case StocktakingStatus.PENDING_APPROVAL:
      return [{ status: StocktakingStatus.APPROVED, label: 'Approve', roles: managerRoles }];
    case StocktakingStatus.APPROVED:
      return [{ status: StocktakingStatus.APPLIED, label: 'Apply inventory', roles: managerRoles }];
    default:
      return [];
  }
}
