import { useMemo, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient(`/deliveries/${id}`);
        setDelivery(res.data);

        if (res.data.customerId) {
          try {
            const custRes = await apiClient(`/partners?type=customer&id=${res.data.customerId}`);
            if (Array.isArray(custRes.data)) {
              setCustomer(custRes.data.find(c => c.id === res.data.customerId));
            }
          } catch (e) { console.error('Failed to load customer', e); }
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

  if (!delivery) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <p className="text-sm text-rose-500">Delivery not found.</p>
      </div>
    );
  }

  const customerName = customer?.name ?? delivery.customerName ?? delivery.customerId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard title="Delivery ID" value={delivery.code || delivery.id} />
        <InfoCard title={t('deliveries.date')} value={formatDate(delivery.date)} />
        <InfoCard title="Ngày giao dự kiến" value={delivery.expectedDate ? formatDate(delivery.expectedDate) : '-'} />
        <InfoCard title={t('deliveries.customer')} value={customerName} />
        <InfoCard title={t('app.total')} value={formatCurrency(delivery.total)} />
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('deliveries.deliveryNote')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{delivery.notes || delivery.note || '—'}</p>
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
                <th className="px-4 py-2 text-right">{t('products.priceOut')}</th>
                <th className="px-4 py-2 text-right">{t('app.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {delivery.lines.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{line.sku || '-'}</td>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{line.name || line.productName || 'Product'}</td>
                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                    {line.quantity || line.qty}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                    {formatCurrency(line.price || line.priceOut)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency((line.quantity || line.qty) * (line.price || line.priceOut))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
