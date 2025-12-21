import { useEffect, useState } from 'react';
import { formatDate } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

export function AuditTrail({ receiptId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const response = await apiClient(`receipts/${receiptId}/audit-logs`);
                setLogs(response.data || []);
            } catch (err) {
                console.error('Failed to fetch audit logs:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (receiptId) {
            fetchLogs();
        }
    }, [receiptId]);

    if (loading) {
        return (
            <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Lịch Sử Thay Đổi
                </h2>
                <p className="text-sm text-slate-500">Đang tải...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Lịch Sử Thay Đổi
                </h2>
                <p className="text-sm text-rose-500">Không thể tải lịch sử: {error}</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Lịch Sử Thay Đổi
                </h2>
                <p className="text-sm text-slate-500">Chưa có lịch sử thay đổi.</p>
            </div>
        );
    }

    return (
        <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Lịch Sử Thay Đổi
            </h2>
            <div className="space-y-3">
                {logs.map((log) => (
                    <div
                        key={log._id}
                        className="border-l-2 border-blue-500 pl-4 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-r"
                    >
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {formatActionName(log.action)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {log.actorId?.name || 'Hệ thống'} • {formatDate(log.createdAt)}
                        </p>
                        {log.payload && Object.keys(log.payload).length > 0 && (
                            <div className="text-xs mt-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                                {Object.entries(log.payload).map(([key, value]) => (
                                    <div key={key} className="text-slate-600 dark:text-slate-300">
                                        <span className="font-medium">{key}:</span>{' '}
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatActionName(action) {
    const actionMap = {
        'receipt.created': 'Tạo phiếu nhập',
        'receipt.updated': 'Cập nhật phiếu nhập',
        'receipt.deleted': 'Xóa phiếu nhập',
        'receipt.approved': 'Phê duyệt phiếu nhập',
        'receipt.supplierConfirmed': 'Nhà cung cấp xác nhận',
        'receipt.completed': 'Hoàn thành nhập hàng',
    };
    return actionMap[action] || action;
}