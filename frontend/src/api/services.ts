import api from './apiClient';
import type {
  Announcement,
  Amenity,
  AmenityBooking,
  BookingRequest,
  BookingStatus,
  Complaint,
  CreateAnnouncementRequest,
  CreateAmenityRequest,
  CreateComplaintRequest,
  CreateVisitorRequest,
  Payment,
  UpdateBookingStatusRequest,
  UpdateComplaintStatusRequest,
  UpdateProfileRequest,
  User,
  Visitor
} from '../types';

export async function getAnnouncements() {
  const response = await api.get<{ success: boolean; message: string; data: Announcement[] }>('/announcements');
  return response.data.data;
}

export async function createAnnouncement(payload: CreateAnnouncementRequest) {
  const response = await api.post<{ success: boolean; message: string; data: Announcement }>('/announcements', payload);
  return response.data.data;
}

export async function deleteAnnouncement(id: number) {
  const response = await api.delete<{ success: boolean; message: string; data: void }>(`/announcements/${id}`);
  return response.data;
}

export async function getAmenities() {
  const response = await api.get<{ success: boolean; message: string; data: Amenity[] }>('/amenities');
  return response.data.data;
}

export async function createAmenity(payload: CreateAmenityRequest) {
  const response = await api.post<{ success: boolean; message: string; data: Amenity }>('/amenities', payload);
  return response.data.data;
}

export async function getBookings(role: string) {
  const path = role === 'RESIDENT' ? '/amenities/bookings/my' : '/amenities/bookings';
  const response = await api.get<{ success: boolean; message: string; data: AmenityBooking[] }>(path);
  return response.data.data;
}

export async function bookAmenity(amenityId: number, payload: BookingRequest) {
  const response = await api.post<{ success: boolean; message: string; data: AmenityBooking }>(`/amenities/${amenityId}/book`, payload);
  return response.data.data;
}

export async function updateBookingStatus(id: number, payload: UpdateBookingStatusRequest) {
  const response = await api.put<{ success: boolean; message: string; data: AmenityBooking }>(`/amenities/bookings/${id}/status`, payload);
  return response.data.data;
}

export async function getComplaints(role: string) {
  const path = role === 'RESIDENT' ? '/complaints/my' : '/complaints';
  const response = await api.get<{ success: boolean; message: string; data: Complaint[] }>(path);
  return response.data.data;
}

export async function createComplaint(payload: CreateComplaintRequest) {
  const response = await api.post<{ success: boolean; message: string; data: Complaint }>('/complaints', payload);
  return response.data.data;
}

export async function updateComplaintStatus(id: number, payload: UpdateComplaintStatusRequest) {
  const response = await api.put<{ success: boolean; message: string; data: Complaint }>(`/complaints/${id}/status`, payload);
  return response.data.data;
}

export async function getPayments(role: string) {
  const path = role === 'RESIDENT' ? '/payments/my' : '/payments/pending';
  const response = await api.get<{ success: boolean; message: string; data: Payment[] }>(path);
  return response.data.data;
}

export async function getVisitors(role: string) {
  const path = role === 'ADMIN' ? '/visitors' : '/visitors/active';
  const response = await api.get<{ success: boolean; message: string; data: Visitor[] }>(path);
  return response.data.data;
}

export async function logVisitorEntry(payload: CreateVisitorRequest) {
  const response = await api.post<{ success: boolean; message: string; data: Visitor }>('/visitors', payload);
  return response.data.data;
}

export async function logVisitorExit(id: number) {
  const response = await api.put<{ success: boolean; message: string; data: Visitor }>(`/visitors/${id}/exit`, {});
  return response.data.data;
}

export async function getProfile() {
  const response = await api.get<{ success: boolean; message: string; data: User }>('/users/me');
  return response.data.data;
}

export async function updateProfile(payload: UpdateProfileRequest) {
  const response = await api.put<{ success: boolean; message: string; data: User }>('/users/me', payload);
  return response.data.data;
}
