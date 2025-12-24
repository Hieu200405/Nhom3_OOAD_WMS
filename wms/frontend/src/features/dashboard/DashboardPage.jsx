import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Truck,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useMockData } from '../../services/mockDataContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatters.js';
import { useAuth } from '../../app/auth-context.jsx';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: mockData } = useMockData();
  const [realData, setRealData] = useState(null);
  const [loading, setLoading] = useState(true);

  const useMock = import.meta.env.VITE_USE_MOCK ?? 'true';

  useEffect(() => {
    if (useMock === 'true') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await apiClient('/reports/overview');
        setRealData(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useMock]);

  // Combine Mock vs Real Data Logic
  const metrics = useMemo(() => {
    if (realData) {
      return {
        totalInventoryValue: realData.totalInventoryValue,
        pendingReceipts: realData.counts.pendingReceipts,
        pendingDeliveries: realData.counts.pendingDeliveries,
        openIncidents: realData.counts.openIncidents,
        revenueChart: realData.revenueChart,
        inventoryStatus: realData.inventoryStatus
      };
    }

    // Fallback to Mock Calculation
    const totalInventoryValue = mockData.inventory.reduce((sum, item) => {
      const product = mockData.products.find((prod) => prod.id === item.productId);
      return sum + item.quantity * (product?.priceIn || 0);
    }, 0);

    const pendingReceipts = mockData.receipts.filter(r => r.status !== 'Completed').length;
    const pendingDeliveries = mockData.deliveries.filter(d => d.status !== 'Completed').length;

    // Mock Chart Data
    const revenueChart = [
      { name: '2024-05', income: 45000000, expense: 32000000 },
      { name: '2024-06', income: 52000000, expense: 35000000 },
      { name: '2024-07', income: 48000000, expense: 40000000 },
      { name: '2024-08', income: 61000000, expense: 45000000 },
      { name: '2024-09', income: 55000000, expense: 38000000 },
      { name: '2024-10', income: 67000000, expense: 42000000 },
    ];

    const inventoryStatus = [
      { name: 'Available', value: mockData.inventory.filter(i => i.status !== 'outOfStock' && i.status !== 'low').length },
      { name: 'Low Stock', value: mockData.inventory.filter(i => i.status === 'low' || (i.quantity < 10 && i.quantity > 0)).length },
      { name: 'Out of Stock', value: mockData.inventory.filter(i => i.quantity === 0).length },
    ];

    return {
      totalInventoryValue,
      pendingReceipts,
      pendingDeliveries,
      openIncidents: mockData.incidents.length,
      revenueChart,
      inventoryStatus
    };
  }, [mockData, realData, useMock]);

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t('dashboard.welcome', { name: user?.fullName ?? 'User' })}
        </h1>
        <p className="text-sm text-slate-500">Tổng quan tình hình hoạt động kho hàng</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Boxes}
          label="Giá trị tồn kho"
          value={formatCurrency(metrics.totalInventoryValue)}
          trend="+5.2%"
          trendUp={true}
          color="indigo"
        />
        <MetricCard
          icon={ClipboardList}
          label="Phiếu nhập chờ xử lý"
          value={metrics.pendingReceipts}
          trend="-2"
          trendUp={true} // Less is better? Depend on context. Green usually good.
          color="blue"
        />
        <MetricCard
          icon={Truck}
          label="Phiếu xuất đang chờ"
          value={metrics.pendingDeliveries}
          trend="+3"
          trendUp={false} // More waiting is bad
          color="orange"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Sự cố chưa giải quyết"
          value={metrics.openIncidents}
          trend="0"
          trendUp={true}
          color="red"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Doanh thu & Chi phí (6 tháng)
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="income" name="Doanh thu" stroke="#818cf8" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Chi phí" stroke="#f87171" fillOpacity={1} fill="url(#colorExpense)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status Pie Chart */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Trạng thái tồn kho
            </h2>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.inventoryStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.inventoryStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, trendUp, color }) {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
        </div>
        <div className={`rounded-xl p-2 ${colorStyles[color] || colorStyles.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {trend}
        </span>
        <span className="text-xs text-slate-500">so với tháng trước</span>
      </div>
    </div>
  );
}