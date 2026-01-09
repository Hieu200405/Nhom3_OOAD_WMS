import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { apiClient } from '../../services/apiClient.js';
import { formatNumber } from '../../utils/formatters.js';
import toast from 'react-hot-toast';
import { FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { ReplenishmentModal } from './ReplenishmentModal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

export function InventoryPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Replenishment State
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

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

  const handleExport = async () => {
    try {
      const blob = await apiClient('/inventory/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory-Report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      toast.error('Failed to export inventory');
    }
  };

  const handleCheckReplenishment = async () => {
    const toastId = toast.loading('Đang kiểm tra tồn kho...');
    try {
      const res = await apiClient('/inventory/replenishment/check');
      setSuggestions(res.data || []);
      setReplenishModalOpen(true);
      toast.dismiss(toastId);
      if (res.data?.length === 0) {
        toast.success('Hệ thống đủ hàng, không cần bổ sung.');
      }
    } catch (err) {
      toast.error('Lỗi kiểm tra: ' + err.message, { id: toastId });
    }
  };

  const handleExecReplenishment = async (selectedSuggestions) => {
    try {
      await apiClient('/inventory/replenishment/exec', {
        method: 'POST',
        body: { suggestions: selectedSuggestions }
      });
      toast.success(`Đã tạo ${selectedSuggestions.length} phiếu nhập kho nháp thành công!`);
      // Optionally refresh inventory if anything changed immediately? 
      // Receipts are drafts so inventory wont change yet.
    } catch (err) {
      toast.error('Lỗi tạo phiếu: ' + err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        title={t('navigation.inventory')}
        description="Theo dõi chi tiết mức độ tồn kho và vị trí lưu trữ hàng hóa."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              className="input !py-2 !h-11 !rounded-2xl !bg-slate-100/50 dark:!bg-slate-900/50 min-w-[150px]"
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCheckReplenishment}
              className="btn btn-primary shadow-indigo-200 !h-11 !rounded-2xl"
            >
              <RefreshCcw className="h-4 w-4" />
              Kiểm tra thông minh
            </button>
            <button
              onClick={handleExport}
              className="btn border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 !h-11 !rounded-2xl"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất Excel
            </button>
          </div>
        }
      />

      <DataTable
        data={filteredInventory}
        loading={loading}
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

      <ReplenishmentModal
        open={replenishModalOpen}
        onClose={() => setReplenishModalOpen(false)}
        suggestions={suggestions}
        onConfirm={handleExecReplenishment}
      />
    </div>
  );
}
