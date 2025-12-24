import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';

@WebSocketGateway({ namespace: '/rooms' })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private roomsService: RoomsService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const player = this.roomsService.joinRoom(data.roomId, data.name);
    client.join(data.roomId);
    
    // Notificar a todos en el room sobre el nuevo jugador
    this.server.to(data.roomId).emit('playerJoined', { player });
    
    // Enviar información actualizada del room al cliente
    const room = this.roomsService.getRoom(data.roomId);
    client.emit('roomState', room);
    
    return { success: true, playerId: player.id };
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody() data: { roomId: string; questions: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const success = this.roomsService.startGame(data.roomId, data.questions);
    
    if (success) {
      // Enviar countdown 3-2-1
      this.server.to(data.roomId).emit('countdown');
      
      // Después de 3 segundos, iniciar la primera ronda
      setTimeout(() => {
        this.server.to(data.roomId).emit('gameStarted');
        this.sendCurrentQuestion(data.roomId);
      }, 3000);
    }
    
    return { success };
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: { roomId: string; playerId: string; answer: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.roomsService.submitAnswer(data.roomId, data.playerId, data.answer);
    
    if (result) {
      // Notificar al jugador si su respuesta fue correcta
      this.server.to(client.id).emit('answerSubmitted', {
        correct: result.correct,
        score: result.score,
      });
      
      // Enviar ranking actualizado a todos
      const ranking = this.roomsService.getRanking(data.roomId);
      this.server.to(data.roomId).emit('rankingUpdated', ranking);
      
      // Verificar si todos han respondido para avanzar a la siguiente ronda
      this.checkRoundComplete(data.roomId);
    }
    
    return result;
  }

  private sendCurrentQuestion(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (room && room.currentQuestion) {
      this.server.to(roomId).emit('newRound', {
        round: room.round,
        question: room.currentQuestion.question,
        options: room.currentQuestion.options,
        timerSeconds: 15, // configurable
      });
    }
  }

  private checkRoundComplete(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (!room) return;
    
    const allAnswered = room.players.every(p => p.answeredAt !== undefined);
    
    if (allAnswered) {
      // Esperar 2 segundos y avanzar a la siguiente ronda
      setTimeout(() => {
        const hasNextRound = this.roomsService.nextRound(roomId);
        
        if (hasNextRound) {
          this.sendCurrentQuestion(roomId);
        } else {
          // Fin del juego
          const finalRanking = this.roomsService.getRanking(roomId);
          this.server.to(roomId).emit('gameEnded', { ranking: finalRanking });
        }
      }, 2000);
    }
  }
}
