import { type ReactNode } from 'react';

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',       text: 'text-blue-600',    num: 'text-blue-700'    },
  green:  { bg: 'bg-green-50',      text: 'text-green-600',   num: 'text-green-700'   },
  amber:  { bg: 'bg-amber-50',      text: 'text-amber-600',   num: 'text-amber-700'   },
  red:    { bg: 'bg-red-50',        text: 'text-red-600',     num: 'text-red-700'     },
  purple: { bg: 'bg-purple-50',     text: 'text-purple-600',  num: 'text-purple-700'  },
  indigo: { bg: 'bg-primary-50',    text: 'text-primary-600', num: 'text-primary-700' },
  slate:  { bg: 'bg-slate-100',     text: 'text-slate-500',   num: 'text-slate-700'   },
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: keyof typeof COLOR_MAP;
  subtitle?: string;
}

export function StatCard({ label, value, icon, color = 'indigo', subtitle }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold font-display ${c.num}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
