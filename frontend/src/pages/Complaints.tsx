import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createComplaint, getComplaints, updateComplaintStatus } from '../api/services';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import Modal from '../components/Modal';

const categories: ComplaintCategory[] = ['PLUMBING', 'ELECTRICAL', 'CLEANING', 'NOISE', 'OTHER'];
const statuses: ComplaintStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

export default function Complaints() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';
  const isAdmin = user?.role === 'ADMIN';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('PLUMBING');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('OPEN');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setComplaints(await getComplaints(user?.role ?? 'RESIDENT'));
      } catch {
        setError('Unable to load complaints.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const refresh = async () => {
    setComplaints(await getComplaints(user?.role ?? 'RESIDENT'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createComplaint({ title, description, category });
      setTitle('');
      setDescription('');
      await refresh();
    } catch {
      setError('Could not submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setSelectedStatus(complaint.status);
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeComplaint) return;

    setSubmitting(true);
    setError('');

    try {
      await updateComplaintStatus(activeComplaint.id, { status: selectedStatus });
      setStatusModalOpen(false);
      await refresh();
    } catch {
      setError('Could not update complaint status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Complaints</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      {isResident && (
        <div className="panel">
          <h2>Submit a Complaint</h2>
          <form onSubmit={handleSubmit} className="panel-form">
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)}>
                {categories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Complaint'}</button>
          </form>
        </div>
      )}

      <div className="panel">
        <h2>{isAdmin ? 'All Complaints' : 'Your Complaints'}</h2>
        {complaints.length === 0 ? (
          <div className="empty-state">No complaints found.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  {isAdmin && <th>Resident</th>}
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>{complaint.title}</td>
                    {isAdmin && <td>{complaint.residentName}</td>}
                    <td>{complaint.category}</td>
                    <td>
                      <span className={`status-badge badge-${complaint.status.toLowerCase()}`}>{formatStatus(complaint.status)}</span>
                    </td>
                    <td>{new Date(complaint.updatedAt).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        {complaint.status !== 'RESOLVED' ? (
                          <button type="button" className="secondary-button" onClick={() => openStatusModal(complaint)}>
                            Update Status
                          </button>
                        ) : (
                          <span>Resolved</span>
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
        open={statusModalOpen}
        title="Update Status"
        onClose={() => setStatusModalOpen(false)}
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="status-form" className="primary-button" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form id="status-form" onSubmit={handleStatusUpdate} className="panel-form">
          <label>
            Status
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as ComplaintStatus)}>
              {statuses.map((option) => (
                <option key={option} value={option}>{formatStatus(option)}</option>
              ))}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}
