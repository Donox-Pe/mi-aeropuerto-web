import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

// Limpiar la clave de posibles espacios o saltos de línea invisibles
const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();

// Solo inicializar si la clave no es placeholder
const isConfigured = Boolean(stripeSecretKey && !stripeSecretKey.includes('PLACEHOLDER'));

let stripe: Stripe | null = null;

if (isConfigured) {
  // Validación de seguridad y formato
  const keyLength = stripeSecretKey.length;
  const keyStart = stripeSecretKey.substring(0, 7);
  const keyEnd = stripeSecretKey.substring(keyLength - 4);
  
  console.log(`🔍 Validando Clave Stripe: Longitud=${keyLength}, Empieza con=${keyStart}, Termina con=${keyEnd}`);

  if (stripeSecretKey.startsWith('pk_')) {
    console.error('❌ ERROR: Estás usando una clave PÚBLICA como secreta.');
  }

  stripe = new Stripe(stripeSecretKey, { 
    apiVersion: '2024-11-20.acacia' as any,
    timeout: 60000,           // 60 segundos por si acaso
    maxNetworkRetries: 5,     // Más intentos
    protocol: 'https',
  });
  console.log('✅ Stripe SDK inicializado con limpieza de espacios (Timeout 60s)');
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
