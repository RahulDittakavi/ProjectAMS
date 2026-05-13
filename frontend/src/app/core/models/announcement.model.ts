export type AnnouncementPriority = 'NORMAL' | 'URGENT';

export interface Announcement {
  id: number;
  adminId: number;
  adminName: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority: AnnouncementPriority;
}
