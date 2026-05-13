export type UserRole = 'ADMIN' | 'RESIDENT' | 'SECURITY';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  flatNumber: string;
  block: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone: string;
  flatNumber: string;
  block: string;
}
