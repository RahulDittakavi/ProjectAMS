import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('RESIDENT');
  const [flatNumber, setFlatNumber] = useState('');
  const [block, setBlock] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/dashboard');
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, phone, role: role as 'ADMIN' | 'RESIDENT' | 'SECURITY', flatNumber, block });
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card wide">
        <h1>Create Account</h1>
        <p>Join Apartment Management System</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full Name
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          <label>
            Phone
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </label>
          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="RESIDENT">Resident</option>
              <option value="ADMIN">Admin</option>
              <option value="SECURITY">Security</option>
            </select>
          </label>
          <div className="split-row">
            <label>
              Flat Number
              <input type="text" value={flatNumber} onChange={(event) => setFlatNumber(event.target.value)} required />
            </label>
            <label>
              Block
              <input type="text" value={block} onChange={(event) => setBlock(event.target.value)} required />
            </label>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/auth/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
