/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { socketService } from './services/socketService';
import type { Room, Player } from './types/game';

type GameState = 'login' | 'lobby' | 'game' | 'gameEnded';

interface GameData {
  playerName: string;
  roomId: string;
  playerId: string;
  room: Room;
}

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('login');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [finalRanking, setFinalRanking] = useState<Player[]>([]);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLoadingChange = (loading: boolean) => {
    setIsConnecting(loading);
  };

  useEffect(() => {
    const handleRoomStateUpdate = (data: unknown) => {
      const room = data as Room;
      if (gameData) {
        setGameData((prev) => (prev ? { ...prev, room } : null));

        // Only change to game state if we're currently in lobby and room becomes active
        if (room.isActive && gameState === 'lobby') {
          setGameState('game');
        }
      }
    };

    const handleGameStarted = (_data: any) => {
      setGameState('game');
    };

    const handleGameEnded = (data: any) => {
      setFinalRanking(data.ranking || []);
      setGameState('gameEnded');
    };

    socketService.on('roomStateUpdate', handleRoomStateUpdate);
    socketService.on('gameStarted', handleGameStarted);
    socketService.on('gameEnded', handleGameEnded);

    return () => {
      socketService.off(
        'roomStateUpdate',
        handleRoomStateUpdate as (data: unknown) => void
      );
      socketService.off('gameStarted', handleGameStarted);
      socketService.off('gameEnded', handleGameEnded);
    };
  }, [gameData, gameState]);

  const handleJoin = (name: string, roomId: string) => {
    // Set up a one-time listener for room state update
    const handleRoomStateUpdate = (data: unknown) => {
      const room = data as Room;
      const player = room.players.find((p) => p.name === name);
      if (player) {
        setGameData({
          playerName: name,
          roomId,
          playerId: player.id,
          room,
        });
        setGameState('lobby');
        // Reset loading state on successful join
        setIsConnecting(false);
        // Remove this listener after successful join
        socketService.off(
          'roomStateUpdate',
          handleRoomStateUpdate as (data: unknown) => void
        );
        socketService.off('error', handleError);
      }
    };

    // Set up error handler
    const handleError = (error: any) => {
      socketService.off(
        'roomStateUpdate',
        handleRoomStateUpdate as (data: unknown) => void
      );
      socketService.off('error', handleError);

      // Reset loading state
      setIsConnecting(false);

      // Show custom notification
      setNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error al unirse a la sala',
        message:
          error.message || 'No se pudo conectar a la sala. Intenta nuevamente.',
      });

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    };

    socketService.on('roomStateUpdate', handleRoomStateUpdate);
    socketService.on('error', handleError);

    // Join room
    socketService.joinRoom(roomId, name);

    // Fallback: if no room state update in 3 seconds, try to get it manually
    setTimeout(() => {
      socketService.off(
        'roomStateUpdate',
        handleRoomStateUpdate as (data: unknown) => void
      );
      socketService.off('error', handleError);
      setIsConnecting(false); // Reset loading on timeout
      const room = socketService.currentRoom;
      if (room) {
        const player = room.players.find((p) => p.name === name);
        if (player) {
          setGameData({
            playerName: name,
            roomId,
            playerId: player.id,
            room,
          });
          setGameState('lobby');
        }
      }
    }, 3000);
  };

  const handleStartGame = () => {
    if (gameData) {
      // Use the triviaId from the room instead of hardcoded value
      const triviaId = gameData.room.triviaId || 'default-trivia';
      socketService.startGame(gameData.roomId, triviaId);
    }
  };

  const renderCurrentState = () => {
    switch (gameState) {
      case 'login':
        return (
          <>
            <LoginForm
              onJoin={handleJoin}
              onLoadingChange={handleLoadingChange}
              isConnecting={false}
            />
            {isConnecting && <div>Connecting...</div>}
          </>
        );

      case 'lobby':
        return gameData ? (
          <Lobby
            room={gameData.room}
            playerName={gameData.playerName}
            onStartGame={handleStartGame}
          />
        ) : null;

      case 'game':
      case 'gameEnded':
        return gameData ? (
          <Game
            room={gameData.room}
            playerName={gameData.playerName}
            playerId={gameData.playerId}
            finalRanking={finalRanking}
            gameEnded={gameState === 'gameEnded'}
          />
        ) : null;

      default:
        return <LoginForm onJoin={handleJoin} isConnecting={false} />;
    }
  };

  // Custom notification component
  const NotificationComponent = () => {
    if (!notification) return null;

    const bgColor = {
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      success: 'bg-green-500',
      info: 'bg-blue-500',
    }[notification.type];

    const icon = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️',
    }[notification.type];

    return (
      <div className="fixed top-4 right-4 z-50 animate-pulse">
        <div
          className={`${bgColor} text-white p-4 rounded-lg shadow-lg max-w-sm flex items-start space-x-3`}
        >
          <span className="text-xl">{icon}</span>
          <div>
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-white hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <NotificationComponent />
      <div className="App">{renderCurrentState()}</div>
    </>
  );
}

export default App;
