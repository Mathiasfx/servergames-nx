import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { BienvenidaComponent } from './bienvenida/bienvenida.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'bienvenida', component: BienvenidaComponent },

      { path: 'configuracion', component: ConfiguracionComponent },

      { path: '', redirectTo: 'bienvenida', pathMatch: 'full' }
    ]
  }
];
