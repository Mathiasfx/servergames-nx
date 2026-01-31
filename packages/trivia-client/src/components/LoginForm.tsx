import React, { useEffect, useState, useRef } from 'react';
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
  const [socketConnected, setSocketConnected] = useState(false);
  const listenersSetupRef = useRef(false); // 👈 Prevenir listeners duplicados

  // 1️⃣ EFECTO: Configurar listeners una sola vez
  useEffect(() => {
    // ✅ Solo registrar listeners UNA VEZ
    if (listenersSetupRef.current) return;
    listenersSetupRef.current = true;

    console.log('📡 Setting up socket listeners');

    // Escuchar conexión
    socketService.on('connect', () => {
      console.log('✅ Socket connected');
      setSocketConnected(true);
    });

    // Escuchar éxito de join
    socketService.on('joinRoomSuccess', (data) => {
      console.log('✅ Successfully joined room:', data);
      onLoadingChange?.(false);
      onJoin(data.player.name, data.room.id);
    });

    // Escuchar errores de join
    socketService.on('joinRoomError', (error) => {
      console.error('❌ Error joining room:', error);
      onLoadingChange?.(false);
      alert(`Error: ${error.message}`);
    });

    // Escuchar errores generales
    socketService.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
      onLoadingChange?.(false);
    });

    // Cleanup: NO desregistrar listeners aquí, mantenerlos activos
    return () => {
      // Opcional: limpiar solo si es necesario
      // socketService.off('connect', ...);
    };
  }, []); // ✅ Dependencias vacías: ejecutar UNA SOLA VEZ

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;

    console.log('🔘 Submit clicked');
    onLoadingChange?.(true);

    // ✅ Siempre conectar primero, luego emitir joinRoom
    if (!socketConnected) {
      console.log('🔌 Connecting socket...');
      socketService.connect();
      
      // Esperar a que conecte
      setTimeout(() => {
        console.log('📨 Emitting joinRoom');
        socketService.emit('joinRoom', {
          roomId: roomId.trim().toUpperCase(),
          name: name.trim(),
          isAdmin: false,
        });
      }, 1000);
    } else {
      console.log('📨 Emitting joinRoom (socket already connected)');
      socketService.emit('joinRoom', {
        roomId: roomId.trim().toUpperCase(),
        name: name.trim(),
        isAdmin: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2">🎮</h1>
          <h2 className="text-4xl font-bold text-gray-900">Trivia Game</h2>
          <p className="text-gray-600 mt-2 text-lg">Únete a jugar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tu Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-base font-semibold text-gray-800 mb-3"
            >
              Tu Nombre
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white text-gray-900"
              placeholder="Ingresa tu nombre"
              required
              maxLength={20}
              disabled={isConnecting}
            />
          </div>

          {/* ID de la Sala */}
          <div>
            <label
              htmlFor="roomId"
              className="block text-base font-semibold text-gray-800 mb-3"
            >
              ID de la Sala
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition uppercase bg-white text-gray-900"
              placeholder="EJ: DWDO"
              required
              maxLength={4}
              disabled={isConnecting}
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isConnecting || !name.trim() || !roomId.trim()}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-lg transition duration-200 shadow-lg"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-3">
                <span className="inline-block animate-spin">⏳</span>
                <span>Conectando...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <span>➜</span>
                <span>Unirse al Juego</span>
              </span>
            )}
          </button>
        </form>

        {/* Status */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-gray-600 text-base">
            💡 Pide al administrador el ID de la sala
          </p>
        </div>
      </div>
    </div>
  );
};
