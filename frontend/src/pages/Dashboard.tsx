import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaints, getAnnouncements, getPayments } from '../api/services';
import './Dashboard.css';

const CARDS = [
  { label: 'Complaints', route: '/complaints', icon: '🔧', desc: 'Report & track issues', roles: ['ADMIN','RESIDENT'], color: '#ef4444' },
  { label: 'Amenities', route: '/amenities', icon: '🏊', desc: 'Book facilities', roles: ['ADMIN','RESIDENT'], color: '#3b82f6' },
  { label: 'Announcements', route: '/announcements', icon: '📢', desc: 'Community updates', roles: ['ADMIN','RESIDENT','SECURITY'], color: '#f59e0b' },
  { label: 'Payments', route: '/payments', icon: '💳', desc: 'Dues & history', roles: ['ADMIN','RESIDENT'], color: '#10b981' },
  { label: 'Visitors', route: '/visitors', icon: '🚶', desc: 'Gate management', roles: ['ADMIN','SECURITY'], color: '#8b5cf6' },
  { label: 'Profile', route: '/profile', icon: '👤', desc: 'Your account', roles: ['ADMIN','RESIDENT','SECURITY'], color: '#d4a853' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ complaints: 0, announcements: 0, payments: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      getComplaints(user.role),
      getAnnouncements(),
      getPayments(user.role),
    ]).then(([c, a, p]) => {
      setStats({
        complaints: c.status === 'fulfilled' ? c.value.length : 0,
        announcements: a.status === 'fulfilled' ? a.value.length : 0,
        payments: p.status === 'fulfilled' ? p.value.length : 0,
      });
    });
  }, [user]);

  const visibleCards = CARDS.filter(c => c.roles.includes(user?.role ?? ''));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="dashboard animate-in">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <div className="dash-greeting">{greeting}</div>
          <h1 className="dash-name">{user?.name}</h1>
          <div className="dash-meta">
            <span className="meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Flat {user?.flatNumber}, Block {user?.block}
            </span>
            <span className="meta-chip">
              <span className="live-dot" />
              {user?.role}
            </span>
          </div>
        </div>
        <div className="dash-hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">{stats.complaints}</div>
            <div className="hero-stat-lbl">Items</div>
          </div>
          <div className="hero-stat-div" />
          <div className="hero-stat">
            <div className="hero-stat-num">{stats.announcements}</div>
            <div className="hero-stat-lbl">Notices</div>
          </div>
          <div className="hero-stat-div" />
          <div className="hero-stat">
            <div className="hero-stat-num">{stats.payments}</div>
            <div className="hero-stat-lbl">Payments</div>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="dash-section-label">Quick Access</div>
      <div className="dash-grid">
        {visibleCards.map((card, i) => (
          <button
            key={card.route}
            className="dash-card"
            onClick={() => navigate(card.route)}
            style={{ '--card-color': card.color, animationDelay: `${i * 0.06}s` } as any}
          >
            <div className="dash-card-icon">{card.icon}</div>
            <div className="dash-card-label">{card.label}</div>
            <div className="dash-card-desc">{card.desc}</div>
            <div className="dash-card-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}