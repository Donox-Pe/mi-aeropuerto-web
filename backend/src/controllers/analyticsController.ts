import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';

/**
 * Obtener datos de analíticas para el panel de administración
 * Incluye: ingresos por mes, reservas por mes, distribución de clases,
 * top rutas, usuarios por mes, y ocupación promedio
 */
export async function getAnalytics(_req: Request, res: Response) {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // 1. Pagos (ingresos) por mes — últimos 6 meses
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    });

    const revenueByMonth: Record<string, number> = {};
    const bookingCountByMonth: Record<string, number> = {};
    
    // Inicializar los 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
      bookingCountByMonth[key] = 0;
    }

    for (const p of payments) {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += p.amount;
        bookingCountByMonth[key]++;
      }
    }

    // 2. Distribución de clases de asientos vendidos
    const seatClassDistribution = await prisma.booking.groupBy({
      by: ['seatId'],
      _count: { id: true },
      where: {
        seatId: { not: null },
      },
    });

    // Obtener la clase de cada asiento
    const seatIds = seatClassDistribution.map(s => s.seatId).filter((id): id is number => id !== null);
    const seats = await prisma.seat.findMany({
      where: { id: { in: seatIds } },
      select: { id: true, seatClass: true },
    });

    const seatClassMap = new Map(seats.map(s => [s.id, s.seatClass]));
    const classCounts: Record<string, number> = { FIRST: 0, PREMIUM: 0, ECONOMY: 0 };

    for (const entry of seatClassDistribution) {
      if (entry.seatId) {
        const seatClass = seatClassMap.get(entry.seatId);
        if (seatClass && classCounts[seatClass] !== undefined) {
          classCounts[seatClass] += entry._count.id;
        }
      }
    }

    // 3. Top 5 rutas más populares
    const allBookings = await prisma.booking.findMany({
      select: {
        flight: {
          select: { origin: true, destination: true },
        },
      },
    });

    const routeCounts: Record<string, number> = {};
    for (const b of allBookings) {
      const route = `${b.flight.origin} → ${b.flight.destination}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    }

    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));

    // 4. Usuarios registrados por mes
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const usersByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      usersByMonth[key] = 0;
    }

    for (const u of users) {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (usersByMonth[key] !== undefined) {
        usersByMonth[key]++;
      }
    }

    // 5. Ocupación promedio por vuelo
    const flights = await prisma.flight.findMany({
      select: {
        code: true,
        origin: true,
        destination: true,
        seatsTotal: true,
        seatsAvailable: true,
      },
      orderBy: { departureAt: 'desc' },
      take: 10,
    });

    const flightOccupancy = flights.map(f => ({
      code: f.code,
      route: `${f.origin}-${f.destination}`,
      occupancy: f.seatsTotal > 0
        ? Math.round(((f.seatsTotal - f.seatsAvailable) / f.seatsTotal) * 100)
        : 0,
      occupied: f.seatsTotal - f.seatsAvailable,
      total: f.seatsTotal,
    }));

    // 6. Totales generales
    const [totalUsers, totalFlights, totalBookings, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.flight.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    // Formatear datos para Recharts
    const monthNames: Record<string, string> = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
    };

    const revenueChart = Object.entries(revenueByMonth).map(([key, value]) => ({
      month: monthNames[key.split('-')[1]] || key,
      ingresos: Math.round(value),
    }));

    const bookingsChart = Object.entries(bookingCountByMonth).map(([key, value]) => ({
      month: monthNames[key.split('-')[1]] || key,
      reservas: value,
    }));

    const usersChart = Object.entries(usersByMonth).map(([key, value]) => ({
      month: monthNames[key.split('-')[1]] || key,
      usuarios: value,
    }));

    const classChart = [
      { name: 'Primera Clase', value: classCounts.FIRST, color: '#fbbf24' },
      { name: 'Premium', value: classCounts.PREMIUM, color: '#8b5cf6' },
      { name: 'Económica', value: classCounts.ECONOMY, color: '#3b82f6' },
    ];

    return res.json({
      totals: {
        users: totalUsers,
        flights: totalFlights,
        bookings: totalBookings,
        revenue: totalRevenue._sum.amount || 0,
      },
      revenueChart,
      bookingsChart,
      usersChart,
      classChart,
      topRoutes,
      flightOccupancy,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      message: 'Error al obtener analíticas',
      error: error.message,
    });
  }
}
