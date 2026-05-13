import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Announcement, CreateAnnouncementRequest } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/announcements`;

  getAll(): Observable<ApiResponse<Announcement[]>> {
    return this.http.get<ApiResponse<Announcement[]>>(this.api);
  }

  create(request: CreateAnnouncementRequest): Observable<ApiResponse<Announcement>> {
    return this.http.post<ApiResponse<Announcement>>(this.api, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`);
  }
}
