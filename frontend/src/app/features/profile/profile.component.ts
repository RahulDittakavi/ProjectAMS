import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header"><h1>My Profile</h1></div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else {
        <div class="profile-layout">
          <mat-card class="info-card">
            <mat-card-content>
              <div class="avatar-section">
                <div class="avatar">{{ initials }}</div>
                <div>
                  <div class="user-name">{{ user()?.name }}</div>
                  <div class="user-email">{{ user()?.email }}</div>
                  <span class="status-badge badge-approved">{{ user()?.role }}</span>
                </div>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <mat-icon>home</mat-icon>
                  <div>
                    <div class="info-label">Flat</div>
                    <div class="info-value">{{ user()?.flatNumber }}, Block {{ user()?.block }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <mat-icon>phone</mat-icon>
                  <div>
                    <div class="info-label">Phone</div>
                    <div class="info-value">{{ user()?.phone }}</div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="edit-card">
            <mat-card-header><mat-card-title>Edit Profile</mat-card-title></mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="save()" class="edit-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Full Name</mat-label>
                  <mat-icon matPrefix>person</mat-icon>
                  <input matInput formControlName="name">
                  @if (form.get('name')?.invalid && form.get('name')?.touched) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Phone</mat-label>
                  <mat-icon matPrefix>phone</mat-icon>
                  <input matInput formControlName="phone">
                </mat-form-field>
                <div class="row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Flat Number</mat-label>
                    <input matInput formControlName="flatNumber">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Block</mat-label>
                    <input matInput formControlName="block">
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                  @if (saving()) { <mat-spinner diameter="18"></mat-spinner> } @else { Save Changes }
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { margin-bottom: 24px; h1 { margin: 0; } }

    .profile-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
      align-items: start;

      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }

    .info-card, .edit-card { border-radius: 12px !important; }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1a237e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 500;
      flex-shrink: 0;
    }

    .user-name { font-size: 18px; font-weight: 500; }
    .user-email { font-size: 13px; color: rgba(0,0,0,0.6); margin: 2px 0 6px; }

    .info-grid { display: flex; flex-direction: column; gap: 16px; }
    .info-item {
      display: flex; align-items: center; gap: 12px;
      mat-icon { color: #3949ab; }
      .info-label { font-size: 12px; color: rgba(0,0,0,0.5); }
      .info-value { font-size: 14px; font-weight: 500; }
    }

    .edit-form { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; mat-form-field { width: 100%; } }

    .loading-center { display: flex; justify-content: center; padding: 64px; }
  `]
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  user = signal<UserResponse | null>(null);

  form = this.fb.group({
    name:       ['', Validators.required],
    phone:      [''],
    flatNumber: [''],
    block:      ['']
  });

  get initials(): string {
    return (this.user()?.name ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: res => {
        this.user.set(res.data);
        this.form.patchValue(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.userService.updateMe(this.form.value as any).subscribe({
      next: res => {
        this.user.set(res.data);
        this.saving.set(false);
        this.snackBar.open('Profile updated successfully!', 'OK', { duration: 3000 });
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message || 'Update failed', 'Close', { duration: 4000 });
      }
    });
  }
}
