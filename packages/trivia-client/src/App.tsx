/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Lobby } from './components/Lobby';
import { socketService } from './services/socketService';
import type { Room } from './types/game';

function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // ✅ Escuchar eventos del socket (sin conectar automáticamente)
    console.log('📱 App initialized');

    // Escuchar cuando se une a una sala
    socketService.on('joinRoomSuccess', (data: any) => {
      console.log('✅ Joined room successfully:', data);
      setPlayerName(data.player.name);
      setCurrentRoom(data.room);
      setIsConnecting(false);
    });

    // Escuchar errores
    socketService.on('joinRoomError', (error: any) => {
      console.error('❌ Error joining room:', error);
      setIsConnecting(false);
    });

    return () => {
      // Cleanup opcional
    };
  }, []);

  const handleJoin = (name: string, roomId: string) => {
    // No hacer nada aquí, LoginForm se encarga de todo
  };

  // ✅ Si hay sala, mostrar Lobby
  if (currentRoom && playerName) {
    return <Lobby room={currentRoom} playerName={playerName} />;
  }

  // ✅ Si no hay sala, mostrar formulario de login
  return (
    <LoginForm
      onJoin={handleJoin}
      onLoadingChange={setIsConnecting}
      isConnecting={isConnecting}
    />
  );
}

export default App;
