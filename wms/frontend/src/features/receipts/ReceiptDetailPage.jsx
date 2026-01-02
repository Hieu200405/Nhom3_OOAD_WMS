import { useMemo, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { InfoCard } from '../../components/InfoCard.jsx';

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

        if (res.data.supplierId) {
          try {
            const supRes = await apiClient(`/partners?type=supplier&id=${res.data.supplierId}`);
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

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

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
          {t('app.back')}
        </button>
        <StatusBadge status={receipt.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard title="Receipt ID" value={receipt.code || receipt.id} />
        <InfoCard title={t('receipts.date')} value={formatDate(receipt.date)} />
        <InfoCard title={t('receipts.supplier')} value={supplierName} />
        <InfoCard title={t('app.total')} value={formatCurrency(receipt.total)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 space-y-4">
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
        {receipt.notes ? <InfoCard title={t('app.notes')} value={receipt.notes} /> : null}
      </div>
    </div>
  );
}
