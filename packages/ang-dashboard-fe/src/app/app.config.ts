import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
    MessageService,
    importProvidersFrom(
      ButtonModule,
      CardModule,
      InputTextModule,
      PasswordModule,
      ToastModule,
      RouterModule
    ),
  ],
};
