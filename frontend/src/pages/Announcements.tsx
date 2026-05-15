import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from '../api/services';
import type { Announcement, AnnouncementPriority } from '../types';
import Modal from '../components/Modal';

const priorities: AnnouncementPriority[] = ['NORMAL', 'URGENT'];

function formatPriority(priority: AnnouncementPriority) {
  return priority === 'URGENT' ? 'Urgent' : 'Normal';
}

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setAnnouncements(await getAnnouncements());
      } catch {
        setError('Unable to load announcements.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const announcement = await createAnnouncement({ title, content, priority });
      setAnnouncements((current) => [announcement, ...current]);
      setOpenCreate(false);
      setTitle('');
      setContent('');
      setPriority('NORMAL');
    } catch {
      setError('Could not post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((current) => current.filter((item) => item.id !== id));
    } catch {
      setError('Unable to delete announcement.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        {isAdmin && (
          <button className="secondary-button" onClick={() => setOpenCreate(true)}>
            New Announcement
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading announcements...</div>
      ) : (
        <div className="cards-grid">
          {announcements.length === 0 ? (
            <div className="empty-state">No announcements available.</div>
          ) : (
            announcements.map((item) => (
              <article className={`announcement-card ${item.priority === 'URGENT' ? 'urgent' : ''}`} key={item.id}>
                <div className="announcement-title">{item.title}</div>
                <div className="announcement-meta">
                  <span>{item.adminName}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <span className={`status-badge badge-${item.priority.toLowerCase()}`}>{formatPriority(item.priority)}</span>
                </div>
                <p>{item.content}</p>
                {isAdmin && (
                  <div className="announcement-actions">
                    <button type="button" className="secondary-button" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      <Modal open={openCreate} title="New Announcement" onClose={() => setOpenCreate(false)} footer={
        <>
          <button type="button" className="secondary-button" onClick={() => setOpenCreate(false)}>
            Cancel
          </button>
          <button type="submit" form="announcement-form" className="primary-button" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </>
      }>
        <form id="announcement-form" onSubmit={handleCreate} className="panel-form">
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Content
            <textarea value={content} onChange={(event) => setContent(event.target.value)} required />
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as AnnouncementPriority)}>
              {priorities.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}
