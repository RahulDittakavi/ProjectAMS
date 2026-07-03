import { FormEvent, useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../api/services';
import type { User } from '../types';
import { Button, Card, Badge, PageHeader } from '../components/ui';

const ROLE_COLORS: Record<string, string> = {
  ADMIN:    'text-amber-600 bg-amber-50 border border-amber-100',
  RESIDENT: 'text-primary-600 bg-primary-50 border border-primary-100',
  SECURITY: 'text-green-600 bg-green-50 border border-green-100',
};

export default function Profile() {
  const [user, setUser]   = useState<User | null>(null);
  const [form, setForm]   = useState({ name: '', phone: '', flatNumber: '', block: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const setF = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    getProfile()
      .then(p => { setUser(p); setForm({ name: p.name, phone: p.phone || '', flatNumber: p.flatNumber || '', block: p.block || '' }); })
      .catch(() => setError('Failed to load profile.'));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { const updated = await updateProfile(form); setUser(updated); setSuccess('Profile updated successfully.'); }
    catch { setError('Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? '?';

  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account details" />

      {error   && <div className="bg-red-50   border border-red-200   text-red-700   rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Identity card */}
        <Card className="p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
            {initials}
          </div>
          <div className="font-bold text-slate-800 text-lg mb-1">{user?.name}</div>
          <div className="mb-5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user?.role ?? ''] ?? ''}`}>
              {user?.role}
            </span>
          </div>
          <div className="space-y-2 text-left">
            {[
              { icon: '✉️', label: 'Email',  val: user?.email },
              { icon: '📞', label: 'Phone',  val: user?.phone || '—' },
              { icon: '🏠', label: 'Flat',   val: user?.flatNumber ? `${user.block}-${user.flatNumber}` : '—' },
              { icon: '📅', label: 'Joined', val: user ? new Date(user.createdAt).toLocaleDateString() : '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                <span>{row.icon}</span>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{row.label}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{row.val}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Edit form */}
        <Card className="p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>Full Name<input value={form.name} onChange={setF('name')} placeholder="Your full name" required /></label>
            <label>Phone Number<input value={form.phone} onChange={setF('phone')} placeholder="+91 98765 43210" required /></label>
            <div className="split-2">
              <label>Flat Number<input value={form.flatNumber} onChange={setF('flatNumber')} placeholder="101" required /></label>
              <label>Block<input value={form.block} onChange={setF('block')} placeholder="A" required /></label>
            </div>
            <div className="pt-1">
              <Button type="submit" loading={loading} size="lg">Save Changes</Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Status</div>
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                Status: <Badge status="ACTIVE" label="Active" />
              </div>
              <div className="text-sm text-slate-500">
                User ID: <span className="font-mono-dm text-slate-600">#{user?.id}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
