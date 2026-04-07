import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Conectar al servidor de WebSockets.
 * Usa el token JWT para autenticación.
 */
export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No hay token JWT para conectar socket');
    throw new Error('No autenticado');
  }

  // Conectar al mismo host que la API (proxied por Vite en dev)
  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket conectado:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket desconectado:', reason);
  });

  return socket;
}

/**
 * Desconectar el socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Obtener instancia del socket actual.
 */
export function getSocket(): Socket | null {
  return socket;
}
