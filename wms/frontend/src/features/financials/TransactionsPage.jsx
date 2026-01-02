import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Refactored to remove mock data usage and unused imports

export function TransactionsPage() {
    const { t } = useTranslation();
    const [transactions] = useState([]); // Empty state

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {t('financials.title')}
                    </h1>
                    <p className="text-sm text-slate-500">{t('financials.transactions')}</p>
                </div>
                <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-400 px-4 py-2 text-sm font-semibold text-white shadow-sm cursor-not-allowed"
                >
                    <Plus className="h-4 w-4" />
                    {t('financials.createPayment')} (Pending API)
                </button>
            </div>

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-slate-900 border border-dashed border-slate-300">
                <p className="text-slate-500">
                    This module is being migrated to the real backend API.
                    <br />
                    Financial data will be available once the endpoints are ready.
                </p>
                <div className="mt-4 text-xs text-slate-400">
                    0 transactions loaded
                </div>
            </div>
        </div>
    );
}
