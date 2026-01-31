/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';
import type { Player, Room } from '../types/game';

class SocketService {
  private socket: Socket | null = null;
  private room: Room | null = null;
  private currentPlayer: Player | null = null;

  connect() {
    if (this.socket) {
      console.log('🔌 Socket already connected');
      return;
    }
    this.socket = io('https://trivianestapi.com.ar/rooms', {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.emit('disconnect');
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // 👇 AGREGA ESTO: Escuchar confirmación de unirse a sala
    this.socket.on(
      'joinRoomSuccess',
      (data: {
        success: boolean;
        player: Player;
        room: Room;
        message: string;
      }) => {
        console.log('✅ Join Room Success:', data);
        this.currentPlayer = data.player;
        this.room = data.room;
        this.emit('joinRoomSuccess', data);
      }
    );

    // 👇 AGREGA ESTO: Escuchar errores al unirse
    this.socket.on(
      'joinRoomError',
      (error: { type: string; message: string }) => {
        console.error('❌ Join Room Error:', error);
        this.emit('joinRoomError', error);
      }
    );

    this.socket.on('roomState', (roomState: Room) => {
      console.log('📊 Room state updated:', roomState);
      this.room = roomState;
      this.emit('roomStateUpdate', roomState);
    });

    this.socket.on('playerJoined', ({ player }: { player: Player }) => {
      console.log('👤 Player joined:', player.name);
      this.emit('playerJoined', player);
    });

    this.socket.on('playerLeft', ({ player }: { player: Player }) => {
      console.log('👤 Player left:', player.name);
      this.emit('playerLeft', player);
    });

    this.socket.on('countdown', (data) => {
      console.log('⏱️ Countdown:', data);
      this.emit('countdown', data);
    });

    this.socket.on('newRound', (data) => {
      console.log('📝 New round:', data);
      this.emit('newRound', data);
    });

    this.socket.on('gameStarted', (data) => {
      console.log('🎮 Game started:', data);
      this.emit('gameStarted', data);
    });

    this.socket.on('gameEnded', (data) => {
      console.log('🏁 Game ended:', data);
      this.emit('gameEnded', data);
    });

    this.socket.on('gameEnding', (data) => {
      console.log('⏳ Game ending:', data);
      this.emit('gameEnding', data);
    });

    this.socket.on('answerSubmitted', (data) => {
      console.log('✔️ Answer submitted:', data);
      this.emit('answerSubmitted', data);
    });

    this.socket.on('rankingUpdated', (ranking) => {
      console.log('🏆 Ranking updated:', ranking);
      this.emit('rankingUpdated', ranking);
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connect error:', error);
      this.emit('connect_error', error);
    });
  }

  joinRoom(roomId: string, playerName: string) {
    if (!this.socket) throw new Error('Socket not connected');
    console.log('📤 Emitting joinRoom with:', { roomId, playerName });
    this.socket.emit('joinRoom', { roomId, name: playerName });
  }

  submitAnswer(roomId: string, playerId: string, answer: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('submitAnswer', { roomId, playerId, answer });
  }

  startGame(roomId: string, triviaId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    console.log('📤 Emitting startGame with:', { roomId, triviaId });
    this.socket.emit('startGame', { roomId, triviaId });
  }

  createRoom(roomId: string, triviaId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('createRoom', { roomId, triviaId });
  }

  getRoomState(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('getRoomState', { roomId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get currentRoom() {
    return this.room;
  }

  get player() {
    return this.currentPlayer;
  }

  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: unknown) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const socketService = new SocketService();
