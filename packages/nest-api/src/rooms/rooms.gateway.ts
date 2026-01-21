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
import { TriviasService } from './trivias/trivias.service';

@WebSocketGateway({ 
  namespace: '/rooms',
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private roomsService: RoomsService,
    private triviasService: TriviasService
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    console.log('Socket data:', client.data);
    
    // Buscar en todas las salas si este socket está asociado a algún jugador
    let playerRemoved = false;
    Object.keys(this.roomsService['rooms']).forEach(roomId => {
      const room = this.roomsService.getRoom(roomId);
      if (room) {
        // Primero intentar por playerId guardado
        const playerId = client.data.playerId;
        if (playerId) {
          const playerIndex = room.players.findIndex(p => p.id === playerId);
          if (playerIndex !== -1) {
            const removedPlayer = room.players.splice(playerIndex, 1)[0];
            
            // Notificar a todos en el room que el jugador se desconectó
            this.server.to(roomId).emit('playerLeft', { player: removedPlayer });
            
            // Enviar estado actualizado del room
            this.server.to(roomId).emit('roomState', room);
            
            console.log(`Player ${removedPlayer.name} left room ${roomId} (by playerId)`);
            playerRemoved = true;
          }
        }
        
        // Si no se encontró por playerId, buscar por socket.id
        if (!playerRemoved) {
          const playerIndex = room.players.findIndex(p => p.id === client.id);
          if (playerIndex !== -1) {
            const removedPlayer = room.players.splice(playerIndex, 1)[0];
            
            // Notificar a todos en el room que el jugador se desconectó
            this.server.to(roomId).emit('playerLeft', { player: removedPlayer });
            
            // Enviar estado actualizado del room
            this.server.to(roomId).emit('roomState', room);
            
            console.log(`Player ${removedPlayer.name} left room ${roomId} (by socket.id)`);
            playerRemoved = true;
          }
        }
      }
    });
    
    if (!playerRemoved) {
      console.log(`No player found for disconnected client: ${client.id}`);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; name: string; isAdmin?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Player ${data.name} joining room ${data.roomId}`);
    
    const player = this.roomsService.joinRoom(data.roomId, data.name, data.isAdmin);
    
    if (!player) {
      // Room doesn't exist or game already started
      const room = this.roomsService.getRoom(data.roomId);
      if (!room) {
        console.log(`Room ${data.roomId} not found`);
        client.emit('error', { 
          type: 'ROOM_NOT_FOUND',
          message: `La sala "${data.roomId}" no existe. Verifica el ID e intenta nuevamente.` 
        });
        return { success: false, error: 'Room not found' };
      } else if (room.isActive) {
        console.log(`Room ${data.roomId} already started`);
        client.emit('error', { 
          type: 'GAME_ALREADY_STARTED',
          message: `La sala "${data.roomId}" ya está en juego. No puedes unirte ahora.` 
        });
        return { success: false, error: 'Game already started' };
      }
    }
    
    client.join(data.roomId);
    
    // Guardar referencia del playerId en el socket para poder eliminarlo después
    client.data.playerId = player.id;
    client.data.roomId = data.roomId;
    
    console.log(`Player created with ID: ${player.id}, Socket ID: ${client.id}, Admin: ${player.isAdmin}`);
    
    // Enviar información actualizada del room al cliente que se unió
    const room = this.roomsService.getRoom(data.roomId);
    client.emit('roomState', room);
    
    // Notificar a todos en el room (incluido el que se unió) sobre el nuevo jugador
    this.server.to(data.roomId).emit('playerJoined', { player });
    
    // Enviar estado actualizado a todos en el room para que todos vean el contador de jugadores
    this.server.to(data.roomId).emit('roomState', room);
    
    return { success: true, playerId: player.id };
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody() data: { roomId: string; triviaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Starting game in room:', data.roomId, 'for trivia:', data.triviaId);
    
    // Iniciar el juego real - cargar preguntas y comenzar rondas
    const room = this.roomsService.getRoom(data.roomId);
    if (room) {
      room.isActive = true;
      room.round = 0;
      
      // Cargar preguntas de la trivia desde la base de datos
      this.triviasService.getTriviaById(data.triviaId).then(trivia => {
        if (trivia && trivia.questions && Array.isArray(trivia.questions)) {
          room.questions = trivia.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.answer
          }));
          room.triviaId = data.triviaId;
          
          // Enviar countdown 3-2-1 para preparar jugadores
          this.server.to(data.roomId).emit('countdown');
          
          // Después de 3 segundos, iniciar la primera ronda
          setTimeout(() => {
            this.startNextRound(data.roomId);
            
            // Notificar a todos que el juego comenzó
            this.server.to(data.roomId).emit('gameStarted', {
              roomId: data.roomId,
              totalQuestions: room.questions.length
            });
          }, 3000);
        } else {
          console.error('No questions found in trivia');
          client.emit('error', { message: 'La trivia no tiene preguntas' });
        }
      }).catch(error => {
        console.error('Error loading trivia questions:', error);
        client.emit('error', { message: 'No se pudieron cargar las preguntas' });
      });
    }
    
    return { success: true };
  }

  private startNextRound(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (!room || room.round >= room.questions.length) {
      // Juego terminado - mostrar countdown final y ranking
      this.server.to(roomId).emit('gameEnding', { 
        message: '¡El juego está por terminar!',
        countdown: 5
      });
      
      // Después de 5 segundos, mostrar ranking
      setTimeout(() => {
        const ranking = this.roomsService.getRanking(roomId);
        console.log(`🏆 Game finished in room ${roomId}! Final ranking:`, ranking);
        console.log(`📊 Total players: ${room.players.length}, Total rounds: ${room.round}`);
        
        this.server.to(roomId).emit('gameEnded', { 
          message: '¡Juego terminado!',
          ranking: ranking,
          showRanking: true
        });
        
        // Actualizar estado del room
        room.isActive = false;
        this.server.to(roomId).emit('roomState', room);
        
        console.log(`✅ Room ${roomId} game state updated to inactive`);
      }, 5000);
      return;
    }

    room.round++;
    const currentQuestion = room.questions[room.round - 1];
    room.currentQuestion = {
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer
    };

    // Resetear respuestas de jugadores
    room.players.forEach(player => {
      player.answeredAt = undefined;
      player.answeredCorrect = undefined;
    });

    // Enviar pregunta a todos
    this.server.to(roomId).emit('newRound', {
      round: room.round,
      question: room.currentQuestion.question,
      options: room.currentQuestion.options,
      timerSeconds: 15
    });

    // Enviar estado actualizado
    this.server.to(roomId).emit('roomState', room);
    
    // Automáticamente avanzar a la siguiente pregunta después de 15 segundos
    // Solo si no es la última pregunta
    if (room.round < room.questions.length) {
      setTimeout(() => {
        this.startNextRound(roomId);
      }, 15000);
    } else {
      // Si es la última pregunta, esperar 15 segundos y luego terminar el juego
      setTimeout(() => {
        this.startNextRound(roomId); // Esta llamada detectará que no hay más preguntas y terminará el juego
      }, 15000);
    }
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

  @SubscribeMessage('roomActivated')
  handleRoomActivated(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Room activated:', data.roomId);
    
    // Activar la sala en el servicio
    const room = this.roomsService.getRoom(data.roomId);
    if (room) {
      room.isActive = true;
      
      // Notificar a todos en la sala que está activa
      this.server.to(data.roomId).emit('roomActivated', {
        message: data.message,
        roomId: data.roomId
      });
      
      // Enviar estado actualizado
      this.server.to(data.roomId).emit('roomState', room);
    }
    
    return { success: true };
  }

  @SubscribeMessage('roomDeactivated')
  handleRoomDeactivated(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Room deactivated:', data.roomId);
    
    // Desactivar la sala en el servicio
    const room = this.roomsService.getRoom(data.roomId);
    if (room) {
      room.isActive = false;
      
      // Notificar a todos en la sala que está inactiva
      this.server.to(data.roomId).emit('roomDeactivated', {
        message: data.message,
        roomId: data.roomId
      });
      
      // Enviar estado actualizado
      this.server.to(data.roomId).emit('roomState', room);
    }
    
    return { success: true };
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() data: { roomId: string; triviaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Creating room:', data.roomId, 'for trivia:', data.triviaId);
    
    // Crear la room si no existe
    let room = this.roomsService.getRoom(data.roomId);
    if (!room) {
      room = this.roomsService.createRoom(data.roomId, data.triviaId);
      console.log('Room created:', room);
    }
    
    return { success: true, room };
  }

  @SubscribeMessage('getRoomState')
  handleGetRoomState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.roomsService.getRoom(data.roomId);
    if (room) {
      client.emit('roomState', room);
    }
    return { success: !!room };
  }

  @SubscribeMessage('endGame')
  handleEndGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('End game request for room:', data.roomId);
    console.log('Available rooms:', Object.keys(this.roomsService['rooms']));
    
    const room = this.roomsService.getRoom(data.roomId);
    if (!room) {
      console.log('Room not found:', data.roomId);
      return { success: false, error: 'Room not found' };
    }
    
    const success = this.roomsService.endGame(data.roomId);
    
    if (success) {
      // Actualizar estado en la base de datos
      this.roomsService.updateTriviaStatus(data.roomId, false);
      
      // Notificar a todos en el room que el juego ha terminado
      this.server.to(data.roomId).emit('gameEnded', { 
        message: 'El juego ha sido finalizado por el administrador',
        finalRanking: this.roomsService.getRanking(data.roomId)
      });
    }
    
    return { success };
  }
}
