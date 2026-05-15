import { FormEvent, useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../api/services';
import type { UpdateProfileRequest, User } from '../types';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [block, setBlock] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();
        setUser(profile);
        setName(profile.name);
        setPhone(profile.phone);
        setFlatNumber(profile.flatNumber);
        setBlock(profile.block);
      } catch {
        setError('Unable to load profile.');
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const updated = await updateProfile({ name, phone, flatNumber, block });
      setUser(updated);
      setMessage('Profile updated successfully.');
    } catch {
      setError('Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Profile</h1></div>
      <div className="page-split">
        <div className="panel">
          <h2>Basic Information</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Joined:</strong> {user ? new Date(user.createdAt).toLocaleDateString() : ''}</p>
        </div>
        <div className="panel">
          <h2>Edit Profile</h2>
          <form onSubmit={handleSubmit} className="panel-form">
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label>
              Flat Number
              <input value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required />
            </label>
            <label>
              Block
              <input value={block} onChange={(e) => setBlock(e.target.value)} required />
            </label>
            {message && <div className="form-success">{message}</div>}
            {error && <div className="form-error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
