import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Boxes, ClipboardList, Truck } from 'lucide-react';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { ReceiptStatus, DeliveryStatus } from '../../utils/constants.js';
import { useAuth } from '../../app/auth-context.jsx';

export function DashboardPage() {
  const { t } = useTranslation();
  const { data } = useMockData();
  const { user } = useAuth();

  const metrics = useMemo(() => {
    const totalInventoryValue = data.inventory.reduce((sum, item) => {
      const product = data.products.find((prod) => prod.id === item.productId);
      if (!product) return sum;
      return sum + item.quantity * product.priceIn;
    }, 0);

    const pendingReceipts = data.receipts.filter(
      (receipt) => receipt.status !== ReceiptStatus.COMPLETED,
    ).length;
    const pendingDeliveries = data.deliveries.filter(
      (delivery) => delivery.status !== DeliveryStatus.COMPLETED,
    ).length;
    const openIncidents = data.incidents.length;

    const recentActivities = [
      ...data.receipts.map((item) => ({
        type: 'Receipt',
        id: item.id,
        status: item.status,
        date: item.date,
        total: item.total,
      })),
      ...data.deliveries.map((item) => ({
        type: 'Delivery',
        id: item.id,
        status: item.status,
        date: item.date,
        total: item.total,
      })),
      ...data.incidents.map((item) => ({
        type: 'Incident',
        id: item.id,
        status: item.action,
        date: new Date().toISOString(),
        total: 0,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    return {
      totalInventoryValue,
      pendingReceipts,
      pendingDeliveries,
      openIncidents,
      recentActivities,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t('dashboard.welcome', { name: user?.fullName ?? 'User' })}
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Boxes}
          label={t('dashboard.cards.inventoryValue')}
          value={formatCurrency(metrics.totalInventoryValue)}
        />
        <MetricCard
          icon={ClipboardList}
          label={t('dashboard.cards.pendingReceipts')}
          value={metrics.pendingReceipts}
        />
        <MetricCard
          icon={Truck}
          label={t('dashboard.cards.pendingDeliveries')}
          value={metrics.pendingDeliveries}
        />
        <MetricCard
          icon={BarChart3}
          label={t('dashboard.cards.incidents')}
          value={metrics.openIncidents}
        />
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('dashboard.recentActivities')}
          </h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {metrics.recentActivities.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between py-3 text-sm text-slate-600 dark:text-slate-300"
            >
              <div>
                <p className="font-medium">
                  {item.type} - {item.id}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {`${formatDate(item.date)} - ${item.status}`}
                </p>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                {item.total ? formatCurrency(item.total) : '--'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  const IconComponent = icon;
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="rounded-full bg-indigo-600/10 p-3 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
          <IconComponent className="h-5 w-5" />
        </div>
        <span className="text-xs font-semibold uppercase text-slate-400">
          KPI
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}