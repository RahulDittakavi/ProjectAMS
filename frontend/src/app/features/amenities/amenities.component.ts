import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AmenityService } from '../../core/services/amenity.service';
import { AuthService } from '../../core/services/auth.service';
import { Amenity, AmenityBooking } from '../../core/models/amenity.model';

@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Amenities</h1>
        @if (role === 'ADMIN') {
          <button mat-raised-button color="primary" (click)="stub('Create amenity')">
            <mat-icon>add</mat-icon> Add Amenity
          </button>
        }
      </div>

      <h3>Available Amenities</h3>
      @if (loadingAmenities()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (amenities().length === 0) {
        <div class="empty-state">
          <mat-icon>pool</mat-icon>
          <p>No amenities available</p>
        </div>
      } @else {
        <div class="amenity-grid">
          @for (a of amenities(); track a.id) {
            <mat-card class="amenity-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>pool</mat-icon>
                <mat-card-title>{{ a.name }}</mat-card-title>
                <mat-card-subtitle>Capacity: {{ a.capacity }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ a.description }}</p>
                @if (a.openTime) { <p class="time-info">{{ a.openTime }} – {{ a.closeTime }}</p> }
              </mat-card-content>
              <mat-card-actions>
                @if (role === 'RESIDENT') {
                  <button mat-button color="primary" (click)="stub('Book ' + a.name)">
                    <mat-icon>book_online</mat-icon> Book
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      <h3 style="margin-top: 32px">
        {{ role === 'RESIDENT' ? 'My Bookings' : 'All Bookings' }}
      </h3>
      @if (loadingBookings()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (bookings().length === 0) {
        <div class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <p>No bookings found</p>
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="bookings()">
            <ng-container matColumnDef="amenityName">
              <th mat-header-cell *matHeaderCellDef>Amenity</th>
              <td mat-cell *matCellDef="let r">{{ r.amenityName }}</td>
            </ng-container>
            <ng-container matColumnDef="bookingDate">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.bookingDate }}</td>
            </ng-container>
            <ng-container matColumnDef="time">
              <th mat-header-cell *matHeaderCellDef>Time</th>
              <td mat-cell *matCellDef="let r">{{ r.startTime }} – {{ r.endTime }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="status-badge badge-{{ r.status.toLowerCase() }}">{{ r.status }}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="bookingCols"></tr>
            <tr mat-row *matRowDef="let r; columns: bookingCols;"></tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; h1 { margin: 0; } }
    .amenity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 8px; }
    .amenity-card mat-card-content p { color: rgba(0,0,0,0.6); font-size: 14px; margin: 8px 0 4px; }
    .time-info { color: #1a237e !important; font-size: 13px !important; }
    table { width: 100%; }
    td, th { padding: 12px 16px !important; }
    .loading-center { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px; color: rgba(0,0,0,0.38); mat-icon { font-size: 48px; height: 48px; width: 48px; } }
  `]
})
export class AmenitiesComponent implements OnInit {
  private service = inject(AmenityService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  role = this.authService.role;
  loadingAmenities = signal(false);
  loadingBookings = signal(false);
  amenities = signal<Amenity[]>([]);
  bookings = signal<AmenityBooking[]>([]);
  bookingCols = ['amenityName', 'bookingDate', 'time', 'status'];

  ngOnInit(): void {
    this.loadAmenities();
    this.loadBookings();
  }

  loadAmenities(): void {
    this.loadingAmenities.set(true);
    this.service.getAll().subscribe({
      next: res => { this.amenities.set(res.data); this.loadingAmenities.set(false); },
      error: () => this.loadingAmenities.set(false)
    });
  }

  loadBookings(): void {
    this.loadingBookings.set(true);
    const req = this.role === 'RESIDENT' ? this.service.getMyBookings() : this.service.getAllBookings();
    req.subscribe({
      next: res => { this.bookings.set(res.data); this.loadingBookings.set(false); },
      error: () => this.loadingBookings.set(false)
    });
  }

  stub(action: string): void {
    this.snackBar.open(`${action} — coming soon!`, 'OK', { duration: 2000 });
  }
}
