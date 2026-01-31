/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TriviaService, Trivia } from '../../../service/trivia.service'; // ✅ Importa desde aquí

interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  answeredAt?: number;
  answeredCorrect?: boolean;
  isAdmin?: boolean;
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
  gameStarted: boolean;
  questions: unknown[];
}

@Component({
  selector: 'app-gestionar-sala',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    DialogModule,
    ProgressSpinnerModule,
    TagModule,
    ToastModule,
  ],
  templateUrl: './gestionar-sala.component.html',
  styleUrls: ['./gestionar-sala.component.css'],
})
export class GestionarSalaComponent implements OnInit, OnDestroy {
  isLoading = false;
  isActivating = false;

  trivia: Trivia | null = null; // ✅ Ahora usa Trivia del service
  roomId = '';
  roomState: RoomState = {
    id: '',
    players: [],
    round: 0,
    isActive: false,
    gameStarted: false,
    questions: [],
  };
  showQRDialog = false;
  socket: Socket | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private triviaService: TriviaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTrivia(id);
      this.generateRoomId();
      this.initializeWebSocket();
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  loadTrivia(id: string): void {
    this.triviaService.getTriviaById(id).subscribe({
      next: (trivia) => {
        this.trivia = trivia;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trivia:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la trivia',
          life: 3000,
        });
        this.loading = false;
      },
    });
  }

  generateRoomId(): void {
    this.roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  initializeWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io('https://trivianestapi.com.ar/rooms');

    if (this.socket) {
      this.socket.on('connect', () => {
        console.log('✅ Connected to WebSocket');
        this.createRoom();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket');
      });

      this.socket.on('roomState', (data: RoomState) => {
        console.log('📊 Room state received:', data);
        this.roomState = data;
        console.log(
          `📊 Room state: isActive=${this.roomState.isActive}, gameStarted=${this.roomState.gameStarted}, players=${this.playersCount}`
        );
      });

      this.socket.on('playerJoined', (data: { player: RoomPlayer }) => {
        console.log(`👤 Player joined: ${data.player.name}`);
        this.messageService.add({
          severity: 'info',
          summary: '👤 Nuevo jugador',
          detail: `${data.player.name} se unió a la sala`,
          life: 3000,
        });
      });

      this.socket.on('playerLeft', (data: { player: RoomPlayer }) => {
        console.log(`👤 Player left: ${data.player.name}`);
        this.messageService.add({
          severity: 'warn',
          summary: '👤 Jugador se fue',
          detail: `${data.player.name} salió de la sala`,
          life: 3000,
        });
      });

      this.socket.on('roomActivated', (data: { message: string; roomId: string }) => {
        console.log('🟢 Room activated event received');
        if (this.roomState) {
          this.roomState.isActive = true;
        }
        this.messageService.add({
          severity: 'success',
          summary: '🟢 Sala Activada',
          detail: 'La sala está lista para recibir jugadores',
          life: 3000,
        });
      });

      this.socket.on('roomDeactivated', (data: { message: string; roomId: string }) => {
        console.log('🔴 Room deactivated event received');
        if (this.roomState) {
          this.roomState.isActive = false;
        }
        this.messageService.add({
          severity: 'info',
          summary: '🔴 Sala Desactivada',
          detail: 'La sala ya no acepta nuevos jugadores',
          life: 3000,
        });
      });

      this.socket.on('gameStarted', (data: any) => {
        console.log('🎮 Game started event received');
        if (this.roomState) {
          this.roomState.gameStarted = true;
        }
        this.messageService.add({
          severity: 'success',
          summary: '🎮 ¡Juego Iniciado!',
          detail: `Total de preguntas: ${data.totalQuestions}`,
          life: 3000,
        });
      });

      this.socket.on('gameEnded', (data: any) => {
        console.log('🏁 Game ended event received');
        if (this.roomState) {
          this.roomState.gameStarted = false;
        }
        this.messageService.add({
          severity: 'success',
          summary: '🏁 ¡Juego Terminado!',
          detail: 'Los jugadores pueden ver sus resultados',
          life: 3000,
        });
      });

      this.socket.on('countdown', (data: any) => {
        console.log('⏱️ Countdown started');
        this.messageService.add({
          severity: 'info',
          summary: '⏱️ Iniciando en...',
          detail: `${data.seconds} segundos`,
          life: 2000,
        });
      });

      this.socket.on('error', (error: any) => {
        console.error('⚠️ Socket error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error de conexión WebSocket',
          life: 3000,
        });
      });

      this.socket.on('updateRoomStatusSuccess', (data: any) => {
        console.log('✅ Room status updated successfully');
      });

      this.socket.on('updateRoomStatusError', (error: any) => {
        console.error('❌ Error updating room status:', error);
        this.isActivating = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'No se pudo cambiar el estado de la sala',
          life: 3000,
        });
      });

      this.socket.on('startGameError', (error: any) => {
        console.error('❌ Error starting game:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al iniciar',
          detail: error.message || 'No se pudo iniciar el juego',
          life: 3000,
        });
      });
    }
  }

  createRoom(): void {
    if (this.socket && this.trivia) {
      console.log(
        `🏠 Creating room: ${this.roomId} for trivia: ${this.trivia.id}`
      );
      this.socket.emit('createRoom', {
        roomId: this.roomId,
        triviaId: this.trivia.id,
      });

      // ✅ Solicitar estado después de crear la sala (fallback)
      setTimeout(() => {
        if (!this.roomState) {
          console.warn(
            '⚠️ roomState not received, requesting manually...'
          );
          if (this.socket) {
            this.socket.emit(
              'getRoomState',
              { roomId: this.roomId },
              (response?: any) => {
                console.log('📊 Manual roomState request response:', response);
                console.log('📊 Response has players?', !!response?.players);

                // ✅ Solo usar si tiene estructura de RoomState (con players array)
                if (response?.players && Array.isArray(response.players)) {
                  console.log('📊 Manual roomState request received:', response);
                  this.roomState = response;
                } else {
                  console.warn('⚠️ Response is not a valid RoomState:', response);
                }
              }
            );
          }
        }
      }, 1000);
    }
  }

  toggleRoomActivation(): void {
    if (!this.socket) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de conexión',
        detail: 'WebSocket no conectado',
        life: 3000,
      });
      return;
    }

    this.isActivating = true;
    const newStatus = !this.roomState.isActive;

    console.log(
      `${newStatus ? '🟢 Activating' : '🔴 Deactivating'} room: ${this.roomId}`
    );

    // ✅ Emit sin condiciones
    this.socket.emit('updateRoomStatus', {
      roomId: this.roomId,
      isActive: newStatus,
    });

    // ✅ Actualizar estado local inmediatamente (optimistic update)
    this.roomState.isActive = newStatus;
    console.log('✅ Local state updated optimistically:', this.roomState.isActive);

    // ✅ Resetear flag después de 2 segundos
    setTimeout(() => {
      console.log('✅ Room activation request completed');
      this.isActivating = false;
    }, 2000);

    // ✅ Solicitar confirmación del servidor después de 500ms
    setTimeout(() => {
      if (this.socket) {
        this.socket.emit('getRoomState', { roomId: this.roomId }, (response?: any) => {
          if (response && response.isActive !== undefined) {
            console.log('✅ Room state confirmed from server:', response.isActive);
            this.roomState = response;
          }
        });
      }
    }, 500);
  }

  startGame(): void {
    if (!this.trivia?.id || !this.roomId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay trivia o sala configurada',
        life: 3000,
      });
      return;
    }

    if (this.playersCount === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin jugadores',
        detail: 'Debe haber al menos un jugador conectado',
        life: 3000,
      });
      return;
    }

    if (!this.roomState?.isActive) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sala Inactiva',
        detail: 'Presiona el botón de Activar antes de iniciar',
        life: 3000,
      });
      return;
    }

    if (this.roomState?.gameStarted) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Juego en Progreso',
        detail: 'El juego ya está en marcha',
        life: 3000,
      });
      return;
    }

    this.isLoading = true;
    console.log('🎮 Starting game:', {
      roomId: this.roomId,
      triviaId: this.trivia.id,
      players: this.playersCount,
    });

    if (this.socket) {
      this.socket.emit(
        'startGame',
        {
          roomId: this.roomId,
          triviaId: this.trivia.id,
        },
        (response?: { success?: boolean; error?: string }) => {
          console.log('Response from startGame:', response);
          this.isLoading = false;

          if (response?.success) {
            this.messageService.add({
              severity: 'success',
              summary: '✅ ¡Juego Iniciado!',
              detail: 'Las preguntas se están enviando a los jugadores...',
              life: 3000,
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response?.error || 'No se pudo iniciar el juego',
              life: 3000,
            });
          }
        }
      );
    } else {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error de conexión',
        detail: 'WebSocket no conectado',
        life: 3000,
      });
    }
  }

  showQRCode(): void {
    this.showQRDialog = true;
  }

  get playersCount(): number {
    // ✅ roomState.players siempre existe, nunca será undefined
    return this.roomState.players.filter((p) => !p.isAdmin).length;
  }

  get players(): RoomPlayer[] {
    // ✅ roomState.players siempre existe, nunca será undefined
    return this.roomState.players.filter((p) => !p.isAdmin);
  }

  get canStartGame(): boolean {
    return (
      this.playersCount > 0 &&
      this.roomState?.isActive === true &&
      this.roomState?.gameStarted === false
    );
  }

  get qrCodeUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `https://triviamultiplayer.netlify.app?room=${this.roomId}`
    )}`;
  }
}
