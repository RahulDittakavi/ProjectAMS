import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
        [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="!(isHandset$ | async)">

        <div class="sidenav-header">
          <mat-icon class="logo-icon">apartment</mat-icon>
          <span class="logo-text">AMS</span>
        </div>

        <div class="user-chip">
          <mat-icon>account_circle</mat-icon>
          <div>
            <div class="user-name-text">{{ user?.name }}</div>
            <div class="user-role-text">{{ user?.role }}</div>
          </div>
        </div>

        <mat-nav-list>
          @for (item of visibleNav; track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active-nav"
               (click)="closeIfMobile(drawer)">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          @if (isHandset$ | async) {
            <button mat-icon-button (click)="drawer.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="toolbar-title">Apartment Management System</span>
          <span class="spacer"></span>
          <button mat-icon-button matTooltip="Logout" (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <div class="main-content">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }

    .sidenav {
      width: 240px;
      background: #1a237e;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 12px;
      background: rgba(0,0,0,0.2);

      .logo-icon { font-size: 28px; height: 28px; width: 28px; }
      .logo-text { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      margin-bottom: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.1);

      mat-icon { opacity: 0.7; font-size: 28px; height: 28px; width: 28px; }
      .user-name-text { font-size: 13px; font-weight: 500; }
      .user-role-text { font-size: 11px; opacity: 0.6; margin-top: 1px; }
    }

    mat-nav-list { padding-top: 4px; }

    a[mat-list-item] {
      color: rgba(255,255,255,0.75) !important;
      border-radius: 0 24px 24px 0;
      margin-right: 12px;
      margin-bottom: 2px;
      transition: background 0.2s;

      mat-icon { color: rgba(255,255,255,0.6); }

      &.active-nav {
        background: rgba(255,255,255,0.18) !important;
        color: white !important;
        mat-icon { color: white; }
      }

      &:hover { background: rgba(255,255,255,0.1) !important; }
    }

    .toolbar { position: sticky; top: 0; z-index: 100; }
    .toolbar-title { font-size: 17px; font-weight: 500; }
    .spacer { flex: 1; }

    .main-content {
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
    }
  `]
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(r => r.matches));

  user = this.authService.currentUser?.user;
  role = this.authService.role ?? '';

  private navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',      route: '/dashboard',     roles: ['ADMIN', 'RESIDENT', 'SECURITY'] },
    { label: 'Complaints',    icon: 'report_problem', route: '/complaints',    roles: ['ADMIN', 'RESIDENT'] },
    { label: 'Amenities',     icon: 'pool',           route: '/amenities',     roles: ['ADMIN', 'RESIDENT'] },
    { label: 'Announcements', icon: 'campaign',       route: '/announcements', roles: ['ADMIN', 'RESIDENT', 'SECURITY'] },
    { label: 'Visitors',      icon: 'people',         route: '/visitors',      roles: ['ADMIN', 'SECURITY'] },
    { label: 'Payments',      icon: 'payment',        route: '/payments',      roles: ['ADMIN', 'RESIDENT'] },
    { label: 'Profile',       icon: 'account_circle', route: '/profile',       roles: ['ADMIN', 'RESIDENT', 'SECURITY'] },
  ];

  get visibleNav(): NavItem[] {
    return this.navItems.filter(item => item.roles.includes(this.role));
  }

  closeIfMobile(drawer: { close: () => void }): void {
    this.breakpointObserver.observe(Breakpoints.Handset).subscribe(r => {
      if (r.matches) drawer.close();
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
