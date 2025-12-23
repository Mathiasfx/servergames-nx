/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  sidebarOpen = false;
  username = '';
  userType = '';
  userId = '';

  get isDesktop(): boolean {
    return window.innerWidth >= 768;
  }

  constructor(private router: Router) {}

  ngOnInit() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.username = user.username || '';
        this.userType = user.userType || '';
        this.userId = user.id || '';
      } catch {
        this.username = '';
        this.userType = '';
        this.userId = '';
      }
    }
    this.checkToken();
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  checkToken() {
    const token = sessionStorage.getItem('access_token');
    // Suponiendo que el token tiene un campo exp en segundos (JWT)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          this.logout();
        }
      } catch {
        this.logout();
      }
    } else {
      this.logout();
    }
  }
}
