import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../services/apiClient';

export function AuditLogViewer({ resource, resourceId }) {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!resourceId) return;

        setLoading(true);
        apiClient.get(`/${resource}/${resourceId}/audit-logs`)
            .then(res => setLogs(res.data.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [resource, resourceId]);

    if (loading) return <div className="p-4 text-center text-sm text-slate-500">Loading history...</div>;
    if (logs.length === 0) return <div className="p-4 text-center text-sm text-slate-500">No history available.</div>;

    return (
        <div className="flow-root p-4">
            <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100 mb-6">Activity History</h3>
            <ul role="list" className="-mb-8">
                {logs.map((log, logIdx) => (
                    <li key={log._id}>
                        <div className="relative pb-8">
                            {logIdx !== logs.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white dark:bg-indigo-900 dark:ring-slate-900">
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                                            {log.actorId?.name?.charAt(0).toUpperCase() || 'S'}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{log.actorId?.name || 'System'}</span>{' '}
                                            <span className="text-slate-600 dark:text-slate-300">{formatAction(log.action)}</span>
                                        </p>
                                        {/* Optional: Show payload details for critical actions */}
                                        {['create', 'update', 'delete'].some(a => log.action.includes(a)) && log.payload && (
                                            <div className="mt-1 text-xs text-slate-500">
                                                {log.payload.status && <span>Status: {log.payload.status}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="whitespace-nowrap text-right text-xs text-slate-400">
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function formatAction(action) {
    if (!action) return '';
    // Format "receipt.created" -> "created receipt"
    const parts = action.split('.');
    if (parts.length > 1) {
        return `${parts[1]} ${parts[0]}`;
    }
    return action.replace(/_/g, ' ');
}
