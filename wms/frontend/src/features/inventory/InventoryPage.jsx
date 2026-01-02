import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { apiClient } from '../../services/apiClient.js';
import { formatNumber } from '../../utils/formatters.js';
import toast from 'react-hot-toast';

export function InventoryPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invRes, prodRes, locRes, catRes] = await Promise.all([
          apiClient('/inventory'),
          apiClient('/products'),
          apiClient('/warehouse'),
          apiClient('/categories')
        ]);
        setInventory(invRes.data || []);
        setProducts(prodRes.data || []);
        setLocations(locRes.data || []);
        setCategories(catRes.data || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  const locationMap = useMemo(() => {
    const map = new Map();
    locations.forEach((node) => map.set(node.id, node));
    return map;
  }, [locations]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (!categoryFilter) return true;
      const product = productMap.get(item.productId);
      return product?.categoryId === categoryFilter;
    });
  }, [inventory, categoryFilter, productMap]);

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
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={filteredInventory}
        isLoading={loading}
        columns={[
          {
            key: 'productId',
            header: 'Product',
            render: (value) => {
              const product = productMap.get(value);
              if (!product) return value;
              return (
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{product.name}</div>
                  <div className="text-xs text-slate-500">{product.sku}</div>
                </div>
              );
            },
          },
          {
            key: 'quantity',
            header: 'Quantity',
            headerAlign: 'right',
            render: (value) => <div className="text-right font-medium">{formatNumber(value)}</div>,
          },
          {
            key: 'batch',
            header: 'Batch',
            render: (value) => value || '—',
          },
          {
            key: 'expDate',
            header: 'Expiry',
            render: (value) => value ? new Date(value).toLocaleDateString() : '—',
          },
          {
            key: 'status',
            header: 'Status',
            render: (value) => <StatusBadge status={value} />,
          },
          {
            key: 'locationId',
            header: 'Location',
            render: (value) => {
              const loc = locationMap.get(value);
              return loc ? `${loc.name} (${loc.code})` : 'N/A';
            },
          },
        ]}
      />
    </div>
  );
}
