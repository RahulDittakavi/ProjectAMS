import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createComplaint, getComplaints, updateComplaintStatus } from '../api/services';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import Modal from '../components/Modal';

const CATS: ComplaintCategory[] = ['PLUMBING','ELECTRICAL','CLEANING','NOISE','OTHER'];
const STATUSES: ComplaintStatus[] = ['OPEN','IN_PROGRESS','RESOLVED'];
const CAT_ICONS: Record<string, string> = { PLUMBING:'🔧', ELECTRICAL:'⚡', CLEANING:'🧹', NOISE:'🔊', OTHER:'📋' };
const fmt = (s: string) => s.replace(/_/g,' ');

export default function Complaints() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';
  const isAdmin = user?.role === 'ADMIN';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('OPEN');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', category: 'PLUMBING' as ComplaintCategory });
  const setF = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try { setComplaints(await getComplaints(user?.role ?? 'RESIDENT')); }
    catch { setError('Failed to load complaints.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await createComplaint(form);
      setSuccess('Complaint submitted successfully.');
      setModalOpen(false);
      setForm({ title: '', description: '', category: 'PLUMBING' });
      await load();
    } catch { setError('Failed to submit complaint.'); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setSubmitting(true); setError('');
    try {
      await updateComplaintStatus(activeComplaint.id, { status: selectedStatus });
      setSuccess('Status updated.'); setStatusModalOpen(false); await load();
    } catch { setError('Failed to update status.'); }
    finally { setSubmitting(false); }
  };

  const openCount = complaints.filter(c => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage and resolve resident complaints' : 'Track your submitted complaints'}</p>
        </div>
        {isResident && <button className="btn btn-gold" onClick={() => setModalOpen(true)}>+ New Complaint</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Open', count: openCount, cls: 'badge-open' },
          { label: 'In Progress', count: inProgressCount, cls: 'badge-in_progress' },
          { label: 'Resolved', count: resolvedCount, cls: 'badge-resolved' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}</div>
            <div style={{ marginTop: 8 }}><span className={`badge ${s.cls}`}>{s.label}</span></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem' }}>{isAdmin ? 'All Complaints' : 'Your Complaints'}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{complaints.length} total</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">No complaints found</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  {isAdmin && <th>Resident</th>}
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.title}</div>
                      {c.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.description.slice(0, 60)}{c.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    {isAdmin && <td>{c.residentName}</td>}
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{CAT_ICONS[c.category]} {c.category}</span></td>
                    <td><span className={`badge badge-${c.status.toLowerCase()}`}>{fmt(c.status)}</span></td>
                    <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        {c.status !== 'RESOLVED' ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setActiveComplaint(c); setSelectedStatus(c.status); setStatusModalOpen(true); }}>Update</button>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Closed</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title="New Complaint" onClose={() => setModalOpen(false)}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-gold" type="submit" form="complaint-form" disabled={submitting}>{submitting ? <><span className="spinner" />Submitting…</> : 'Submit'}</button>
        </>}>
        <form id="complaint-form" onSubmit={handleCreate} className="form-grid">
          <label>Title <input value={form.title} onChange={setF('title')} placeholder="Brief description of the issue" required /></label>
          <label>Category
            <select value={form.category} onChange={setF('category')}>
              {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </label>
          <label>Description <textarea value={form.description} onChange={setF('description')} placeholder="Detailed description…" /></label>
        </form>
      </Modal>

      <Modal open={statusModalOpen} title="Update Status" onClose={() => setStatusModalOpen(false)}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setStatusModalOpen(false)}>Cancel</button>
          <button className="btn btn-gold" type="submit" form="status-form" disabled={submitting}>{submitting ? <><span className="spinner" />Saving…</> : 'Save'}</button>
        </>}>
        <form id="status-form" onSubmit={handleStatusUpdate} className="form-grid">
          <div style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{activeComplaint?.title}</strong>
          </div>
          <label>New Status
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as ComplaintStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}