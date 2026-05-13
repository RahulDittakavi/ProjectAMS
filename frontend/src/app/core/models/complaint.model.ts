export type ComplaintCategory = 'PLUMBING' | 'ELECTRICAL' | 'CLEANING' | 'NOISE' | 'OTHER';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface Complaint {
  id: number;
  residentId: number;
  residentName: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintRequest {
  title: string;
  description: string;
  category: ComplaintCategory;
}

export interface UpdateComplaintStatusRequest {
  status: ComplaintStatus;
}
