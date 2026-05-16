import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from '../api/services';
import type { Announcement, AnnouncementPriority } from '../types';
import Modal from '../components/Modal';

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'NORMAL' as AnnouncementPriority });
  const [submitting, setSubmitting] = useState(false);
  const setF = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try { setItems(await getAnnouncements()); }
    catch { setError('Failed to load announcements.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await createAnnouncement(form);
      setModalOpen(false); setForm({ title:'', content:'', priority:'NORMAL' }); await load();
    } catch { setError('Failed to post announcement.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    try { await deleteAnnouncement(id); await load(); }
    catch { setError('Failed to delete.'); }
  };

  const urgent = items.filter(i => i.priority === 'URGENT');
  const normal = items.filter(i => i.priority === 'NORMAL');

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Community notices and important updates</p>
        </div>
        {isAdmin && <button className="btn btn-gold" onClick={() => setModalOpen(true)}>+ New Announcement</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📢</div><div className="empty-text">No announcements yet</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {urgent.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚨</span> Urgent
              </div>
              {urgent.map(item => <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />)}
              <div style={{ height: 8 }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>General</div>
            </>
          )}
          {normal.map(item => <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />)}
        </div>
      )}

      <Modal open={modalOpen} title="New Announcement" onClose={() => setModalOpen(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-gold" type="submit" form="ann-form" disabled={submitting}>{submitting ? <><span className="spinner" />Posting…</> : 'Post'}</button></>}>
        <form id="ann-form" onSubmit={handleCreate} className="form-grid">
          <label>Title <input value={form.title} onChange={setF('title')} placeholder="Announcement title" required /></label>
          <label>Priority
            <select value={form.priority} onChange={setF('priority')}>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">🚨 Urgent</option>
            </select>
          </label>
          <label>Content <textarea value={form.content} onChange={setF('content')} placeholder="Write your announcement…" style={{ minHeight: 140 }} required /></label>
        </form>
      </Modal>
    </div>
  );
}

function AnnouncementCard({ item, isAdmin, onDelete }: { item: Announcement; isAdmin: boolean; onDelete: (id: number) => void }) {
  const isUrgent = item.priority === 'URGENT';
  return (
    <div className="card" style={{
      borderLeft: `3px solid ${isUrgent ? 'var(--accent-red)' : 'var(--border-default)'}`,
      borderRadius: '0 14px 14px 0',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.title}</span>
            <span className={`badge badge-${item.priority.toLowerCase()}`}>{item.priority}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.content}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>👤 {item.adminName}</span>
            <span>🕐 {new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)} style={{ flexShrink: 0 }}>Delete</button>
        )}
      </div>
    </div>
  );
}