/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import type { Player, Room } from '../types/game';

interface LobbyProps {
  room: Room;
  playerName: string;
}

export const Lobby: React.FC<LobbyProps> = ({ room, playerName }) => {
  const [players, setPlayers] = useState<Player[]>(
    room.players.filter((p) => !p.isAdmin)
  );
  const [countdown, setCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const playersMapRef = useRef<Map<string, Player>>(new Map());

  useEffect(() => {
    // ✅ Inicializar Map solo con jugadores (sin admin)
    playersMapRef.current.clear();
    room.players
      .filter((p) => !p.isAdmin)
      .forEach((p) => playersMapRef.current.set(p.id, p));

    setPlayers(room.players.filter((p) => !p.isAdmin));

    const handlePlayerJoined = (data: { player: Player }) => {
      const player = data.player;

      // ❌ Ignorar si es admin
      if (player.isAdmin) {
        console.log(`🚫 Admin user ignored: ${player.name}`);
        return;
      }

      console.log(`👤 Player joined: ${player.name}`);

      if (playersMapRef.current.has(player.id)) {
        console.log(`⏭️ Player already exists: ${player.name}`);
        return;
      }

      console.log(`✅ Adding new player: ${player.name}`);
      playersMapRef.current.set(player.id, player);

      setPlayers((prev) => {
        if (prev.some((p) => p.id === player.id)) {
          return prev;
        }
        return [...prev, player];
      });
    };

    const handlePlayerLeft = (data: { player: Player }) => {
      const player = data.player;
      console.log(`👤 Player left: ${player.name}`);
      playersMapRef.current.delete(player.id);
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
    };

    const handleRoomState = (roomState: Room) => {
      console.log(
        `📊 Room state update: ${roomState.players.length} total (${
          roomState.players.filter((p) => !p.isAdmin).length
        } jugadores)`
      );

      // ✅ Filtrar solo jugadores, no admins
      const gamePlayers = roomState.players.filter((p) => !p.isAdmin);
      playersMapRef.current.clear();
      gamePlayers.forEach((p) => playersMapRef.current.set(p.id, p));

      setPlayers(gamePlayers);
    };

    const handleCountdown = (data: { seconds?: number }) => {
      console.log(`⏱️ Countdown: ${data.seconds || 3}, 2, 1...`);
      setCountdown(data.seconds || 3);
      let count = data.seconds || 3;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) clearInterval(interval);
      }, 1000);
    };

    socketService.on('playerJoined', handlePlayerJoined);
    socketService.on('playerLeft', handlePlayerLeft);
    socketService.on('roomState', handleRoomState);
    socketService.on('countdown', handleCountdown);

    return () => {
      socketService.off('playerJoined', handlePlayerJoined as (data: any) => void);
      socketService.off('playerLeft', handlePlayerLeft as (data: any) => void);
      socketService.off('roomState', handleRoomState as (data: any) => void);
      socketService.off('countdown', handleCountdown as (data: any) => void);
    };
  }, [room.players]);

  // Mostrar countdown
  if (countdown > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            El juego comienza en
          </h2>
          <p className="text-6xl font-bold text-yellow-300">{countdown}</p>
        </div>
      </div>
    );
  }

  // Mostrar lobby
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          🎮 Trivia Game
        </h1>
        <p className="text-gray-600 mb-6">
          Bienvenido, {playerName}
        </p>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Jugadores en la sala
            </h2>
            <span className="text-2xl font-bold text-purple-600">
              {players.length}/10
            </span>
          </div>

          {players.length >= 10 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              ⚠️ La sala está llena
            </div>
          )}

          {players.length === 0 && (
            <div className="bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded text-center">
              <p className="text-sm">Esperando jugadores...</p>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{player.name}</p>
                  <p className="text-sm text-gray-600">Score: {player.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded text-center">
          <p className="font-semibold">
            ⏳ Esperando que el administrador inicie el juego...
          </p>
          <p className="text-sm mt-1">
            Jugadores conectados: {players.length}/10
          </p>
        </div>
      </div>
    </div>
  );
};
