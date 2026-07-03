import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createComplaint, getComplaints, updateComplaintStatus } from '../api/services';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { Button, Card, StatCard, Badge, DataTable, Modal, PageHeader, type Column } from '../components/ui';

const CATS: ComplaintCategory[] = ['PLUMBING','ELECTRICAL','CLEANING','NOISE','OTHER'];
const STATUSES: ComplaintStatus[] = ['OPEN','IN_PROGRESS','RESOLVED'];
const CAT_ICONS: Record<string, string> = { PLUMBING:'🔧', ELECTRICAL:'⚡', CLEANING:'🧹', NOISE:'🔊', OTHER:'📋' };

export default function Complaints() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';
  const isAdmin    = user?.role === 'ADMIN';

  const [complaints, setComplaints]       = useState<Complaint[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [selectedStatus, setSelectedStatus]   = useState<ComplaintStatus>('OPEN');
  const [submitting, setSubmitting]       = useState(false);
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
      setSuccess('Complaint submitted.'); setModalOpen(false);
      setForm({ title: '', description: '', category: 'PLUMBING' }); await load();
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

  const openCount       = complaints.filter(c => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount   = complaints.filter(c => c.status === 'RESOLVED').length;

  const columns: Column<Complaint>[] = [
    {
      key: 'title', header: 'Title',
      render: c => (
        <div>
          <div className="font-medium text-slate-800">{c.title}</div>
          {c.description && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{c.description.slice(0, 60)}{c.description.length > 60 ? '…' : ''}</div>}
        </div>
      ),
    },
    ...(isAdmin ? [{ key: 'resident', header: 'Resident', render: (c: Complaint) => <span className="text-slate-700">{c.residentName}</span> }] : []),
    {
      key: 'category', header: 'Category',
      render: c => <span className="inline-flex items-center gap-1.5 text-slate-600">{CAT_ICONS[c.category]} {c.category}</span>,
    },
    { key: 'status', header: 'Status', render: c => <Badge status={c.status} /> },
    { key: 'updated', header: 'Updated', render: c => <span className="text-slate-400 text-xs">{new Date(c.updatedAt).toLocaleDateString()}</span> },
    ...(isAdmin ? [{
      key: 'action', header: 'Action',
      render: (c: Complaint) => c.status !== 'RESOLVED'
        ? <Button variant="ghost" size="sm" onClick={() => { setActiveComplaint(c); setSelectedStatus(c.status); setStatusModalOpen(true); }}>Update</Button>
        : <span className="text-xs text-slate-300">Closed</span>,
    }] : []),
  ];

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Complaints"
        subtitle={isAdmin ? 'Manage and resolve resident complaints' : 'Track your submitted complaints'}
        action={isResident ? <Button onClick={() => setModalOpen(true)}>+ New Complaint</Button> : undefined}
      />

      {error   && <Alert type="error"   message={error}   />}
      {success && <Alert type="success" message={success} />}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Open"        value={openCount}        icon={<OpenIcon />}       color="blue"   />
        <StatCard label="In Progress" value={inProgressCount}  icon={<ProgressIcon />}   color="purple" />
        <StatCard label="Resolved"    value={resolvedCount}    icon={<ResolvedIcon />}   color="green"  />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">{isAdmin ? 'All Complaints' : 'Your Complaints'}</h2>
          <span className="text-xs text-slate-400">{complaints.length} total</span>
        </div>
        <DataTable
          columns={columns}
          data={complaints}
          keyExtractor={c => c.id}
          loading={loading}
          emptyIcon="📋"
          emptyText="No complaints found"
        />
      </Card>

      {/* New Complaint Modal */}
      <Modal open={modalOpen} title="New Complaint" onClose={() => setModalOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="complaint-form" loading={submitting}>Submit</Button>
        </>}
      >
        <form id="complaint-form" onSubmit={handleCreate} className="form-grid">
          <label>Title<input value={form.title} onChange={setF('title')} placeholder="Brief description of the issue" required /></label>
          <label>Category
            <select value={form.category} onChange={setF('category')}>
              {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </label>
          <label>Description<textarea value={form.description} onChange={setF('description')} placeholder="Detailed description…" /></label>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal open={statusModalOpen} title="Update Status" onClose={() => setStatusModalOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="status-form" loading={submitting}>Save</Button>
        </>}
      >
        <form id="status-form" onSubmit={handleStatusUpdate} className="form-grid">
          <div className="py-1 text-sm text-slate-500">
            Updating status for: <span className="font-medium text-slate-800">{activeComplaint?.title}</span>
          </div>
          <label>New Status
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as ComplaintStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}

const OpenIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>;
const ProgressIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const ResolvedIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const cls = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-green-50 border-green-200 text-green-700';
  return <div className={`border rounded-lg px-4 py-3 text-sm ${cls}`}>{message}</div>;
}
