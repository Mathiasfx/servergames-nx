import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TriviaService, Trivia } from '../../../service/trivia.service';

@Component({
  selector: 'app-listar-rooms',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './listar-rooms.component.html',
  styleUrls: ['./listar-rooms.component.css']
})
export class ListarRoomsComponent implements OnInit {
  trivias: Trivia[] = [];
  loading = true;

  private readonly triviaService = inject(TriviaService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    console.log('Component initialized');
    this.loadTrivias();
  }

  loadTrivias(): void {
    // Por ahora, como solo hay una trivia por usuario, cargamos la trivia del usuario
    console.log('Loading trivias...');
    this.triviaService.getMyTrivia().subscribe({
      next: (trivia) => {
        console.log('Trivia received:', trivia);
        if (trivia) {
          this.trivias = [trivia];
          console.log('Trivias array:', this.trivias);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trivias:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las trivias'
        });
        this.loading = false;
      }
    });
  }

  goToManageRoom(triviaId: string): void {
    this.router.navigate(['/dashboard/gestionar-sala', triviaId]);
  }

  createNewTrivia(): void {
    this.router.navigate(['/dashboard/crear-trivia']);
  }

  editTrivia(trivia: Trivia): void {
    // Navegar a la página de edición con los datos de la trivia
    this.router.navigate(['/dashboard/editar-trivia', trivia.id]);
  }

  deleteTrivia(trivia: Trivia): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar la trivia "${trivia.title}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.performDelete(trivia.id);
      },
      reject: () => {
        // No hacer nada si el usuario cancela
      }
    });
  }

  private performDelete(triviaId: string): void {
    this.triviaService.deleteTrivia(triviaId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Trivia Eliminada',
          detail: 'La trivia ha sido eliminada exitosamente'
        });
        this.loadTrivias(); // Recargar la lista
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo eliminar la trivia'
        });
      }
    });
  }
}
