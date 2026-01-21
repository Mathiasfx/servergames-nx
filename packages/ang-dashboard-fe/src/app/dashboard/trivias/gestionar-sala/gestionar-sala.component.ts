import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TriviaService, Trivia } from '../../../service/trivia.service';
import { io, Socket } from 'socket.io-client';

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
    ToastModule
  ],
  templateUrl: './gestionar-sala.component.html',
  styleUrls: ['./gestionar-sala.component.css']
})
export class GestionarSalaComponent implements OnInit, OnDestroy {
  isLoading = false;
  isActivating = false;
  
  trivia: Trivia | null = null;
  roomId = '';
  roomState: RoomState | null = null;
  showQRDialog = false;
  socket: Socket | null = null;
  loading = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly routerPublic = this.router;
  private readonly triviaService = inject(TriviaService);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const triviaId = this.route.snapshot.paramMap.get('id');
    if (triviaId) {
      console.log('Initializing gestionar sala component for trivia:', triviaId);
      this.loadTrivia(triviaId);
      this.generateRoomId();
      this.initializeWebSocket();
      
      // Esperar a que el WebSocket se conecte y luego unirse a la sala
      setTimeout(() => {
        this.requestRoomState();
      }, 1500); // Más tiempo para asegurar que todo esté inicializado
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
      this.socket.disconnect();
    }
  }

  loadTrivia(id: string): void {
    console.log('Loading trivia with ID:', id);
    this.triviaService.getTriviaById(id).subscribe({
      next: (trivia) => {
        // NO activar automáticamente - mantener estado de la base de datos
        this.trivia = trivia;
        this.loading = false;
        console.log('Trivia loaded from DB:', this.trivia);
      },
      error: (error) => {
        console.error('Error loading trivia:', error);
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
    // Evitar múltiples conexiones
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io(
      'http://ec2-3-236-119-111.compute-1.amazonaws.com:3007/rooms'
    );
    
    if (this.socket) {
      this.socket.on('connect', () => {
        console.log('Connected to room management WebSocket');
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from room management WebSocket');
      });
      
      this.socket.on('roomState', (data: RoomState) => {
        console.log('Room state updated:', data);
        this.roomState = data;
      });
      
      this.socket.on('playerJoined', (data: { player: RoomPlayer }) => {
        console.log('Player joined event received:', data.player);
        // NO solicitar estado actualizado - ya viene en el evento roomState
      });
      
      this.socket.on('playerLeft', (data: { player: RoomPlayer }) => {
        console.log('Player left event received:', data.player);
        // NO solicitar estado actualizado - ya viene en el evento roomState
      });
      
      this.socket.on('roomActivated', (data: { message: string; roomId: string }) => {
        console.log('Room activated event received:', data);
        this.messageService.add({
          severity: 'success',
          summary: 'Sala Activada',
          detail: data.message || 'La sala está lista para recibir jugadores',
          life: 3000,
        });
      });
      
      this.socket.on('roomDeactivated', (data: { message: string; roomId: string }) => {
        console.log('Room deactivated event received:', data);
        this.messageService.add({
          severity: 'info',
          summary: 'Sala Desactivada',
          detail: data.message || 'La sala ya no acepta nuevos jugadores',
          life: 3000,
        });
      });
      
      this.socket.on('gameEnding', (data: { message: string; countdown: number }) => {
        console.log('Game ending event received:', data);
        this.messageService.add({
          severity: 'warn',
          summary: 'Juego por terminar',
          detail: data.message || '¡Prepárense para los resultados!',
          life: 5000,
        });
      });

      this.socket.on('gameEnded', (data: { message: string; ranking: unknown[]; showRanking: boolean }) => {
        console.log('Game ended event received:', data);
        this.messageService.add({
          severity: 'success',
          summary: '¡Juego Terminado!',
          detail: data.message || '¡Gracias por participar!'
        });
        
        // Actualizar estado local del room (no de la trivia)
        if (this.roomState) {
          this.roomState.isActive = false;
        }
        
        // Mostrar ranking si está disponible
        if (data.showRanking && data.ranking) {
          console.log('Final ranking:', data.ranking);
          // Aquí podrías mostrar un modal o sección con el ranking
        }
      });
    }
  }
  
  private requestRoomState(): void {
    if (this.socket && this.roomId && this.trivia?.id) {
      console.log('Requesting room state for:', this.roomId);
      // Primero crear la room si no existe
      this.socket.emit('createRoom', { 
        roomId: this.roomId,
        triviaId: this.trivia.id
      });
      
      // Unirse a la sala para recibir eventos de jugadores
      this.socket.emit('joinRoom', { 
        roomId: this.roomId, 
        name: 'Administrador',
        isAdmin: true
      });
      
      // Luego solicitar el estado
      setTimeout(() => {
        if (this.roomId && this.socket) {
          this.socket.emit('getRoomState', { roomId: this.roomId });
        }
      }, 500);
    }
  }

  showQRCode(): void {
    // Solo mostrar QR si la sala está activa
    if (!this.roomState?.isActive) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sala Inactiva',
        detail: 'Debes activar la sala antes de mostrar el código QR',
        life: 3000,
      });
      return;
    }
    
    this.showQRDialog = true;
  }

  toggleRoomActivation(): void {
    if (!this.trivia?.id || !this.roomId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede cambiar el estado de la sala',
        life: 3000,
      });
      return;
    }

    // Verificar si hay un juego en progreso
    if (this.roomState?.isActive && this.roomState?.round > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Juego en Progreso',
        detail: 'No se puede desactivar la sala mientras hay un juego en curso',
        life: 3000,
      });
      return;
    }

    this.isActivating = true;
    
    const isCurrentlyActive = this.roomState?.isActive || false;
    
    if (isCurrentlyActive) {
      // Desactivar la sala
      if (this.roomState) {
        this.roomState.isActive = false;
      }
      
      // Notificar al backend
      if (this.socket) {
        this.socket.emit('roomDeactivated', { 
          roomId: this.roomId,
          message: 'La sala ha sido desactivada'
        });
      }
      
      this.messageService.add({
        severity: 'info',
        summary: 'Sala Desactivada',
        detail: 'La sala ya no acepta nuevos jugadores',
        life: 3000,
      });
    } else {
      // Activar la sala
      if (this.roomState) {
        this.roomState.isActive = true;
      }
      
      // Notificar al backend
      if (this.socket) {
        this.socket.emit('roomActivated', { 
          roomId: this.roomId,
          message: 'La sala está activa, pueden conectarse'
        });
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Sala Activada',
        detail: 'La sala está lista para recibir jugadores',
        life: 3000,
      });
    }
    
    this.isActivating = false;
  }

  startGame(): void {
    if (!this.trivia?.id || !this.roomId || this.playersCount === 0 || this.roomState?.isActive) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No se puede iniciar',
        detail: this.roomState?.isActive 
          ? 'El juego ya está en progreso' 
          : this.playersCount === 0 
          ? 'Debe haber al menos un jugador conectado' 
          : 'La sala debe estar activa para recibir jugadores',
        life: 3000,
      });
      return;
    }

    // Iniciar el juego real - enviar preguntas por WebSocket
    if (this.socket) {
      this.socket.emit('startGame', { 
        roomId: this.roomId,
        triviaId: this.trivia.id
      });
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Juego Iniciado',
      detail: 'Enviando preguntas a los jugadores',
      life: 3000,
    });
  }

  endGame(): void {
    if (!this.roomId || !this.roomState?.isActive) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No se puede finalizar',
        detail: 'No hay un juego en progreso',
        life: 3000,
      });
      return;
    }

    console.log('Ending game for room:', this.roomId);
    console.log('Socket available:', !!this.socket);

    if (this.socket) {
      console.log('Emitting endGame event...');
      this.socket.emit('endGame', { roomId: this.roomId }, (response: { success?: boolean }) => {
        console.log('End game response:', response);
        
        if (response && response.success) {
          // Actualizar estado local del room (no de la trivia)
          if (this.roomState) {
            this.roomState.isActive = false;
          }
          
          this.messageService.add({
            severity: 'info',
            summary: 'Juego finalizado',
            detail: 'La partida ha sido detenida exitosamente'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo finalizar el juego'
          });
        }
      });
    } else {
      console.log('Socket not available');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay conexión WebSocket activa'
      });
    }
  }

  get answeredCount(): number {
    // Excluir al administrador del conteo de respuestas
    return this.roomState?.players.filter(p => 
      !p.isAdmin && p.answeredAt
    ).length || 0;
  }

  get playersCount(): number {
    // Excluir al administrador del conteo de jugadores
    return this.roomState?.players.filter(p => 
      !p.isAdmin
    ).length || 0;
  }

  getPlayers(): RoomPlayer[] {
    // Filtrar al administrador para no mostrarlo como jugador
    return this.roomState?.players.filter(p => !p.isAdmin) || [];
  }

  trackByPlayerId(index: number, player: RoomPlayer): string {
    return player.id;
  }

  get currentRound(): number {
    return this.roomState?.round || 0;
  }

  get totalQuestions(): number {
    return this.roomState?.questions.length || 0;
  }
}
