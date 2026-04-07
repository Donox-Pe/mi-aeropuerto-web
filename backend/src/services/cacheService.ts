import { cacheClient } from './redisClient.js';

const DEFAULT_TTL = 60; // 60 seconds

/**
 * Servicio de cache con operaciones CRUD, TTL y invalidación por patrón.
 */
export const cacheService = {
  /**
   * Obtener valor del cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = await cacheClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  /**
   * Guardar valor en cache con TTL
   */
  async set(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await cacheClient.setex(key, ttl, serialized);
    } catch (err) {
      console.warn('Cache set error:', err);
    }
  },

  /**
   * Eliminar una key
   */
  async del(key: string): Promise<void> {
    try {
      await cacheClient.del(key);
    } catch (err) {
      console.warn('Cache del error:', err);
    }
  },

  /**
   * Invalidar cache por patrón (ej: "flights:*")
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await cacheClient.keys(pattern);
      if (keys.length > 0) {
        await cacheClient.del(...keys);
        console.log(`🗑️ Cache invalidado: ${keys.length} keys matching "${pattern}"`);
      }
    } catch (err) {
      console.warn('Cache invalidate error:', err);
    }
  },

  /**
   * Get or Set: si existe en cache devuelve. Si no, ejecuta fetchFn, guarda en cache y devuelve.
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`⚡ Cache HIT: ${key}`);
      return cached;
    }
    console.log(`💾 Cache MISS: ${key}`);
    const freshData = await fetchFn();
    await this.set(key, freshData, ttl);
    return freshData;
  },
};
