import { useState, useMemo } from 'react';
import { Plus, Wallet, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';
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

    // Filters
    const [filterOverdue, setFilterOverdue] = useState(false);
    const [filterUnpaid, setFilterUnpaid] = useState(false);
    const [partnerId, setPartnerId] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Quick Pay Modal
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [payAmount, setPayAmount] = useState(0);

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

    const handleOpenPayModal = (row) => {
        setSelectedRow(row);
        setPayAmount(row.debtAmount);
        setPayModalOpen(true);
    };

    const handleQuickPaySubmit = (e) => {
        e.preventDefault();
        if (!selectedRow) return;

        const amount = Number(payAmount);
        const newPaidAmount = (selectedRow.paidAmount || 0) + amount;
        const newDebtAmount = Math.max(0, selectedRow.debtAmount - amount);

        // Update the debt record
        actions.updateRecord('financialTransactions', selectedRow.id, {
            paidAmount: newPaidAmount,
            debtAmount: newDebtAmount,
            status: newDebtAmount === 0 ? 'PAID' : 'PARTIAL'
        });

        // Create a linked payment record
        actions.createRecord('financialTransactions', {
            partnerId: selectedRow.partnerId,
            partnerName: selectedRow.partnerName,
            type: 'payment',
            amount: amount,
            paidAmount: amount,
            debtAmount: 0,
            status: 'PAID',
            date: new Date().toISOString().split('T')[0],
            referenceId: selectedRow.id,
            note: `Thanh toán nhanh cho phiếu ${selectedRow.id}`
        });

        setPayModalOpen(false);
        setSelectedRow(null);
    };

    const statusConfig = {
        PAID: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'PAID' },
        PARTIAL: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'PARTIAL' },
        OVERDUE: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', label: 'OVERDUE' },
        UNPAID: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400', label: 'UNPAID' },
    };

    const columns = [
        {
            key: 'id',
            header: t('financials.id'),
            className: 'font-mono text-[10px] opacity-70',
            render: (value) => <span title={value}>{value?.substring(0, 10)}...</span>
        },
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
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${value === 'receivable'
                        ? 'text-green-600'
                        : value === 'payable'
                            ? 'text-rose-600'
                            : 'text-blue-600'
                        }`}
                >
                    {value === 'receivable' ? (
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
            render: (value) => value?.toLocaleString('vi-VN'),
        },
        {
            key: 'paidAmount',
            header: t('financials.paidAmount'),
            className: 'text-right font-mono text-slate-500',
            render: (value) => value?.toLocaleString('vi-VN') || 0,
        },
        {
            key: 'debtAmount',
            header: t('financials.debtAmount'),
            className: 'text-right font-mono font-bold text-rose-600',
            render: (value) => value?.toLocaleString('vi-VN') || 0,
        },
        {
            key: 'paymentDueDate',
            header: t('financials.paymentDueDate'),
            render: (value, row) => {
                if (!value) return '-';
                const dueDate = new Date(value);
                const today = new Date();
                const isOverdue = dueDate < today && (row.debtAmount > 0 || row.status !== 'PAID');
                const diffTime = today - dueDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                    <div className="flex flex-col">
                        <span>{new Date(value).toLocaleDateString('vi-VN')}</span>
                        {isOverdue && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600" title={t('financials.overdueDays', { days: diffDays })}>
                                <ShieldAlert className="h-3 w-3" />
                                {t('financials.overdueDays', { days: diffDays })}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            header: t('financials.status'),
            render: (value, row) => {
                const dueDate = row.paymentDueDate ? new Date(row.paymentDueDate) : null;
                const isOverdue = dueDate && dueDate < new Date() && (row.debtAmount > 0);
                const effectiveStatus = isOverdue ? 'OVERDUE' : (value || 'UNPAID');
                const config = statusConfig[effectiveStatus] || statusConfig.UNPAID;

                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${config.color}`}>
                        {config.label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: '',
            sortable: false,
            render: (_, row) => {
                if ((row.type !== 'receivable' && row.type !== 'payable') || row.debtAmount <= 0) return null;
                const isReceivable = row.type === 'receivable';
                return (
                    <button
                        onClick={() => handleOpenPayModal(row)}
                        className={`rounded-lg px-3 py-1 text-[10px] font-bold text-white transition hover:opacity-90 ${isReceivable ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                    >
                        {isReceivable ? t('financials.collectNow') : t('financials.payNow')}
                    </button>
                );
            }
        },
        {
            key: 'referenceId',
            header: t('financials.relatedReceipt'),
            className: 'text-[10px] opacity-70 font-mono',
            render: (value) => <span title={value}>{value ? `${value.substring(0, 10)}...` : '-'}</span>
        },
    ];


    const stats = useMemo(() => {
        let receivable = 0;
        let payable = 0;
        let overdueCount = 0;
        let collected = 0;
        let totalPaid = 0;

        data.financialTransactions.forEach((t) => {
            if (t.type === 'receivable') receivable += (t.debtAmount || 0);
            if (t.type === 'payable') payable += (t.debtAmount || 0);

            if (t.type === 'payment') {
                // Manual payments
                const partner = partners.find(p => p.id === t.partnerId);
                if (partner?.type === 'customer') collected += t.amount;
                else totalPaid += t.amount;
            } else {
                // Partial payments from debt records
                if (t.type === 'receivable') collected += (t.paidAmount || 0);
                if (t.type === 'payable') totalPaid += (t.paidAmount || 0);
            }

            const dueDate = t.paymentDueDate ? new Date(t.paymentDueDate) : null;
            if (dueDate && dueDate < new Date() && t.debtAmount > 0) {
                overdueCount++;
            }
        });

        return { receivable, payable, overdueCount, collected, totalPaid };
    }, [data.financialTransactions, partners]);

    const filteredTransactions = useMemo(() => {
        return data.financialTransactions.filter(t => {
            if (filterOverdue) {
                const dueDate = t.paymentDueDate ? new Date(t.paymentDueDate) : null;
                const isOverdue = dueDate && dueDate < new Date() && t.debtAmount > 0;
                if (!isOverdue) return false;
            }
            if (filterUnpaid && (t.debtAmount || 0) <= 0) return false;
            if (partnerId && t.partnerId !== partnerId) return false;
            if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) return false;
            if (dateRange.end && new Date(t.date) > new Date(dateRange.end)) return false;
            return true;
        });
    }, [data.financialTransactions, filterOverdue, filterUnpaid, partnerId, dateRange]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const partner = partners.find((p) => p.id === form.partnerId);
        const amount = Number(form.amount);

        // If it's a payment, we try to "allocate" it to existing debt records
        if (form.type === 'payment') {
            const targetType = partner.type === 'customer' ? 'receivable' : 'payable';
            let remainingToAllocate = amount;

            // Sort by date ascending to pay oldest debt first (FIFO)
            const unpaidRecords = [...data.financialTransactions]
                .filter(t => t.partnerId === form.partnerId && t.type === targetType && t.debtAmount > 0)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            for (const record of unpaidRecords) {
                if (remainingToAllocate <= 0) break;

                const allocation = Math.min(record.debtAmount, remainingToAllocate);
                const newPaidAmount = (record.paidAmount || 0) + allocation;
                const newDebtAmount = record.debtAmount - allocation;

                actions.updateRecord('financialTransactions', record.id, {
                    paidAmount: newPaidAmount,
                    debtAmount: newDebtAmount,
                    status: newDebtAmount === 0 ? 'PAID' : 'PARTIAL'
                });

                remainingToAllocate -= allocation;
            }
        }

        actions.createRecord('financialTransactions', {
            ...form,
            id: generateId('ft'),
            partnerName: partner?.name || 'Unknown',
            amount: amount,
            paidAmount: form.type === 'payment' ? amount : 0,
            debtAmount: form.type === 'receivable' || form.type === 'payable' ? amount : 0,
            status: form.type === 'payment' ? 'PAID' : 'UNPAID',
        });
        setOpen(false);
    };

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
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                    <Plus className="h-4 w-4" />
                    {t('financials.createPayment')}
                </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('financials.totalReceivable')}</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
                        {stats.receivable.toLocaleString('vi-VN')}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <ArrowDownLeft className="h-3 w-3" />
                        <span>Khách đang nợ mình</span>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('financials.totalPayable')}</p>
                    <p className="mt-2 text-2xl font-bold text-rose-600 font-mono">
                        {stats.payable.toLocaleString('vi-VN')}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Mình đang nợ NCC</span>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 border-l-4 border-rose-500">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('financials.overdueCount')}</p>
                    <p className="mt-2 text-2xl font-bold text-rose-600 font-mono">
                        {stats.overdueCount}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Vi phạm SLA thanh toán</span>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('financials.totalCollected')}</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-600 font-mono">
                        {stats.collected.toLocaleString('vi-VN')}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <ArrowDownLeft className="h-3 w-3" />
                        <span>Tổng tiền đã thu (In)</span>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('financials.totalPaidInPeriod')}</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600 font-mono">
                        {stats.totalPaid.toLocaleString('vi-VN')}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Tổng tiền đã trả (Out)</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="flex-1 min-w-[200px]">
                    <Select
                        label={t('financials.partner')}
                        value={partnerId}
                        onChange={(e) => setPartnerId(e.target.value)}
                        options={[{ value: '', label: 'Tất cả đối tác' }, ...partners.map(p => ({ value: p.id, label: p.name }))]}
                    />
                </div>
                <div className="w-40">
                    <Input
                        label="Từ ngày"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                </div>
                <div className="w-40">
                    <Input
                        label="Đến ngày"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                </div>
                <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filterOverdue}
                            onChange={(e) => setFilterOverdue(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('financials.filterOverdue')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filterUnpaid}
                            onChange={(e) => setFilterUnpaid(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('financials.filterUnpaid')}</span>
                    </label>
                </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 overflow-hidden">
                <DataTable data={filteredTransactions} columns={columns} />
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
                                { value: 'receivable', label: t('financials.receivable') },
                                { value: 'payable', label: t('financials.payable') },
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

            {/* Quick Pay Modal */}
            <Modal
                open={payModalOpen}
                onClose={() => setPayModalOpen(false)}
                title={selectedRow?.type === 'receivable' ? t('financials.collectNow') : t('financials.payNow')}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setPayModalOpen(false)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            {t('app.cancel')}
                        </button>
                        <button
                            type="submit"
                            form="quick-pay-form"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                        >
                            {t('app.save')}
                        </button>
                    </>
                }
            >
                <form id="quick-pay-form" className="space-y-4" onSubmit={handleQuickPaySubmit}>
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{t('financials.partner')}:</span>
                            <span className="font-semibold">{selectedRow?.partnerName}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                            <span className="text-slate-500">{t('financials.debtAmount')}:</span>
                            <span className="font-bold text-rose-600 font-mono">{selectedRow?.debtAmount?.toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                    <Input
                        label={t('financials.quickPayAmount')}
                        type="number"
                        max={selectedRow?.debtAmount}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        required
                        autofocus
                    />
                </form>
            </Modal>
        </div>
    );
}
