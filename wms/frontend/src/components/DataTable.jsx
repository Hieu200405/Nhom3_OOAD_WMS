import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from './forms/Input.jsx';
import { useTranslation } from 'react-i18next';

export function DataTable({
  title,
  columns = [],
  data = [],
  pageSize = 10,
  searchable = true,
  searchableFields,
  onRowClick,
  actions,
  emptyMessage = 'No data',
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const lowered = search.trim().toLowerCase();
    const keys =
      searchableFields ??
      columns
        .filter((col) => typeof col.key === 'string')
        .map((col) => col.key);

    return data.filter((row) =>
      keys.some((key) => {
        const value = row[key];
        if (value == null) return false;
        return value.toString().toLowerCase().includes(lowered);
      }),
    );
  }, [columns, data, search, searchable, searchableFields]);

  const sorted = useMemo(() => {
    if (!sortState.key) return filtered;
    const sortedData = [...filtered].sort((a, b) => {
      const valueA = a[sortState.key];
      const valueB = b[sortState.key];
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortState.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return sortState.direction === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
    return sortedData;
  }, [filtered, sortState]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setPage(1);
    setSortState((current) => {
      if (current.key !== key) {
        return { key, direction: 'asc' };
      }
      return {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {title ? (
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
            {sorted.length} {t('app.records') || 'Bản ghi'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {searchable ? (
            <div className="w-full sm:w-72">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="!rounded-2xl !bg-slate-100/50 dark:!bg-slate-900/50"
                placeholder={t('app.search') || "Tìm kiếm..."}
              />
            </div>
          ) : null}
          {actions}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100/30 dark:bg-slate-800/20">
                {columns.map((column, idx) => {
                  const isSortable = column.sortable !== false;
                  const isActive = sortState.key === column.key;
                  return (
                    <th
                      key={column.key ?? column.header}
                      className={clsx(
                        "px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-200/50 dark:border-slate-800/50",
                        idx === 0 && "pl-8"
                      )}
                    >
                      <button
                        type="button"
                        className={clsx(
                          'flex items-center gap-1 group transition-colors',
                          isSortable ? 'cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400' : 'cursor-default',
                        )}
                        onClick={() => (isSortable && column.key ? toggleSort(column.key) : undefined)}
                      >
                        <span>{column.header}</span>
                        {isSortable && column.key ? (
                          <div className={clsx(
                            "transition-opacity",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                          )}>
                            {isActive && sortState.direction === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                          </div>
                        ) : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <p className="text-sm font-bold text-slate-400">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : null}
              {pageItems.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className={clsx(
                    'group transition-all duration-200',
                    onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20',
                  )}
                  onClick={() => (onRowClick ? onRowClick(row) : undefined)}
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={column.key ?? column.header}
                      className={clsx(
                        "px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300",
                        colIdx === 0 && "pl-8"
                      )}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {t('app.page') || 'Trang'} {currentPage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="btn btn-secondary !px-4 !py-2 !text-xs disabled:hidden"
              disabled={currentPage === 1}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="btn btn-primary !px-4 !py-2 !text-xs disabled:hidden"
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
