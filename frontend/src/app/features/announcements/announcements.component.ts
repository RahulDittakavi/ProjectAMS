import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AnnouncementService } from '../../core/services/announcement.service';
import { AuthService } from '../../core/services/auth.service';
import { Announcement } from '../../core/models/announcement.model';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-announcement-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>New Announcement</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Announcement title">
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Content</mat-label>
          <textarea matInput formControlName="content" rows="4"
                    placeholder="Write announcement content..."></textarea>
          @if (form.get('content')?.invalid && form.get('content')?.touched) {
            <mat-error>Content is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="NORMAL">Normal</mat-option>
            <mat-option value="URGENT">Urgent</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Post</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .full-width { width: 100%; }
  `]
})
export class CreateAnnouncementDialogComponent {
  
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateAnnouncementDialogComponent>);
  form = this.fb.group({
    title:    ['', Validators.required],
    content:  ['', Validators.required],
    priority: ['NORMAL', Validators.required]
  });

  submit() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.dialogRef.close(this.form.value);
}
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    DatePipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Announcements</h1>
        @if (role === 'ADMIN') {
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
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
                <mat-icon mat-card-avatar
                  [style.color]="a.priority === 'URGENT' ? '#c62828' : '#1a237e'">
                  {{ a.priority === 'URGENT' ? 'warning' : 'campaign' }}
                </mat-icon>
                <mat-card-title>{{ a.title }}</mat-card-title>
                <mat-card-subtitle>
                  By {{ a.adminName }} &bull; {{ a.createdAt | date:'mediumDate' }}
                  <span class="status-badge badge-{{ a.priority.toLowerCase() }}"
                        style="margin-left: 8px">
                    {{ a.priority }}
                  </span>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ a.content }}</p>
              </mat-card-content>
              @if (role === 'ADMIN') {
                <mat-card-actions align="end">
                  <button mat-icon-button color="warn"
                          (click)="delete(a.id)"
                          matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 24px;
      h1 { margin: 0; }
    }
    .announcement-list { display: flex; flex-direction: column; gap: 12px; }
    .announcement-card { border-radius: 12px !important; }
    .announcement-card.urgent { border-left: 4px solid #c62828; }
    mat-card-content p { color: rgba(0,0,0,0.7); line-height: 1.6; margin: 8px 0 0; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px; color: rgba(0,0,0,0.38);
      mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 16px; }
      p { font-size: 18px; margin: 0; }
    }
  `]
})
export class AnnouncementsComponent implements OnInit {
  private service   = inject(AnnouncementService);
  private auth      = inject(AuthService);
  private snackBar  = inject(MatSnackBar);
  private dialog    = inject(MatDialog);

  role    = this.auth.role;
  loading = signal(false);
  items   = signal<Announcement[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateAnnouncementDialogComponent, {
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: res => {
          this.items.update(list => [res.data, ...list]);
          this.snackBar.open('Announcement posted!', 'OK', { duration: 3000 });
        },
        error: err => {
          this.snackBar.open(err.error?.message || 'Failed to post', 'Close', { duration: 4000 });
        }
      });
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this announcement?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.items.update(list => list.filter(a => a.id !== id));
        this.snackBar.open('Deleted', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
    });
  }
}