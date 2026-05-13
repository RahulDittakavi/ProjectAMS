export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Amenity {
  id: number;
  name: string;
  description: string;
  capacity: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

export interface CreateAmenityRequest {
  name: string;
  description: string;
  capacity: number;
  openTime: string;
  closeTime: string;
}

export interface AmenityBooking {
  id: number;
  amenityId: number;
  amenityName: string;
  residentId: number;
  residentName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingRequest {
  bookingDate: string;
  startTime: string;
  endTime: string;
}

export interface BookingStatusUpdateRequest {
  status: BookingStatus;
}
