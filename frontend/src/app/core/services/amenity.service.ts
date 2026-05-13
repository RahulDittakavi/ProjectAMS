import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  Amenity, CreateAmenityRequest, AmenityBooking,
  BookingRequest, BookingStatusUpdateRequest
} from '../models/amenity.model';

@Injectable({ providedIn: 'root' })
export class AmenityService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/amenities`;

  getAll(): Observable<ApiResponse<Amenity[]>> {
    return this.http.get<ApiResponse<Amenity[]>>(this.api);
  }

  create(request: CreateAmenityRequest): Observable<ApiResponse<Amenity>> {
    return this.http.post<ApiResponse<Amenity>>(this.api, request);
  }

  book(amenityId: number, request: BookingRequest): Observable<ApiResponse<AmenityBooking>> {
    return this.http.post<ApiResponse<AmenityBooking>>(`${this.api}/${amenityId}/book`, request);
  }

  getMyBookings(): Observable<ApiResponse<AmenityBooking[]>> {
    return this.http.get<ApiResponse<AmenityBooking[]>>(`${this.api}/bookings/my`);
  }

  getAllBookings(): Observable<ApiResponse<AmenityBooking[]>> {
    return this.http.get<ApiResponse<AmenityBooking[]>>(`${this.api}/bookings`);
  }

  updateBookingStatus(bookingId: number, request: BookingStatusUpdateRequest): Observable<ApiResponse<AmenityBooking>> {
    return this.http.put<ApiResponse<AmenityBooking>>(`${this.api}/bookings/${bookingId}/status`, request);
  }
}
