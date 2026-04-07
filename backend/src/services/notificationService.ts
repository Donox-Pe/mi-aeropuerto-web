import { prisma } from '../prisma/client.js';
import { emitToUser, emitToRole } from './socketService.js';

type NotificationType = 'INFO' | 'FLIGHT_UPDATE' | 'BOARDING' | 'PAYMENT' | 'BOOKING' | 'ALERT';

/**
 * Crea una notificación en BD y la emite por Socket.io.
 */
export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: NotificationType = 'INFO',
) {
  const notification = await prisma.notification.create({
    data: { userId, title, message, type },
  });

  // Emitir al usuario en tiempo real
  emitToUser(userId, 'notification', {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });

  return notification;
}

/**
 * Notificar a todos los pasajeros de un vuelo (ej: cambio de puerta).
 */
export async function notifyFlightUpdate(flightId: number, title: string, message: string) {
  const bookings = await prisma.booking.findMany({
    where: { flightId, status: 'APPROVED' },
    select: { userId: true },
  });

  const notified = new Set<number>();
  for (const booking of bookings) {
    if (!notified.has(booking.userId)) {
      await createNotification(booking.userId, title, message, 'FLIGHT_UPDATE');
      notified.add(booking.userId);
    }
  }

  return notified.size;
}

/**
 * Notificar approval de booking al pasajero.
 */
export async function notifyBookingApproved(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { flight: { select: { code: true, origin: true, destination: true } } },
  });

  if (!booking) return;

  await createNotification(
    booking.userId,
    '✅ Reserva Aprobada',
    `Tu reserva para el vuelo ${booking.flight.code} (${booking.flight.origin} → ${booking.flight.destination}) ha sido aprobada.`,
    'BOOKING',
  );
}

/**
 * Notificar rechazo de booking al pasajero.
 */
export async function notifyBookingRejected(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { flight: { select: { code: true, origin: true, destination: true } } },
  });

  if (!booking) return;

  await createNotification(
    booking.userId,
    '❌ Reserva Rechazada',
    `Tu reserva para el vuelo ${booking.flight.code} (${booking.flight.origin} → ${booking.flight.destination}) ha sido rechazada.`,
    'BOOKING',
  );
}

/**
 * Notificar pago recibido.
 */
export async function notifyPaymentReceived(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { flight: { select: { code: true } }, payment: true },
  });

  if (!booking) return;

  const amount = booking.payment?.amount || booking.finalPrice || booking.price || 0;
  await createNotification(
    booking.userId,
    '💳 Pago Confirmado',
    `Tu pago de $${amount.toLocaleString('es-MX')} MXN para el vuelo ${booking.flight.code} ha sido procesado.`,
    'PAYMENT',
  );
}

/**
 * Notificar a agentes/admins de una nueva reserva pendiente.
 */
export async function notifyNewBookingToAgents(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { fullName: true } },
      flight: { select: { code: true } },
    },
  });

  if (!booking) return;

  // Obtener todos los agentes y admins
  const staff = await prisma.user.findMany({
    where: { role: { in: ['AGENT', 'ADMIN'] } },
    select: { id: true },
  });

  for (const s of staff) {
    await createNotification(
      s.id,
      '📋 Nueva Reserva Pendiente',
      `${booking.user.fullName} ha solicitado una reserva para el vuelo ${booking.flight.code}.`,
      'BOOKING',
    );
  }
}
