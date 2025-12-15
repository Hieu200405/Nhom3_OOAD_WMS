import { useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMockData } from "../../services/mockDataContext.jsx";
import { Modal } from "../../components/Modal.jsx";
import { Input } from "../../components/forms/Input.jsx";
import { Select } from "../../components/forms/Select.jsx";
import { BarcodeInput } from "../../components/forms/BarcodeInput.jsx";
import { Tag } from "../../components/Tag.jsx";
import { generateId } from "../../utils/id.js";

const LEVELS = [
  { value: "Warehouse", label: "Warehouse" },
  { value: "Zone", label: "Zone" },
  { value: "Row", label: "Row" },
  { value: "Rack", label: "Rack" },
  { value: "Bin", label: "Bin" }
];

const emptyNode = {
  name: "",
  type: "Warehouse",
  code: "",
  barcode: "",
  parentId: null
};

export function WarehouseStructurePage() {
  const { t } = useTranslation();
  const { data, actions } = useMockData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyNode);
  const [highlightId, setHighlightId] = useState(null);

  const tree = useMemo(() => {
    const map = new Map();
    data.warehouseLocations.forEach((node) => map.set(node.id, { ...node, children: [] }));
    const roots = [];
    map.forEach((node) => {
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [data.warehouseLocations]);

  const openCreateModal = (parent) => {
    setEditing(null);
    setForm({
      ...emptyNode,
      parentId: parent?.id ?? null,
      type: parent ? nextLevel(parent.type) : "Warehouse"
    });
    setOpen(true);
  };

  const openEditModal = (node) => {
    setEditing(node);
    setForm(node);
    setOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = { ...form };
    if (!payload.code) {
      payload.code = generateCode(payload);
    }
    if (editing) {
      actions.updateRecord("warehouseLocations", editing.id, payload);
    } else {
      actions.createRecord("warehouseLocations", { ...payload, id: generateId("loc") });
    }
    setOpen(false);
  };

  const handleBarcodeScan = (value) => {
    const node = data.warehouseLocations.find((item) => item.barcode === value);
    if (node) {
      setHighlightId(node.id);
      setTimeout(() => setHighlightId(null), 2000);
    } else if (editing) {
      setForm((prev) => ({ ...prev, barcode: value }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("warehouse.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scan a barcode to jump to a location instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BarcodeInput label={t("warehouse.barcode")} onScan={handleBarcodeScan} />
          <button
            type="button"
            onClick={() => openCreateModal(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {t("warehouse.addNode")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tree.map((node) => (
          <WarehouseNodeCard
            key={node.id}
            node={node}
            onAddChild={openCreateModal}
            onEdit={openEditModal}
            highlightId={highlightId}
          />
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t("warehouse.editNode") : t("warehouse.addNode")}
        actions={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("app.cancel")}
            </button>
            <button
              type="submit"
              form="warehouse-form"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {t("app.save")}
            </button>
          </>
        }
      >
        <form id="warehouse-form" className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label={t("warehouse.type")}
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            options={LEVELS}
          />
          <Input
            label={t("warehouse.name")}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            label={t("warehouse.code")}
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            required
          />
          <Input
            label={t("warehouse.barcode")}
            value={form.barcode}
            onChange={(event) => setForm((prev) => ({ ...prev, barcode: event.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}

function WarehouseNodeCard({ node, onAddChild, onEdit, highlightId }) {
  return (
    <div
      className={`card space-y-4 ${highlightId === node.id ? "border-indigo-500 shadow-lg shadow-indigo-200" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <Tag label={node.type} />
          <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            {node.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {node.code} {node.barcode ? `| ${node.barcode}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {node.type !== "Bin" ? (
            <button
              type="button"
              onClick={() => onAddChild(node)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-300 text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {node.children.length > 0 ? (
        <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
          {node.children.map((child) => (
            <WarehouseNodeCard
              key={child.id}
              node={child}
              onAddChild={onAddChild}
              onEdit={onEdit}
              highlightId={highlightId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function nextLevel(type) {
  const index = LEVELS.findIndex((level) => level.value === type);
  return LEVELS[Math.min(index + 1, LEVELS.length - 1)].value;
}

function generateCode(form) {
  const prefix = form.type.slice(0, 2).toUpperCase();
  return `${prefix}-${Date.now().toString(36)}`;
}
