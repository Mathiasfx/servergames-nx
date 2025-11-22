import { Route } from '@angular/router';
import { Login } from './login/login';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  // Agrega aquí más rutas según sea necesario
  // Ejemplo para el dashboard:
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  // },
  {
    path: '**',
    redirectTo: 'login'
  }
];
