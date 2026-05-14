import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AmenityService } from '../../core/services/amenity.service';
import { AuthService } from '../../core/services/auth.service';
import { Amenity, AmenityBooking } from '../../core/models/amenity.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';

// ── Create Amenity Dialog (ADMIN) ────────────────────────────────────────────

@Component({
  selector: 'app-create-amenity-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add Amenity</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Swimming Pool">
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Capacity</mat-label>
          <input matInput type="number" formControlName="capacity">
        </mat-form-field>

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Open Time</mat-label>
            <input matInput type="time" formControlName="openTime">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Close Time</mat-label>
            <input matInput type="time" formControlName="closeTime">
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 420px; padding-top: 8px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; mat-form-field { width: 100%; } }
  `]
})
export class CreateAmenityDialogComponent {
  private fb        = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateAmenityDialogComponent>);

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    capacity:    [null],
    openTime:    [''],
    closeTime:   ['']
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }
}

// ── Book Amenity Dialog (RESIDENT) ───────────────────────────────────────────
@Component({
  selector: 'app-book-amenity-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Book {{ amenityName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker"
       formControlName="bookingDate"
       placeholder="Select date"
       [min]="minDate"
       (keydown)="$event.preventDefault()">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if (form.get('bookingDate')?.invalid && form.get('bookingDate')?.touched) {
            <mat-error>Date is required</mat-error>
          }
        </mat-form-field>

        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Start Time</mat-label>
            <input matInput type="time" formControlName="startTime">
            @if (form.get('startTime')?.invalid && form.get('startTime')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End Time</mat-label>
            <input matInput type="time" formControlName="endTime">
            @if (form.get('endTime')?.invalid && form.get('endTime')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Book</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 380px; padding-top: 8px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; mat-form-field { width: 100%; } }
  `]
})
export class BookAmenityDialogComponent {
  private fb        = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BookAmenityDialogComponent>);

  amenityName = '';
  minDate     = new Date();

  form = this.fb.group({
    bookingDate: [null, Validators.required],
    startTime:   ['', Validators.required],
    endTime:     ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.value;
    const date = raw.bookingDate as unknown as Date;
    const pad  = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    this.dialogRef.close({
      bookingDate: formatted,
      startTime:   raw.startTime,
      endTime:     raw.endTime
    });
  }
}

// ── Update Booking Status Dialog (ADMIN) ─────────────────────────────────────
@Component({
  selector: 'app-booking-status-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatButtonModule, MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Update Booking Status</h2>
    <mat-dialog-content style="padding-top: 12px">
      <mat-form-field appearance="outline" style="width: 100%; min-width: 300px">
        <mat-label>Status</mat-label>
        <mat-select [(value)]="selected">
          <mat-option value="PENDING">Pending</mat-option>
          <mat-option value="APPROVED">Approved</mat-option>
          <mat-option value="REJECTED">Rejected</mat-option>
          <mat-option value="CANCELLED">Cancelled</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              (click)="dialogRef.close(selected)">Update</button>
    </mat-dialog-actions>
  `
})
export class BookingStatusDialogComponent {
  dialogRef = inject(MatDialogRef<BookingStatusDialogComponent>);
  selected  = 'PENDING';
}

// ── Main Amenities Component ─────────────────────────────────────────────────
@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [
    DatePipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatTableModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <h1>Amenities</h1>
        @if (role === 'ADMIN') {
          <button mat-raised-button color="primary" (click)="openCreateAmenity()">
            <mat-icon>add</mat-icon> Add Amenity
          </button>
        }
      </div>

      <!-- Amenity Cards -->
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
                <div mat-card-avatar class="amenity-avatar">
                  <mat-icon style="color:white">pool</mat-icon>
                </div>
                <mat-card-title>{{ a.name }}</mat-card-title>
                <mat-card-subtitle>
                  @if (a.capacity) { Capacity: {{ a.capacity }} }
                  @if (a.openTime) { &bull; {{ a.openTime }} – {{ a.closeTime }} }
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ a.description }}</p>
              </mat-card-content>
              @if (role === 'RESIDENT') {
                <mat-card-actions>
                  <button mat-raised-button color="primary"
                          (click)="openBookDialog(a)">
                    <mat-icon>book_online</mat-icon> Book
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
      }

      <!-- Bookings Section -->
      <div class="section-header">
        <h2>{{ role === 'RESIDENT' ? 'My Bookings' : 'All Bookings' }}</h2>
      </div>

      @if (loadingBookings()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else if (bookings().length === 0) {
        <div class="empty-state small">
          <mat-icon>event_busy</mat-icon>
          <p>No bookings yet</p>
        </div>
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="bookings()">

            <ng-container matColumnDef="amenityName">
              <th mat-header-cell *matHeaderCellDef>Amenity</th>
              <td mat-cell *matCellDef="let r">{{ r.amenityName }}</td>
            </ng-container>

            @if (role === 'ADMIN') {
              <ng-container matColumnDef="residentName">
                <th mat-header-cell *matHeaderCellDef>Resident</th>
                <td mat-cell *matCellDef="let r">{{ r.residentName }}</td>
              </ng-container>
            }

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
                <span class="status-badge badge-{{ r.status.toLowerCase() }}">
                  {{ r.status }}
                </span>
              </td>
            </ng-container>

            @if (role === 'ADMIN') {
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let r">
                  @if (r.status === 'PENDING') {
                    <button mat-icon-button color="primary"
                            matTooltip="Update status"
                            (click)="openBookingStatus(r)">
                      <mat-icon>edit</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>
            }

            <tr mat-header-row *matHeaderRowDef="bookingCols()"></tr>
            <tr mat-row *matRowDef="let r; columns: bookingCols();"></tr>
          </table>
        </mat-card>
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
    .amenity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px; margin-bottom: 8px;
    }
    .amenity-card { border-radius: 12px !important; }
    .amenity-avatar {
      background: #1a237e; width: 40px; height: 40px;
      border-radius: 50%; display: flex;
      align-items: center; justify-content: center;
    }
    mat-card-content p { color: rgba(0,0,0,0.6); font-size: 14px; margin: 8px 0 4px; }
    .section-header { margin: 32px 0 16px; h2 { margin: 0; font-size: 20px; } }
    .table-card { border-radius: 12px !important; }
    table { width: 100%; }
    td, th { padding: 12px 16px !important; }
    .loading-center { display: flex; justify-content: center; padding: 32px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px; color: rgba(0,0,0,0.38);
      mat-icon { font-size: 56px; height: 56px; width: 56px; margin-bottom: 12px; }
      p { font-size: 16px; margin: 0; }
    }
    .empty-state.small { padding: 24px; mat-icon { font-size: 40px; height: 40px; width: 40px; } }
  `]
})
export class AmenitiesComponent implements OnInit {
  private service  = inject(AmenityService);
  private auth     = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);

  role             = this.auth.role;
  loadingAmenities = signal(false);
  loadingBookings  = signal(false);
  amenities        = signal<Amenity[]>([]);
  bookings         = signal<AmenityBooking[]>([]);

  bookingCols() {
    return this.role === 'ADMIN'
      ? ['amenityName', 'residentName', 'bookingDate', 'time', 'status', 'actions']
      : ['amenityName', 'bookingDate', 'time', 'status'];
  }

  ngOnInit(): void {
    this.loadAmenities();
    this.loadBookings();
  }

  loadAmenities(): void {
    this.loadingAmenities.set(true);
    this.service.getAll().subscribe({
      next: res => { this.amenities.set(res.data); this.loadingAmenities.set(false); },
      error: ()  => this.loadingAmenities.set(false)
    });
  }

  loadBookings(): void {
    this.loadingBookings.set(true);
    const req = this.role === 'RESIDENT'
      ? this.service.getMyBookings()
      : this.service.getAllBookings();
    req.subscribe({
      next: res => { this.bookings.set(res.data); this.loadingBookings.set(false); },
      error: ()  => this.loadingBookings.set(false)
    });
  }

  openCreateAmenity(): void {
    this.dialog.open(CreateAmenityDialogComponent, { width: '500px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: res => {
            this.amenities.update(list => [...list, res.data]);
            this.snackBar.open('Amenity created!', 'OK', { duration: 3000 });
          },
          error: err =>
            this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 4000 })
        });
      });
  }

  openBookDialog(amenity: Amenity): void {
    const ref = this.dialog.open(BookAmenityDialogComponent, { width: '460px' });
    ref.componentInstance.amenityName = amenity.name;

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.book(amenity.id, result).subscribe({
        next: res => {
          this.bookings.update(list => [res.data, ...list]);
          this.snackBar.open('Booking submitted! Awaiting approval.', 'OK', { duration: 4000 });
        },
        error: err =>
          this.snackBar.open(err.error?.message || 'Booking failed', 'Close', { duration: 4000 })
      });
    });
  }

  openBookingStatus(booking: AmenityBooking): void {
    const ref = this.dialog.open(BookingStatusDialogComponent, { width: '360px' });
    ref.componentInstance.selected = booking.status;

    ref.afterClosed().subscribe(status => {
      if (!status) return;
      this.service.updateBookingStatus(booking.id, { status }).subscribe({
        next: res => {
          this.bookings.update(list =>
            list.map(b => b.id === booking.id ? res.data : b)
          );
          this.snackBar.open('Status updated!', 'OK', { duration: 3000 });
        },
        error: () =>
          this.snackBar.open('Update failed', 'Close', { duration: 3000 })
      });
    });
  }
}