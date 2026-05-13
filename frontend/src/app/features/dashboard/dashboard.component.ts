import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  label: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page-container">
      <div class="welcome-banner">
        <div class="banner-text">
          <h1>Welcome, {{ user?.name }}!</h1>
          <p>{{ user?.flatNumber }}, Block {{ user?.block }}</p>
        </div>
        <mat-icon class="banner-icon">apartment</mat-icon>
      </div>

      <h2 class="section-title">Quick Access</h2>
      <div class="stats-grid">
        @for (card of visibleCards; track card.label) {
          <mat-card class="stat-card" [routerLink]="card.route">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon-wrap" [style.background]="card.color + '20'">
                  <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
                </div>
                <span class="stat-label">{{ card.label }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }

    .welcome-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1a237e, #3949ab);
      color: white;
      padding: 28px 32px;
      border-radius: 16px;
      margin-bottom: 32px;

      h1 { margin: 0; font-size: 26px; font-weight: 500; }
      p  { margin: 6px 0 0; opacity: 0.75; font-size: 14px; }

      .banner-icon { font-size: 72px; height: 72px; width: 72px; opacity: 0.25; }
    }

    .section-title { margin: 0 0 16px; font-size: 18px; font-weight: 500; color: rgba(0,0,0,0.7); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .stat-card {
      cursor: pointer;
      border-radius: 12px !important;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }

      mat-card-content { padding: 20px 16px !important; }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }

    .stat-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 14px;

      mat-icon { font-size: 28px; height: 28px; width: 28px; }
    }

    .stat-label { font-size: 14px; font-weight: 500; color: rgba(0,0,0,0.7); }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);

  user = this.authService.currentUser?.user;
  role = this.authService.role ?? '';

  private allCards: StatCard[] = [
    { label: 'Complaints',    icon: 'report_problem', color: '#f44336', route: '/complaints'    },
    { label: 'Announcements', icon: 'campaign',       color: '#2196f3', route: '/announcements' },
    { label: 'Amenities',     icon: 'pool',           color: '#4caf50', route: '/amenities'     },
    { label: 'Payments',      icon: 'payment',        color: '#ff9800', route: '/payments'      },
    { label: 'Visitors',      icon: 'people',         color: '#9c27b0', route: '/visitors'      },
    { label: 'Profile',       icon: 'account_circle', color: '#607d8b', route: '/profile'       },
  ];

  get visibleCards(): StatCard[] {
    const roleMap: Record<string, string[]> = {
      ADMIN:    ['Complaints', 'Announcements', 'Amenities', 'Payments', 'Visitors', 'Profile'],
      RESIDENT: ['Complaints', 'Announcements', 'Amenities', 'Payments', 'Profile'],
      SECURITY: ['Announcements', 'Visitors', 'Profile'],
    };
    const allowed = roleMap[this.role] ?? [];
    return this.allCards.filter(c => allowed.includes(c.label));
  }
}
