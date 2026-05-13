import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VisitorService } from '../../core/services/visitor.service';
import { AuthService } from '../../core/services/auth.service';
import { Visitor } from '../../core/models/visitor.model';

@Component({
  selector: 'app-visitors',
  standalone: true,
  imports: [
    DatePipe, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Visitors</h1>
      </div>

      @if (role === 'SECURITY') {
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Log Visitor Entry</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="entryForm" (ngSubmit)="logEntry()" class="entry-form">
              <mat-form-field appearance="outline">
                <mat-label>Visitor Name</mat-label>
                <input matInput formControlName="name">
                @if (entryForm.get('name')?.invalid && entryForm.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Flat to Visit</mat-label>
                <input matInput formControlName="flatToVisit" placeholder="B202">
                @if (entryForm.get('flatToVisit')?.invalid && entryForm.get('flatToVisit')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Purpose</mat-label>
                <input matInput formControlName="purpose">
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="submitting()">
                @if (submitting()) { <mat-spinner diameter="18"></mat-spinner> } @else { Log Entry }
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (loading()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>people</mat-icon>
          <p>No visitors found</p>
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="items()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Visitor</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>
            <ng-container matColumnDef="flatToVisit">
              <th mat-header-cell *matHeaderCellDef>Flat</th>
              <td mat-cell *matCellDef="let r">{{ r.flatToVisit }}</td>
            </ng-container>
            <ng-container matColumnDef="purpose">
              <th mat-header-cell *matHeaderCellDef>Purpose</th>
              <td mat-cell *matCellDef="let r">{{ r.purpose }}</td>
            </ng-container>
            <ng-container matColumnDef="entryTime">
              <th mat-header-cell *matHeaderCellDef>Entry</th>
              <td mat-cell *matCellDef="let r">{{ r.entryTime | date:'shortTime' }}</td>
            </ng-container>
            <ng-container matColumnDef="exitTime">
              <th mat-header-cell *matHeaderCellDef>Exit</th>
              <td mat-cell *matCellDef="let r">
                @if (r.exitTime) { {{ r.exitTime | date:'shortTime' }} }
                @else if (role === 'SECURITY') {
                  <button mat-stroked-button color="accent" (click)="logExit(r.id)">Log Exit</button>
                } @else { <span class="status-badge badge-open">Inside</span> }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let r; columns: columns;"></tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; h1 { margin: 0; } }
    .form-card { margin-bottom: 24px; border-radius: 12px !important; }
    .entry-form { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; align-items: start; margin-top: 12px; }
    table { width: 100%; }
    td, th { padding: 12px 16px !important; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: rgba(0,0,0,0.38); mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 16px; } p { font-size: 18px; margin: 0; } }
  `]
})
export class VisitorsComponent implements OnInit {
  private service = inject(VisitorService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  role = this.authService.role;
  loading = signal(false);
  submitting = signal(false);
  items = signal<Visitor[]>([]);
  columns = ['name', 'flatToVisit', 'purpose', 'entryTime', 'exitTime'];

  entryForm = this.fb.group({
    name:        ['', Validators.required],
    phone:       [''],
    flatToVisit: ['', Validators.required],
    purpose:     ['']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const req = this.role === 'ADMIN' ? this.service.getAll() : this.service.getActive();
    req.subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  logEntry(): void {
    if (this.entryForm.invalid) { this.entryForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.service.logEntry(this.entryForm.value as any).subscribe({
      next: res => {
        this.submitting.set(false);
        this.snackBar.open('Visitor entry logged', 'OK', { duration: 3000 });
        this.entryForm.reset();
        this.items.update(list => [res.data, ...list]);
      },
      error: err => {
        this.submitting.set(false);
        this.snackBar.open(err.error?.message || 'Failed to log entry', 'Close', { duration: 4000 });
      }
    });
  }

  logExit(id: number): void {
    this.service.logExit(id).subscribe({
      next: res => {
        this.snackBar.open('Exit logged', 'OK', { duration: 2000 });
        this.items.update(list => list.map(v => v.id === id ? res.data : v));
      },
      error: () => this.snackBar.open('Failed to log exit', 'Close', { duration: 3000 })
    });
  }
}
