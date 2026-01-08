import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Search, User, FileText, Calendar } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatDateTime } from '../../utils/formatters.js';

export function AuditLogPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ page: 1, limit: 20, entity: '', query: '' });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/audit', { params: filter });
                setLogs(res.data || []);
                setTotal(res.pagination?.total || 0);
            } catch (error) {
                console.error('Failed to fetch audit logs', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [filter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <History className="h-6 w-6 text-indigo-500" />
                        Nhật ký hoạt động (Audit Logs)
                    </h1>
                    <p className="text-sm text-slate-500">Theo dõi toàn bộ lịch sử thay đổi của hệ thống</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Thực thể (Entity)</label>
                    <select
                        className="input w-full"
                        value={filter.entity}
                        onChange={(e) => setFilter({ ...filter, entity: e.target.value, page: 1 })}
                    >
                        <option value="">Tất cả thực thể</option>
                        <option value="Product">Sản phẩm</option>
                        <option value="Inventory">Kho hàng</option>
                        <option value="Receipt">Nhập kho</option>
                        <option value="Delivery">Xuất kho</option>
                        <option value="Adjustment">Điều chỉnh</option>
                        <option value="Stocktake">Kiểm kê</option>
                        <option value="Return">Trả hàng</option>
                        <option value="Setting">Cài đặt</option>
                        <option value="User">Người dùng</option>
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Hành động (Action)</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            className="input pl-10 w-full"
                            placeholder="Tìm theo hành động..."
                            value={filter.query}
                            onChange={(e) => setFilter({ ...filter, query: e.target.value, page: 1 })}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <DataTable
                data={logs}
                loading={loading}
                columns={[
                    {
                        key: 'createdAt',
                        header: 'Thời gian',
                        render: (value) => (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {formatDateTime(value)}
                            </div>
                        )
                    },
                    {
                        key: 'actor',
                        header: 'Người thực hiện',
                        render: (value) => (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="text-sm font-medium">{value?.username || 'System'}</div>
                            </div>
                        )
                    },
                    {
                        key: 'action',
                        header: 'Hành động',
                        render: (value) => (
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                {value}
                            </span>
                        )
                    },
                    {
                        key: 'entity',
                        header: 'Thực thể',
                        render: (_, row) => (
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.entity}</span>
                                <span className="text-xs text-slate-500 font-mono truncate max-w-[120px]">{row.entityId}</span>
                            </div>
                        )
                    },
                    {
                        key: 'payload',
                        header: 'Chi tiết',
                        render: (value) => value && (
                            <pre className="text-[10px] bg-slate-50 dark:bg-slate-900 p-2 rounded-xl max-w-[300px] overflow-auto max-h-[60px] cursor-help hover:max-h-[200px] transition-all scrollbar-hide border border-slate-100 dark:border-slate-800">
                                {JSON.stringify(value, null, 2)}
                            </pre>
                        )
                    }
                ]}
            />

            {/* Pagination Controls */}
            <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Hiển thị {logs.length} / {total} kết quả
                </span>
                <div className="flex gap-2">
                    <button
                        className="btn-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest"
                        disabled={filter.page === 1}
                        onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                    >
                        Trước
                    </button>
                    <button
                        className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                        disabled={logs.length < filter.limit}
                    >
                        Sau
                    </button>
                </div>
            </div>

        </div>
    );
}
