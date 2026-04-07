import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';

// Función helper para verificar si un asiento está realmente ocupado (basándose en bookings)
async function isSeatActuallyOccupied(seatId: number): Promise<boolean> {
  const bookingCount = await prisma.booking.count({
    where: { seatId },
  });
  return bookingCount > 0;
}

export async function getSeatsByFlight(req: Request, res: Response) {
  const flightId = Number(req.params.id);
  if (!flightId) return res.status(400).json({ message: 'ID inválido' });

  const seats = await prisma.seat.findMany({
    where: { flightId },
    orderBy: [{ seatClass: 'asc' }, { number: 'asc' }],
    include: { booking: { select: { id: true } } },
  });

  // Calcular isOccupied basándose SOLO en bookings reales (no confiar en el campo isOccupied)
  const seatsWithCorrectStatus = seats.map(s => ({
    id: s.id,
    number: s.number,
    seatClass: s.seatClass,
    isOccupied: s.booking.length > 0, // Solo ocupado si hay bookings reales
  }));

  // Sincronizar el estado en la base de datos (en background, sin bloquear la respuesta)
  prisma.$transaction(async (tx) => {
    for (const seat of seats) {
      const hasBookings = seat.booking.length > 0;
      if (seat.isOccupied !== hasBookings) {
        await tx.seat.update({
          where: { id: seat.id },
          data: { isOccupied: hasBookings },
        });
      }
    }
  }).catch(err => {
    console.error('Error sincronizando asientos:', err);
  });

  return res.json(seatsWithCorrectStatus);
}

const bookSeatSchema = z.object({
  seatId: z.number().int().positive(),
});

export async function bookSeat(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const flightId = Number(req.params.id);
  if (!flightId) return res.status(400).json({ message: 'ID inválido' });

  const parsed = bookSeatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

  const seat = await prisma.seat.findUnique({
    where: { id: parsed.data.seatId },
    include: { flight: true, booking: true },
  });

  if (!seat || seat.flightId !== flightId) return res.status(404).json({ message: 'Asiento no encontrado' });
  // Verificar ocupación basándose en bookings reales
  if (seat.booking.length > 0) return res.status(400).json({ message: 'Asiento ocupado' });

  // verificar si ya tiene reserva en este vuelo
  const existing = await prisma.booking.findUnique({
    where: { userId_flightId: { userId: req.user.sub, flightId } },
  });

  // Obtener información del vuelo para calcular precio
  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return res.status(404).json({ message: 'Vuelo no encontrado' });

  // Calcular precio basado en la categoría del vuelo y la clase del asiento
  const { getFlightPrice } = await import('../utils/pricing.js');
  const newPrice = getFlightPrice(flight.categoria, seat.seatClass);

  if (existing) {
    // actualizar reserva existente con el asiento
    const updated = await prisma.$transaction(async (tx) => {
      // Liberar asiento anterior si existe
      if (existing.seatId) {
        await tx.seat.update({ where: { id: existing.seatId }, data: { isOccupied: false } });
      }
      
      // Actualizar booking con nuevo asiento y precio
      const updatedBooking = await tx.booking.update({
        where: { id: existing.id },
        data: { 
          seatId: seat.id,
          price: newPrice, // Actualizar precio con la nueva clase
        },
      });
      
      await tx.seat.update({ where: { id: seat.id }, data: { isOccupied: true } });
      
      // Actualizar o crear pago con el nuevo precio
      const existingPayment = await tx.payment.findFirst({
        where: { bookingId: existing.id },
      });
      
      if (existingPayment) {
        // Actualizar pago existente con nuevo precio
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: { amount: newPrice, status: 'completed' },
        });
      } else {
        // Crear pago si no existe
        await tx.payment.create({
          data: {
            bookingId: existing.id,
            amount: newPrice,
            status: 'completed',
          },
        });
      }
      
      return updatedBooking;
    });
    return res.json({ message: 'Asiento asignado y pago actualizado' });
  }

  // crear nueva reserva con asiento
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const userId = req.user.sub;
  const created = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({ 
      data: { 
        userId, 
        flightId, 
        seatId: seat.id,
        price: newPrice, // Incluir precio desde el inicio
      } 
    });
    await tx.seat.update({ where: { id: seat.id }, data: { isOccupied: true } });
    await tx.flight.update({ where: { id: flightId }, data: { seatsAvailable: { decrement: 1 } } });
    
    // Crear pago automáticamente
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: newPrice,
        status: 'completed',
      },
    });
    
    return booking;
  });

  return res.status(201).json({ message: 'Asiento reservado y pago procesado' });
}

// Endpoint para sincronizar todos los asientos de todos los vuelos
export async function syncAllSeats(_req: Request, res: Response) {
  try {
    const allSeats = await prisma.seat.findMany({
      include: { booking: { select: { id: true } } },
    });

    let updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const seat of allSeats) {
        const hasBookings = seat.booking.length > 0;
        if (seat.isOccupied !== hasBookings) {
          await tx.seat.update({
            where: { id: seat.id },
            data: { isOccupied: hasBookings },
          });
          updated++;
        }
      }
    });

    return res.json({ 
      message: `Sincronización completada. ${updated} asientos actualizados.`,
      updated 
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al sincronizar asientos', error: error.message });
  }
}

