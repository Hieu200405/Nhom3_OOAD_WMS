import { useState, useMemo } from 'react';
import { Plus, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { generateId } from '../../utils/id.js';

const emptyTransaction = {
    partnerId: '',
    type: 'payment',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
};

export function TransactionsPage() {
    const { t } = useTranslation();
    const { data, actions } = useMockData();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyTransaction);

    const partners = useMemo(() => {
        return [
            ...data.suppliers.map((s) => ({ id: s.id, name: `${s.name} (NCC)`, type: 'supplier' })),
            ...data.customers.map((c) => ({ id: c.id, name: `${c.name} (KH)`, type: 'customer' })),
        ];
    }, [data.suppliers, data.customers]);

    const openCreateModal = () => {
        setForm({ ...emptyTransaction, date: new Date().toISOString().split('T')[0] });
        setOpen(true);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const partner = partners.find((p) => p.id === form.partnerId);
        actions.createRecord('financialTransactions', {
            ...form,
            id: generateId('ft'),
            partnerName: partner?.name || 'Unknown',
            amount: Number(form.amount),
        });
        setOpen(false);
    };

    const columns = [
        {
            key: 'date',
            header: t('financials.date'),
            render: (value) => new Date(value).toLocaleDateString('vi-VN'),
        },
        { key: 'partnerName', header: t('financials.partner') },
        {
            key: 'type',
            header: t('financials.type'),
            render: (value) => (
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${value === 'payment'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : value === 'liability'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                >
                    {value === 'payment' ? (
                        <ArrowDownLeft className="h-3 w-3" />
                    ) : (
                        <ArrowUpRight className="h-3 w-3" />
                    )}
                    {t(`financials.${value}`)}
                </span>
            ),
        },
        {
            key: 'amount',
            header: t('financials.amount'),
            className: 'text-right font-mono',
            render: (value) => value.toLocaleString('vi-VN'),
        },
        { key: 'referenceId', header: t('financials.reference') },
        { key: 'note', header: t('app.notes') },
    ];

    const totalDebt = useMemo(() => {
        return data.financialTransactions.reduce((acc, curr) => {
            // For suppliers, liability increases debt, payment decreases it
            // For simplicity in this demo, we just show raw amounts
            return acc + (curr.type === 'liability' ? curr.amount : -curr.amount);
        }, 0);
    }, [data.financialTransactions]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {t('financials.title')}
                </h1>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                    <Plus className="h-4 w-4" />
                    {t('financials.createPayment')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">{t('financials.debtAmount')}</p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {totalDebt.toLocaleString('vi-VN')} VNĐ
                    </p>
                </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                        {t('financials.transactions')}
                    </h2>
                </div>
                <DataTable data={data.financialTransactions} columns={columns} />
            </div>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={t('financials.createPayment')}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            {t('app.cancel')}
                        </button>
                        <button
                            type="submit"
                            form="transaction-form"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                        >
                            {t('app.save')}
                        </button>
                    </>
                }
            >
                <form id="transaction-form" className="space-y-4" onSubmit={handleSubmit}>
                    <Select
                        label={t('financials.partner')}
                        value={form.partnerId}
                        onChange={(event) => setForm((prev) => ({ ...prev, partnerId: event.target.value }))}
                        required
                        options={[
                            { value: '', label: 'Select partner' },
                            ...partners.map((p) => ({ value: p.id, label: p.name })),
                        ]}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label={t('financials.type')}
                            value={form.type}
                            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                            required
                            options={[
                                { value: 'payment', label: t('financials.payment') },
                                { value: 'refund', label: t('financials.refund') },
                            ]}
                        />
                        <Input
                            label={t('financials.date')}
                            type="date"
                            value={form.date}
                            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                            required
                        />
                    </div>
                    <Input
                        label={t('financials.amount')}
                        type="number"
                        value={form.amount}
                        onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                        required
                    />
                    <Input
                        label={t('app.notes')}
                        value={form.note}
                        onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                    />
                </form>
            </Modal>
        </div>
    );
}
