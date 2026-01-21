import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

interface Message {
  timestamp: string;
  text: string;
  type: 'sent' | 'received';
}

interface GameInfo {
  players: any[];
  round: number;
  currentQuestion?: {
    question: string;
    options: string[];
  };
}

@Component({
  selector: 'app-test-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-client.component.html',
  styleUrls: ['./test-client.component.css']
})
export class TestClientComponent implements OnInit, OnDestroy {
  serverUrl = 'http://localhost:3007/rooms';
  isConnected = false;
  isConnecting = false;
  playerName = 'Jugador Test';
  roomId = '';
  customEvent = 'joinRoom';
  customData = '{"roomId": "", "name": "Jugador Test"}';
  
  messages: Message[] = [];
  currentRoomId: string | null = null;
  currentPlayerId: string | null = null;
  gameInfo: GameInfo | null = null;
  currentQuestion: { question: string; options: string[] } | null = null;
  playersCount = 0;
  currentRound = '-';

  private socket: Socket | null = null;

  ngOnInit() {
    // Inicializar datos de ejemplo
    this.customData = JSON.stringify({
      roomId: "",
      name: "Jugador Test"
    }, null, 2);
  }

  ngOnDestroy() {
    this.disconnect();
  }

  toggleConnection() {
    if (this.isConnected) {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  connect() {
    // Evitar múltiples conexiones
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnecting = true;
    this.addMessage(`Conectando a ${this.serverUrl}...`, 'sent');
    
    this.socket = io(this.serverUrl);
    
    if (this.socket) {
      this.socket.on('connect', () => {
        this.addMessage('✅ Conectado al servidor', 'received');
        this.isConnected = true;
        this.isConnecting = false;
      });
      
      this.socket.on('disconnect', () => {
        this.addMessage('❌ Desconectado del servidor', 'received');
        this.isConnected = false;
        this.currentRoomId = null;
        this.currentPlayerId = null;
        this.gameInfo = null;
      });
      
      this.socket.on('roomState', (data: GameInfo) => {
        this.addMessage(`📊 Estado de la sala: ${JSON.stringify(data, null, 2)}`, 'received');
        this.updateGameInfo(data);
      });
      
      this.socket.on('playerJoined', (data: any) => {
        this.addMessage(`👤 Jugador se unió: ${JSON.stringify(data)}`, 'received');
      });
      
      this.socket.on('playerLeft', (data: any) => {
        this.addMessage(`👋 Jugador se fue: ${JSON.stringify(data)}`, 'received');
      });
      
      this.socket.on('countdown', () => {
        this.addMessage('🚀 ¡Cuenta regresiva iniciada!', 'received');
      });
      
      this.socket.on('gameStarted', () => {
        this.addMessage('🎮 ¡Juego iniciado!', 'received');
      });
      
      this.socket.on('newRound', (data: any) => {
        this.addMessage(`📝 Nueva ronda: ${JSON.stringify(data)}`, 'received');
        this.showQuestion(data);
      });
      
      this.socket.on('answerSubmitted', (data: any) => {
        this.addMessage(`✅ Respuesta enviada: ${JSON.stringify(data)}`, 'received');
      });
      
      this.socket.on('rankingUpdated', (data: any) => {
        this.addMessage(`🏆 Ranking actualizado: ${JSON.stringify(data)}`, 'received');
      });
      
      this.socket.on('gameEnded', (data: any) => {
        this.addMessage(`🏁 Juego terminado: ${JSON.stringify(data)}`, 'received');
        this.gameInfo = null;
        this.currentQuestion = null;
      });
      
      this.socket.on('connect_error', (error: Error) => {
        this.addMessage(`❌ Error de conexión: ${error.message}`, 'received');
        this.isConnected = false;
        this.isConnecting = false;
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.currentRoomId = null;
    this.currentPlayerId = null;
    this.gameInfo = null;
    this.currentQuestion = null;
  }

  joinRoom() {
    if (!this.playerName || !this.roomId) {
      alert('Por favor ingresa nombre y Room ID');
      return;
    }
    
    const data = { roomId: this.roomId, name: this.playerName };
    this.addMessage(`📤 Enviando joinRoom: ${JSON.stringify(data)}`, 'sent');
    
    if (this.socket) {
      this.socket.emit('joinRoom', data, (response: any) => {
        this.addMessage(`📥 Respuesta joinRoom: ${JSON.stringify(response)}`, 'received');
        if (response && response.success) {
          this.currentRoomId = this.roomId;
          this.currentPlayerId = response.playerId;
        }
      });
    }
  }

  startGame() {
    if (!this.currentRoomId) return;
    
    const questions = [
      {
        question: "no estaba",
        options: ["si", "no"],
        answer: "no"
      }
    ];
    
    const data = { roomId: this.currentRoomId, questions };
    this.addMessage(`📤 Enviando startGame: ${JSON.stringify(data)}`, 'sent');
    
    if (this.socket) {
      this.socket.emit('startGame', data, (response: any) => {
        this.addMessage(`📥 Respuesta startGame: ${JSON.stringify(response)}`, 'received');
      });
    }
  }

  sendCustomEvent() {
    try {
      const data = JSON.parse(this.customData);
      this.addMessage(`📤 Enviando ${this.customEvent}: ${JSON.stringify(data)}`, 'sent');
      
      if (this.socket) {
        this.socket.emit(this.customEvent, data, (response: any) => {
          this.addMessage(`📥 Respuesta ${this.customEvent}: ${JSON.stringify(response)}`, 'received');
        });
      }
    } catch (error) {
      alert('Error en el JSON: ' + (error as Error).message);
    }
  }

  submitAnswer(answer: string) {
    if (!this.currentRoomId || !this.currentPlayerId) return;
    
    const data = { roomId: this.currentRoomId, playerId: this.currentPlayerId, answer };
    this.addMessage(`📤 Enviando submitAnswer: ${JSON.stringify(data)}`, 'sent');
    
    if (this.socket) {
      this.socket.emit('submitAnswer', data, (response: any) => {
        this.addMessage(`📥 Respuesta submitAnswer: ${JSON.stringify(response)}`, 'received');
      });
    }
  }

  updateGameInfo(roomState: GameInfo) {
    this.gameInfo = roomState;
    if (roomState) {
      this.playersCount = roomState.players ? roomState.players.length : 0;
      this.currentRound = roomState.round ? roomState.round.toString() : '-';
    }
  }

  showQuestion(data: { question: string; options: string[] }) {
    this.currentQuestion = data;
  }

  addMessage(text: string, type: 'sent' | 'received' = 'received') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'sent' ? '📤' : '📥';
    this.messages.push({
      timestamp,
      text: `${prefix} ${text}`,
      type
    });
  }

  clearMessages() {
    this.messages = [];
  }
}
