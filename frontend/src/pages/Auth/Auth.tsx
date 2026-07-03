import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

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
    <AuthScene>
      <div className="text-center mb-8">
        <LogoMark />
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Welcome back</h1>
        <p className="text-sm text-slate-400 mt-1">Sign in to your apartment dashboard</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label>
          Email address
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </label>
        <Button type="submit" loading={loading} className="w-full mt-2 py-2.5">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-primary-600 font-medium hover:text-primary-700">Create one</Link>
      </p>
    </AuthScene>
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
    <AuthScene wide>
      <div className="text-center mb-8">
        <LogoMark />
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Create account</h1>
        <p className="text-sm text-slate-400 mt-1">Join the Apartment Management System</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="split-2">
          <label>Full Name<input value={form.name} onChange={set('name')} placeholder="Rahul Dittakavi" required /></label>
          <label>Phone<input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" required /></label>
        </div>
        <label>Email address<input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} /></label>
        <div className="split-2">
          <label>
            Role
            <select value={form.role} onChange={set('role')}>
              <option value="RESIDENT">Resident</option>
              <option value="ADMIN">Admin</option>
              <option value="SECURITY">Security</option>
            </select>
          </label>
          <label>Flat Number<input value={form.flatNumber} onChange={set('flatNumber')} placeholder="A-101" required /></label>
        </div>
        <label>Block<input value={form.block} onChange={set('block')} placeholder="A" required /></label>
        <Button type="submit" loading={loading} className="w-full mt-2 py-2.5">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
      </p>
    </AuthScene>
  );
}

function AuthScene({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-card border border-slate-100 p-8 w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}
      >
        {children}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm mx-auto tracking-wide">
      AMS
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
      {message}
    </div>
  );
}
