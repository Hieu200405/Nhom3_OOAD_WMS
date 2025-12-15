import { PlusCircle, Trash2 } from 'lucide-react';
import { Select } from './forms/Select.jsx';
import { NumberInput } from './forms/NumberInput.jsx';

export function LineItemsEditor({
  products = [],
  value = [],
  onChange,
  showPrice = true,
  minRows = 1,
}) {
  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.sku} - ${product.name}`,
  }));

  const updateLine = (index, changes) => {
    const next = value.map((line, idx) => (idx === index ? { ...line, ...changes } : line));
    onChange?.(next);
  };

  const addLine = () => {
    onChange?.([
      ...value,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: '',
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const removeLine = (index) => {
    if (value.length <= minRows) return;
    const next = value.filter((_, idx) => idx !== index);
    onChange?.(next);
  };

  return (
    <div className="space-y-3">
      {value.map((line, index) => (
        <div
          key={line.id ?? index}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
        >
          <div className="flex items-start gap-3">
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              <Select
                label="Product"
                value={line.productId}
                onChange={(event) =>
                  updateLine(index, {
                    productId: event.target.value,
                  })
                }
                options={productOptions}
                placeholder="Select product"
                required
              />
              <NumberInput
                label="Quantity"
                min={1}
                value={line.quantity}
                onChange={(event) =>
                  updateLine(index, {
                    quantity: Number(event.target.value),
                  })
                }
                required
              />
              {showPrice ? (
                <NumberInput
                  label="Unit price"
                  min={0}
                  value={line.price}
                  onChange={(event) =>
                    updateLine(index, {
                      price: Number(event.target.value),
                    })
                  }
                  required
                />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeLine(index)}
              className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-rose-500 transition hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-500/20"
              disabled={value.length <= minRows}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addLine}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <PlusCircle className="h-4 w-4" />
        Add line item
      </button>
    </div>
  );
}
