import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { requireRole } from '../middlewares/authMiddleware.js';
import { getFlightPrice } from '../utils/pricing.js';

/**
 * Obtener historial de pagos (para agentes y admins)
 */
export async function getPaymentHistory(_req: Request, res: Response) {
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          flight: {
            select: {
              id: true,
              code: true,
              origin: true,
              destination: true,
              categoria: true,
              departureAt: true,
              arrivalAt: true,
            },
          },
          seat: { select: { id: true, number: true, seatClass: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(payments);
}

/**
 * Obtener estadísticas de pagos
 */
export async function getPaymentStats(_req: Request, res: Response) {
  const [total, completed, totalAmount] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'completed' } }),
    prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
    }),
  ]);

  return res.json({
    total,
    completed,
    pending: total - completed,
    totalAmount: totalAmount._sum.amount || 0,
  });
}

/**
 * Sincronizar pagos faltantes - crea pagos para bookings que no tienen pago asociado
 */
export async function syncMissingPayments(_req: Request, res: Response) {
  try {
    // Obtener todos los bookings que no tienen pagos asociados
    const bookingsWithoutPayments = await prisma.booking.findMany({
      where: {
        payment: null,
      },
      include: {
        flight: {
          select: {
            categoria: true,
          },
        },
        seat: {
          select: {
            seatClass: true,
          },
        },
      },
    });

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const booking of bookingsWithoutPayments) {
        // Calcular precio basado en categoría del vuelo y clase del asiento
        const seatClass = booking.seat?.seatClass || null;
        const price = booking.price || getFlightPrice(booking.flight.categoria, seatClass);

        // Si el booking no tiene precio, actualizarlo también
        if (!booking.price) {
          await tx.booking.update({
            where: { id: booking.id },
            data: { price },
          });
          updated++;
        }

        // Crear pago
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: price,
            status: 'completed',
          },
        });
        created++;
      }
    });

    return res.json({
      message: `Sincronización completada. ${created} pagos creados, ${updated} precios actualizados.`,
      paymentsCreated: created,
      pricesUpdated: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Error al sincronizar pagos', 
      error: error.message 
    });
  }
}

/**
 * Verificar integridad de pagos - muestra estadísticas de bookings sin pagos
 */
export async function verifyPaymentsIntegrity(_req: Request, res: Response) {
  try {
    const [
      totalBookings,
      bookingsWithPayments,
      bookingsWithoutPayments,
      bookingsWithoutPrice,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          payment: {
            isNot: null,
          },
        },
      }),
      prisma.booking.count({
        where: {
          payment: null,
        },
      }),
      prisma.booking.count({
        where: {
          price: null,
        },
      }),
    ]);

    return res.json({
      totalBookings,
      bookingsWithPayments,
      bookingsWithoutPayments,
      bookingsWithoutPrice,
      integrity: {
        hasAllPayments: bookingsWithoutPayments === 0,
        hasAllPrices: bookingsWithoutPrice === 0,
        percentageComplete: totalBookings > 0 
          ? ((bookingsWithPayments / totalBookings) * 100).toFixed(2) + '%'
          : '0%',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Error al verificar integridad', 
      error: error.message 
    });
  }
}



