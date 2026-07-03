import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  complaints: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
    </svg>
  ),
  amenities: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  announcements: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  visitors: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
} as const;

type NavIconKey = keyof typeof Icons;

const NAV = [
  { label: 'Dashboard',     route: '/dashboard',     icon: 'dashboard'     as NavIconKey, roles: ['ADMIN','RESIDENT','SECURITY'] },
  { label: 'Complaints',    route: '/complaints',    icon: 'complaints'    as NavIconKey, roles: ['ADMIN','RESIDENT'] },
  { label: 'Amenities',     route: '/amenities',     icon: 'amenities'     as NavIconKey, roles: ['ADMIN','RESIDENT'] },
  { label: 'Announcements', route: '/announcements', icon: 'announcements' as NavIconKey, roles: ['ADMIN','RESIDENT','SECURITY'] },
  { label: 'Visitors',      route: '/visitors',      icon: 'visitors'      as NavIconKey, roles: ['ADMIN','SECURITY'] },
  { label: 'Payments',      route: '/payments',      icon: 'payments'      as NavIconKey, roles: ['ADMIN','RESIDENT'] },
  { label: 'Profile',       route: '/profile',       icon: 'profile'       as NavIconKey, roles: ['ADMIN','RESIDENT','SECURITY'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = user ? NAV.filter(n => n.roles.includes(user.role)) : [];
  const currentPage = NAV.find(n => location.pathname.startsWith(n.route))?.label ?? 'Dashboard';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 tracking-wide">
            AMS
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 leading-tight">ApartmentOS</div>
            <div className="text-xs text-slate-400">Management Suite</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Navigation
          </div>
          {items.map(item => (
            <NavLink
              key={item.route}
              to={item.route}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <span className="flex-shrink-0">{Icons[item.icon]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-700 truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.role} · {user?.flatNumber}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/auth/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            {Icons.logout}
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">ApartmentOS</span>
            <span className="text-slate-300">›</span>
            <span className="font-medium text-slate-700">{currentPage}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-600">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
