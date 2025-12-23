import { Routes } from '@angular/router';
import { Login } from './login/login';
import { RegisterComponent } from './register/register';
import { dashboardRoutes } from './dashboard/dashboard.routes';
import { AuthGuard } from './auth.guard';
import { App } from './app';


export const appRoutes: Routes = [
  { path: '', component: App },
  { path: 'login', component: Login },
  { path: 'registro', component: RegisterComponent },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    children: dashboardRoutes
  },
  { path: '**', redirectTo: '/login' },
];
