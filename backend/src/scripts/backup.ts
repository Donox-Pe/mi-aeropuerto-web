import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runBackup() {
  console.log('--- Iniciando respaldo de base de datos PostgreSQL de Render ---');
  try {
    const backup: any = {};
    
    console.log('1/7 Leyendo tabla: user...');
    backup.user = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    
    console.log('2/7 Leyendo tabla: traveloffer...');
    backup.traveloffer = await prisma.traveloffer.findMany({ orderBy: { id: 'asc' } });

    console.log('3/7 Leyendo tabla: flight...');
    backup.flight = await prisma.flight.findMany({ orderBy: { id: 'asc' } });
    
    console.log('4/7 Leyendo tabla: seat...');
    backup.seat = await prisma.seat.findMany({ orderBy: { id: 'asc' } });
    
    console.log('5/7 Leyendo tabla: booking...');
    backup.booking = await prisma.booking.findMany({ orderBy: { id: 'asc' } });
    
    console.log('6/7 Leyendo tabla: payment...');
    backup.payment = await prisma.payment.findMany({ orderBy: { id: 'asc' } });
    
    console.log('7/7 Leyendo tabla: notification...');
    backup.notification = await prisma.notification.findMany({ orderBy: { id: 'asc' } });

    const dateStr = new Date().toISOString().slice(0, 10);
    const baseDir = path.resolve(__dirname, '../../../'); // Raíz del proyecto
    
    // 1. Guardar como JSON
    const jsonFilename = `RESPALDO_RENDER_POSTGRES_${dateStr}.json`;
    const jsonPath = path.join(baseDir, jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`\n✅ Respaldo JSON guardado en: ${jsonPath}`);
    
    // 2. Guardar como SQL PostgreSQL compatible
    const sqlFilename = `RESPALDO_RENDER_POSTGRES_${dateStr}.sql`;
    const sqlPath = path.join(baseDir, sqlFilename);
    const sqlStatements: string[] = [];
    
    sqlStatements.push('-- Respaldos de base de datos AeroAzteca PostgreSQL (Render)');
    sqlStatements.push(`-- Generado el: ${new Date().toLocaleString()}`);
    sqlStatements.push('-- Desactivar restricciones temporales para evitar problemas de FK en la inserción');
    sqlStatements.push('SET session_replication_role = \'replica\';\n');
    
    // Truncar en orden inverso para asegurar limpieza limpia
    const tableCleanOrder = ['payment', 'booking', 'seat', 'flight', 'traveloffer', 'notification', 'user'];
    sqlStatements.push('-- Limpiar tablas existentes');
    for (const table of tableCleanOrder) {
      sqlStatements.push(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
    sqlStatements.push('');

    // Escape de cadenas de SQL
    const escape = (val: any) => {
      if (val === null || val === undefined) return 'NULL';
      if (val instanceof Date) return `'${val.toISOString()}'`;
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return val;
    };

    // Generar INSERTS en el orden de integridad de FKs
    sqlStatements.push('-- Insertar datos en la tabla: user');
    for (const u of backup.user) {
      sqlStatements.push(`INSERT INTO "user" (id, email, password, "fullName", role, "twoFactorSecret", "twoFactorEnabled", "resetToken", "resetTokenExpiry", "loginAttempts", "lockedUntil", "lastLogin", "lastLogout", "loyaltyPoints", "loyaltyTier", "isVerified", "createdAt", "updatedAt") VALUES (${u.id}, ${escape(u.email)}, ${escape(u.password)}, ${escape(u.fullName)}, '${u.role}', ${escape(u.twoFactorSecret)}, ${u.twoFactorEnabled}, ${escape(u.resetToken)}, ${escape(u.resetTokenExpiry)}, ${u.loginAttempts}, ${escape(u.lockedUntil)}, ${escape(u.lastLogin)}, ${escape(u.lastLogout)}, ${u.loyaltyPoints}, '${u.loyaltyTier}', ${u.isVerified}, ${escape(u.createdAt)}, ${escape(u.updatedAt)});`);
    }
    sqlStatements.push('');

    sqlStatements.push('-- Insertar datos en la tabla: traveloffer');
    for (const o of backup.traveloffer) {
      sqlStatements.push(`INSERT INTO traveloffer (id, destination, description, "imageUrl", "originalPrice", "discountPrice", "discountPercent", "isActive", "destinationCode", "createdAt", "updatedAt") VALUES (${o.id}, ${escape(o.destination)}, ${escape(o.description)}, ${escape(o.imageUrl)}, ${o.originalPrice}, ${o.discountPrice}, ${o.discountPercent}, ${o.isActive}, ${escape(o.destinationCode)}, ${escape(o.createdAt)}, ${escape(o.updatedAt)});`);
    }
    sqlStatements.push('');

    sqlStatements.push('-- Insertar datos en la tabla: flight');
    for (const f of backup.flight) {
      sqlStatements.push(`INSERT INTO flight (id, code, origin, destination, "departureAt", "arrivalAt", "seatsTotal", "seatsAvailable", "numeroAvion", categoria, "lugarArribo", "puertaArribo", "checkInTime", "carbonFootprint", "createdAt", "updatedAt") VALUES (${f.id}, ${escape(f.code)}, ${escape(f.origin)}, ${escape(f.destination)}, ${escape(f.departureAt)}, ${escape(f.arrivalAt)}, ${f.seatsTotal}, ${f.seatsAvailable}, ${escape(f.numeroAvion)}, '${f.categoria}', ${escape(f.lugarArribo)}, ${escape(f.puertaArribo)}, ${escape(f.checkInTime)}, ${f.carbonFootprint || 0}, ${escape(f.createdAt)}, ${escape(f.updatedAt)});`);
    }
    sqlStatements.push('');

    sqlStatements.push('-- Insertar datos en la tabla: seat');
    for (const s of backup.seat) {
      sqlStatements.push(`INSERT INTO seat (id, number, "seatClass", "flightId", "isOccupied", "createdAt", "updatedAt") VALUES (${s.id}, ${escape(s.number)}, '${s.seatClass}', ${s.flightId}, ${s.isOccupied}, ${escape(s.createdAt)}, ${escape(s.updatedAt)});`);
    }
    sqlStatements.push('');

    sqlStatements.push('-- Insertar datos en la tabla: booking');
    for (const b of backup.booking) {
      sqlStatements.push(`INSERT INTO booking (id, "userId", "flightId", "seatId", price, "offerId", "discountPercent", "finalPrice", status, "paymentMethod", "createdAt") VALUES (${b.id}, ${b.userId}, ${b.flightId}, ${b.seatId}, ${b.price}, ${b.offerId}, ${b.discountPercent}, ${b.finalPrice}, '${b.status}', ${escape(b.paymentMethod)}, ${escape(b.createdAt)});`);
    }
    sqlStatements.push('');

    sqlStatements.push('-- Insertar datos en la tabla: payment');
    for (const p of backup.payment) {
      sqlStatements.push(`INSERT INTO payment (id, "bookingId", amount, status, "paymentMethod", "stripePaymentId", "stripeSessionId", currency, "createdAt") VALUES (${p.id}, ${p.bookingId}, ${p.amount}, ${escape(p.status)}, '${p.paymentMethod}', ${escape(p.stripePaymentId)}, ${escape(p.stripeSessionId)}, ${escape(p.currency)}, ${escape(p.createdAt)});`);
    }
    sqlStatements.push('');

    sqlStatements.push('-- Insertar datos en la tabla: notification');
    for (const n of backup.notification) {
      sqlStatements.push(`INSERT INTO notification (id, "userId", title, message, type, "isRead", "createdAt") VALUES (${n.id}, ${n.userId}, ${escape(n.title)}, ${escape(n.message)}, '${n.type}', ${n.isRead}, ${escape(n.createdAt)});`);
    }
    sqlStatements.push('');

    // Ajustar secuencias seriales en PostgreSQL
    sqlStatements.push('-- Ajustar secuencias de ID auto-incrementables');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'"user"\', \'id\'), COALESCE(MAX(id), 1)) FROM "user";');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'traveloffer\', \'id\'), COALESCE(MAX(id), 1)) FROM traveloffer;');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'flight\', \'id\'), COALESCE(MAX(id), 1)) FROM flight;');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'seat\', \'id\'), COALESCE(MAX(id), 1)) FROM seat;');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'booking\', \'id\'), COALESCE(MAX(id), 1)) FROM booking;');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'payment\', \'id\'), COALESCE(MAX(id), 1)) FROM payment;');
    sqlStatements.push('SELECT setval(pg_get_serial_sequence(\'notification\', \'id\'), COALESCE(MAX(id), 1)) FROM notification;');
    sqlStatements.push('');
    
    sqlStatements.push('-- Reactivar restricciones temporales');
    sqlStatements.push('SET session_replication_role = \'origin\';');

    fs.writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf-8');
    console.log(`✅ Respaldo SQL guardado en: ${sqlPath}`);
    
    console.log('\n🎉 ¡Respaldo completado exitosamente!');
  } catch (error) {
    console.error('❌ Error al realizar el respaldo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
