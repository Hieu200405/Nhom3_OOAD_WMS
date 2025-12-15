import clsx from 'clsx';

const STATUS_STYLES = {
  Draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Approved: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  'Supplier Confirmed': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  Prepared: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  Cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-600/40 dark:text-slate-200',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200',
  'Pending Approval': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
  Approved2: 'bg-green-100 text-green-700', // fallback key
};

export function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
