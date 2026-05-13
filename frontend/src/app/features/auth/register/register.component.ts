import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule,
    MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-logo">
            <mat-icon>apartment</mat-icon>
          </div>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join Apartment Management System</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="name" placeholder="John Doe">
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <mat-error>Name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput formControlName="email" type="email">
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Valid email is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput formControlName="password" [type]="showPwd() ? 'text' : 'password'">
              <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
                <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Minimum 6 characters required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone</mat-label>
              <mat-icon matPrefix>phone</mat-icon>
              <input matInput formControlName="phone" placeholder="9876543210">
              @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
                <mat-error>Phone is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="RESIDENT">Resident</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="SECURITY">Security</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="form-row-2">
              <mat-form-field appearance="outline">
                <mat-label>Flat Number</mat-label>
                <mat-icon matPrefix>home</mat-icon>
                <input matInput formControlName="flatNumber" placeholder="A101">
                @if (form.get('flatNumber')?.invalid && form.get('flatNumber')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Block</mat-label>
                <input matInput formControlName="block" placeholder="A">
                @if (form.get('block')?.invalid && form.get('block')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              } @else {
                Create Account
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="card-actions">
          <span>Already have an account?</span>
          <a routerLink="/auth/login">Sign In</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #7986cb 100%);
      padding: 24px 16px;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      border-radius: 16px !important;
      padding: 8px;
    }
    .auth-logo {
      display: flex; justify-content: center; width: 100%; margin-bottom: 8px;
      mat-icon { font-size: 52px; height: 52px; width: 52px; color: #1a237e; }
    }
    mat-card-header { flex-direction: column; align-items: center; text-align: center; }
    mat-card-title { font-size: 24px !important; margin-top: 8px !important; }
    .auth-form { display: flex; flex-direction: column; gap: 4px; margin-top: 24px; }
    .full-width { width: 100%; }
    .form-row-2 {
      display: grid; grid-template-columns: 2fr 1fr; gap: 12px;
      mat-form-field { width: 100%; }
    }
    .submit-btn {
      height: 48px; font-size: 15px; margin-top: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-actions {
      display: flex; justify-content: center; gap: 8px;
      padding: 16px !important; font-size: 14px;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  showPwd = signal(false);

  form = this.fb.group({
    name:        ['', Validators.required],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(6)]],
    phone:       ['', Validators.required],
    role:        ['RESIDENT', Validators.required],
    flatNumber:  ['', Validators.required],
    block:       ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.authService.register(this.form.value as RegisterRequest).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message || 'Registration failed.', 'Close', { duration: 4000 });
      }
    });
  }
}
