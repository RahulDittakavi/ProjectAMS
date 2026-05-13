import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Payment } from '../../core/models/payment.model';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>{{ role === 'ADMIN' ? 'Pending Payments' : 'My Payments' }}</h1>
        @if (role === 'RESIDENT') {
          <button mat-raised-button color="primary" (click)="stub()">
            <mat-icon>add</mat-icon> Make Payment
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>payment</mat-icon>
          <p>No payments found</p>
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="items()">
            @if (role === 'ADMIN') {
              <ng-container matColumnDef="residentName">
                <th mat-header-cell *matHeaderCellDef>Resident</th>
                <td mat-cell *matCellDef="let r">{{ r.residentName }}</td>
              </ng-container>
            }
            <ng-container matColumnDef="paymentType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">{{ r.paymentType }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let r">₹{{ r.amount | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="month">
              <th mat-header-cell *matHeaderCellDef>Month</th>
              <td mat-cell *matCellDef="let r">{{ r.month }}</td>
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
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: rgba(0,0,0,0.38); mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 16px; } p { font-size: 18px; margin: 0; } }
  `]
})
export class PaymentsComponent implements OnInit {
  private service = inject(PaymentService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  role = this.authService.role;
  loading = signal(false);
  items = signal<Payment[]>([]);

  get columns(): string[] {
    return this.role === 'ADMIN'
      ? ['residentName', 'paymentType', 'amount', 'month', 'status', 'createdAt']
      : ['paymentType', 'amount', 'month', 'status', 'createdAt'];
  }

  ngOnInit(): void {
    this.loading.set(true);
    const req = this.role === 'ADMIN' ? this.service.getPendingPayments() : this.service.getMyPayments();
    req.subscribe({
      next: res => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  stub(): void {
    this.snackBar.open('Razorpay payment flow — coming soon!', 'OK', { duration: 2000 });
  }
}
