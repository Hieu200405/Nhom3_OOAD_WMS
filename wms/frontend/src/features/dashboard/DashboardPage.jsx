import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Boxes, ClipboardList, Truck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { apiClient } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatters.js';
import { useAuth } from '../../app/auth-context.jsx';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient('/reports/overview');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      // If fails, we display zeros or separate error state, 
      // but let's just proceed with null safe
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = useMemo(() => {
    if (!data) return {
      totalInventoryValue: 0,
      pendingReceipts: 0,
      pendingDeliveries: 0,
      openIncidents: 0,
      revenueChart: [],
      inventoryStatus: []
    };
    return {
      totalInventoryValue: data.totalInventoryValue || 0,
      pendingReceipts: data.counts?.pendingReceipts || 0,
      pendingDeliveries: data.counts?.pendingDeliveries || 0,
      openIncidents: data.counts?.openIncidents || 0,
      revenueChart: data.revenueChart || [],
      inventoryStatus: data.inventoryStatus || []
    };
  }, [data]);

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
          trend="RealTime"
          trendUp={true}
          color="indigo"
        />
        <MetricCard
          icon={ClipboardList}
          label="Phiếu nhập chờ xử lý"
          value={metrics.pendingReceipts}
          trend=""
          trendUp={true}
          color="blue"
        />
        <MetricCard
          icon={Truck}
          label="Phiếu xuất đang chờ"
          value={metrics.pendingDeliveries}
          trend=""
          trendUp={false}
          color="orange"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Sự cố chưa giải quyết"
          value={metrics.openIncidents}
          trend=""
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
        {/* Trend display if needed, currently just removed mock trend */}
      </div>
    </div>
  );
}