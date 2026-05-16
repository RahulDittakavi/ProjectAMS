import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err: any) { setError(err?.response?.data?.message || err?.message || 'Sign in failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-scene">
      <div className="auth-bg-pattern" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">AMS</div>
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-sub">Sign in to your apartment dashboard</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 18 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? <><span className="spinner" />Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-link">
          Don't have an account? <Link to="/auth/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'RESIDENT', flatNumber: '', block: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await register(form); navigate('/dashboard'); }
    catch (err: any) { setError(err?.response?.data?.message || err?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-scene">
      <div className="auth-bg-pattern" />
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <div className="auth-logo-mark">AMS</div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Join the Apartment Management System</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 18 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="split-2">
            <label>Full Name <input value={form.name} onChange={set('name')} placeholder="Rahul Dittakavi" required /></label>
            <label>Phone <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required /></label>
          </div>
          <label>Email address <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required /></label>
          <label>Password <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} /></label>
          <div className="split-2">
            <label>
              Role
              <select value={form.role} onChange={set('role')}>
                <option value="RESIDENT">Resident</option>
                <option value="ADMIN">Admin</option>
                <option value="SECURITY">Security</option>
              </select>
            </label>
            <label>Flat Number <input value={form.flatNumber} onChange={set('flatNumber')} placeholder="A-101" required /></label>
          </div>
          <label>Block <input value={form.block} onChange={set('block')} placeholder="A" required /></label>
          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? <><span className="spinner" />Creating account…</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer-link">
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}