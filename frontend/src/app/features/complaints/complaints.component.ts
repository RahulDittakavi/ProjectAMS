import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ComplaintService } from '../../core/services/complaint.service';
import { AuthService } from '../../core/services/auth.service';
import { Complaint } from '../../core/models/complaint.model';

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [
    DatePipe, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Complaints</h1>
        @if (role === 'RESIDENT') {
          <button mat-raised-button color="primary" (click)="stub()">
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
        <mat-card>
          <table mat-table [dataSource]="items()">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let r">{{ r.title }}</td>
            </ng-container>
            <ng-container matColumnDef="residentName">
              <th mat-header-cell *matHeaderCellDef>Resident</th>
              <td mat-cell *matCellDef="let r">{{ r.residentName }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let r">{{ r.category }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="status-badge badge-{{ r.status.toLowerCase() }}">{{ r.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'mediumDate' }}</td>
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
    table { width: 100%; }
    td, th { padding: 12px 16px !important; }
  `]
})
export class ComplaintsComponent implements OnInit {
  private service = inject(ComplaintService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  role = this.authService.role;
  loading = signal(false);
  items = signal<Complaint[]>([]);

  get columns(): string[] {
    return this.role === 'RESIDENT'
      ? ['title', 'category', 'status', 'createdAt']
      : ['title', 'residentName', 'category', 'status', 'createdAt'];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const req = this.role === 'RESIDENT' ? this.service.getMy() : this.service.getAll();
    req.subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  stub(): void {
    this.snackBar.open('Create complaint — coming soon!', 'OK', { duration: 2000 });
  }
}
