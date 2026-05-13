import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AnnouncementService } from '../../core/services/announcement.service';
import { AuthService } from '../../core/services/auth.service';
import { Announcement } from '../../core/models/announcement.model';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    DatePipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Announcements</h1>
        @if (role === 'ADMIN') {
          <button mat-raised-button color="primary" (click)="stub()">
            <mat-icon>add</mat-icon> New Announcement
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>campaign</mat-icon>
          <p>No announcements yet</p>
        </div>
      } @else {
        <div class="announcement-list">
          @for (a of items(); track a.id) {
            <mat-card class="announcement-card" [class.urgent]="a.priority === 'URGENT'">
              <mat-card-header>
                <mat-icon mat-card-avatar [style.color]="a.priority === 'URGENT' ? '#c62828' : '#1a237e'">
                  {{ a.priority === 'URGENT' ? 'warning' : 'campaign' }}
                </mat-icon>
                <mat-card-title>{{ a.title }}</mat-card-title>
                <mat-card-subtitle>
                  By {{ a.adminName }} &bull; {{ a.createdAt | date:'mediumDate' }}
                  <span class="status-badge badge-{{ a.priority.toLowerCase() }}" style="margin-left: 8px">
                    {{ a.priority }}
                  </span>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ a.content }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; h1 { margin: 0; } }
    .announcement-list { display: flex; flex-direction: column; gap: 12px; }
    .announcement-card { border-radius: 12px !important; }
    .announcement-card.urgent { border-left: 4px solid #c62828; }
    mat-card-content p { color: rgba(0,0,0,0.7); line-height: 1.6; margin: 8px 0 0; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: rgba(0,0,0,0.38); mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 16px; } p { font-size: 18px; margin: 0; } }
  `]
})
export class AnnouncementsComponent implements OnInit {
  private service = inject(AnnouncementService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  role = this.authService.role;
  loading = signal(false);
  items = signal<Announcement[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  stub(): void {
    this.snackBar.open('Create announcement — coming soon!', 'OK', { duration: 2000 });
  }
}
