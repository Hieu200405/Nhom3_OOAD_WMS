export function InfoCard({ title, value, className = '' }) {
    return (
        <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{value ?? '--'}</p>
        </div>
    );
}
