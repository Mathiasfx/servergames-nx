/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://ec2-3-236-119-111.compute-1.amazonaws.com:3007/api/auth'; 

  constructor(private http: HttpClient) {}

  register(data: { name: string; email: string; password: string }): Observable<any> {
     const payload = {
      username: data.name,
      email: data.email,
      password: data.password
    };
    return this.http.post(`${this.apiUrl}/register`, payload);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }
}
