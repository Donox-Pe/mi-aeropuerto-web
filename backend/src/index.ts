import 'dotenv/config';
import http from 'http';
import { createServer } from './server.js';
import { initSocketServer } from './services/socketService.js';
import { logger } from './utils/logger.js';

const port = Number(process.env.PORT || 4000);
const app = createServer();

// Verificar conexión a la base de datos al iniciar
import { prisma } from './prisma/client.js';

async function start() {
  try {
    logger.info('⏳ Verificando conexión a la base de datos...');
    await prisma.$connect();
    logger.info('✅ Conexión a la base de datos exitosa');
    
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    httpServer.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 API escuchando en http://0.0.0.0:${port}`);
      logger.info(`🔌 WebSocket disponible en ws://0.0.0.0:${port}`);
    });
  } catch (error) {
    logger.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();
