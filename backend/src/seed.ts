import dotenv from 'dotenv';
dotenv.config();
import { prisma } from './prisma/client.js';
import { hashPassword } from './utils/hash.js';

async function main() {
  const adminPass = await hashPassword('admin123');
  const agentPass = await hashPassword('agent123');
  const passengerPass = await hashPassword('pass123');

  // Usuarios base
  await prisma.user.upsert({
    where: { email: 'admin@airport.com' },
    update: {},
    create: { email: 'admin@airport.com', password: adminPass, fullName: 'Admin', role: 'ADMIN', updatedAt: new Date() },
  });

  await prisma.user.upsert({
    where: { email: 'agent@airport.com' },
    update: {},
    create: { email: 'agent@airport.com', password: agentPass, fullName: 'Agente', role: 'AGENT', updatedAt: new Date() },
  });

  await prisma.user.upsert({
    where: { email: 'passenger@airport.com' },
    update: {},
    create: { email: 'passenger@airport.com', password: passengerPass, fullName: 'Pasajero', role: 'PASSENGER', updatedAt: new Date() },
  });

  // pasajeros extra
  const extraPassengers = [
    { email: 'p1@airport.com', name: 'Pasajero Uno' },
    { email: 'p2@airport.com', name: 'Pasajero Dos' },
    { email: 'p3@airport.com', name: 'Pasajero Tres' },
    { email: 'p4@airport.com', name: 'Pasajero Cuatro' },
  ];
  for (const p of extraPassengers) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: { email: p.email, password: passengerPass, fullName: p.name, role: 'PASSENGER', updatedAt: new Date() },
    });
  }

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const checkInOffset = 1 * 60 * 60 * 1000;

  async function createSeatsForFlight(flightId: number, seatsTotal: number) {
    const seats = [];
    let seatCount = 0;
    const firstClassRows = 2; // 20
    const premiumRows = 3;    // 30
    const economyRows = Math.ceil((seatsTotal - 50) / 10);

    for (let row = 1; row <= firstClassRows && seatCount < seatsTotal; row++) {
      for (const col of ['A','B','C','D','E','F','G','H','I','J']) {
        if (seatCount >= seatsTotal) break;
        seats.push({ number: `${row}${col}`, seatClass: 'FIRST' as const, flightId, isOccupied: false });
        seatCount++;
      }
    }
    for (let row = 3; row <= 3 + premiumRows - 1 && seatCount < seatsTotal; row++) {
      for (const col of ['A','B','C','D','E','F','G','H','I','J']) {
        if (seatCount >= seatsTotal) break;
        seats.push({ number: `${row}${col}`, seatClass: 'PREMIUM' as const, flightId, isOccupied: false });
        seatCount++;
      }
    }
    let economyRow = 6;
    while (seatCount < seatsTotal) {
      for (const col of ['A','B','C','D','E','F','G','H','I','J']) {
        if (seatCount >= seatsTotal) break;
        seats.push({ number: `${economyRow}${col}`, seatClass: 'ECONOMY' as const, flightId, isOccupied: false });
        seatCount++;
      }
      economyRow++;
    }
    await prisma.seat.createMany({ 
      data: seats.map(s => ({ ...s, updatedAt: new Date() })), 
      skipDuplicates: true 
    });
  }

  const flightGroups = [
    {
      code: 'PAR',
      flights: [
        { code: 'SC001', origin: 'MEX', destination: 'PAR', categoria: 'INTERNATIONAL' as const, seatsTotal: 150, numeroAvion: 'Boeing 787', daysOffset: 1 },
        { code: 'SC002', origin: 'CDMX', destination: 'CDG', categoria: 'INTERNATIONAL' as const, seatsTotal: 200, numeroAvion: 'Airbus A350', daysOffset: 3 },
        { code: 'SC003', origin: 'GDL', destination: 'PAR', categoria: 'BASIC' as const, seatsTotal: 120, numeroAvion: 'Boeing 737', daysOffset: 5 },
      ],
    },
    {
      code: 'TYO',
      flights: [
        { code: 'SC004', origin: 'MEX', destination: 'TYO', categoria: 'INTERNATIONAL' as const, seatsTotal: 180, numeroAvion: 'Boeing 777', daysOffset: 2 },
        { code: 'SC005', origin: 'CDMX', destination: 'NRT', categoria: 'INTERNATIONAL' as const, seatsTotal: 150, numeroAvion: 'Airbus A330', daysOffset: 4 },
        { code: 'SC006', origin: 'MTY', destination: 'TYO', categoria: 'BASIC' as const, seatsTotal: 120, numeroAvion: 'Boeing 737', daysOffset: 6 },
      ],
    },
    {
      code: 'CUN',
      flights: [
        { code: 'SC007', origin: 'MEX', destination: 'CUN', categoria: 'BASIC' as const, seatsTotal: 150, numeroAvion: 'Boeing 737', daysOffset: 1 },
        { code: 'SC008', origin: 'CDMX', destination: 'CUN', categoria: 'BASIC' as const, seatsTotal: 180, numeroAvion: 'Airbus A320', daysOffset: 2 },
        { code: 'SC009', origin: 'GDL', destination: 'CUN', categoria: 'PRIVATE' as const, seatsTotal: 50, numeroAvion: 'Gulfstream G650', daysOffset: 3 },
      ],
    },
    {
      code: 'NYC',
      flights: [
        { code: 'SC010', origin: 'MEX', destination: 'NYC', categoria: 'INTERNATIONAL' as const, seatsTotal: 200, numeroAvion: 'Boeing 787', daysOffset: 2 },
        { code: 'SC011', origin: 'CDMX', destination: 'JFK', categoria: 'INTERNATIONAL' as const, seatsTotal: 150, numeroAvion: 'Airbus A350', daysOffset: 4 },
        { code: 'SC012', origin: 'MTY', destination: 'NYC', categoria: 'BASIC' as const, seatsTotal: 120, numeroAvion: 'Boeing 737', daysOffset: 6 },
      ],
    },
    {
      code: 'BCN',
      flights: [
        { code: 'SC013', origin: 'MEX', destination: 'BCN', categoria: 'INTERNATIONAL' as const, seatsTotal: 180, numeroAvion: 'Boeing 777', daysOffset: 3 },
        { code: 'SC014', origin: 'CDMX', destination: 'BCN', categoria: 'INTERNATIONAL' as const, seatsTotal: 150, numeroAvion: 'Airbus A330', daysOffset: 5 },
        { code: 'SC015', origin: 'GDL', destination: 'BCN', categoria: 'BASIC' as const, seatsTotal: 120, numeroAvion: 'Boeing 737', daysOffset: 7 },
      ],
    },
    {
      code: 'DXB',
      flights: [
        { code: 'SC016', origin: 'MEX', destination: 'DXB', categoria: 'INTERNATIONAL' as const, seatsTotal: 200, numeroAvion: 'Boeing 787', daysOffset: 4 },
        { code: 'SC017', origin: 'CDMX', destination: 'DXB', categoria: 'INTERNATIONAL' as const, seatsTotal: 180, numeroAvion: 'Airbus A350', daysOffset: 6 },
        { code: 'SC018', origin: 'MTY', destination: 'DXB', categoria: 'PRIVATE' as const, seatsTotal: 50, numeroAvion: 'Bombardier Global 7500', daysOffset: 8 },
      ],
    },
  ];

  const flights: Array<{ id: number; seatsTotal: number }> = [];
  for (const group of flightGroups) {
    for (const config of group.flights) {
      const departureTime = new Date(now.getTime() + config.daysOffset * oneDay + 8 * 60 * 60 * 1000);
      const flightDuration = config.categoria === 'PRIVATE' ? 3 * 60 * 60 * 1000 :
                             config.categoria === 'INTERNATIONAL' ? 12 * 60 * 60 * 1000 :
                             4 * 60 * 60 * 1000;
      const arrivalTime = new Date(departureTime.getTime() + flightDuration);

      const lugarArribo = config.categoria === 'INTERNATIONAL' ? 'Terminal Internacional' :
                         config.categoria === 'PRIVATE' ? 'Terminal Privada' :
                         'Terminal Nacional';
      const puertaArribo = config.categoria === 'INTERNATIONAL' ? `I${Math.floor(Math.random() * 20) + 1}` :
                          config.categoria === 'PRIVATE' ? `P${Math.floor(Math.random() * 10) + 1}` :
                          `A${Math.floor(Math.random() * 30) + 1}`;

      const flight = await prisma.flight.upsert({
        where: { code: config.code },
        update: {},
        create: {
          code: config.code,
          origin: config.origin,
          destination: config.destination,
          departureAt: departureTime,
          arrivalAt: arrivalTime,
          seatsTotal: config.seatsTotal,
          seatsAvailable: config.seatsTotal,
          numeroAvion: config.numeroAvion,
          categoria: config.categoria,
          lugarArribo: `${lugarArribo} - Muelle ${Math.floor(Math.random() * 5) + 1}`,
          puertaArribo: puertaArribo,
          checkInTime: new Date(departureTime.getTime() - checkInOffset),
          updatedAt: new Date(),
        },
      });

      await createSeatsForFlight(flight.id, config.seatsTotal);
      flights.push({ id: flight.id, seatsTotal: config.seatsTotal });
    }
  }

  // Crear reservas demo para pasajeros base
  const basePassengers = await prisma.user.findMany({ where: { role: 'PASSENGER' } });
  const allFlights = await prisma.flight.findMany({ orderBy: { id: 'asc' } });
  if (basePassengers.length && allFlights.length) {
    for (let i = 0; i < basePassengers.length; i++) {
      const user = basePassengers[i];
      const f = allFlights[i % allFlights.length];
      const seats = await prisma.seat.findMany({ where: { flightId: f.id, isOccupied: false }, take: 1 });
      if (seats.length > 0) {
        const seat = seats[0];
        await prisma.booking.upsert({
          where: { userId_flightId: { userId: user.id, flightId: f.id } },
          update: {},
          create: { userId: user.id, flightId: f.id, seatId: seat.id, status: 'APPROVED', paymentMethod: 'EFECTIVO', finalPrice: 0 },
        });
        await prisma.seat.update({ where: { id: seat.id }, data: { isOccupied: true } });
        await prisma.flight.update({ where: { id: f.id }, data: { seatsAvailable: { decrement: 1 } } });
      }
    }
  }

  // Ofertas de viaje
  const offers = [
    {
      destination: 'París, Francia',
      description: 'La ciudad del amor te espera',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop',
      originalPrice: 2500,
      discountPrice: 1750,
      discountPercent: 30,
      destinationCode: 'PAR',
      isActive: true,
    },
    {
      destination: 'Tokio, Japón',
      description: 'Descubre la cultura oriental',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
      originalPrice: 2400,
      discountPrice: 1800,
      discountPercent: 25,
      destinationCode: 'TYO',
      isActive: true,
    },
    {
      destination: 'Cancún, México',
      description: 'Playas paradisíacas te esperan',
      imageUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=1000&auto=format&fit=crop',
      originalPrice: 2000,
      discountPrice: 1300,
      discountPercent: 35,
      destinationCode: 'CUN',
      isActive: true,
    },
    {
      destination: 'Nueva York, USA',
      description: 'La ciudad que nunca duerme',
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1000&auto=format&fit=crop',
      originalPrice: 2300,
      discountPrice: 1656,
      discountPercent: 28,
      destinationCode: 'NYC',
      isActive: true,
    },
    {
      destination: 'Barcelona, España',
      description: 'Descubre la arquitectura y el mar',
      imageUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1000&auto=format&fit=crop',
      originalPrice: 2200,
      discountPrice: 1500,
      discountPercent: 32,
      destinationCode: 'BCN',
      isActive: true,
    },
    {
      destination: 'Dubái, EAU',
      description: 'Lujo y modernidad en el desierto',
      imageUrl: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?q=80&w=1000&auto=format&fit=crop',
      originalPrice: 2600,
      discountPrice: 1872,
      discountPercent: 28,
      destinationCode: 'DXB',
      isActive: true,
    },
  ];
  await prisma.traveloffer.createMany({ 
    data: offers.map(o => ({ ...o, updatedAt: new Date() })), 
    skipDuplicates: true 
  });

  console.log('Seed completo: usuarios, vuelos, asientos, ofertas, reservas demo.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


