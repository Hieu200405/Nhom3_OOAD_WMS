export function PageHeader({ title, description, actions }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-in">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">{title}</h1>
                {description && (
                    <p className="mt-2 text-sm font-medium text-slate-500 italic opacity-80">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
