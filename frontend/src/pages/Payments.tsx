import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPayments } from '../api/services';
import type { Payment } from '../types';

export default function Payments() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    setLoading(true);
    getPayments(user?.role ?? 'RESIDENT')
      .then(setPayments)
      .catch(() => setError('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, [user]);

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const successCount = payments.filter(p => p.status === 'SUCCESS').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{isResident ? 'Your payment history and dues' : 'Pending payment requests'}</p>
        </div>
        {isResident && (
          <button className="btn btn-gold" onClick={() => setInfo('Razorpay integration active — connect your Razorpay key to enable live payments.')}>
            Make Payment
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Amount', value: `₹${total.toLocaleString()}`, color: 'var(--gold)' },
          { label: 'Successful', value: successCount, color: 'var(--accent-green)' },
          { label: 'Pending', value: pendingCount, color: 'var(--accent-amber)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.9rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${s.color}20, transparent 70%)`, borderRadius: '50%' }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem' }}>Transaction History</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{payments.length} records</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💳</div><div className="empty-text">No payment records found</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>{!isResident && <th>Resident</th>}<th>Type</th><th>Amount</th><th>Month</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    {!isResident && <td>{p.residentName}</td>}
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        {p.paymentType === 'MAINTENANCE' ? '🏠' : '🏊'} {p.paymentType.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: 'var(--text-primary)' }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td>{p.month || '—'}</td>
                    <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isResident && (
        <div className="card" style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,168,83,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '2rem' }}>💡</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gold)' }}>Razorpay Integration</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                This system uses Razorpay for secure payments. Your Razorpay key is configured in <code style={{ fontFamily: "'DM Mono', monospace", background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>application.properties</code>. Contact admin to initiate a payment.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}