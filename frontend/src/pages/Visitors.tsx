import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVisitors, logVisitorEntry, logVisitorExit } from '../api/services';
import type { Visitor } from '../types';

export default function Visitors() {
  const { user } = useAuth();
  const role = user?.role ?? 'RESIDENT';
  const isSecurity = role === 'SECURITY';

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [flatToVisit, setFlatToVisit] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setVisitors(await getVisitors(role));
      } catch {
        setError('Unable to load visitors.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role]);

  const refresh = async () => {
    setVisitors(await getVisitors(role));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await logVisitorEntry({ name, phone, purpose, flatToVisit });
      setMessage('Visitor entry logged.');
      setName('');
      setPhone('');
      setPurpose('');
      setFlatToVisit('');
      await refresh();
    } catch {
      setError('Could not log entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = async (id: number) => {
    setError('');
    setMessage('');
    try {
      await logVisitorExit(id);
      setMessage('Visitor exit logged.');
      await refresh();
    } catch {
      setError('Could not log exit.');
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Visitors</h1></div>
      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      {isSecurity && (
        <div className="panel">
          <h2>Log Visitor Entry</h2>
          <form onSubmit={handleSubmit} className="panel-form">
            <label>
              Visitor Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label>
              Flat to Visit
              <input value={flatToVisit} onChange={(event) => setFlatToVisit(event.target.value)} required />
            </label>
            <label>
              Purpose
              <input value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            </label>
            <button type="submit" disabled={submitting}>{submitting ? 'Logging...' : 'Log Entry'}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading visitors...</div>
      ) : visitors.length === 0 ? (
        <div className="empty-state">No visitors found.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Purpose</th>
                <th>Visiting</th>
                <th>Entry</th>
                <th>Exit</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor) => (
                <tr key={visitor.id}>
                  <td>{visitor.name}</td>
                  <td>{visitor.phone}</td>
                  <td>{visitor.purpose}</td>
                  <td>{visitor.flatToVisit}</td>
                  <td>{new Date(visitor.entryTime).toLocaleString()}</td>
                  <td>
                    {visitor.exitTime ? (
                      new Date(visitor.exitTime).toLocaleString()
                    ) : isSecurity ? (
                      <button type="button" className="secondary-button" onClick={() => handleExit(visitor.id)}>
                        Log Exit
                      </button>
                    ) : (
                      <span className="status-badge badge-open">Inside</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
