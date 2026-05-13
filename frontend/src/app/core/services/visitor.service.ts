import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Visitor, CreateVisitorRequest } from '../models/visitor.model';

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/visitors`;

  getAll(): Observable<ApiResponse<Visitor[]>> {
    return this.http.get<ApiResponse<Visitor[]>>(this.api);
  }

  getActive(): Observable<ApiResponse<Visitor[]>> {
    return this.http.get<ApiResponse<Visitor[]>>(`${this.api}/active`);
  }

  logEntry(request: CreateVisitorRequest): Observable<ApiResponse<Visitor>> {
    return this.http.post<ApiResponse<Visitor>>(this.api, request);
  }

  logExit(id: number): Observable<ApiResponse<Visitor>> {
    return this.http.put<ApiResponse<Visitor>>(`${this.api}/${id}/exit`, {});
  }
}
