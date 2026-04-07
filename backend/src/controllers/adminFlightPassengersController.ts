import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';

export async function listFlightsWithCounts(_req: Request, res: Response) {
  const flights = await prisma.flight.findMany({
    orderBy: { departureAt: 'asc' },
    include: { _count: { select: { booking: true } } },
  });
  return res.json(
    flights.map(f => ({
      id: f.id,
      code: f.code,
      origin: f.origin,
      destination: f.destination,
      departureAt: f.departureAt,
      arrivalAt: f.arrivalAt,
      seatsTotal: f.seatsTotal,
      seatsAvailable: f.seatsAvailable,
      passengerCount: f._count.booking,
    }))
  );
}

export async function listPassengersByFlight(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  const bookings = await prisma.booking.findMany({
    where: { flightId: id },
    include: {
      user: { select: { id: true, email: true, fullName: true, role: true } },
      seat: { select: { id: true, number: true, seatClass: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(bookings.map(b => ({ id: b.id, user: b.user, seat: b.seat })));
}

const assignSchema = z.object({
  userId: z.number().int().positive(),
  seatId: z.number().int().positive().optional(),
});

export async function assignPassenger(req: Request, res: Response) {
  const flightId = Number(req.params.id);
  if (!flightId) return res.status(400).json({ message: 'ID inválido' });
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

  const [flight, currentCount] = await Promise.all([
    prisma.flight.findUnique({ where: { id: flightId } }),
    prisma.booking.count({ where: { flightId } }),
  ]);
  if (!flight) return res.status(404).json({ message: 'Vuelo no encontrado' });
  if (currentCount >= 200) return res.status(400).json({ message: 'Máximo 200 pasajeros alcanzado' });

  let seatId = parsed.data.seatId;
  let seatClass = null;
  if (seatId) {
    const seat = await prisma.seat.findUnique({ 
      where: { id: seatId },
      include: { booking: { select: { id: true } } },
    });
    if (!seat || seat.flightId !== flightId) {
      return res.status(400).json({ message: 'Asiento no válido para este vuelo' });
    }
    // Verificar ocupación basándose en bookings reales
    if (seat.booking.length > 0) {
      return res.status(400).json({ message: 'Asiento no disponible' });
    }
    seatClass = seat.seatClass;
  }

  // Calcular precio
  const { getFlightPrice } = await import('../utils/pricing.js');
  const price = getFlightPrice(flight.categoria, seatClass);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: { userId: parsed.data.userId, flightId, seatId, price },
      });
      if (seatId) {
        await tx.seat.update({ where: { id: seatId }, data: { isOccupied: true } });
      }
      await tx.flight.update({ where: { id: flightId }, data: { seatsAvailable: { decrement: 1 } } });
      
      // Crear pago
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: price,
          status: 'completed',
        },
      });
      
      return booking;
    });
    return res.status(201).json({ id: created.id });
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ message: 'Usuario ya asignado al vuelo' });
    return res.status(500).json({ message: 'Error al asignar' });
  }
}

export async function removePassenger(req: Request, res: Response) {
  const flightId = Number(req.params.id);
  const userId = Number(req.params.userId);
  if (!flightId || !userId) return res.status(400).json({ message: 'Parámetros inválidos' });

  const booking = await prisma.booking.findUnique({
    where: { userId_flightId: { userId, flightId } },
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

export async function listAllPassengers(_req: Request, res: Response) {
  const passengers = await prisma.user.findMany({ where: { role: 'PASSENGER' }, orderBy: { createdAt: 'desc' } });
  return res.json(passengers.map(p => ({ id: p.id, email: p.email, fullName: p.fullName })));
}






