import { Routes } from '@angular/router';
import { Login } from './login/login';
import { RegisterComponent } from './register/register';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: RegisterComponent },
  { path: '**', redirectTo: '/login' },
];
