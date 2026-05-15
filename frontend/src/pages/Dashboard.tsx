import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const cards = [
  { label: 'Complaints', route: '/complaints' },
  { label: 'Announcements', route: '/announcements' },
  { label: 'Amenities', route: '/amenities' },
  { label: 'Payments', route: '/payments' },
  { label: 'Visitors', route: '/visitors' },
  { label: 'Profile', route: '/profile' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const visibleCards = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return cards;
    if (user.role === 'RESIDENT') return cards.filter((item) => item.label !== 'Visitors');
    return cards.filter((item) => ['Announcements', 'Visitors', 'Profile'].includes(item.label));
  }, [user]);

  return (
    <div>
      <section className="page-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p>Flat {user?.flatNumber}, Block {user?.block}</p>
        </div>
      </section>

      <div className="grid-cards">
        {visibleCards.map((card) => (
          <button key={card.route} className="stat-card" onClick={() => navigate(card.route)}>
            <span>{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
