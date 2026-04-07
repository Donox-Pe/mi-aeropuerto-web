import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

// Solo inicializar si la clave no es placeholder
const isConfigured = Boolean(stripeSecretKey && !stripeSecretKey.includes('PLACEHOLDER'));

let stripe: Stripe | null = null;

if (isConfigured) {
  // Validación básica del formato de la clave
  if (stripeSecretKey.startsWith('pk_')) {
    console.error('❌ ERROR CRÍTICO: STRIPE_SECRET_KEY parece ser una clave pública (empieza con pk_). Debes usar la clave secreta (sk_).');
  } else if (!stripeSecretKey.startsWith('sk_')) {
    console.error('❌ ERROR CRÍTICO: STRIPE_SECRET_KEY no tiene el formato correcto (debe empezar con sk_).');
  }

  stripe = new Stripe(stripeSecretKey, { 
    apiVersion: '2024-11-20.acacia' as any,
    timeout: 30000,           // Aumentar a 30s para Render
    maxNetworkRetries: 3,     // Un intento extra
  });
  console.log('✅ Stripe SDK inicializado (Timeout: 30s)');
} else {
  console.log('⚠️ Stripe no configurado correctamente en variables de entorno.');
}

export function isStripeConfigured(): boolean {
  return isConfigured && stripe !== null;
}

/**
 * Crea una sesión de Stripe Checkout.
 */
export async function createCheckoutSession(params: {
  bookingId: number;
  amount: number;
  currency?: string;
  customerEmail: string;
  flightCode: string;
  description: string;
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error('Stripe no está configurado. Agrega las claves en .env');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: params.currency || 'mxn',
          product_data: {
            name: `Vuelo ${params.flightCode}`,
            description: params.description,
          },
          unit_amount: Math.round(params.amount * 100), // Stripe usa centavos
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: params.bookingId.toString(),
    },
    success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/payment/cancel',
  });

  return session;
}

/**
 * Construye y verifica un evento de webhook de Stripe.
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  if (!stripe) throw new Error('Stripe no está configurado');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Recupera una sesión de checkout completada.
 */
export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error('Stripe no está configurado');
  return stripe.checkout.sessions.retrieve(sessionId);
}

export { stripe };
