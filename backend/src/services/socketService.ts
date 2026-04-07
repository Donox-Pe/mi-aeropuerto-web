import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { prisma } from '../prisma/client.js';
import { verifyToken } from '../utils/jwt.js';

let io: SocketServer | null = null;

// Mapa de usuarios conectados: userId -> Set<socketId>
const connectedUsers = new Map<number, Set<string>>();

/**
 * Inicializa Socket.io sobre el servidor HTTP.
 */
export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware de autenticación
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Token de autenticación requerido'));
    }
    try {
      const payload = verifyToken(token as string);
      (socket as any).userId = payload.sub;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as number;
    const role = (socket as any).userRole as string;

    // Registrar usuario conectado
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    console.log(`🔌 Socket conectado: User #${userId} (${role}) [${socket.id}]`);

    // Unir a room por rol
    socket.join(`role:${role}`);
    socket.join(`user:${userId}`);

    // Enviar confirmación
    socket.emit('connected', {
      message: 'Conectado al servidor de notificaciones',
      userId,
    });

    socket.on('disconnect', async () => {
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
          // Registrar hora de desconexión definitiva
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { lastLogout: new Date() },
            });
          } catch (err) {
            console.error('Error al actualizar lastLogout:', err);
          }
        }
      }
      console.log(`🔌 Socket desconectado: User #${userId} [${socket.id}]`);
    });
  });

  console.log('🔌 Socket.io inicializado');
  return io;
}

/**
 * Emitir evento a un usuario específico.
 */
export function emitToUser(userId: number, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emitir evento a todos los usuarios con un rol específico.
 */
export function emitToRole(role: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
}

/**
 * Broadcast a todos los usuarios conectados.
 */
export function broadcast(event: string, data: unknown): void {
  if (!io) return;
  io.emit(event, data);
}

/**
 * Obtener usuarios conectados.
 */
export function getConnectedUsers(): number[] {
  return Array.from(connectedUsers.keys());
}

export function getIO(): SocketServer | null {
  return io;
}
