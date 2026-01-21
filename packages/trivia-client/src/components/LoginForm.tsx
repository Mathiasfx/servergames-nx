import React, { useState } from 'react';
import { socketService } from '../services/socketService';

interface LoginFormProps {
  onJoin: (name: string, roomId: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  isConnecting: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onJoin,
  onLoadingChange,
  isConnecting,
}) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;

    onLoadingChange?.(true);

    try {
      socketService.connect();

      // Let App.tsx handle the joinRoom call to avoid duplicates
      onJoin(name.trim(), roomId.trim());
    } catch (error) {
      console.error('Error joining room:', error);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎮 Trivia Game
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tu Nombre
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="Ingresa tu nombre"
              required
              maxLength={20}
            />
          </div>

          <div>
            <label
              htmlFor="roomId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ID de la Sala
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition uppercase"
              placeholder="Ingresa el ID de la sala"
              required
              maxLength={10}
            />
          </div>

          <button
            type="submit"
            disabled={isConnecting || !name.trim() || !roomId.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {isConnecting ? 'Conectando...' : 'Unirse al Juego'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Ingresa tu nombre y el ID de la sala para comenzar</p>
        </div>
      </div>
    </div>
  );
};
