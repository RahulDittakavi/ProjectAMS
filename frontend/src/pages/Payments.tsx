import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPayments } from '../api/services';
import type { Payment } from '../types';
import { Card, StatCard, Badge, DataTable, PageHeader, type Column } from '../components/ui';

export default function Payments() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    getPayments(user?.role ?? 'RESIDENT')
      .then(setPayments)
      .catch(() => setError('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, [user]);

  const total        = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const successCount = payments.filter(p => p.status === 'SUCCESS').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  const columns: Column<Payment>[] = [
    ...(!isResident ? [{ key: 'resident', header: 'Resident', render: (p: Payment) => <span className="text-slate-700">{p.residentName}</span> }] : []),
    {
      key: 'type', header: 'Type',
      render: p => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          {p.paymentType === 'MAINTENANCE' ? '🏠' : '🏊'} {p.paymentType.replace(/_/g,' ')}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', render: p => <span className="font-mono-dm font-semibold text-slate-800">₹{Number(p.amount).toLocaleString()}</span> },
    { key: 'month',  header: 'Month',  render: p => <span>{p.month || '—'}</span> },
    { key: 'status', header: 'Status', render: p => <Badge status={p.status} /> },
    { key: 'date',   header: 'Date',   render: p => <span className="text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Payments"
        subtitle={isResident ? 'Your payment history and dues' : 'Pending payment requests'}
      />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Paid"  value={`₹${total.toLocaleString()}`} icon={<TotalIcon />}   color="indigo" />
        <StatCard label="Successful"  value={successCount}                  icon={<CheckIcon />}   color="green"  />
        <StatCard label="Pending"     value={pendingCount}                  icon={<ClockIcon />}   color="amber"  />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Transaction History</h2>
          <span className="text-xs text-slate-400">{payments.length} records</span>
        </div>
        <DataTable
          columns={columns}
          data={payments}
          keyExtractor={p => p.id}
          loading={loading}
          emptyIcon="💳"
          emptyText="No payment records found"
        />
      </Card>

      {isResident && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <div className="font-semibold text-primary-700">Razorpay Integration</div>
            <div className="text-sm text-primary-600 mt-1">
              Secure payment processing via Razorpay. The full billing flow (monthly dues, bill generation, pay-specific-bill) is coming with the Billing Service in Phase 2.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TotalIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const ClockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
