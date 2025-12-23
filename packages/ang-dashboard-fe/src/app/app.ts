import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ToastModule],
  template: `
    <p-toast
      position="top-right"
      [baseZIndex]="1000"
      key="main"
      [showTransform]="'translateY(100%)'"
      [showTransitionOptions]="'300ms ease-out'"
      [hideTransitionOptions]="'250ms ease-in'"
      [breakpoints]="{ '768px': { width: '90%', right: '1rem' } }"
    >
    </p-toast>
    <router-outlet></router-outlet>
  `,
  styles: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App implements OnInit {
  title = 'ang-dashboard-fe';
  private router = inject(Router);

  ngOnInit() {
    const token = sessionStorage.getItem('access_token');
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            // Token válido, redirigir al dashboard
            this.router.navigate(['/dashboard']);
            return;
          }
        }
      } catch {
        // Token inválido, limpiar y redirigir a login
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
      }
    }
    
    // No hay token o es inválido, redirigir a login
    this.router.navigate(['/login']);
  }
}
