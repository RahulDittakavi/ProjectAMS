import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaints, getAnnouncements, getBookings, getMyDues } from '../api/services';
import { StatCard, Card } from '../components/ui';

const NAV_CARDS = [
  { label: 'Complaints',    route: '/complaints',    icon: '🔧', desc: 'Report & track issues',      roles: ['ADMIN','RESIDENT'] },
  { label: 'Amenities',     route: '/amenities',     icon: '🏊', desc: 'Book community facilities',  roles: ['ADMIN','RESIDENT'] },
  { label: 'Announcements', route: '/announcements', icon: '📢', desc: 'Community notices',          roles: ['ADMIN','RESIDENT','SECURITY'] },
  { label: 'Payments',      route: '/payments',      icon: '💳', desc: 'Dues & payment history',     roles: ['ADMIN','RESIDENT'] },
  { label: 'Visitors',      route: '/visitors',      icon: '🚶', desc: 'Gate entry management',      roles: ['ADMIN','SECURITY'] },
  { label: 'Profile',       route: '/profile',       icon: '👤', desc: 'Your account settings',      roles: ['ADMIN','RESIDENT','SECURITY'] },
];

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto flex-shrink-0 text-slate-300 group-hover:text-primary-400 transition-colors">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [stats, setStats] = useState({ openComplaints: 0, totalComplaints: 0, myBookings: 0, announcements: 0, unpaidDues: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const isResident = user.role === 'RESIDENT';
    Promise.allSettled([
      getComplaints(user.role),
      getBookings(user.role),
      getAnnouncements(),
      isResident ? getMyDues() : Promise.resolve([]),
    ]).then(([complaints, bookings, announcements, dues]) => {
      const cList = complaints.status === 'fulfilled' ? complaints.value : [];
      const bList = bookings.status   === 'fulfilled' ? bookings.value   : [];
      const aList = announcements.status === 'fulfilled' ? announcements.value : [];
      const dList = dues.status       === 'fulfilled' ? dues.value       : [];
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        openComplaints: cList.filter((c: any) => c.status === 'OPEN').length,
        totalComplaints: cList.length,
        myBookings: bList.filter((b: any) =>
          (b.status === 'PENDING' || b.status === 'APPROVED') && b.bookingDate >= today
        ).length,
        announcements: aList.length,
        unpaidDues: dList.length,
      });
    }).finally(() => setLoading(false));
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const visibleCards = NAV_CARDS.filter(c => c.roles.includes(user?.role ?? ''));

  return (
    <div className="animate-in space-y-6">
      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-slate-400">{greeting}</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-0.5">{user?.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              Flat {user?.flatNumber}, Block {user?.block}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              {user?.role}
            </span>
          </div>
        </div>
        <div className="text-4xl select-none">🏢</div>
      </div>

      {/* Live Stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin ? (
            <>
              <StatCard label="Total Complaints" value={stats.totalComplaints} icon={<ComplaintIcon />} color="blue" />
              <StatCard label="Open Complaints"  value={stats.openComplaints}  icon={<AlertIcon />}    color="red" />
              <StatCard label="Announcements"    value={stats.announcements}   icon={<BellIcon />}     color="indigo" />
              <StatCard label="Active Bookings"  value={stats.myBookings}      icon={<CalIcon />}      color="green" />
            </>
          ) : (
            <>
              <StatCard label="Open Complaints"     value={stats.openComplaints}  icon={<AlertIcon />}    color="red" />
              <StatCard label="Upcoming Bookings"   value={stats.myBookings}      icon={<CalIcon />}      color="green" />
              <StatCard label="Announcements"       value={stats.announcements}   icon={<BellIcon />}     color="blue" />
              <StatCard label="Unpaid Dues" value={stats.unpaidDues} icon={<CardIcon />} color={stats.unpaidDues > 0 ? 'amber' : 'green'} />
            </>
          )}
        </div>
      )}

      {/* Quick Access */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleCards.map(card => (
            <button
              key={card.route}
              onClick={() => navigate(card.route)}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all text-left group"
            >
              <span className="text-xl">{card.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-700 group-hover:text-primary-700 transition-colors">{card.label}</div>
                <div className="text-xs text-slate-400 truncate">{card.desc}</div>
              </div>
              <ArrowIcon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ComplaintIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const AlertIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>;
const BellIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const CalIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const CardIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
