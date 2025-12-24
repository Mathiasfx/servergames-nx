import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TriviaService, Trivia } from '../../../service/trivia.service';

@Component({
  selector: 'app-listar-rooms',
  standalone: true,
  imports: [
    DatePipe,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    TagModule,
    ToastModule
  ],
  templateUrl: './listar-rooms.component.html',
  styleUrls: ['./listar-rooms.component.css']
})
export class ListarRoomsComponent implements OnInit {
  trivias: Trivia[] = [];
  loading = true;

  private readonly triviaService = inject(TriviaService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    this.loadTrivias();
  }

  loadTrivias(): void {
    // Por ahora, como solo hay una trivia por usuario, cargamos la trivia del usuario
    this.triviaService.getMyTrivia().subscribe({
      next: (trivia) => {
        if (trivia) {
          this.trivias = [trivia];
        }
        this.loading = false;
      },
      error: () => {
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
}
