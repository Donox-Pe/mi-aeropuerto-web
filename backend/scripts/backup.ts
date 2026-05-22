import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../src/utils/logger.js';

const execAsync = util.promisify(exec);

async function performBackup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error('No se puede hacer el backup. DATABASE_URL no está definido.');
    process.exit(1);
  }

  // Extraer el nombre de la base de datos de la URL o usar uno por defecto
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${dateStr}.sql`;
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const backupPath = path.join(backupDir, backupFileName);

  logger.info(`Iniciando backup de la base de datos en: ${backupPath}`);

  try {
    // Usamos pg_dump para extraer la base de datos (Requiere tener las tools de PostgreSQL instaladas en el servidor o local)
    // Para entornos donde pg_dump no está disponible globalmente, este script puede fallar.
    const command = `pg_dump "${dbUrl}" -f "${backupPath}"`;
    await execAsync(command);
    logger.info('✅ Backup completado exitosamente.');
  } catch (error: any) {
    logger.error(`❌ Falló el backup: ${error.message}`);
    process.exit(1);
  }
}

performBackup();
