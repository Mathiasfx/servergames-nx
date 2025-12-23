/* eslint-disable @angular-eslint/prefer-inject */
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 


// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../service/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    ToastModule,
    RouterModule,
    HttpClientModule,
  ],
  providers: [],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Inicio de sesión exitoso',
            key: 'main',
            life: 3000,
          });
          // Guardar token y datos de usuario en sessionStorage
          sessionStorage.setItem('access_token', res.access_token);
          sessionStorage.setItem(
            'user',
            JSON.stringify({
              id: res.user.id,
              email: res.user.email,
              username: res.user.username,
              userType: res.user.userType,
            })
          );
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Credenciales inválidas',
            key: 'main',
            life: 3000,
          });
        },
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa el formulario correctamente',
        key: 'main',
        life: 3000,
      });
    }
  }

  // En tu método probarNotificacion
  probarNotificacion() {
    console.log('Intentando mostrar notificación...'); // Verifica en consola
    this.messageService.add({
      severity: 'success',
      summary: 'Prueba',
      detail: '¡Esta es una notificación de prueba!',
      key: 'main',
      life: 3000,
    });
  }
}
