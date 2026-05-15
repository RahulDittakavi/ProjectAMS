import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const navItems = [
  { label: 'Dashboard', route: '/dashboard', roles: ['ADMIN', 'RESIDENT', 'SECURITY'] },
  { label: 'Complaints', route: '/complaints', roles: ['ADMIN', 'RESIDENT'] },
  { label: 'Amenities', route: '/amenities', roles: ['ADMIN', 'RESIDENT'] },
  { label: 'Announcements', route: '/announcements', roles: ['ADMIN', 'RESIDENT', 'SECURITY'] },
  { label: 'Visitors', route: '/visitors', roles: ['ADMIN', 'SECURITY'] },
  { label: 'Payments', route: '/payments', roles: ['ADMIN', 'RESIDENT'] },
  { label: 'Profile', route: '/profile', roles: ['ADMIN', 'RESIDENT', 'SECURITY'] }
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = user ? navItems.filter((item) => item.roles.includes(user.role)) : [];

  return (
    <div className="layout-shell">
      <aside className="layout-sidebar">
        <div className="brand">
          <div className="brand-icon">AMS</div>
          <div className="brand-label">Apartment Management</div>
        </div>
        <div className="user-summary">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <nav className="nav-list">
          {visibleItems.map((item) => (
            <NavLink key={item.route} to={item.route} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div>Apartment Management System</div>
          <button className="logout-button" onClick={() => { logout(); navigate('/auth/login'); }}>
            Logout
          </button>
        </header>
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
