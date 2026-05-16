import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const NAV = [
  { label: 'Dashboard', route: '/dashboard', icon: '⬡', roles: ['ADMIN','RESIDENT','SECURITY'] },
  { label: 'Complaints', route: '/complaints', icon: '◈', roles: ['ADMIN','RESIDENT'] },
  { label: 'Amenities', route: '/amenities', icon: '◎', roles: ['ADMIN','RESIDENT'] },
  { label: 'Announcements', route: '/announcements', icon: '◉', roles: ['ADMIN','RESIDENT','SECURITY'] },
  { label: 'Visitors', route: '/visitors', icon: '◈', roles: ['ADMIN','SECURITY'] },
  { label: 'Payments', route: '/payments', icon: '◇', roles: ['ADMIN','RESIDENT'] },
  { label: 'Profile', route: '/profile', icon: '○', roles: ['ADMIN','RESIDENT','SECURITY'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = user ? NAV.filter(n => n.roles.includes(user.role)) : [];
  const currentPage = NAV.find(n => location.pathname.startsWith(n.route))?.label ?? 'Dashboard';

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <span>AMS</span>
          </div>
          <div className="brand-text">
            <div className="brand-name">ApartmentOS</div>
            <div className="brand-sub">Management Suite</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {items.map(item => (
            <NavLink key={item.route} to={item.route}
              className={({ isActive }) => `nav-item${isActive ? ' nav-active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {location.pathname.startsWith(item.route) && <span className="nav-pip" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-meta">{user?.role} · {user?.flatNumber}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={() => { logout(); navigate('/auth/login'); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar-left">
            <div className="breadcrumb">
              <span className="breadcrumb-home">ApartmentOS</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{currentPage}</span>
            </div>
          </div>
          <div className="top-bar-right">
            <div className="top-bar-badge">
              <span className="live-dot" />
              Live
            </div>
            <div className="top-user-chip">
              <div className="top-user-avatar">{initials}</div>
              <span>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}