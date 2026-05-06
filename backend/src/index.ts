import 'dotenv/config';
import http from 'http';
import { createServer } from './server.js';
import { initSocketServer } from './services/socketService.js';

const port = Number(process.env.PORT || 4000);
const app = createServer();

// Crear HTTP server (en lugar de app.listen directo) para Socket.io
const httpServer = http.createServer(app);

// Inicializar Socket.io
initSocketServer(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API escuchando en http://0.0.0.0:${port}`);
  console.log(`🔌 WebSocket disponible en ws://0.0.0.0:${port}`);
});
