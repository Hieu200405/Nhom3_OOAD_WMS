import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, Calendar, Filter, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatDateTime } from '../../utils/formatters.js';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { FilterDrawer } from '../../components/FilterDrawer.jsx';
import { Input } from '../../components/forms/Input.jsx'; // Assuming this exists
import { Select } from '../../components/forms/Select.jsx'; // Assuming this exists

export function AuditLogPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Main filter state
    const [filter, setFilter] = useState({
        page: 1,
        limit: 20,
        entity: '',
        query: '',
        startDate: '',
        endDate: ''
    });
    const [total, setTotal] = useState(0);

    // Drawer state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempFilter, setTempFilter] = useState({ entity: '', startDate: '', endDate: '' });

    // Sync temp state when drawer opens
    useEffect(() => {
        if (isFilterOpen) {
            setTempFilter({
                entity: filter.entity,
                startDate: filter.startDate || '',
                endDate: filter.endDate || ''
            });
        }
    }, [isFilterOpen, filter]);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Remove empty keys
                const params = Object.fromEntries(
                    Object.entries(filter).filter(([_, v]) => v != null && v !== '')
                );
                const res = await apiClient.get('/audit', { params });
                setLogs(res.data || []);
                setTotal(res.pagination?.total || 0);
            } catch (error) {
                console.error('Failed to fetch audit logs', error);
            } finally {
                setLoading(false);
            }
        };
        // Debounce query slightly
        const timeout = setTimeout(fetchLogs, 300);
        return () => clearTimeout(timeout);
    }, [filter]);

    const handleApplyFilters = () => {
        setFilter(prev => ({
            ...prev,
            ...tempFilter,
            page: 1
        }));
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setTempFilter({ entity: '', startDate: '', endDate: '' });
        setFilter(prev => ({
            ...prev,
            entity: '',
            startDate: '',
            endDate: '',
            page: 1
        }));
        setIsFilterOpen(false);
    };

    // Entity Options
    const entityOptions = [
        { value: '', label: 'Tất cả thực thể' },
        { value: 'Product', label: 'Sản phẩm' },
        { value: 'Inventory', label: 'Kho hàng' },
        { value: 'Receipt', label: 'Nhập kho' },
        { value: 'Delivery', label: 'Xuất kho' },
        { value: 'Adjustment', label: 'Điều chỉnh' },
        { value: 'Stocktake', label: 'Kiểm kê' },
        { value: 'Return', label: 'Trả hàng' },
        { value: 'Setting', label: 'Cài đặt' },
        { value: 'User', label: 'Người dùng' },
    ];

    const activeFilterCount = [filter.entity, filter.startDate, filter.endDate].filter(Boolean).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Nhật ký hoạt động"
                description="Theo dõi toàn bộ lịch sử thay đổi của hệ thống"
                actions={
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="btn btn-secondary shadow-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                        <Filter className="h-4 w-4 mr-2 text-indigo-500" />
                        Bộ lọc
                        {activeFilterCount > 0 && (
                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                }
            />

            {/* Quick Search Bar - Floating Style */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border-0 rounded-2xl text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 ring-1 ring-slate-200 dark:ring-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="Tìm kiếm nhanh theo hành động (VD: Create, Update) hoặc người dùng..."
                    value={filter.query}
                    onChange={(e) => setFilter({ ...filter, query: e.target.value, page: 1 })}
                />
            </div>

            {/* Table */}
            <div className="relative">
                <DataTable
                    data={logs}
                    loading={loading}
                    // Disable DataTable internal search since we use server-side search
                    searchable={false}
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
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 uppercase tracking-wide">
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
                                    <span className="text-xs text-slate-500 font-mono truncate max-w-[120px] bg-slate-50 dark:bg-slate-800 px-1 rounded" title={row.entityId}>{row.entityId}</span>
                                </div>
                            )
                        },
                        {
                            key: 'payload',
                            header: 'Chi tiết',
                            render: (value) => value && (
                                <div className="group relative">
                                    <div className="text-xs text-slate-500 cursor-help underline decoration-dotted">Xem chi tiết</div>
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-slate-900 text-slate-50 rounded-lg text-[10px] font-mono shadow-xl overflow-auto max-h-[300px]">
                                        <pre>{JSON.stringify(value, null, 2)}</pre>
                                    </div>
                                </div>
                            )
                        }
                    ]}
                />
            </div>

            {/* Pagination Controls Reuse */}
            <div className="flex justify-between items-center px-4 py-2 bg-white/50 dark:bg-slate-900/50 rounded-xl backdrop-blur-sm border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Trang {filter.page}
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

            {/* Advanced Filter Drawer */}
            <FilterDrawer
                open={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                title="Lọc nhật ký hoạt động"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Loại thực thể
                        </label>
                        <select
                            className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-indigo-500 text-sm py-2.5"
                            value={tempFilter.entity}
                            onChange={(e) => setTempFilter({ ...tempFilter, entity: e.target.value })}
                        >
                            {entityOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Khoảng thời gian
                        </label>
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Từ ngày</span>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm py-2.5 px-3"
                                    value={tempFilter.startDate}
                                    onChange={(e) => setTempFilter({ ...tempFilter, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Đến ngày</span>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm py-2.5 px-3"
                                    value={tempFilter.endDate}
                                    onChange={(e) => setTempFilter({ ...tempFilter, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </FilterDrawer>
        </div>
    );
}
