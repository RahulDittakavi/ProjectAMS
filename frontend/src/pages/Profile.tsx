import { FormEvent, useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../api/services';
import type { User } from '../types';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', flatNumber: '', block: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const setF = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    getProfile().then(p => { setUser(p); setForm({ name: p.name, phone: p.phone || '', flatNumber: p.flatNumber || '', block: p.block || '' }); }).catch(() => setError('Failed to load profile.'));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { const updated = await updateProfile(form); setUser(updated); setSuccess('Profile updated successfully.'); }
    catch { setError('Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? '?';
  const roleColors: Record<string, string> = { ADMIN: '#d4a853', RESIDENT: '#3b82f6', SECURITY: '#10b981' };
  const roleColor = roleColors[user?.role ?? ''] ?? 'var(--text-muted)';

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div><h1 className="page-title">Profile</h1><p className="page-subtitle">Manage your account details</p></div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Identity Card */}
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${roleColor}, transparent)` }} />
          <div style={{
            width: 80, height: 80,
            background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}10)`,
            border: `2px solid ${roleColor}50`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '1.6rem', fontWeight: 700, color: roleColor,
            fontFamily: "'Playfair Display', serif"
          }}>{initials}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{user?.name}</div>
          <div style={{ marginBottom: 16 }}><span className="badge" style={{ background: `${roleColor}20`, color: roleColor }}>{user?.role}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '✉️', label: 'Email', val: user?.email },
              { icon: '📞', label: 'Phone', val: user?.phone || '—' },
              { icon: '🏠', label: 'Flat', val: user?.flatNumber ? `${user.block}-${user.flatNumber}` : '—' },
              { icon: '📅', label: 'Joined', val: user ? new Date(user.createdAt).toLocaleDateString() : '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, textAlign: 'left' }}>
                <span>{row.icon}</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{row.label}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 1 }}>{row.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', marginBottom: 24 }}>Edit Profile</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>Full Name <input value={form.name} onChange={setF('name')} placeholder="Your full name" required /></label>
            <label>Phone Number <input value={form.phone} onChange={setF('phone')} placeholder="+91 98765 43210" required /></label>
            <div className="split-2">
              <label>Flat Number <input value={form.flatNumber} onChange={setF('flatNumber')} placeholder="A-101" required /></label>
              <label>Block <input value={form.block} onChange={setF('block')} placeholder="A" required /></label>
            </div>
            <div style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-gold" disabled={loading} style={{ padding: '12px 28px' }}>
                {loading ? <><span className="spinner" />Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 28, padding: 20, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Account Status</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: </span><span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>Active</span></div>
              <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>User ID: </span><span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{user?.id}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}