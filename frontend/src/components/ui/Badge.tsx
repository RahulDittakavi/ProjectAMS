// Unified status color map — same semantics across every page:
// blue=OPEN/IN_PROGRESS  green=RESOLVED/PAID/APPROVED  amber=PENDING/UNPAID  red=OVERDUE/REJECTED/FAILED
const STATUS_STYLES: Record<string, string> = {
  OPEN:        'bg-blue-50   text-blue-700   border border-blue-100',
  IN_PROGRESS: 'bg-violet-50 text-violet-700 border border-violet-100',
  RESOLVED:    'bg-green-50  text-green-700  border border-green-100',
  SUCCESS:     'bg-green-50  text-green-700  border border-green-100',
  PAID:        'bg-green-50  text-green-700  border border-green-100',
  APPROVED:    'bg-green-50  text-green-700  border border-green-100',
  ACTIVE:      'bg-green-50  text-green-700  border border-green-100',
  INSIDE:      'bg-blue-50   text-blue-700   border border-blue-100',
  PENDING:     'bg-amber-50  text-amber-700  border border-amber-100',
  UNPAID:      'bg-amber-50  text-amber-700  border border-amber-100',
  FAILED:      'bg-red-50    text-red-700    border border-red-100',
  OVERDUE:     'bg-red-50    text-red-700    border border-red-100',
  REJECTED:    'bg-red-50    text-red-700    border border-red-100',
  URGENT:      'bg-red-50    text-red-700    border border-red-100',
  CANCELLED:   'bg-slate-100 text-slate-600  border border-slate-200',
  EXITED:      'bg-slate-100 text-slate-600  border border-slate-200',
  NORMAL:      'bg-slate-100 text-slate-600  border border-slate-200',
};

const DOT_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500', IN_PROGRESS: 'bg-violet-500', RESOLVED: 'bg-green-500',
  SUCCESS: 'bg-green-500', PAID: 'bg-green-500', APPROVED: 'bg-green-500',
  ACTIVE: 'bg-green-500', INSIDE: 'bg-blue-500',
  PENDING: 'bg-amber-500', UNPAID: 'bg-amber-500',
  FAILED: 'bg-red-500', OVERDUE: 'bg-red-500', REJECTED: 'bg-red-500', URGENT: 'bg-red-500',
  CANCELLED: 'bg-slate-400', EXITED: 'bg-slate-400', NORMAL: 'bg-slate-400',
};

const DEFAULT_STYLE = 'bg-slate-100 text-slate-600 border border-slate-200';

interface BadgeProps {
  status: string;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  const key = status.toUpperCase();
  const style = STATUS_STYLES[key] ?? DEFAULT_STYLE;
  const dot = DOT_COLORS[key] ?? 'bg-slate-400';
  const text = label ?? status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {text}
    </span>
  );
}
