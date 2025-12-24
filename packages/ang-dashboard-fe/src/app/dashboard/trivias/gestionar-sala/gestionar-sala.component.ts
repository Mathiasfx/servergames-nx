import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TriviaService, Trivia } from '../../../service/trivia.service';

interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  answeredAt?: number;
  answeredCorrect?: boolean;
}

interface RoomState {
  id: string;
  players: RoomPlayer[];
  currentQuestion?: {
    question: string;
    options: string[];
  };
  round: number;
  isActive: boolean;
  questions: unknown[];
}

@Component({
  selector: 'app-gestionar-sala',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    DialogModule,
    ProgressSpinnerModule,
    TagModule,
    ToastModule
  ],
  templateUrl: './gestionar-sala.component.html',
  styleUrls: ['./gestionar-sala.component.css']
})
export class GestionarSalaComponent implements OnInit, OnDestroy {
  trivia: Trivia | null = null;
  roomId = '';
  roomState: RoomState | null = null;
  showQRDialog = false;
  socket: unknown | null = null;
  loading = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly routerPublic = this.router;
  private readonly triviaService = inject(TriviaService);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const triviaId = this.route.snapshot.paramMap.get('id');
    if (triviaId) {
      this.loadTrivia(triviaId);
      this.generateRoomId();
      this.initializeWebSocket();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID de la trivia'
      });
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      console.log('Socket disconnect will be implemented after installing dependencies');
    }
  }

  loadTrivia(_id: string): void {
    this.triviaService.getMyTrivia().subscribe({
      next: (trivia) => {
        this.trivia = trivia;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la trivia'
        });
        this.loading = false;
      }
    });
  }

  generateRoomId(): void {
    this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  initializeWebSocket(): void {
    console.log('WebSocket will be initialized after installing dependencies');
  }

  startGame(): void {
    if (!this.trivia?.id) return;

    this.triviaService.startTrivia(this.trivia.id).subscribe({
      next: () => {
        if (this.trivia) {
          this.trivia.isActive = true;
        }

        this.messageService.add({
          severity: 'danger',
          summary: 'Juego iniciado',
          detail: 'La partida ha comenzado'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo iniciar el juego'
        });
      }
    });
  }

  endGame(): void {
    if (!this.trivia) return;

    this.messageService.add({
      severity: 'info',
      summary: 'Juego finalizado',
      detail: 'La partida ha sido detenida'
    });
  }

  get answeredCount(): number {
    return this.roomState?.players.filter(p => p.answeredAt).length || 0;
  }

  get playersCount(): number {
    return this.roomState?.players.length || 0;
  }

  get currentRound(): number {
    return this.roomState?.round || 0;
  }

  get totalQuestions(): number {
    return this.roomState?.questions.length || 0;
  }
}
