import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  bookAmenity,
  createAmenity,
  getAmenities,
  getBookings,
  updateBookingStatus
} from '../api/services';
import type { Amenity, AmenityBooking, BookingStatus } from '../types';
import Modal from '../components/Modal';

const bookingStatuses: BookingStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

export default function Amenities() {
  const { user } = useAuth();
  const role = user?.role ?? 'RESIDENT';
  const isAdmin = role === 'ADMIN';
  const isResident = role === 'RESIDENT';

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AmenityBooking | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');

  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('PENDING');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAmenities();
    loadBookings();
  }, [role]);

  const loadAmenities = async () => {
    setLoadingAmenities(true);
    setError('');
    try {
      setAmenities(await getAmenities());
    } catch {
      setError('Unable to load amenities.');
    } finally {
      setLoadingAmenities(false);
    }
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    setError('');
    try {
      setBookings(await getBookings(role));
    } catch {
      setError('Unable to load bookings.');
    } finally {
      setLoadingBookings(false);
    }
  };

  const resetCreateForm = () => {
    setName('');
    setDescription('');
    setCapacity('');
    setOpenTime('');
    setCloseTime('');
  };

  const handleCreateAmenity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const amenity = await createAmenity({
        name,
        description,
        capacity: Number(capacity),
        openTime,
        closeTime
      });
      setAmenities((current) => [...current, amenity]);
      setCreateOpen(false);
      resetCreateForm();
      setMessage('Amenity created successfully.');
    } catch {
      setError('Unable to create amenity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBook = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setBookingDate(new Date().toISOString().slice(0, 10));
    setStartTime('');
    setEndTime('');
    setBookOpen(true);
  };

  const handleBookAmenity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (!selectedAmenity) {
      setError('Amenity not selected.');
      setSubmitting(false);
      return;
    }

    try {
      const booking = await bookAmenity(selectedAmenity.id, {
        bookingDate,
        startTime,
        endTime
      });
      setBookings((current) => [booking, ...current]);
      setBookOpen(false);
      setMessage('Amenity booked successfully.');
    } catch {
      setError('Unable to submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (booking: AmenityBooking) => {
    setSelectedBooking(booking);
    setBookingStatus(booking.status);
    setStatusOpen(true);
  };

  const handleUpdateBookingStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBooking) return;

    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const updated = await updateBookingStatus(selectedBooking.id, { status: bookingStatus });
      setBookings((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setStatusOpen(false);
      setMessage('Booking status updated.');
    } catch {
      setError('Unable to update booking status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Amenities</h1>
          <p>Manage amenities and bookings for your community.</p>
        </div>
        {isAdmin && (
          <button className="secondary-button" onClick={() => setCreateOpen(true)}>
            Add Amenity
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="form-success">{message}</div>}

      {loadingAmenities ? (
        <div className="empty-state">Loading amenities...</div>
      ) : amenities.length === 0 ? (
        <div className="empty-state">No amenities available.</div>
      ) : (
        <div className="amenity-grid">
          {amenities.map((amenity) => (
            <div key={amenity.id} className="announcement-card">
              <div className="announcement-title">{amenity.name}</div>
              <div className="meta" style={{ marginBottom: 12 }}>
                {amenity.capacity ? `Capacity: ${amenity.capacity}` : 'Capacity: N/A'}
                <br />
                {amenity.openTime && amenity.closeTime ? `${amenity.openTime} - ${amenity.closeTime}` : 'Hours: N/A'}
              </div>
              <p>{amenity.description}</p>
              {isResident && (
                <button className="secondary-button" type="button" onClick={() => handleOpenBook(amenity)}>
                  Book
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{ marginTop: 24 }}>
        <h2>{isAdmin ? 'All Bookings' : 'My Bookings'}</h2>
        {loadingBookings ? (
          <div className="empty-state">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No bookings yet.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Amenity</th>
                  {isAdmin && <th>Resident</th>}
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.amenityName}</td>
                    {isAdmin && <td>{booking.residentName}</td>}
                    <td>{formatDate(booking.bookingDate)}</td>
                    <td>{`${booking.startTime} - ${booking.endTime}`}</td>
                    <td>
                      <span className={`status-badge badge-${booking.status.toLowerCase()}`}>
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        {booking.status === 'PENDING' ? (
                          <button type="button" className="secondary-button" onClick={() => openStatusModal(booking)}>
                            Update Status
                          </button>
                        ) : (
                          <span>{formatStatus(booking.status)}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        title="Add Amenity"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="create-amenity-form" className="primary-button" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </>
        }
      >
        <form id="create-amenity-form" onSubmit={handleCreateAmenity} className="panel-form">
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label>
            Capacity
            <input type="number" min="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
          </label>
          <div className="split-row">
            <label>
              Open Time
              <input type="time" value={openTime} onChange={(event) => setOpenTime(event.target.value)} />
            </label>
            <label>
              Close Time
              <input type="time" value={closeTime} onChange={(event) => setCloseTime(event.target.value)} />
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={bookOpen}
        title={selectedAmenity ? `Book ${selectedAmenity.name}` : 'Book Amenity'}
        onClose={() => setBookOpen(false)}
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setBookOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="book-amenity-form" className="primary-button" disabled={submitting}>
              {submitting ? 'Booking...' : 'Book'}
            </button>
          </>
        }
      >
        <form id="book-amenity-form" onSubmit={handleBookAmenity} className="panel-form">
          <label>
            Date
            <input type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} required />
          </label>
          <div className="split-row">
            <label>
              Start Time
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
            </label>
            <label>
              End Time
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={statusOpen}
        title="Update Booking Status"
        onClose={() => setStatusOpen(false)}
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setStatusOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="status-form" className="primary-button" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form id="status-form" onSubmit={handleUpdateBookingStatus} className="panel-form">
          <label>
            Status
            <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value as BookingStatus)}>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>{formatStatus(status)}</option>
              ))}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}
