import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVisitors, logVisitorEntry, logVisitorExit } from '../api/services';
import type { Visitor } from '../types';
import { Button, Card, StatCard, Badge, DataTable, Modal, PageHeader, type Column } from '../components/ui';

export default function Visitors() {
  const { user } = useAuth();
  const isSecurity = user?.role === 'SECURITY';
  const [visitors, setVisitors]   = useState<Visitor[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
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
      setSuccess('Visitor entry logged.'); setModalOpen(false);
      setForm({ name:'', phone:'', purpose:'', flatToVisit:'' }); await load();
    } catch { setError('Failed to log entry.'); }
    finally { setSubmitting(false); }
  };

  const handleExit = async (id: number) => {
    setError('');
    try { await logVisitorExit(id); setSuccess('Exit logged.'); await load(); }
    catch { setError('Failed to log exit.'); }
  };

  const active = visitors.filter(v => !v.exitTime);
  const exited = visitors.filter(v =>  v.exitTime);

  const columns: Column<Visitor>[] = [
    {
      key: 'visitor', header: 'Visitor',
      render: v => (
        <div>
          <div className="font-medium text-slate-800">{v.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">by {v.loggedByName}</div>
        </div>
      ),
    },
    { key: 'phone',   header: 'Phone',        render: v => <span>{v.phone || '—'}</span> },
    { key: 'purpose', header: 'Purpose',       render: v => <span>{v.purpose || '—'}</span> },
    { key: 'flat',    header: 'Visiting Flat', render: v => <span className="font-mono-dm">{v.flatToVisit}</span> },
    {
      key: 'entry', header: 'Entry',
      render: v => (
        <div>
          <div className="text-sm">{new Date(v.entryTime).toLocaleTimeString()}</div>
          <div className="text-xs text-slate-400">{new Date(v.entryTime).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'exit', header: 'Exit / Status',
      render: v => v.exitTime ? (
        <div>
          <div className="text-sm">{new Date(v.exitTime).toLocaleTimeString()}</div>
          <Badge status="EXITED" />
        </div>
      ) : isSecurity ? (
        <Button variant="ghost" size="sm" onClick={() => handleExit(v.id)}>Log Exit</Button>
      ) : (
        <Badge status="INSIDE" label="Inside" />
      ),
    },
  ];

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Visitors"
        subtitle="Gate entry and exit management"
        action={isSecurity ? <Button onClick={() => setModalOpen(true)}>+ Log Entry</Button> : undefined}
      />

      {error   && <Alert type="error"   message={error}   />}
      {success && <Alert type="success" message={success} />}

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <StatCard label="Inside Now"   value={active.length} icon={<InsideIcon />} color="green" />
        <StatCard label="Exited Today" value={exited.length} icon={<ExitIcon />}   color="slate" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Visitor Log</h2>
          <span className="text-xs text-slate-400">{visitors.length} total</span>
        </div>
        <DataTable
          columns={columns}
          data={visitors}
          keyExtractor={v => v.id}
          loading={loading}
          emptyIcon="🚶"
          emptyText="No visitor records"
        />
      </Card>

      <Modal open={modalOpen} title="Log Visitor Entry" onClose={() => setModalOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="visitor-form" loading={submitting}>Log Entry</Button>
        </>}
      >
        <form id="visitor-form" onSubmit={handleEntry} className="form-grid">
          <div className="split-2">
            <label>Visitor Name<input value={form.name} onChange={setF('name')} placeholder="John Doe" required /></label>
            <label>Phone<input value={form.phone} onChange={setF('phone')} placeholder="+91 …" /></label>
          </div>
          <label>Flat to Visit<input value={form.flatToVisit} onChange={setF('flatToVisit')} placeholder="A-101" required /></label>
          <label>Purpose<input value={form.purpose} onChange={setF('purpose')} placeholder="Delivery, guest, etc." /></label>
        </form>
      </Modal>
    </div>
  );
}

const InsideIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const ExitIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const cls = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
  return <div className={`border rounded-lg px-4 py-3 text-sm ${cls}`}>{message}</div>;
}
