import { useMemo, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js'; // Use apiClient
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
// import { AuditTrail } from '../../components/AuditTrail.jsx'; // Disabling mock audit trail

export function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [supplier, setSupplier] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient(`/receipts/${id}`);
        setReceipt(res.data);

        // Fetch supplier info if needed (or backend populates it?)
        // If backend populates `supplier` field as object, great. 
        // If just ID, fetch supplier.
        // Assuming backend might not populate, let's fetch carefully.
        if (res.data.supplierId) {
          try {
            // Assuming partners endpoint can fetch by ID or we list all. 
            // Currently mock partners handled list. 
            // Real API typically has /partners/:id. 
            // If not, we might need to filter list.
            // Let's assume we load details. 
            // Or simplified: display ID if name not available.
            const supRes = await apiClient(`/partners?type=supplier&id=${res.data.supplierId}`);
            // If query returns list:
            if (Array.isArray(supRes.data)) {
              setSupplier(supRes.data.find(s => s.id === res.data.supplierId));
            }
          } catch (e) { console.error('Failed to load supplier', e); }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;

  if (!receipt) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('app.back')}
        </button>
        <p className="text-sm text-rose-500">Receipt not found.</p>
      </div>
    );
  }

  // Use populated name or fetched supplier or just ID
  const supplierName = supplier?.name ?? receipt.supplierName ?? receipt.supplierId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
        <StatusBadge status={receipt.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Receipt ID" value={receipt.code || receipt.id} />
        <InfoCard title={t('receipts.date')} value={formatDate(receipt.date)} />
        <InfoCard title={t('receipts.supplier')} value={supplierName} />
        <InfoCard title={t('app.total')} value={formatCurrency(receipt.total)} />
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('app.lineItems')}
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/40 dark:text-slate-300">
              <tr>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">{t('products.name')}</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">{t('products.priceIn')}</th>
                <th className="px-4 py-2 text-right">{t('app.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {receipt.lines.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{line.sku || '-'}</td>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{line.name || line.productName || 'Product'}</td>
                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                    {line.quantity || line.qty}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                    {formatCurrency(line.price || line.priceIn)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency((line.quantity || line.qty) * (line.price || line.priceIn))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Mapping backend notes field for now */}
        {receipt.notes ? <InfoCard title={t('app.notes')} value={receipt.notes} /> : null}
      </div>

      {/* AuditTrail mock removed. Real backend would provide logs if implemented. */}
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
