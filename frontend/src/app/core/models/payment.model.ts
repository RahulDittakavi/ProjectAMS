export type PaymentType = 'MAINTENANCE' | 'AMENITY_BOOKING';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Payment {
  id: number;
  residentId: number;
  residentName: string;
  amount: number;
  paymentType: PaymentType;
  status: PaymentStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  month: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  amount: number;
  paymentType: PaymentType;
  month: string;
}

export interface OrderResponse {
  paymentId: number;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
