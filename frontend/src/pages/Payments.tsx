import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPayments } from '../api/services';
import type { Payment } from '../types';

export default function Payments() {
  const { user } = useAuth();
  const role = user?.role ?? 'RESIDENT';
  const isResident = role === 'RESIDENT';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setPayments(await getPayments(role));
      } catch {
        setError('Unable to load payments.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role]);

  const handleStub = () => setMessage('Razorpay payment flow — coming soon!');

  return (
    <div>
      <div className="page-header">
        <h1>{isResident ? 'My Payments' : 'Pending Payments'}</h1>
        {isResident && (
          <button className="secondary-button" onClick={handleStub}>
            Make Payment
          </button>
        )}
      </div>
      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}
      {loading ? (
        <div className="empty-state">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">No payment records found.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {isResident ? null : <th>Resident</th>}
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Month</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  {!isResident && <td>{payment.residentName}</td>}
                  <td>{payment.paymentType}</td>
                  <td>₹{payment.amount}</td>
                  <td><span className={`status-badge badge-${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                  <td>{payment.month}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
