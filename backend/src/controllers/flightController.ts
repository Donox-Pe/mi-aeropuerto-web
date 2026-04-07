import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';
import { getFlightPrice } from '../utils/pricing.js';
import { cacheService } from '../services/cacheService.js';

export async function listFlights(_req: Request, res: Response) {
  const flights = await prisma.flight.findMany({ orderBy: { departureAt: 'asc' } });
  return res.json(flights);
}

const flightSchema = z.object({
  code: z.string().min(2),
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureAt: z.string(),
  arrivalAt: z.string(),
  seatsTotal: z.number().int().positive(),
  numeroAvion: z.string().optional(),
  categoria: z.enum(['BASIC', 'PRIVATE', 'INTERNATIONAL']).optional(),
  lugarArribo: z.string().optional(),
  puertaArribo: z.string().optional(),
  checkInTime: z.string().optional(),
});

export async function createFlight(req: Request, res: Response) {
  const parsed = flightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });
  const { code, origin, destination, departureAt, arrivalAt, seatsTotal, numeroAvion, categoria, lugarArribo, puertaArribo, checkInTime } = parsed.data;

  const parseDate = (val: string | undefined) => {
    if (!val || val.trim() === '') return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const cDeparture = parseDate(departureAt);
  const cArrival = parseDate(arrivalAt);

  if (!cDeparture || !cArrival) {
    return res.status(400).json({ message: 'Las fechas de salida y llegada son obligatorias y deben ser válidas' });
  }

  const created = await prisma.$transaction(async (tx) => {
    const flight = await tx.flight.create({
      data: {
        code,
        origin,
        destination,
        departureAt: cDeparture,
        arrivalAt: cArrival,
        seatsTotal: 150, // fijo: 20+30+100
        seatsAvailable: 150,
        numeroAvion: numeroAvion || null,
        categoria: categoria || 'BASIC',
        lugarArribo: lugarArribo || null,
        puertaArribo: puertaArribo || null,
        checkInTime: parseDate(checkInTime) || null,
      },
    });

    // crear asientos: 20 primera, 30 premium, 100 económica
    const seats: Array<{ number: string; seatClass: 'FIRST' | 'PREMIUM' | 'ECONOMY'; flightId: number; isOccupied: boolean }> = [];
    // Primera clase: 1A-1J, 2A-2J (20 asientos)
    for (let row = 1; row <= 2; row++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
        seats.push({ number: `${row}${col}`, seatClass: 'FIRST' as const, flightId: flight.id, isOccupied: false });
      }
    }
    // Premium: 3A-3J, 4A-4J, 5A-5J (30 asientos)
    for (let row = 3; row <= 5; row++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
        seats.push({ number: `${row}${col}`, seatClass: 'PREMIUM' as const, flightId: flight.id, isOccupied: false });
      }
    }
    // Económica: 6A-15J (100 asientos)
    for (let row = 6; row <= 15; row++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
        seats.push({ number: `${row}${col}`, seatClass: 'ECONOMY' as const, flightId: flight.id, isOccupied: false });
      }
    }
    await tx.seat.createMany({ data: seats });

    return flight;
  });

  // Invalidar cache de vuelos
  await cacheService.invalidate('flights:*');

  return res.status(201).json(created);
}

const updateFlightSchema = z.object({
  origin: z.string().min(2).optional(),
  destination: z.string().min(2).optional(),
  departureAt: z.string().optional(),
  arrivalAt: z.string().optional(),
  seatsTotal: z.number().int().positive().optional(),
  seatsAvailable: z.number().int().min(0).optional(),
  numeroAvion: z.string().optional(),
  categoria: z.enum(['BASIC', 'PRIVATE', 'INTERNATIONAL']).optional(),
  lugarArribo: z.string().optional(),
  puertaArribo: z.string().optional(),
  checkInTime: z.string().optional(),
});

export async function updateFlight(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  const parsed = updateFlightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });
  const data: any = { ...parsed.data };
  
  const parseDate = (val: string | undefined) => {
    if (!val || val.trim() === '') return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  };

  if ('departureAt' in data) {
    const d = parseDate(data.departureAt);
    if (d) data.departureAt = d; else delete data.departureAt;
  }
  if ('arrivalAt' in data) {
    const d = parseDate(data.arrivalAt);
    if (d) data.arrivalAt = d; else delete data.arrivalAt;
  }
  if ('checkInTime' in data) {
    const d = parseDate(data.checkInTime);
    if (d) data.checkInTime = d; else delete data.checkInTime;
  }

  const updated = await prisma.flight.update({ where: { id }, data });
  await cacheService.invalidate('flights:*');
  return res.json(updated);
}

export async function deleteFlight(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  await prisma.flight.delete({ where: { id } });
  await cacheService.invalidate('flights:*');
  return res.status(204).send();
}

export async function calculatePrice(req: Request, res: Response) {
  const flightId = Number(req.params.id);
  const seatId = req.query.seatId ? Number(req.query.seatId) : null;
  
  if (!flightId) return res.status(400).json({ message: 'ID de vuelo inválido' });

  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) return res.status(404).json({ message: 'Vuelo no encontrado' });

  let seatClass = null;
  if (seatId) {
    const seat = await prisma.seat.findUnique({ where: { id: seatId } });
    if (seat && seat.flightId === flightId) {
      seatClass = seat.seatClass;
    }
  }

  const price = getFlightPrice(flight.categoria, seatClass);
  
  return res.json({
    flightId,
    seatId: seatId || null,
    categoria: flight.categoria,
    seatClass: seatClass || 'ECONOMY',
    price,
    formattedPrice: `MXN ${price.toLocaleString('es-MX')}`,
  });
}


