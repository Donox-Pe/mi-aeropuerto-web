import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para endpoints de autenticación.
 * Previene ataques de fuerza bruta.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos por ventana
  message: {
    message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter más estricto para password reset.
 */
export const resetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 solicitudes por hora
  message: {
    message: 'Demasiadas solicitudes de recuperación. Intenta en 1 hora.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter general para API.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: {
    message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
