import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService.js';

/**
 * Middleware de cache para rutas GET.
 * Cachea la respuesta por el TTL especificado.
 * El key es generado automáticamente basado en la URL + query params.
 */
export function cacheRoute(ttlSeconds: number = 60, prefix?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = `${prefix || 'route'}:${req.originalUrl}`;

    try {
      const cached = await cacheService.get<{ body: unknown; statusCode: number }>(cacheKey);
      if (cached) {
        console.log(`⚡ Cache HIT: ${cacheKey}`);
        return res.status(cached.statusCode).json(cached.body);
      }
    } catch {
      // Si el cache falla, continuar normalmente
    }

    // Interceptar res.json para capturar la respuesta
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      // Solo cachear respuestas exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, { body, statusCode: res.statusCode }, ttlSeconds).catch(() => {});
        console.log(`💾 Cache SET: ${cacheKey} (TTL: ${ttlSeconds}s)`);
      }
      return originalJson(body);
    };

    next();
  };
}
