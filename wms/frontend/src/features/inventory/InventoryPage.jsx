import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatNumber } from '../../utils/formatters.js';

export function InventoryPage() {
  const { t } = useTranslation();
  const { data } = useMockData();
  const [categoryFilter, setCategoryFilter] = useState('');

  const productMap = useMemo(() => {
    const map = new Map();
    data.products.forEach((product) => map.set(product.id, product));
    return map;
  }, [data.products]);

  const locationMap = useMemo(() => {
    const map = new Map();
    data.warehouseLocations.forEach((node) => map.set(node.id, node));
    return map;
  }, [data.warehouseLocations]);

  const inventory = useMemo(() => {
    return data.inventory.filter((item) => {
      if (!categoryFilter) return true;
      const product = productMap.get(item.productId);
      return product?.categoryId === categoryFilter;
    });
  }, [data.inventory, categoryFilter, productMap]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('navigation.inventory')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track stock levels by category and location.
          </p>
        </div>
        <select
          value={categoryFilter}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">All categories</option>
          {data.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={inventory}
        columns={[
          {
            key: 'productId',
            header: 'Product',
            render: (value) => {
              const product = productMap.get(value);
              if (!product) return value;
              return `${product.sku} - ${product.name}`;
            },
          },
          {
            key: 'quantity',
            header: 'Quantity',
            render: (value) => formatNumber(value),
          },
          {
            key: 'status',
            header: 'Status',
            render: (value) => <StatusBadge status={value} />,
          },
          {
            key: 'locationId',
            header: 'Location',
            render: (value) => locationMap.get(value)?.code ?? 'N/A',
          },
        ]}
      />
    </div>
  );
}
