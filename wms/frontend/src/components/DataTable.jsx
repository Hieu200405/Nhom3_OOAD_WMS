import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from './forms/Input.jsx';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          {title ? (
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
          ) : null}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sorted.length} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          {searchable ? (
            <div className="w-64">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
              />
            </div>
          ) : null}
          {actions}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {columns.map((column) => {
                const isSortable = column.sortable !== false;
                const isActive = sortState.key === column.key;
                return (
                  <th
                    key={column.key ?? column.header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300"
                  >
                    <button
                      type="button"
                      className={clsx(
                        'flex items-center gap-1',
                        isSortable ? 'cursor-pointer select-none' : 'cursor-default',
                      )}
                      onClick={() => (isSortable && column.key ? toggleSort(column.key) : undefined)}
                    >
                      <span>{column.header}</span>
                      {isSortable && column.key ? (
                        isActive && sortState.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : isActive ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4 opacity-20" />
                        )
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {pageItems.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  'transition hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={() => (onRowClick ? onRowClick(row) : undefined)}
              >
                {columns.map((column) => (
                  <td key={column.key ?? column.header} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
