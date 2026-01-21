import { Injectable } from '@nestjs/common';

export interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  answeredAt?: number;
  answeredCorrect?: boolean;
  isAdmin?: boolean;
}

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer?: string;
}

interface Room {
  id: string;
  players: RoomPlayer[];
  currentQuestion?: {
    question: string;
    options: string[];
    correctAnswer?: string;
  };
  round: number;
  isActive: boolean;
  questions: TriviaQuestion[];
  triviaId?: string;
}

@Injectable()
export class RoomsService {
  private rooms: Record<string, Room> = {};

  createRoom(roomId: string, triviaId?: string): Room {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        id: roomId,
        players: [],
        round: 0,
        isActive: false,
        currentQuestion: undefined,
        questions: [],
        triviaId: triviaId
      };
    }
    return this.rooms[roomId];
  }

  joinRoom(roomId: string, playerName: string, isAdmin = false): RoomPlayer | null {
    // Check if room exists
    if (!this.rooms[roomId]) {
      return null; // Room doesn't exist
    }
    
    // Check if game is already started
    if (this.rooms[roomId].isActive) {
      return null; // Game already started
    }
    
    const player: RoomPlayer = {
      id: Math.random().toString(36).substring(2, 10),
      name: playerName,
      score: isAdmin ? 0 : 0, // Admin siempre tiene 0 puntos
      isAdmin
    };
    this.rooms[roomId].players.push(player);
    return player;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms[roomId];
  }

  startGame(roomId: string, questions: TriviaQuestion[]): boolean {
    const room = this.rooms[roomId];
    if (room && !room.isActive) {
      room.isActive = true;
      room.round = 1;
      room.questions = questions;
      this.setCurrentQuestion(roomId);
      return true;
    }
    return false;
  }

  setCurrentQuestion(roomId: string): void {
    const room = this.rooms[roomId];
    if (room && room.questions[room.round - 1]) {
      room.currentQuestion = room.questions[room.round - 1];
      // Reset player answers for la ronda
      room.players.forEach(p => {
        p.answeredAt = undefined;
        p.answeredCorrect = false;
      });
    }
  }

  submitAnswer(roomId: string, playerId: string, answer: string): { correct: boolean; score: number } | null {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) return null;
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.answeredAt || player.isAdmin) return null; // Admin no responde
    player.answeredAt = Date.now();
    const correct = answer.trim().toLowerCase() === (room.currentQuestion?.correctAnswer?.trim().toLowerCase() ?? '');
    player.answeredCorrect = correct;
    if (correct) {
      // Score: base + bonus por rapidez
      const correctCount = room.players.filter(p => p.answeredCorrect && !p.isAdmin).length;
      const bonus = Math.max(0, 5 - correctCount); // El primero suma más
      player.score += 10 + bonus;
    }
    return { correct, score: player.score };
  }

  nextRound(roomId: string): boolean {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) return false;
    if (room.round < room.questions.length) {
      room.round++;
      this.setCurrentQuestion(roomId);
      return true;
    } else {
      room.isActive = false;
      return false;
    }
  }

  getRanking(roomId: string): RoomPlayer[] {
    const room = this.rooms[roomId];
    if (!room) return [];
    return [...room.players]
      .filter(p => !p.isAdmin) // Excluir al administrador del ranking
      .sort((a, b) => b.score - a.score);
  }

  endGame(roomId: string): boolean {
    const room = this.rooms[roomId];
    if (!room) return false;
    
    room.isActive = false;
    room.currentQuestion = undefined;
    
    // Reset player answers
    room.players.forEach(p => {
      p.answeredAt = undefined;
      p.answeredCorrect = false;
    });
    
    return true;
  }

  updateTriviaStatus(roomId: string, isActive: boolean): boolean {
    // Aquí iría la lógica para actualizar la base de datos
    // Por ahora solo actualizamos el estado en memoria
    const room = this.rooms[roomId];
    if (room) {
      room.isActive = isActive;
      return true;
    }
    return false;
  }
}
