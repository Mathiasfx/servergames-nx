import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import {provideAnimations} from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer'; 
import { MenubarModule } from 'primeng/menubar';
import { PanelMenuModule } from 'primeng/panelmenu';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Lara
      }
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    importProvidersFrom(
      ButtonModule,
      CardModule,
      InputTextModule,
      PasswordModule,
      ToastModule,
      DrawerModule, 
      MenubarModule,
      PanelMenuModule,   
      RouterModule
    ),
    provideAnimations()
  ],
};
