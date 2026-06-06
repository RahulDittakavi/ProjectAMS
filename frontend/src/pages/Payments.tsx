import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPayments, getMyBills, createPaymentOrder, verifyPayment, generateBills, setMaintenanceConfig, getCollections } from '../api/services';
import type { Bill, CollectionSummary, Payment } from '../types';
import { Button, Card, StatCard, Badge, DataTable, Modal, PageHeader, type Column } from '../components/ui';

declare const Razorpay: any;

export default function Payments() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';
  const isAdmin    = user?.role === 'ADMIN';

  const [payments, setPayments]       = useState<Payment[]>([]);
  const [bills, setBills]             = useState<Bill[]>([]);
  const [collections, setCollections] = useState<CollectionSummary | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [configModal, setConfigModal]     = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [collectModal, setCollectModal]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  const [configForm, setConfigForm]       = useState({ monthlyAmount: '', block: '', effectiveFrom: '' });
  const [generateMonth, setGenerateMonth] = useState('');
  const [collectMonth, setCollectMonth]   = useState('');

  const setC = (k: string) => (e: any) => setConfigForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [p, b] = await Promise.all([
        getPayments(user?.role ?? 'RESIDENT'),
        isResident ? getMyBills() : Promise.resolve([]),
      ]);
      setPayments(p);
      if (isResident) setBills(b as Bill[]);
    } catch {
      setError('Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handlePayBill = async (bill: Bill) => {
    setError('');
    try {
      const order = await createPaymentOrder({ paymentType: 'MAINTENANCE', billId: bill.id });
      const options = {
        key: 'rzp_test_SoVYVV1TZMtOdr',
        amount: order.amount * 100,
        currency: order.currency,
        name: 'ApartmentOS',
        description: `Maintenance — ${bill.billingMonth}`,
        order_id: order.razorpayOrderId,
        handler: async (resp: any) => {
          try {
            await verifyPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            setSuccess(`Payment for ${bill.billingMonth} successful!`);
            load();
          } catch {
            setError('Payment verification failed.');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#6366F1' },
      };
      new Razorpay(options).open();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  const handleSetConfig = async (e: any) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await setMaintenanceConfig({
        monthlyAmount: Number(configForm.monthlyAmount),
        block: configForm.block || null,
        effectiveFrom: configForm.effectiveFrom,
      });
      setSuccess('Maintenance config saved.'); setConfigModal(false);
      setConfigForm({ monthlyAmount: '', block: '', effectiveFrom: '' });
    } catch { setError('Failed to save config.'); }
    finally { setSubmitting(false); }
  };

  const handleGenerate = async (e: any) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const msg = await generateBills(generateMonth);
      setSuccess(msg); setGenerateModal(false); setGenerateMonth('');
    } catch { setError('Failed to generate bills.'); }
    finally { setSubmitting(false); }
  };

  const handleLoadCollections = async (e: any) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      setCollections(await getCollections(collectMonth));
      setCollectModal(false);
    } catch { setError('Failed to load collections.'); }
    finally { setSubmitting(false); }
  };

  const total        = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const successCount = payments.filter(p => p.status === 'SUCCESS').length;
  const overdueCount = bills.filter(b => b.status === 'OVERDUE').length;

  const billColumns: Column<Bill>[] = [
    { key: 'month',  header: 'Month',    render: b => <span className="font-medium text-slate-800">{b.billingMonth}</span> },
    { key: 'flat',   header: 'Flat',     render: b => <span className="font-mono-dm">{b.block}-{b.flatNumber}</span> },
    { key: 'amount', header: 'Amount',   render: b => <span className="font-mono-dm font-semibold">₹{Number(b.amount).toLocaleString()}</span> },
    { key: 'due',    header: 'Due Date', render: b => <span className="text-slate-500 text-sm">{new Date(b.dueDate).toLocaleDateString()}</span> },
    { key: 'status', header: 'Status',   render: b => <Badge status={b.status} /> },
    {
      key: 'action', header: '',
      render: b => b.status !== 'PAID'
        ? <Button size="sm" onClick={() => handlePayBill(b)}>Pay ₹{Number(b.amount).toLocaleString()}</Button>
        : <span className="text-xs text-slate-400">Paid {b.paidAt ? new Date(b.paidAt).toLocaleDateString() : ''}</span>,
    },
  ];

  const txnColumns: Column<Payment>[] = [
    ...(!isResident ? [{ key: 'resident', header: 'Resident', render: (p: Payment) => <span className="text-slate-700">{p.residentName}</span> }] : []),
    { key: 'type',   header: 'Type',   render: p => <span className="text-slate-600">{p.paymentType === 'MAINTENANCE' ? '🏠' : '🏊'} {p.paymentType.replace(/_/g, ' ')}</span> },
    { key: 'amount', header: 'Amount', render: p => <span className="font-mono-dm font-semibold">₹{Number(p.amount).toLocaleString()}</span> },
    { key: 'month',  header: 'Month',  render: p => <span>{p.month || '—'}</span> },
    { key: 'status', header: 'Status', render: p => <Badge status={p.status} /> },
    { key: 'date',   header: 'Date',   render: p => <span className="text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span> },
  ];

  const defaulterColumns: Column<Bill>[] = [
    { key: 'name',   header: 'Resident', render: b => <span className="font-medium text-slate-800">{b.residentName}</span> },
    { key: 'flat',   header: 'Flat',     render: b => <span className="font-mono-dm">{b.block}-{b.flatNumber}</span> },
    { key: 'amount', header: 'Amount',   render: b => <span className="font-mono-dm">₹{Number(b.amount).toLocaleString()}</span> },
    { key: 'status', header: 'Status',   render: b => <Badge status={b.status} /> },
  ];

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Payments & Billing"
        subtitle={isResident ? 'Your dues and payment history' : 'Collection management'}
        action={isAdmin ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfigModal(true)}>Set Rate</Button>
            <Button variant="secondary" onClick={() => setGenerateModal(true)}>Generate Bills</Button>
            <Button onClick={() => setCollectModal(true)}>Collections</Button>
          </div>
        ) : undefined}
      />

      {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Paid"      value={`₹${total.toLocaleString()}`} icon={<CardIcon />}  color="indigo" />
        <StatCard label="Successful Txns" value={successCount}                  icon={<CheckIcon />} color="green"  />
        {isResident
          ? <StatCard label="Overdue Bills" value={overdueCount} icon={<WarnIcon />} color="red"   />
          : <StatCard label="Pending"       value={payments.filter(p => p.status === 'PENDING').length} icon={<ClockIcon />} color="amber" />
        }
      </div>

      {isResident && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800">My Bills</h2>
            <span className="text-xs text-slate-400">{bills.length} bills</span>
          </div>
          <DataTable
            columns={billColumns}
            data={bills}
            keyExtractor={b => b.id}
            loading={loading}
            emptyIcon="🧾"
            emptyText="No bills yet — your monthly dues will appear here"
          />
        </Card>
      )}

      {collections && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-800">Collection Summary — {collections.month}</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {collections.paidCount} / {collections.totalBills} paid · ₹{Number(collections.collectedAmount).toLocaleString()} collected
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCollections(null)}>✕</Button>
          </div>
          {collections.defaulters.length > 0 && (
            <>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Defaulters ({collections.defaulterCount})
              </div>
              <DataTable
                columns={defaulterColumns}
                data={collections.defaulters}
                keyExtractor={b => b.id}
                emptyIcon="✅"
                emptyText="All residents have paid"
              />
            </>
          )}
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Transaction History</h2>
          <span className="text-xs text-slate-400">{payments.length} records</span>
        </div>
        <DataTable
          columns={txnColumns}
          data={payments}
          keyExtractor={p => p.id}
          loading={loading}
          emptyIcon="💳"
          emptyText="No payment records found"
        />
      </Card>

      <Modal open={configModal} title="Set Maintenance Rate" onClose={() => setConfigModal(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setConfigModal(false)}>Cancel</Button>
          <Button type="submit" form="config-form" loading={submitting}>Save</Button>
        </>}
      >
        <form id="config-form" onSubmit={handleSetConfig} className="form-grid">
          <label>Monthly Amount (₹)
            <input type="number" value={configForm.monthlyAmount} onChange={setC('monthlyAmount')} placeholder="2500" required />
          </label>
          <label>Block (leave blank for all blocks)
            <input value={configForm.block} onChange={setC('block')} placeholder="A, B, … or blank for all" />
          </label>
          <label>Effective From
            <input type="date" value={configForm.effectiveFrom} onChange={setC('effectiveFrom')} required />
          </label>
        </form>
      </Modal>

      <Modal open={generateModal} title="Generate Monthly Bills" onClose={() => setGenerateModal(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setGenerateModal(false)}>Cancel</Button>
          <Button type="submit" form="gen-form" loading={submitting}>Generate</Button>
        </>}
      >
        <form id="gen-form" onSubmit={handleGenerate} className="form-grid">
          <label>Billing Month
            <input type="month" value={generateMonth} onChange={e => setGenerateMonth(e.target.value)} required />
          </label>
          <p className="text-sm text-slate-500">Safe to re-run — existing bills are skipped automatically.</p>
        </form>
      </Modal>

      <Modal open={collectModal} title="View Collection Summary" onClose={() => setCollectModal(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setCollectModal(false)}>Cancel</Button>
          <Button type="submit" form="collect-form" loading={submitting}>Load</Button>
        </>}
      >
        <form id="collect-form" onSubmit={handleLoadCollections} className="form-grid">
          <label>Month
            <input type="month" value={collectMonth} onChange={e => setCollectMonth(e.target.value)} required />
          </label>
        </form>
      </Modal>
    </div>
  );
}

const CardIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const ClockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const WarnIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
