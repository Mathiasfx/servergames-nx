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
    RouterModule
    
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginForm: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder, private messageService: MessageService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      console.log('Formulario enviado:', this.loginForm.value);
      // Aquí iría la lógica de autenticación
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Inicio de sesión exitoso',
      });
        this.router.navigate(['/dashboard']);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa el formulario correctamente',
      });
    }
  }
}
