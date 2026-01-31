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
    origin: [
      'https://triviamultiplayerdashboard.netlify.app',
      'https://triviamultiplayer.netlify.app',
      'https://trivianestapi.com.ar',
      'http://trivianestapi.com.ar',
      'http://localhost:3000',
      'http://localhost:4200',
      'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private roomsService: RoomsService,
    private triviasService: TriviasService
  ) {}

  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);

    // Buscar y remover el jugador de todas las salas
    let playerRemoved = false;
    Object.keys(this.roomsService['rooms']).forEach((roomId) => {
      const room = this.roomsService.getRoom(roomId);
      if (room) {
        const playerId = client.data.playerId;
        if (playerId) {
          const playerIndex = room.players.findIndex((p) => p.id === playerId);
          if (playerIndex !== -1) {
            const removedPlayer = room.players.splice(playerIndex, 1)[0];
            this.server
              .to(roomId)
              .emit('playerLeft', { player: removedPlayer });
            this.server.to(roomId).emit('roomState', room);
            console.log(`👤 Player ${removedPlayer.name} left room ${roomId}`);
            playerRemoved = true;
          }
        }
      }
    });

    if (!playerRemoved) {
      console.log(`⚠️ No player found for disconnected client: ${client.id}`);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; name: string; isAdmin?: boolean },
    @ConnectedSocket() client: Socket
  ) {
    console.log(
      `📨 JOIN ROOM REQUEST - Player: ${data.name}, Room: ${data.roomId}`
    );

    // Validar datos
    if (!data || !data.roomId || !data.name) {
      console.error('❌ Missing required fields');
      client.emit('joinRoomError', {
        type: 'INVALID_DATA',
        message: 'Nombre y ID de sala son requeridos',
      });
      return;
    }

    try {
      const room = this.roomsService.getRoom(data.roomId);

      // ✅ VALIDACIÓN 1: Verificar si la sala existe
      if (!room) {
        console.error(`❌ Room ${data.roomId} does not exist`);
        client.emit('joinRoomError', {
          type: 'ROOM_NOT_FOUND',
          message: `La sala "${data.roomId}" no existe.`,
        });
        return;
      }

      // ✅ VALIDACIÓN 2: Verificar si el juego ya comenzó
      if (room.gameStarted) {
        console.error(`❌ Room ${data.roomId} game already started`);
        client.emit('joinRoomError', {
          type: 'GAME_ALREADY_STARTED',
          message: `La sala "${data.roomId}" ya está en juego.`,
        });
        return;
      }

      // ✅ VALIDACIÓN 3: Verificar límite de jugadores (MAX 10)
      if (room.players.length >= 10) {
        console.error(
          `❌ Room ${data.roomId} is full (${room.players.length}/10)`
        );
        client.emit('joinRoomError', {
          type: 'ROOM_FULL',
          message: `La sala "${data.roomId}" está llena (máximo 10 jugadores).`,
        });
        return;
      }

      // ✅ VALIDACIÓN 4: Verificar si el usuario ya está en la sala
      const existingPlayer = room.players.find((p) => p.name === data.name);
      if (existingPlayer) {
        console.log(`⚠️ Player ${data.name} already in room ${data.roomId}`);
        // Simplemente enviar el estado actual sin agregar duplicado
        client.join(data.roomId);
        client.data.playerId = existingPlayer.id;
        client.data.roomId = data.roomId;

        client.emit('joinRoomSuccess', {
          success: true,
          player: existingPlayer,
          room,
          message: `Bienvenido de vuelta ${existingPlayer.name}!`,
        });
        return;
      }

      // Intentar unirse a la sala
      const player = this.roomsService.joinRoom(
        data.roomId,
        data.name,
        data.isAdmin
      );

      if (!player) {
        console.error(`❌ Failed to join room ${data.roomId}`);
        client.emit('joinRoomError', {
          type: 'UNKNOWN_ERROR',
          message: 'No se pudo unir a la sala',
        });
        return;
      }

      // ✅ Éxito: Unirse al room de socket.io
      client.join(data.roomId);
      client.data.playerId = player.id;
      client.data.roomId = data.roomId;

      console.log(
        `✅ Player joined successfully - ID: ${player.id}, Socket: ${client.id}, Admin: ${player.isAdmin}`
      );

      const updatedRoom = this.roomsService.getRoom(data.roomId);

      // 1️⃣ Enviar confirmación al cliente que se unió
      client.emit('joinRoomSuccess', {
        success: true,
        player,
        room: updatedRoom,
        message: `Bienvenido ${player.name}! Te has unido a la sala ${data.roomId}`,
      });

      // 2️⃣ Notificar a todos EXCEPTO al que se acaba de unir
      client.to(data.roomId).emit('playerJoined', { player });

      // 3️⃣ Enviar estado actualizado a todos
      this.server.to(data.roomId).emit('roomState', updatedRoom);

      console.log(
        `📊 Room ${data.roomId} now has ${updatedRoom.players.length}/10 players`
      );
    } catch (error) {
      console.error('💥 Error in joinRoom:', error);
      client.emit('joinRoomError', {
        type: 'SERVER_ERROR',
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody() data: { roomId: string; triviaId: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(
      `🎮 START GAME - Room: ${data.roomId}, Trivia: ${data.triviaId}`
    );

    try {
      const room = this.roomsService.getRoom(data.roomId);
      if (!room) {
        console.error(`❌ Room ${data.roomId} not found`);
        client.emit('startGameError', {
          type: 'ROOM_NOT_FOUND',
          message: 'La sala no existe',
        });
        return;
      }

      // ✅ Verificar que isActive sea true (sala activada)
      if (!room.isActive) {
        console.error(`❌ Room ${data.roomId} is not active`);
        client.emit('startGameError', {
          type: 'ROOM_NOT_ACTIVE',
          message: 'La sala debe estar activa para iniciar el juego',
        });
        return;
      }

      // ✅ Verificar que el juego NO esté ya iniciado
      if (room.gameStarted) {
        console.error(`❌ Game already started in room ${data.roomId}`);
        client.emit('startGameError', {
          type: 'GAME_ALREADY_STARTED',
          message: 'El juego ya ha comenzado',
        });
        return;
      }

      // Cargar preguntas de la trivia
      this.triviasService
        .getTriviaById(data.triviaId)
        .then((trivia) => {
          if (trivia && trivia.questions && Array.isArray(trivia.questions)) {
            const questions = trivia.questions.map((q: any) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.answer,
            }));

            // ✅ Iniciar el juego con el servicio
            const success = this.roomsService.startGame(data.roomId, questions);

            if (success) {
              console.log(
                `✅ Game started in room ${data.roomId} with ${questions.length} questions`
              );

              // Enviar countdown
              this.server.to(data.roomId).emit('countdown', {
                message: 'El juego comienza en...',
                seconds: 3,
              });

              // Después de 3 segundos, enviar primera pregunta
              setTimeout(() => {
                this.startNextRound(data.roomId);

                this.server.to(data.roomId).emit('gameStarted', {
                  roomId: data.roomId,
                  totalQuestions: questions.length,
                  message: '¡Comienza el juego!',
                });
              }, 3000);
            } else {
              console.error(`❌ Failed to start game in room ${data.roomId}`);
              client.emit('startGameError', {
                message: 'No se pudo iniciar el juego',
              });
            }
          } else {
            console.error('❌ No questions found in trivia');
            client.emit('startGameError', {
              message: 'La trivia no tiene preguntas',
            });
          }
        })
        .catch((error) => {
          console.error('❌ Error loading trivia:', error);
          client.emit('startGameError', {
            message: 'Error al cargar las preguntas',
          });
        });

      return { success: true };
    } catch (error) {
      console.error('💥 Error in startGame:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private startNextRound(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (!room || room.round >= room.questions.length) {
      this.endGameSequence(roomId);
      return;
    }

    room.round++;
    const currentQuestion = room.questions[room.round - 1];
    room.currentQuestion = {
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
    };

    // Resetear respuestas
    room.players.forEach((player) => {
      player.answeredAt = undefined;
      player.answeredCorrect = undefined;
    });

    console.log(
      `📝 Round ${room.round}/${room.questions.length} in room ${roomId}`
    );

    // Enviar pregunta
    this.server.to(roomId).emit('newRound', {
      round: room.round,
      question: room.currentQuestion.question,
      options: room.currentQuestion.options,
      timerSeconds: 15,
    });

    this.server.to(roomId).emit('roomState', room);

    // Auto-avanzar después de 15 segundos
    setTimeout(() => {
      this.startNextRound(roomId);
    }, 15000);
  }

  private endGameSequence(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (!room) return;

    console.log(`🏁 Game ending for room ${roomId}`);

    this.server.to(roomId).emit('gameEnding', {
      message: '¡El juego está por terminar!',
      countdown: 5,
    });

    setTimeout(() => {
      const ranking = this.roomsService.getRanking(roomId);
      console.log(`🏆 Final ranking for room ${roomId}:`, ranking);

      this.server.to(roomId).emit('gameEnded', {
        message: '¡Juego terminado!',
        ranking: ranking,
        showRanking: true,
      });

      room.gameStarted = false;
      room.isActive = false;
      this.server.to(roomId).emit('roomState', room);
    }, 5000);
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: { roomId: string; playerId: string; answer: string },
    @ConnectedSocket() client: Socket
  ) {
    const result = this.roomsService.submitAnswer(
      data.roomId,
      data.playerId,
      data.answer
    );

    if (result) {
      this.server.to(client.id).emit('answerSubmitted', {
        correct: result.correct,
        score: result.score,
      });

      const ranking = this.roomsService.getRanking(data.roomId);
      this.server.to(data.roomId).emit('rankingUpdated', ranking);

      this.checkRoundComplete(data.roomId);
    }

    return result;
  }

  private checkRoundComplete(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (!room) return;

    const allAnswered = room.players.every((p) => p.answeredAt !== undefined);

    if (allAnswered) {
      setTimeout(() => {
        const hasNextRound = this.roomsService.nextRound(roomId);

        if (hasNextRound) {
          this.sendCurrentQuestion(roomId);
        } else {
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
        timerSeconds: 15,
      });
    }
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() data: { roomId: string; triviaId: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(
      `🏠 Creating room: ${data.roomId} for trivia: ${data.triviaId}`
    );

    let room = this.roomsService.getRoom(data.roomId);
    if (!room) {
      room = this.roomsService.createRoom(data.roomId, data.triviaId);
      console.log(`✅ Room created: ${data.roomId}`);
    }

    return { success: true, room };
  }

  @SubscribeMessage('getRoomState')
  handleGetRoomState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = this.roomsService.getRoom(data.roomId);
    if (room) {
      client.emit('roomState', room);
      return { success: true };
    }
    return { success: false, error: 'Room not found' };
  }

  @SubscribeMessage('endGame')
  handleEndGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`🛑 End game request for room: ${data.roomId}`);

    const room = this.roomsService.getRoom(data.roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const success = this.roomsService.endGame(data.roomId);

    if (success) {
      this.roomsService.updateTriviaStatus(data.roomId, false);
      this.server.to(data.roomId).emit('gameEnded', {
        message: 'El juego ha sido finalizado por el administrador',
        finalRanking: this.roomsService.getRanking(data.roomId),
      });
      console.log(`✅ Game ended for room: ${data.roomId}`);
    }

    return { success };
  }

  @SubscribeMessage('updateRoomStatus')
  handleUpdateRoomStatus(
    @MessageBody() data: { roomId: string; isActive: boolean },
    @ConnectedSocket() client: Socket
  ) {
    console.log(
      `🔄 Update room status - Room: ${data.roomId}, Active: ${data.isActive}`
    );

    try {
      const room = this.roomsService.getRoom(data.roomId);

      if (!room) {
        console.error(`❌ Room ${data.roomId} not found`);
        client.emit('updateRoomStatusError', {
          type: 'ROOM_NOT_FOUND',
          message: 'La sala no existe',
        });
        return;
      }

      // ✅ Actualizar estado de la sala
      room.isActive = data.isActive;
      console.log(
        `✅ Room ${data.roomId} status updated to: ${data.isActive ? 'ACTIVE' : 'INACTIVE'}`
      );

      // ✅ Emitir evento a todos los clientes en la sala
      if (data.isActive) {
        this.server.to(data.roomId).emit('roomActivated', {
          message: 'La sala ha sido activada',
          roomId: data.roomId,
        });
      } else {
        this.server.to(data.roomId).emit('roomDeactivated', {
          message: 'La sala ha sido desactivada',
          roomId: data.roomId,
        });
      }

      // ✅ Enviar estado actualizado a todos
      this.server.to(data.roomId).emit('roomState', room);

      // ✅ Responder con éxito al cliente
      return { success: true, room };
    } catch (error) {
      console.error('💥 Error in updateRoomStatus:', error);
      client.emit('updateRoomStatusError', {
        type: 'SERVER_ERROR',
        message: 'Error al actualizar el estado de la sala',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { success: false };
    }
  }
}
