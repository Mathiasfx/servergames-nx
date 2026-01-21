import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TriviaService, Question, CreateTriviaDto } from '../../../service/trivia.service';

@Component({
  selector: 'app-crear-trivia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    ToastModule
  ],
  templateUrl: './crear-trivia.component.html',
  styleUrls: ['./crear-trivia.component.css']
})
export class CrearTriviaComponent implements OnInit {
  isLoading = false;
  
  trivia = {
    title: ''
  };
  
  questions: Question[] = [];
  newQuestion: Question = {
    question: '',
    options: ['', ''],
    answer: ''
  };
  
  showAddQuestionDialog = false;

  private readonly triviaService = inject(TriviaService);
  private readonly router = inject(Router);
  public readonly routerPublic = this.router;
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    // Component initialized - ready for user interaction
  }

  addOption(): void {
    if (this.newQuestion.options.length < 4) {
      this.newQuestion.options.push('');
      // Forzar detección de cambios
      this.newQuestion.options = [...this.newQuestion.options];
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  removeOption(index: number): void {
    if (this.newQuestion.options.length > 2) {
      const removedOption = this.newQuestion.options[index];
      this.newQuestion.options.splice(index, 1);
      
      if (this.newQuestion.answer === removedOption) {
        this.newQuestion.answer = '';
      }
    }
  }

  setCorrectAnswer(option: string): void {
    this.newQuestion.answer = option;
  }

  addQuestion(): void {
    if (this.newQuestion.question && 
        this.newQuestion.options.filter(opt => opt.trim()).length >= 2 && 
        this.newQuestion.answer) {
      
      this.newQuestion.options = this.newQuestion.options.filter(opt => opt.trim());
      
      this.questions.push({ ...this.newQuestion });
      
      this.newQuestion = {
        question: '',
        options: ['', ''],
        answer: ''
      };
      
      this.showAddQuestionDialog = false;
      
      this.messageService.add({
        severity: 'danger',
        summary: 'Pregunta agregada',
        detail: 'La pregunta ha sido agregada correctamente'
      });
    }
  }

  removeQuestion(index: number): void {
    this.questions.splice(index, 1);
    this.messageService.add({
      severity: 'info',
      summary: 'Pregunta eliminada',
      detail: 'La pregunta ha sido eliminada'
    });
  }

  saveTrivia(): void {
    if (!this.trivia.title || this.questions.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debes completar el título y agregar al menos una pregunta'
      });
      return;
    }

    this.isLoading = true;
    const triviaDto: CreateTriviaDto = {
      title: this.trivia.title,
      questions: this.questions
    };

    this.triviaService.createTrivia(triviaDto).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'danger',
          summary: 'Trivia creada',
          detail: 'Tu trivia ha sido creada exitosamente'
        });
        
        this.router.navigate(['/dashboard/gestionar-sala', response.id]);
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo crear la trivia'
        });
      }
    });
  }
}
