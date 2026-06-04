export type UserRole = 'ADMIN' | 'RESIDENT' | 'SECURITY';
export interface User { id: number; name: string; email: string; phone: string; role: UserRole; flatNumber: string; block: string; isActive: boolean; createdAt: string; }
export interface AuthResponse { token: string; user: User; }
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; phone: string; role: UserRole; flatNumber: string; block: string; }

export type AnnouncementPriority = 'NORMAL' | 'URGENT';
export interface Announcement { id: number; adminId: number; adminName: string; title: string; content: string; priority: AnnouncementPriority; createdAt: string; }
export interface CreateAnnouncementRequest { title: string; content: string; priority: AnnouncementPriority; }

export type ComplaintCategory = 'PLUMBING' | 'ELECTRICAL' | 'CLEANING' | 'NOISE' | 'OTHER';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export interface Complaint { id: number; residentId: number; residentName: string; title: string; description: string; category: ComplaintCategory; status: ComplaintStatus; createdAt: string; updatedAt: string; }
export interface CreateComplaintRequest { title: string; description: string; category: ComplaintCategory; }
export interface UpdateComplaintStatusRequest { status: ComplaintStatus; }

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export interface Amenity { id: number; name: string; description: string; capacity: number; openTime: string; closeTime: string; isActive: boolean; }
export interface CreateAmenityRequest { name: string; description: string; capacity: number; openTime: string; closeTime: string; }
export interface AmenityBooking { id: number; amenityId: number; amenityName: string; residentId: number; residentName: string; bookingDate: string; startTime: string; endTime: string; status: BookingStatus; createdAt: string; }
export interface BookingRequest { bookingDate: string; startTime: string; endTime: string; }
export interface UpdateBookingStatusRequest { status: BookingStatus; }

export type PaymentType = 'MAINTENANCE' | 'AMENITY_BOOKING';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export interface Payment { id: number; residentId: number; residentName: string; amount: number; paymentType: PaymentType; status: PaymentStatus; razorpayOrderId: string; razorpayPaymentId: string; month: string; createdAt: string; }

export interface Visitor { id: number; name: string; phone: string; purpose: string; flatToVisit: string; loggedById: number; loggedByName: string; entryTime: string; exitTime: string | null; }
export interface CreateVisitorRequest { name: string; phone: string; purpose: string; flatToVisit: string; }
export interface UpdateProfileRequest { name: string; phone: string; flatNumber: string; block: string; }