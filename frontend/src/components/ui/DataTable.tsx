import { type ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyIcon?: string;
  emptyText?: string;
}

export function DataTable<T>({ columns, data, keyExtractor, loading, emptyIcon = '📋', emptyText = 'No data found' }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyText} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map(row => (
            <tr key={keyExtractor(row)} className="hover:bg-slate-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-4 text-sm text-slate-600 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
