import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComplaintService } from '../../core/services/complaint.service';
import { AuthService } from '../../core/services/auth.service';
import { Complaint } from '../../core/models/complaint.model';
import { StatusLabelPipe } from '../../core/pipes/status-label.pipe';

// ── Create Complaint Dialog ──────────────────────────────────────────────────
@Component({
  selector: 'app-create-complaint-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Raise a Complaint</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Brief title of the issue">
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option value="PLUMBING">Plumbing</mat-option>
            <mat-option value="ELECTRICAL">Electrical</mat-option>
            <mat-option value="CLEANING">Cleaning</mat-option>
            <mat-option value="NOISE">Noise</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
          @if (form.get('category')?.invalid && form.get('category')?.touched) {
            <mat-error>Category is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4"
                    placeholder="Describe the issue in detail..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Submit</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 420px; padding-top: 8px; }
    .full-width { width: 100%; }
  `]
})
export class CreateComplaintDialogComponent {
  private fb         = inject(FormBuilder);
  private dialogRef  = inject(MatDialogRef<CreateComplaintDialogComponent>);

  form = this.fb.group({
    title:       ['', Validators.required],
    category:    ['', Validators.required],
    description: ['']
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }
}

// ── Update Status Dialog (ADMIN) ─────────────────────────────────────────────
@Component({
  selector: 'app-update-status-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatButtonModule, MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Update Status</h2>
    <mat-dialog-content style="padding-top: 12px">
      <mat-form-field appearance="outline" style="width: 100%; min-width: 300px">
        <mat-label>New Status</mat-label>
        <mat-select [(value)]="selected">
          <mat-option value="OPEN">Open</mat-option>
          <mat-option value="IN_PROGRESS">In Progress</mat-option>
          <mat-option value="RESOLVED">Resolved</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(selected)">Update</button>
    </mat-dialog-actions>
  `
})
export class UpdateStatusDialogComponent {
  dialogRef = inject(MatDialogRef<UpdateStatusDialogComponent>);
  selected  = 'OPEN';
}

// ── Main Complaints Component ────────────────────────────────────────────────
@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [
    DatePipe, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatChipsModule, MatTooltipModule,
    StatusLabelPipe
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Complaints</h1>
        @if (role === 'RESIDENT') {
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon> New Complaint
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>report_problem</mat-icon>
          <p>No complaints found</p>
        </div>
      } @else {
        <div class="complaints-grid">
          @for (c of items(); track c.id) {
            <mat-card class="complaint-card">
              <mat-card-header>
                <div mat-card-avatar class="category-icon"
                     [style.background]="categoryColor(c.category)">
                  <mat-icon style="color:white; font-size:20px; line-height:40px">
                    {{ categoryIcon(c.category) }}
                  </mat-icon>
                </div>
                <mat-card-title>{{ c.title }}</mat-card-title>
                <mat-card-subtitle>
                  @if (role === 'ADMIN') { {{ c.residentName }} &bull; }
                  {{ c.createdAt | date:'mediumDate' }}
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                @if (c.description) {
                  <p class="description">{{ c.description }}</p>
                }
                <div class="meta-row">
                  <span class="category-chip">{{ c.category }}</span>
                  <span class="status-badge badge-{{ c.status.toLowerCase() }}">
                    {{ c.status | statusLabel }}
                  </span>
                </div>
              </mat-card-content>

              @if (role === 'ADMIN' && c.status !== 'RESOLVED') {
                <mat-card-actions align="end">
                  <button mat-stroked-button color="primary"
                          (click)="openStatusDialog(c)">
                    <mat-icon>edit</mat-icon> Update Status
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
    .complaints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .complaint-card { border-radius: 12px !important; }
    .category-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .description {
      color: rgba(0,0,0,0.65); font-size: 14px;
      line-height: 1.5; margin: 8px 0;
    }
    .meta-row {
      display: flex; align-items: center;
      gap: 8px; margin-top: 8px;
    }
    .category-chip {
      background: #e8eaf6; color: #3949ab;
      padding: 3px 10px; border-radius: 12px;
      font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px; color: rgba(0,0,0,0.38);
      mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 16px; }
      p { font-size: 18px; margin: 0; }
    }
  `]
})
export class ComplaintsComponent implements OnInit {
  private service  = inject(ComplaintService);
  private auth     = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);

  role    = this.auth.role;
  loading = signal(false);
  items   = signal<Complaint[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const req = this.role === 'RESIDENT'
      ? this.service.getMy()
      : this.service.getAll();
    req.subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  openCreateDialog(): void {
    this.dialog.open(CreateComplaintDialogComponent, { width: '500px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: res => {
            this.items.update(list => [res.data, ...list]);
            this.snackBar.open('Complaint submitted!', 'OK', { duration: 3000 });
          },
          error: err =>
            this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 4000 })
        });
      });
  }

  openStatusDialog(complaint: Complaint): void {
    const ref = this.dialog.open(UpdateStatusDialogComponent, { width: '360px' });
    ref.componentInstance.selected = complaint.status;

    ref.afterClosed().subscribe(status => {
      if (!status) return;
      this.service.updateStatus(complaint.id, { status }).subscribe({
        next: res => {
          this.items.update(list =>
            list.map(c => c.id === complaint.id ? res.data : c)
          );
          this.snackBar.open('Status updated!', 'OK', { duration: 3000 });
        },
        error: () =>
          this.snackBar.open('Update failed', 'Close', { duration: 3000 })
      });
    });
  }

  categoryIcon(cat: string): string {
    const map: Record<string, string> = {
      PLUMBING: 'plumbing', ELECTRICAL: 'electrical_services',
      CLEANING: 'cleaning_services', NOISE: 'volume_up', OTHER: 'report_problem'
    };
    return map[cat] ?? 'report_problem';
  }

  categoryColor(cat: string): string {
    const map: Record<string, string> = {
      PLUMBING: '#1565c0', ELECTRICAL: '#f57f17',
      CLEANING: '#2e7d32', NOISE: '#6a1b9a', OTHER: '#c62828'
    };
    return map[cat] ?? '#555';
  }
}