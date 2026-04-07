import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';
import { getFlightPrice } from '../utils/pricing.js';
import { sendTicketEmail } from '../services/emailService.js';
import PDFDocument from 'pdfkit';
import { notifyBookingApproved, notifyBookingRejected, notifyNewBookingToAgents, notifyPaymentReceived } from '../services/notificationService.js';

const bookingSchema = z.object({
  flightId: z.number().int().positive(),
  seatId: z.number().int().positive().optional(),
  offerId: z.number().int().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA']).optional().default('EFECTIVO'),
});

export async function createBooking(req: Request, res: Response) {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const flight = await prisma.flight.findUnique({ where: { id: parsed.data.flightId } });
  if (!flight) return res.status(404).json({ message: 'Vuelo no encontrado' });
  if (flight.seatsAvailable <= 0) return res.status(400).json({ message: 'Sin asientos disponibles' });
  
  // Verificar si ya tiene una reserva en este vuelo
  const existing = await prisma.booking.findUnique({
    where: { userId_flightId: { userId: req.user.sub, flightId: flight.id } },
  });
  if (existing) {
    return res.status(400).json({ 
      message: existing.status === 'APPROVED' 
        ? 'Ya tienes una reserva aprobada para este vuelo.' 
        : 'Ya tienes una reserva pendiente para este vuelo.' 
    });
  }

  let seatId = parsed.data.seatId;
  let seatClass = null;
  if (seatId) {
    const seat = await prisma.seat.findUnique({ 
      where: { id: seatId },
      include: { booking: { select: { id: true, status: true } } },
    });
    if (!seat || seat.flightId !== flight.id) {
      return res.status(400).json({ message: 'Asiento no válido para este vuelo' });
    }
    // Solo asientos aprobados bloquean
    const hasApproved = seat.booking.some(b => b.status === 'APPROVED');
    if (hasApproved) {
      return res.status(400).json({ message: 'Asiento no disponible' });
    }
    seatClass = seat.seatClass;
  }

  // Calcular precio base
  const basePrice = getFlightPrice(flight.categoria, seatClass);
  
  // Verificar oferta si se proporciona
  let offerId = parsed.data.offerId;
  let discountPercent = parsed.data.discountPercent || 0;
  
  if (offerId) {
    const offer = await prisma.traveloffer.findUnique({ where: { id: offerId } });
    if (offer && offer.isActive) {
      discountPercent = offer.discountPercent;
      // Validar que el destino del vuelo coincida con la oferta (opcional)
      if (offer.destinationCode) {
        const destinationMatches = flight.destination.toLowerCase().includes(offer.destinationCode.toLowerCase()) ||
                                   offer.destination.toLowerCase().includes(flight.destination.toLowerCase());
        if (!destinationMatches) {
          // Si no coincide, no aplicar descuento pero permitir la reserva
          discountPercent = 0;
          offerId = undefined;
        }
      }
    } else {
      offerId = undefined;
      discountPercent = 0;
    }
  }
  
  // Calcular precio final con descuento
  const finalPrice = discountPercent > 0 
    ? Math.round(basePrice * (1 - discountPercent / 100))
    : basePrice;

  // Crear booking en estado PENDING; no ocupamos asiento ni descontamos cupo hasta aprobar
  const booking = await prisma.booking.create({
    data: {
      userId: req.user!.sub,
      flightId: flight.id,
      seatId,
      price: basePrice,
      finalPrice: finalPrice,
      offerId,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      paymentMethod: parsed.data.paymentMethod || 'EFECTIVO',
      status: 'PENDING',
    },
  });

  // Notificar a agentes/admins de la nueva reserva
  notifyNewBookingToAgents(booking.id).catch(err => console.error('Error notificando agentes:', err));

  return res.status(201).json(booking);
}

export async function myBookings(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.sub },
    include: { 
      flight: true, 
      seat: true,
      payment: true,
      traveloffer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(bookings);
}

export async function listPendingBookings(_req: Request, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      flight: true,
      seat: true,
      traveloffer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(bookings);
}

export async function getTicket(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const flightId = Number(req.params.id);
  if (!flightId) return res.status(400).json({ message: 'ID inválido' });

  const booking = await prisma.booking.findUnique({
    where: { userId_flightId: { userId: req.user.sub, flightId } },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      flight: true,
      seat: true,
      payment: true,
      traveloffer: true,
    },
  });

  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
  if (booking.status !== 'APPROVED') return res.status(400).json({ message: 'El boleto solo está disponible cuando la reserva está aprobada' });

  return res.json(booking);
}

export async function approveBooking(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { flight: true, seat: true, payment: true },
  });
  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
  const b = booking;
  if (booking.status !== 'PENDING') return res.status(400).json({ message: 'La reserva ya fue procesada' });

  // Validar disponibilidad actual
  if (booking.flight.seatsAvailable <= 0) {
    return res.status(400).json({ message: 'Sin asientos disponibles para aprobar' });
  }
  if (booking.seatId) {
    const seat = await prisma.seat.findUnique({ where: { id: booking.seatId } });
    if (!seat || seat.isOccupied) {
      return res.status(400).json({ message: 'El asiento ya no está disponible' });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (booking.seatId) {
      await tx.seat.update({ where: { id: booking.seatId }, data: { isOccupied: true } });
    }
    await tx.flight.update({ where: { id: booking.flightId }, data: { seatsAvailable: { decrement: 1 } } });

    const saved = await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'APPROVED' },
      include: { user: true, flight: true, seat: true, traveloffer: true, payment: true },
    });

    if (!saved.payment) {
      await tx.payment.create({
        data: {
          bookingId: saved.id,
          amount: saved.finalPrice || saved.price || 0,
          status: 'completed',
          paymentMethod: saved.paymentMethod || 'EFECTIVO',
        },
      });
    }

    return saved;
  });

  // Emitir notificaciones
  notifyBookingApproved(updated.id).catch(err => console.error('Error notificando aprobación:', err));
  if (updated.payment) {
    notifyPaymentReceived(updated.id).catch(err => console.error('Error notificando pago:', err));
  }

  return res.json(updated);
}

export async function rejectBooking(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { seat: true },
  });
  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
  if (booking.status !== 'PENDING') return res.status(400).json({ message: 'La reserva ya fue procesada' });

  await prisma.$transaction(async (tx) => {
    if (booking.seatId) {
      await tx.seat.update({ where: { id: booking.seatId }, data: { isOccupied: false } });
    }
    await tx.booking.update({ where: { id: booking.id }, data: { status: 'REJECTED' } });
  });

  // Emitir notificación de rechazo
  notifyBookingRejected(id).catch(err => console.error('Error notificando rechazo:', err));

  return res.json({ message: 'Reserva rechazada' });
}

export async function emailTicket(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  const toOverride = typeof req.body?.to === 'string' ? req.body.to.trim() : undefined;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      flight: true,
      seat: true,
      traveloffer: true,
      payment: true,
    },
  });
  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
  const b = booking;

  // Solo el dueño o admin/agent
  if (req.user?.role === 'PASSENGER' && booking.userId !== req.user.sub) {
    return res.status(403).json({ message: 'No autorizado' });
  }
  if (booking.status !== 'APPROVED') return res.status(400).json({ message: 'La reserva debe estar aprobada para enviar boleto' });

  const to = toOverride || booking.user?.email;
  if (!to) return res.status(400).json({ message: 'No se proporcionó correo y el pasajero no tiene email registrado' });

  const price = b.finalPrice || b.price || 0;
  const seatInfo = b.seat ? `${b.seat.number} (${b.seat.seatClass})` : 'Sin asiento';
  const offerInfo = b.traveloffer ? `${b.traveloffer.destination} (${b.traveloffer.discountPercent}% OFF)` : 'N/A';
  const paymentMethod = b.payment?.paymentMethod || b.paymentMethod || 'EFECTIVO';

  // PDF adjunto
  async function buildPdf(): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).fillColor('#d32f2f').text(`Boleto de Vuelo ${b.flight.code}`, { underline: false });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#111').text(`Pasajero: ${b.user?.fullName || ''} (${b.user?.email || ''})`);
      doc.text(`Estado: ${b.status}`);
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor('#111').text('Detalles de vuelo', { underline: true });
      doc.fontSize(12).text(`Ruta: ${b.flight.origin} → ${b.flight.destination}`);
      doc.text(`Salida: ${new Date(b.flight.departureAt).toLocaleString()}`);
      doc.text(`Llegada: ${new Date(b.flight.arrivalAt).toLocaleString()}`);
      if (b.flight.lugarArribo) doc.text(`Lugar de arribo: ${b.flight.lugarArribo}`);
      if (b.flight.puertaArribo) doc.text(`Puerta: ${b.flight.puertaArribo}`);
      if (b.flight.checkInTime) doc.text(`Check-in: ${new Date(b.flight.checkInTime).toLocaleString()}`);
      doc.moveDown(0.5);

      doc.fontSize(14).text('Asiento', { underline: true });
      doc.fontSize(12).text(seatInfo);
      doc.moveDown(0.5);

      doc.fontSize(14).text('Pago', { underline: true });
      doc.fontSize(12).text(`Monto: MXN ${price.toLocaleString('es-MX')}`);
      doc.text(`Método: ${paymentMethod === 'TARJETA' ? 'Tarjeta' : 'Efectivo'}`);
      doc.text(`Oferta: ${offerInfo}`);

      doc.end();
    });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2>Tu boleto de vuelo ${b.flight.code}</h2>
      <p>Hola ${b.user?.fullName || ''}, aquí tienes tu boleto confirmado.</p>
      <ul>
        <li><strong>Ruta:</strong> ${b.flight.origin} → ${b.flight.destination}</li>
        <li><strong>Salida:</strong> ${new Date(b.flight.departureAt).toLocaleString()}</li>
        <li><strong>Llegada:</strong> ${new Date(b.flight.arrivalAt).toLocaleString()}</li>
        <li><strong>Asiento:</strong> ${seatInfo}</li>
        <li><strong>Categoría:</strong> ${b.flight.categoria}</li>
        <li><strong>Precio pagado:</strong> MXN ${price.toLocaleString('es-MX')}</li>
        <li><strong>Oferta:</strong> ${offerInfo}</li>
        <li><strong>Método de pago:</strong> ${b.payment?.paymentMethod || 'EFECTIVO'}</li>
        <li><strong>Estado:</strong> ${b.status}</li>
      </ul>
      <p>Gracias por volar con nosotros.</p>
    </div>
  `;

  try {
    const pdf = await buildPdf();
    await sendTicketEmail(to, `Boleto ${b.flight.code}`, html, [
      { filename: `boleto-${b.flight.code}.pdf`, content: pdf },
    ]);
    return res.json({ message: 'Boleto enviado al correo del pasajero' });
  } catch (err: any) {
    return res.status(500).json({ message: 'No se pudo enviar el correo', error: err?.message });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const flightId = Number(req.params.id);
  if (!flightId) return res.status(400).json({ message: 'ID inválido' });

  const booking = await prisma.booking.findUnique({
    where: { userId_flightId: { userId: req.user.sub, flightId } },
    include: { seat: true },
  });

  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });

  await prisma.$transaction(async (tx) => {
    if (booking.seatId) {
      await tx.seat.update({ where: { id: booking.seatId }, data: { isOccupied: false } });
    }
    await tx.booking.delete({ where: { id: booking.id } });
    await tx.flight.update({ where: { id: flightId }, data: { seatsAvailable: { increment: 1 } } });
  });

  return res.status(204).send();
}






