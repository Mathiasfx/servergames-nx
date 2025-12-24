import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { BienvenidaComponent } from './bienvenida/bienvenida.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { CrearTriviaComponent } from './trivias/crear-trivia/crear-trivia.component';
import { GestionarSalaComponent } from './trivias/gestionar-sala/gestionar-sala.component';
import { ListarRoomsComponent } from './trivias/listar-rooms/listar-rooms.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'bienvenida', component: BienvenidaComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'crear-trivia', component: CrearTriviaComponent },
      { path: 'rooms', component: ListarRoomsComponent },
      { path: 'gestionar-sala/:id', component: GestionarSalaComponent },
      { path: '', redirectTo: 'bienvenida', pathMatch: 'full' }
    ]
  }
];
