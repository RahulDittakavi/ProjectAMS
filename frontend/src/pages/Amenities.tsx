import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookAmenity, createAmenity, getAmenities, getBookings, updateBookingStatus } from '../api/services';
import type { Amenity, AmenityBooking, BookingStatus } from '../types';
import Modal from '../components/Modal';

const STATUSES: BookingStatus[] = ['PENDING','APPROVED','REJECTED','CANCELLED'];
const fmt = (s: string) => s.replace(/_/g,' ');

export default function Amenities() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isResident = user?.role === 'RESIDENT';

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AmenityBooking | null>(null);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('PENDING');
  const [submitting, setSubmitting] = useState(false);

  const [amenityForm, setAmenityForm] = useState({ name: '', description: '', capacity: '', openTime: '', closeTime: '' });
  const [bookForm, setBookForm] = useState({ bookingDate: new Date().toISOString().slice(0,10), startTime: '', endTime: '' });
  const setAF = (k: string) => (e: any) => setAmenityForm(f => ({ ...f, [k]: e.target.value }));
  const setBF = (k: string) => (e: any) => setBookForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([getAmenities(), getBookings(user?.role ?? 'RESIDENT')]);
      setAmenities(a); setBookings(b);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleCreateAmenity = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await createAmenity({ ...amenityForm, capacity: Number(amenityForm.capacity) });
      setSuccess('Amenity created.'); setCreateOpen(false); setAmenityForm({ name:'',description:'',capacity:'',openTime:'',closeTime:'' });
      await load();
    } catch { setError('Failed to create amenity.'); }
    finally { setSubmitting(false); }
  };

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;
    setError(''); setSubmitting(true);
    try {
      await bookAmenity(selectedAmenity.id, bookForm);
      setSuccess('Amenity booked!'); setBookOpen(false); await load();
    } catch { setError('Booking failed — slot may be taken.'); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmitting(true); setError('');
    try {
      await updateBookingStatus(selectedBooking.id, { status: bookingStatus });
      setSuccess('Status updated.'); setStatusOpen(false); await load();
    } catch { setError('Failed to update status.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Amenities</h1>
          <p className="page-subtitle">Community facilities and booking management</p>
        </div>
        {isAdmin && <button className="btn btn-gold" onClick={() => setCreateOpen(true)}>+ Add Amenity</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Amenity Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {loading ? Array(3).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />) :
        amenities.length === 0 ? <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-icon">🏊</div><div className="empty-text">No amenities available</div></div> :
        amenities.map(a => (
          <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--accent-blue))' }} />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{a.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {a.capacity && <span>👥 Capacity: {a.capacity}</span>}
              {a.openTime && <span>🕐 {a.openTime}–{a.closeTime}</span>}
            </div>
            {a.description && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.description}</p>}
            {isResident && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                onClick={() => { setSelectedAmenity(a); setBookForm({ bookingDate: new Date().toISOString().slice(0,10), startTime:'', endTime:'' }); setBookOpen(true); }}>
                Book Now
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bookings */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem' }}>{isAdmin ? 'All Bookings' : 'My Bookings'}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bookings.length} total</span>
        </div>
        {bookings.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-text">No bookings found</div></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Amenity</th>{isAdmin && <th>Resident</th>}<th>Date</th><th>Time Slot</th><th>Status</th>{isAdmin && <th>Action</th>}</tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{b.amenityName}</td>
                    {isAdmin && <td>{b.residentName}</td>}
                    <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}>{b.startTime} – {b.endTime}</td>
                    <td><span className={`badge badge-${b.status.toLowerCase()}`}>{fmt(b.status)}</span></td>
                    {isAdmin && (
                      <td>{b.status === 'PENDING' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedBooking(b); setBookingStatus(b.status); setStatusOpen(true); }}>Update</button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{fmt(b.status)}</span>}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Amenity Modal */}
      <Modal open={createOpen} title="Add Amenity" onClose={() => setCreateOpen(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button><button className="btn btn-gold" type="submit" form="amenity-form" disabled={submitting}>{submitting ? <><span className="spinner" />Creating…</> : 'Create'}</button></>}>
        <form id="amenity-form" onSubmit={handleCreateAmenity} className="form-grid">
          <label>Name <input value={amenityForm.name} onChange={setAF('name')} placeholder="Swimming Pool" required /></label>
          <label>Description <textarea value={amenityForm.description} onChange={setAF('description')} placeholder="Amenity description…" /></label>
          <label>Capacity <input type="number" min="1" value={amenityForm.capacity} onChange={setAF('capacity')} placeholder="50" /></label>
          <div className="split-2">
            <label>Open Time <input type="time" value={amenityForm.openTime} onChange={setAF('openTime')} /></label>
            <label>Close Time <input type="time" value={amenityForm.closeTime} onChange={setAF('closeTime')} /></label>
          </div>
        </form>
      </Modal>

      {/* Book Amenity Modal */}
      <Modal open={bookOpen} title={`Book — ${selectedAmenity?.name}`} onClose={() => setBookOpen(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setBookOpen(false)}>Cancel</button><button className="btn btn-gold" type="submit" form="book-form" disabled={submitting}>{submitting ? <><span className="spinner" />Booking…</> : 'Confirm Booking'}</button></>}>
        <form id="book-form" onSubmit={handleBook} className="form-grid">
          <label>Date <input type="date" value={bookForm.bookingDate} onChange={setBF('bookingDate')} required /></label>
          <div className="split-2">
            <label>Start Time <input type="time" value={bookForm.startTime} onChange={setBF('startTime')} required /></label>
            <label>End Time <input type="time" value={bookForm.endTime} onChange={setBF('endTime')} required /></label>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal open={statusOpen} title="Update Booking Status" onClose={() => setStatusOpen(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setStatusOpen(false)}>Cancel</button><button className="btn btn-gold" type="submit" form="bstatus-form" disabled={submitting}>{submitting ? <><span className="spinner" />Saving…</> : 'Save'}</button></>}>
        <form id="bstatus-form" onSubmit={handleStatusUpdate} className="form-grid">
          <div style={{ padding: '8px 0 4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{selectedBooking?.amenityName}</strong> — {selectedBooking?.residentName}
          </div>
          <label>New Status
            <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value as BookingStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}