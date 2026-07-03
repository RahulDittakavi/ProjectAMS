import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from '../api/services';
import type { Announcement, AnnouncementPriority } from '../types';
import { Button, Badge, Modal, PageHeader, EmptyState } from '../components/ui';

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems]     = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]       = useState({ title: '', content: '', priority: 'NORMAL' as AnnouncementPriority });
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
    <div className="animate-in space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Community notices and important updates"
        action={isAdmin ? <Button onClick={() => setModalOpen(true)}>+ New Announcement</Button> : undefined}
      />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="📢" title="No announcements yet" />
      ) : (
        <div className="space-y-3">
          {urgent.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-red-500 uppercase tracking-wider">
                <span>🚨</span> Urgent
              </div>
              {urgent.map(item => <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />)}
              {normal.length > 0 && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">General</div>}
            </>
          )}
          {normal.map(item => <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />)}
        </div>
      )}

      <Modal open={modalOpen} title="New Announcement" onClose={() => setModalOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="ann-form" loading={submitting}>Post</Button>
        </>}
      >
        <form id="ann-form" onSubmit={handleCreate} className="form-grid">
          <label>Title<input value={form.title} onChange={setF('title')} placeholder="Announcement title" required /></label>
          <label>Priority
            <select value={form.priority} onChange={setF('priority')}>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">🚨 Urgent</option>
            </select>
          </label>
          <label>Content<textarea value={form.content} onChange={setF('content')} placeholder="Write your announcement…" style={{ minHeight: 140 }} required /></label>
        </form>
      </Modal>
    </div>
  );
}

function AnnouncementCard({ item, isAdmin, onDelete }: { item: Announcement; isAdmin: boolean; onDelete: (id: number) => void }) {
  const isUrgent = item.priority === 'URGENT';
  return (
    <div className={`bg-white rounded-2xl border shadow-card p-5 ${isUrgent ? 'border-l-4 border-l-red-400 border-red-100' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <span className="font-semibold text-slate-800">{item.title}</span>
            <Badge status={item.priority} />
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{item.content}</p>
          <div className="flex gap-4 mt-3 text-xs text-slate-400">
            <span>👤 {item.adminName}</span>
            <span>🕐 {new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
        {isAdmin && (
          <Button variant="danger" size="sm" onClick={() => onDelete(item.id)} className="flex-shrink-0">Delete</Button>
        )}
      </div>
    </div>
  );
}
