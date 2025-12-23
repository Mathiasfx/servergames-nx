/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Optionally attach token if present
    const token = sessionStorage.getItem('access_token');
    console.log('AuthInterceptor: token from sessionStorage:', token);
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('AuthInterceptor: HTTP error', error);
        if (error.status === 401) {
          console.warn('AuthInterceptor: 401 detected, clearing session and redirecting');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('user');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
