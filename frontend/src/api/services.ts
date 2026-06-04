import axios from 'axios';
import type { Amenity, AmenityBooking, Announcement, Complaint, Payment, User, Visitor, BookingRequest, BookingStatus, ComplaintStatus, CreateAmenityRequest, CreateAnnouncementRequest, CreateComplaintRequest, CreateVisitorRequest, UpdateProfileRequest } from '../types';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('ams_auth');
  if (raw) {
    try {
      const auth = JSON.parse(raw);
      config.headers = { ...config.headers, Authorization: `Bearer ${auth.token}` } as any;
    } catch { localStorage.removeItem('ams_auth'); }
  }
  return config;
});

const d = <T>(r: { data: { data: T } }) => r.data.data;

export const getAnnouncements = () => api.get<any>('/announcements').then(d<Announcement[]>);
export const createAnnouncement = (p: CreateAnnouncementRequest) => api.post<any>('/announcements', p).then(d<Announcement>);
export const deleteAnnouncement = (id: number) => api.delete(`/announcements/${id}`);

export const getAmenities = () => api.get<any>('/amenities').then(d<Amenity[]>);
export const createAmenity = (p: CreateAmenityRequest) => api.post<any>('/amenities', p).then(d<Amenity>);
export const getBookings = (role: string) => api.get<any>(role === 'RESIDENT' ? '/amenities/bookings/my' : '/amenities/bookings').then(d<AmenityBooking[]>);
export const bookAmenity = (id: number, p: BookingRequest) => api.post<any>(`/amenities/${id}/book`, p).then(d<AmenityBooking>);
export const updateBookingStatus = (id: number, p: { status: BookingStatus }) => api.put<any>(`/amenities/bookings/${id}/status`, p).then(d<AmenityBooking>);

export const getComplaints = (role: string) => api.get<any>(role === 'RESIDENT' ? '/complaints/my' : '/complaints').then(d<Complaint[]>);
export const createComplaint = (p: CreateComplaintRequest) => api.post<any>('/complaints', p).then(d<Complaint>);
export const updateComplaintStatus = (id: number, p: { status: ComplaintStatus }) => api.put<any>(`/complaints/${id}/status`, p).then(d<Complaint>);

export const getPayments = (role: string) => api.get<any>(role === 'RESIDENT' ? '/payments/my' : '/payments/pending').then(d<Payment[]>);

export const getVisitors = (role: string) => api.get<any>(role === 'ADMIN' ? '/visitors' : '/visitors/active').then(d<Visitor[]>);
export const logVisitorEntry = (p: CreateVisitorRequest) => api.post<any>('/visitors', p).then(d<Visitor>);
export const logVisitorExit = (id: number) => api.put<any>(`/visitors/${id}/exit`, {}).then(d<Visitor>);

export const getProfile = () => api.get<any>('/users/me').then(d<User>);
export const updateProfile = (p: UpdateProfileRequest) => api.put<any>('/users/me', p).then(d<User>);

export const authLogin = (p: { email: string; password: string }) => api.post<any>('/auth/login', p).then(r => r.data.data);
export const authRegister = (p: any) => api.post<any>('/auth/register', p).then(r => r.data.data);