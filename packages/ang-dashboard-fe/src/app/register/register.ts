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
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { notSame: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log('Formulario enviado:', this.registerForm.value);
      // Aquí iría la lógica de registro
      this.messageService.add({
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Tu cuenta ha sido creada correctamente',
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa el formulario correctamente',
      });
    }
  }
}
