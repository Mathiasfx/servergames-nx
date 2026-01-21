/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';
import type { Player, Room } from '../types/game';

class SocketService {
  private socket: Socket | null = null;
  private room: Room | null = null;

  connect() {
    this.socket = io(
      'http://ec2-3-236-119-111.compute-1.amazonaws.com:3007/api/rooms',
      {
        withCredentials: true,
      }
    );

    this.socket.on('connect', () => {
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnect');
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('roomState', (roomState: Room) => {
      this.room = roomState;
      this.emit('roomStateUpdate', roomState);
    });

    this.socket.on('playerJoined', ({ player }: { player: Player }) => {
      this.emit('playerJoined', player);
    });

    this.socket.on('playerLeft', ({ player }: { player: Player }) => {
      this.emit('playerLeft', player);
    });

    this.socket.on('countdown', () => {
      this.emit('countdown');
    });

    this.socket.on('newRound', (data) => {
      this.emit('newRound', data);
    });

    this.socket.on('gameStarted', (data) => {
      this.emit('gameStarted', data);
    });

    this.socket.on('gameEnded', (data) => {
      this.emit('gameEnded', data);
    });

    this.socket.on('gameEnding', (data) => {
      this.emit('gameEnding', data);
    });

    this.socket.on('answerSubmitted', (data) => {
      this.emit('answerSubmitted', data);
    });

    this.socket.on('rankingUpdated', (ranking) => {
      this.emit('rankingUpdated', ranking);
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      this.emit('connect_error', error);
    });
  }

  joinRoom(roomId: string, playerName: string) {
    if (!this.socket) throw new Error('Socket not connected');
    console.log('Emitting joinRoom with:', { roomId, playerName });
    this.socket.emit('joinRoom', { roomId, name: playerName });
  }

  submitAnswer(roomId: string, playerId: string, answer: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('submitAnswer', { roomId, playerId, answer });
  }

  startGame(roomId: string, triviaId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    console.log('Emitting startGame with:', { roomId, triviaId });
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
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const socketService = new SocketService();
