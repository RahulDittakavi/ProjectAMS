import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVisitors, logVisitorEntry, logVisitorExit } from '../api/services';
import type { Visitor } from '../types';
import Modal from '../components/Modal';

export default function Visitors() {
  const { user } = useAuth();
  const isSecurity = user?.role === 'SECURITY';
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', purpose: '', flatToVisit: '' });
  const setF = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try { setVisitors(await getVisitors(user?.role ?? 'ADMIN')); }
    catch { setError('Failed to load visitors.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleEntry = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await logVisitorEntry(form);
      setSuccess('Visitor entry logged.'); setModalOpen(false); setForm({ name:'', phone:'', purpose:'', flatToVisit:'' }); await load();
    } catch { setError('Failed to log entry.'); }
    finally { setSubmitting(false); }
  };

  const handleExit = async (id: number) => {
    setError('');
    try { await logVisitorExit(id); setSuccess('Exit logged.'); await load(); }
    catch { setError('Failed to log exit.'); }
  };

  const active = visitors.filter(v => !v.exitTime);
  const exited = visitors.filter(v => v.exitTime);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitors</h1>
          <p className="page-subtitle">Gate entry and exit management</p>
        </div>
        {isSecurity && <button className="btn btn-gold" onClick={() => setModalOpen(true)}>+ Log Entry</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 400 }}>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{active.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inside Now</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{exited.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exited Today</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem' }}>Visitor Log</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{visitors.length} total</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
        ) : visitors.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🚶</div><div className="empty-text">No visitor records</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Visitor</th><th>Phone</th><th>Purpose</th><th>Visiting Flat</th><th>Entry</th><th>Exit / Action</th></tr></thead>
              <tbody>
                {visitors.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {v.loggedByName}</div>
                    </td>
                    <td>{v.phone || '—'}</td>
                    <td>{v.purpose || '—'}</td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>{v.flatToVisit}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(v.entryTime).toLocaleTimeString()}<br /><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(v.entryTime).toLocaleDateString()}</span></td>
                    <td>
                      {v.exitTime ? (
                        <div>
                          <span style={{ fontSize: '0.85rem' }}>{new Date(v.exitTime).toLocaleTimeString()}</span>
                          <br /><span className="badge badge-cancelled" style={{ marginTop: 4 }}>Exited</span>
                        </div>
                      ) : isSecurity ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleExit(v.id)}>Log Exit</button>
                      ) : (
                        <span className="badge badge-open">Inside</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title="Log Visitor Entry" onClose={() => setModalOpen(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-gold" type="submit" form="visitor-form" disabled={submitting}>{submitting ? <><span className="spinner" />Logging…</> : 'Log Entry'}</button></>}>
        <form id="visitor-form" onSubmit={handleEntry} className="form-grid">
          <div className="split-2">
            <label>Visitor Name <input value={form.name} onChange={setF('name')} placeholder="John Doe" required /></label>
            <label>Phone <input value={form.phone} onChange={setF('phone')} placeholder="+91 …" /></label>
          </div>
          <label>Flat to Visit <input value={form.flatToVisit} onChange={setF('flatToVisit')} placeholder="A-101" required /></label>
          <label>Purpose <input value={form.purpose} onChange={setF('purpose')} placeholder="Delivery, guest, etc." /></label>
        </form>
      </Modal>
    </div>
  );
}