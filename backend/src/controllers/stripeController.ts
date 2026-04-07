import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import {
  createCheckoutSession,
  constructWebhookEvent,
  retrieveSession,
  isStripeConfigured,
} from '../services/stripeService.js';
import { z } from 'zod';

/**
 * GET /api/stripe/status
 * Verifica si Stripe está configurado
 */
export async function getStripeStatus(_req: Request, res: Response) {
  return res.json({
    configured: isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
}

/**
 * POST /api/stripe/create-checkout-session
 * Crea una sesión de pago de Stripe Checkout para un booking existente.
 */
const createSessionSchema = z.object({
  bookingId: z.number().int().positive(),
});

export async function createStripeSession(req: Request, res: Response) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ message: 'Stripe no está configurado. Revise las claves en .env' });
  }

  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'bookingId requerido' });
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: {
      user: { select: { email: true } },
      flight: { select: { code: true, origin: true, destination: true, categoria: true } },
      seat: { select: { number: true, seatClass: true } },
      payment: true,
    },
  });

  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
  if (booking.userId !== req.user.sub && req.user.role === 'PASSENGER') {
    return res.status(403).json({ message: 'No autorizado para esta reserva' });
  }

  // Si ya tiene un pago con Stripe completado
  if (booking.payment?.stripeSessionId && booking.payment?.status === 'completed') {
    return res.status(400).json({ message: 'Este booking ya fue pagado con Stripe' });
  }

  const amount = booking.finalPrice || booking.price || 0;
  const description = `${booking.flight.origin} → ${booking.flight.destination} | Asiento: ${booking.seat?.number || 'Sin asignar'} | ${booking.flight.categoria}`;

  try {
    const session = await createCheckoutSession({
      bookingId: booking.id,
      amount,
      customerEmail: booking.user.email,
      flightCode: booking.flight.code,
      description,
    });

    // Guardar session ID en payment (crear si no existe)
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          stripeSessionId: session.id,
          paymentMethod: 'STRIPE',
          status: 'pending',
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount,
          status: 'pending',
          paymentMethod: 'STRIPE',
          stripeSessionId: session.id,
        },
      });
    }

    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: any) {
    console.error('Stripe createSession error:', err);
    return res.status(500).json({ 
      message: 'Error al crear sesión de Stripe', 
      error: err.message,
      stripeError: err.raw?.message || err.message 
    });
  }
}

/**
 * POST /api/stripe/webhook
 * Recibe eventos de Stripe y procesa pagos completados.
 * IMPORTANTE: Este endpoint recibe raw body, no JSON parseado.
 */
export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) return res.status(400).json({ message: 'Falta firma stripe-signature' });

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Firma inválida' });
  }

  // Procesar evento
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const bookingId = parseInt(session.metadata?.bookingId, 10);

      if (bookingId) {
        try {
          await prisma.$transaction(async (tx) => {
            // Actualizar payment
            const payment = await tx.payment.findFirst({
              where: { stripeSessionId: session.id },
            });

            if (payment) {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: 'completed',
                  stripePaymentId: session.payment_intent,
                },
              });
            }

            // Aprobar booking automáticamente tras pago
            const booking = await tx.booking.findUnique({
              where: { id: bookingId },
              include: { flight: true },
            });

            if (booking && booking.status === 'PENDING') {
              // Marcar asiento como ocupado
              if (booking.seatId) {
                await tx.seat.update({
                  where: { id: booking.seatId },
                  data: { isOccupied: true },
                });
              }
              // Decrementar asientos disponibles
              await tx.flight.update({
                where: { id: booking.flightId },
                data: { seatsAvailable: { decrement: 1 } },
              });
              // Aprobar booking
              await tx.booking.update({
                where: { id: bookingId },
                data: { status: 'APPROVED', paymentMethod: 'STRIPE' },
              });
            }
          });
          console.log(`✅ Pago Stripe completado para booking #${bookingId}`);
        } catch (err: any) {
          console.error('Error procesando webhook:', err.message);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as any;
      console.log(`❌ Pago fallido: ${intent.id}`);
      break;
    }

    default:
      console.log(`Evento Stripe sin manejar: ${event.type}`);
  }

  return res.json({ received: true });
}

/**
 * GET /api/stripe/session/:sessionId
 * Obtener estado de una sesión de Stripe.
 */
export async function getSessionStatus(req: Request, res: Response) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ message: 'Stripe no está configurado' });
  }

  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ message: 'sessionId requerido' });

  try {
    const session = await retrieveSession(sessionId);
    return res.json({
      status: session.payment_status,
      bookingId: session.metadata?.bookingId,
      amountTotal: (session.amount_total || 0) / 100,
      currency: session.currency,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Error al consultar Stripe', error: err.message });
  }
}
