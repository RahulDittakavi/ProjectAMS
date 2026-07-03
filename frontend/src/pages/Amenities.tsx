import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookAmenity, createAmenity, getAmenities, getBookings, updateBookingStatus } from '../api/services';
import type { Amenity, AmenityBooking, BookingStatus } from '../types';
import { Button, Card, Badge, DataTable, Modal, PageHeader, EmptyState, type Column } from '../components/ui';

const STATUSES: BookingStatus[] = ['PENDING','APPROVED','REJECTED','CANCELLED'];

export default function Amenities() {
  const { user } = useAuth();
  const isAdmin    = user?.role === 'ADMIN';
  const isResident = user?.role === 'RESIDENT';

  const [amenities, setAmenities]     = useState<Amenity[]>([]);
  const [bookings, setBookings]       = useState<AmenityBooking[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [createOpen, setCreateOpen]   = useState(false);
  const [bookOpen, setBookOpen]       = useState(false);
  const [statusOpen, setStatusOpen]   = useState(false);
  const [selectedAmenity, setSelectedAmenity]   = useState<Amenity | null>(null);
  const [selectedBooking, setSelectedBooking]   = useState<AmenityBooking | null>(null);
  const [bookingStatus, setBookingStatus]       = useState<BookingStatus>('PENDING');
  const [submitting, setSubmitting]   = useState(false);

  const [amenityForm, setAmenityForm] = useState({ name: '', description: '', capacity: '', openTime: '', closeTime: '' });
  const [bookForm, setBookForm]       = useState({ bookingDate: new Date().toISOString().slice(0,10), startTime: '', endTime: '' });
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
      setSuccess('Amenity created.'); setCreateOpen(false);
      setAmenityForm({ name:'', description:'', capacity:'', openTime:'', closeTime:'' }); await load();
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

  const bookingColumns: Column<AmenityBooking>[] = [
    { key: 'amenity', header: 'Amenity', render: b => <span className="font-medium text-slate-800">{b.amenityName}</span> },
    ...(isAdmin ? [{ key: 'resident', header: 'Resident', render: (b: AmenityBooking) => <span>{b.residentName}</span> }] : []),
    { key: 'date', header: 'Date', render: b => <span>{new Date(b.bookingDate).toLocaleDateString()}</span> },
    { key: 'time', header: 'Time Slot', render: b => <span className="font-mono-dm text-xs">{b.startTime} – {b.endTime}</span> },
    { key: 'status', header: 'Status', render: b => <Badge status={b.status} /> },
    ...(isAdmin ? [{
      key: 'action', header: 'Action',
      render: (b: AmenityBooking) => b.status === 'PENDING'
        ? <Button variant="ghost" size="sm" onClick={() => { setSelectedBooking(b); setBookingStatus(b.status); setStatusOpen(true); }}>Update</Button>
        : <span className="text-xs text-slate-300">{b.status.replace(/_/g,' ')}</span>,
    }] : []),
  ];

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Amenities"
        subtitle="Community facilities and booking management"
        action={isAdmin ? <Button onClick={() => setCreateOpen(true)}>+ Add Amenity</Button> : undefined}
      />

      {error   && <Alert type="error"   message={error}   />}
      {success && <Alert type="success" message={success} />}

      {/* Amenity cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array(3).fill(0).map((_,i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)
          : amenities.length === 0
            ? <div className="col-span-full"><EmptyState icon="🏊" title="No amenities available" /></div>
            : amenities.map(a => (
              <Card key={a.id} className="p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-blue-400" />
                <h3 className="font-semibold text-slate-800 mb-2">{a.name}</h3>
                <div className="flex gap-3 text-xs text-slate-400 mb-3 flex-wrap">
                  {a.capacity  && <span>👥 {a.capacity} capacity</span>}
                  {a.openTime  && <span>🕐 {a.openTime}–{a.closeTime}</span>}
                </div>
                {a.description && <p className="text-sm text-slate-500 leading-relaxed mb-4">{a.description}</p>}
                {isResident && (
                  <Button variant="ghost" size="sm"
                    onClick={() => { setSelectedAmenity(a); setBookForm({ bookingDate: new Date().toISOString().slice(0,10), startTime:'', endTime:'' }); setBookOpen(true); }}>
                    Book Now
                  </Button>
                )}
              </Card>
            ))
        }
      </div>

      {/* Bookings table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">{isAdmin ? 'All Bookings' : 'My Bookings'}</h2>
          <span className="text-xs text-slate-400">{bookings.length} total</span>
        </div>
        <DataTable columns={bookingColumns} data={bookings} keyExtractor={b => b.id} emptyIcon="📅" emptyText="No bookings found" />
      </Card>

      {/* Create Amenity Modal */}
      <Modal open={createOpen} title="Add Amenity" onClose={() => setCreateOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button type="submit" form="amenity-form" loading={submitting}>Create</Button>
        </>}
      >
        <form id="amenity-form" onSubmit={handleCreateAmenity} className="form-grid">
          <label>Name<input value={amenityForm.name} onChange={setAF('name')} placeholder="Swimming Pool" required /></label>
          <label>Description<textarea value={amenityForm.description} onChange={setAF('description')} placeholder="Amenity description…" /></label>
          <label>Capacity<input type="number" min="1" value={amenityForm.capacity} onChange={setAF('capacity')} placeholder="50" /></label>
          <div className="split-2">
            <label>Open Time<input type="time" value={amenityForm.openTime} onChange={setAF('openTime')} /></label>
            <label>Close Time<input type="time" value={amenityForm.closeTime} onChange={setAF('closeTime')} /></label>
          </div>
        </form>
      </Modal>

      {/* Book Amenity Modal */}
      <Modal open={bookOpen} title={`Book — ${selectedAmenity?.name}`} onClose={() => setBookOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button type="submit" form="book-form" loading={submitting}>Confirm Booking</Button>
        </>}
      >
        <form id="book-form" onSubmit={handleBook} className="form-grid">
          <label>Date<input type="date" value={bookForm.bookingDate} onChange={setBF('bookingDate')} required /></label>
          <div className="split-2">
            <label>Start Time<input type="time" value={bookForm.startTime} onChange={setBF('startTime')} required /></label>
            <label>End Time<input type="time" value={bookForm.endTime} onChange={setBF('endTime')} required /></label>
          </div>
        </form>
      </Modal>

      {/* Update Booking Status Modal */}
      <Modal open={statusOpen} title="Update Booking Status" onClose={() => setStatusOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setStatusOpen(false)}>Cancel</Button>
          <Button type="submit" form="bstatus-form" loading={submitting}>Save</Button>
        </>}
      >
        <form id="bstatus-form" onSubmit={handleStatusUpdate} className="form-grid">
          <div className="py-1 text-sm text-slate-500">
            <span className="font-medium text-slate-800">{selectedBooking?.amenityName}</span> — {selectedBooking?.residentName}
          </div>
          <label>New Status
            <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value as BookingStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const cls = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
  return <div className={`border rounded-lg px-4 py-3 text-sm ${cls}`}>{message}</div>;
}
