/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import type { Player, Room } from '../types/game';
import { socketService } from '../services/socketService';

interface LobbyProps {
  room: Room;
  playerName: string;
  onStartGame: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  room,
  playerName,
  onStartGame,
}) => {
  const [players, setPlayers] = useState<Player[]>(room.players);
  const [isAdmin, setIsAdmin] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const currentPlayer = players.find((p) => p.name === playerName);
    setIsAdmin(currentPlayer?.isAdmin || false);
  }, [players, playerName]);

  useEffect(() => {
    const handlePlayerJoined = (player: Player) => {
      setPlayers((prev) => {
        // Check if player already exists by ID
        if (!prev.find((p) => p.id === player.id)) {
          return [...prev, player];
        }
        return prev;
      });
    };

    const handlePlayerLeft = (player: Player) => {
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
    };

    const handleRoomStateUpdate = (roomState: Room) => {
      // Remove duplicates by ID and update players
      const uniquePlayers = roomState.players.filter(
        (player, index, self) =>
          index === self.findIndex((p) => p.id === player.id)
      );
      setPlayers(uniquePlayers);
    };

    const handleCountdown = () => {
      console.log(' Lobby - Countdown received');
      setCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
        count--;
        console.log(' Lobby - Countdown:', count);
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
        }
      }, 1000);
    };

    socketService.on('playerJoined', handlePlayerJoined);
    socketService.on('playerLeft', handlePlayerLeft);
    socketService.on('roomStateUpdate', handleRoomStateUpdate);
    socketService.on('countdown', handleCountdown);

    return () => {
      socketService.off(
        'playerJoined',
        handlePlayerJoined as (data: any) => void
      );
      socketService.off('playerLeft', handlePlayerLeft as (data: any) => void);
      socketService.off(
        'roomStateUpdate',
        handleRoomStateUpdate as (data: any) => void
      );
      socketService.off('countdown', handleCountdown as () => void);
    };
  }, [playerName]);

  // Show countdown if active
  if (countdown > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl font-bold text-white animate-pulse mb-4">
            {countdown}
          </div>
          <p className="text-2xl text-white">
            {countdown === 3
              ? 'Prepárate...'
              : countdown === 2
              ? 'Listos...'
              : '¡El juego comienza!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎮 Sala de Espera
        </h1>

        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-gray-700">Sala: {room.id}</p>
          <p className="text-sm text-gray-600">Esperando jugadores...</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Jugadores Conectados ({players.filter((p) => !p.isAdmin).length})
          </h2>
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg">
                {players.filter((p) => !p.isAdmin).length}{' '}
                {players.filter((p) => !p.isAdmin).length === 1
                  ? 'jugador listo'
                  : 'jugadores listos'}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="text-center">
            <button
              onClick={onStartGame}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:from-green-600 hover:to-green-700 transition duration-200"
            >
              🎯 Comenzar Juego
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Esperando para comenzar...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
