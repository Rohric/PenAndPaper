import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** All backend calls go through the dev proxy under this prefix. */
const BASE_URL = '/api/';

/** Thin wrapper around HttpClient so features never repeat the base URL. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /** Load one resource or a list. */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(BASE_URL + path);
  }

  /** Create a resource. */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(BASE_URL + path, body);
  }

  /** Change some fields of a resource. */
  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(BASE_URL + path, body);
  }

  /** Remove a resource. */
  delete(path: string): Observable<void> {
    return this.http.delete<void>(BASE_URL + path);
  }
}
