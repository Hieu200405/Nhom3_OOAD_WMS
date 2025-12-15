import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data } = useMockData();

  const receipt = useMemo(
    () => data.receipts.find((item) => item.id === id),
    [data.receipts, id],
  );

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

  const supplier = data.suppliers.find((item) => item.id === receipt.supplierId);

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
        <InfoCard title="Receipt ID" value={receipt.id} />
        <InfoCard title={t('receipts.date')} value={formatDate(receipt.date)} />
        <InfoCard title={t('receipts.supplier')} value={supplier?.name ?? receipt.supplierId} />
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
              {receipt.lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{line.sku}</td>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">{line.name}</td>
                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                    {line.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-slate-600 dark:text-slate-300">
                    {formatCurrency(line.price)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency(line.quantity * line.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {receipt.hasShortage ? (
          <InfoCard title={t('receipts.shortageNote')} value={receipt.shortageNote || '--'} />
        ) : null}
        {receipt.damageNote ? <InfoCard title={t('receipts.damageNote')} value={receipt.damageNote} /> : null}
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
