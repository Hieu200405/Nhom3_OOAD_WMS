import { useMemo, useState } from "react";
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
import { useMockData } from "../../services/mockDataContext.jsx";
import { StocktakingStatus, Roles } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";
import { generateId } from "../../utils/id.js";
import { RoleGuard } from "../../components/RoleGuard.jsx";

const emptyLine = {
  productId: "",
  actualQuantity: 0,
  reason: ""
};

export function StocktakingPage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, record: null, status: null });
  const [form, setForm] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 10),
    lines: [{ ...emptyLine, id: generateId("line") }]
  });

  const productOptions = useMemo(() =>
    data.products.map((product) => ({
      value: product.id,
      label: `${product.sku} - ${product.name}`
    })),
  [data.products]);

  const inventoryMap = useMemo(() => {
    const map = new Map();
    data.inventory.forEach((item) => map.set(item.productId, item.quantity));
    return map;
  }, [data.inventory]);

  const createAdjustments = (lines) =>
    lines
      .filter((line) => line.productId)
      .map((line) => {
        const recorded = inventoryMap.get(line.productId) ?? 0;
        const difference = line.actualQuantity - recorded;
        return {
          id: generateId("adj"),
          productId: line.productId,
          recordedQuantity: recorded,
          actualQuantity: line.actualQuantity,
          difference,
          reason: line.reason,
          status: difference === 0 ? "Balanced" : difference > 0 ? "Surplus" : "Deficit"
        };
      });

  const handleSubmit = (event) => {
    event.preventDefault();
    const adjustments = createAdjustments(form.lines);
    if (adjustments.length === 0) return;

    actions.createRecord("stocktaking", {
      id: generateId("st"),
      name: form.name,
      date: form.date,
      status: StocktakingStatus.OPEN,
      adjustments
    });
    setOpen(false);
    setForm({
      name: "",
      date: new Date().toISOString().slice(0, 10),
      lines: [{ ...emptyLine, id: generateId("line") }]
    });
  };

  const updateInventoryFromAdjustments = (adjustments) => {
    adjustments.forEach((adjustment) => {
      const current = data.inventory.find((item) => item.productId === adjustment.productId);
      if (current) {
        actions.updateRecord("inventory", current.id, {
          quantity: adjustment.actualQuantity,
          status: adjustment.actualQuantity === 0 ? "Out of Stock" : "Available"
        });
      } else {
        actions.createRecord("inventory", {
          id: generateId("inv"),
          productId: adjustment.productId,
          quantity: adjustment.actualQuantity,
          status: adjustment.actualQuantity === 0 ? "Out of Stock" : "Available"
        });
      }
    });
  };

  const handleTransition = (record, nextStatus) => {
    if (nextStatus === StocktakingStatus.APPLIED && record.status !== StocktakingStatus.APPROVED) {
      toast.error("Manager approval is required before applying inventory.");
      return;
    }
    actions.updateRecord("stocktaking", record.id, { status: nextStatus });
    if (nextStatus === StocktakingStatus.APPLIED) {
      updateInventoryFromAdjustments(record.adjustments);
      toast.success("Inventory updated from stocktake.");
    }
  };

  const requestTransition = (record, nextStatus) => {
    if (nextStatus === StocktakingStatus.APPLIED) {
      setConfirm({ open: true, record, status: nextStatus });
      return;
    }
    handleTransition(record, nextStatus);
  };

  const addLine = () =>
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...emptyLine, id: generateId("line") }]
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
        data={data.stocktaking}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'date', header: t('deliveries.date'), render: (value) => formatDate(value) },
          { key: 'status', header: t('app.status'), render: (value) => <StatusBadge status={value} /> },
          {
            key: 'adjustments',
            header: t('stocktaking.adjustments'),
            render: (value) => value.length,
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
          <Input
            label="Stocktake name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <DatePicker
            label={t('deliveries.date')}
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <div className="space-y-3">
            {form.lines.map((line, index) => {
              const recorded = inventoryMap.get(line.productId) ?? 0;
              return (
                <div
                  key={line.id ?? index}
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
                    <NumberInput label="Recorded" value={recorded} readOnly />
                    <NumberInput
                      label="Actual"
                      min={0}
                      value={line.actualQuantity}
                      onChange={(event) =>
                        updateLine(index, { actualQuantity: Number(event.target.value) })
                      }
                      required
                    />
                    <NumberInput
                      label={t('stocktaking.difference')}
                      value={line.productId ? line.actualQuantity - recorded : 0}
                      readOnly
                    />
                  </div>
                  <Input
                    label="Reason"
                    value={line.reason}
                    onChange={(event) => updateLine(index, { reason: event.target.value })}
                  />
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
              Add product
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
    </div>
  );
}

function stocktakingActions(record) {
  const managerRoles = [Roles.ADMIN, Roles.MANAGER];
  const staffRoles = [Roles.ADMIN, Roles.MANAGER, Roles.STAFF];

  switch (record.status) {
    case StocktakingStatus.OPEN:
      return [{ status: StocktakingStatus.PENDING_APPROVAL, label: 'Submit', roles: staffRoles }];
    case StocktakingStatus.PENDING_APPROVAL:
      return [{ status: StocktakingStatus.APPROVED, label: 'Approve', roles: managerRoles }];
    case StocktakingStatus.APPROVED:
      return [{ status: StocktakingStatus.APPLIED, label: 'Apply inventory', roles: managerRoles }];
    default:
      return [];
  }
}
