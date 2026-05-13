import { UserResponse } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'ADMIN' | 'RESIDENT' | 'SECURITY';
  flatNumber: string;
  block: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}
