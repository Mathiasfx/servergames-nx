/* eslint-disable @angular-eslint/prefer-inject */
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = sessionStorage.getItem('access_token');

    
    if (!token) {
      console.warn('AuthGuard: No token found, redirecting to login');
      return this.router.parseUrl('/login');
    }
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('AuthGuard: Token format invalid, redirecting to login');
        return this.router.parseUrl('/login');
      }
      
      const payload = JSON.parse(atob(parts[1]));

      
      if (!payload.exp) {
       
        return this.router.parseUrl('/login');
      }
      
      if (payload.exp * 1000 < Date.now()) {
        console.warn('AuthGuard: Token expired, clearing session and redirecting');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        return this.router.parseUrl('/login');
      }
    } catch (e) {
      console.error('AuthGuard: Error parsing token', e);
      return this.router.parseUrl('/login');
    }
    
  
    return true;
  }
}
