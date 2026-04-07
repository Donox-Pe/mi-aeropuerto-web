import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para endpoints de autenticación.
 * Previene ataques de fuerza bruta.
 */
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 30, // máximo 30 intentos por ventana (más relajado para pruebas)
  message: {
    message: 'Demasiados intentos. Intenta de nuevo en 5 minutos.',
    retryAfter: 5,
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
