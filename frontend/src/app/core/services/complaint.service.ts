import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Complaint, CreateComplaintRequest, UpdateComplaintStatusRequest } from '../models/complaint.model';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/complaints`;

  getAll(): Observable<ApiResponse<Complaint[]>> {
    return this.http.get<ApiResponse<Complaint[]>>(this.api);
  }

  getMy(): Observable<ApiResponse<Complaint[]>> {
    return this.http.get<ApiResponse<Complaint[]>>(`${this.api}/my`);
  }

  create(request: CreateComplaintRequest): Observable<ApiResponse<Complaint>> {
    return this.http.post<ApiResponse<Complaint>>(this.api, request);
  }

  updateStatus(id: number, request: UpdateComplaintStatusRequest): Observable<ApiResponse<Complaint>> {
    return this.http.put<ApiResponse<Complaint>>(`${this.api}/${id}/status`, request);
  }
}
