import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TriviaService, Trivia, Question } from '../../../service/trivia.service';

@Component({
  selector: 'app-editar-trivia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './editar-trivia.component.html',
  styleUrls: ['./editar-trivia.component.css']
})
export class EditarTriviaComponent implements OnInit {
  isLoading = false;
  triviaId = '';
  trivia: Trivia | null = null;
  
  questions: Question[] = [];
  newQuestion: Question = {
    question: '',
    options: ['', ''],
    answer: ''
  };
  
  showAddQuestionDialog = false;

  private readonly triviaService = inject(TriviaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    this.triviaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.triviaId) {
      this.loadTrivia();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID de la trivia'
      });
      this.router.navigate(['/dashboard/rooms']);
    }
  }

  loadTrivia(): void {
    this.isLoading = true;
    this.triviaService.getTriviaById(this.triviaId).subscribe({
      next: (trivia) => {
        this.trivia = trivia;
        this.questions = [...trivia.questions];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la trivia'
        });
        this.router.navigate(['/dashboard/rooms']);
      }
    });
  }

  addOption(): void {
    if (this.newQuestion.options.length < 4) {
      this.newQuestion.options.push('');
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
        severity: 'success',
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
    if (!this.trivia?.title || this.questions.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debes completar el título y agregar al menos una pregunta'
      });
      return;
    }

    this.isLoading = true;
    
    const updateDto = {
      title: this.trivia.title,
      questions: this.questions
    };

    this.triviaService.updateTrivia(this.triviaId, updateDto).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Trivia Actualizada',
          detail: 'Tu trivia ha sido actualizada exitosamente'
        });
        
        this.router.navigate(['/dashboard/gestionar-sala', this.triviaId]);
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo actualizar la trivia'
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/rooms']);
  }
}
