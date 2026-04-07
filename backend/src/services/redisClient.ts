import dotenv from 'dotenv';
import Redis from 'ioredis';
dotenv.config();

/**
 * Redis client con fallback a memoria.
 * Si REDIS_URL está configurado, usa ioredis real.
 * Si no, usa un Map en memoria como cache.
 */

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<void>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  del(...keys: string[]): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<void>;
  isReady: boolean;
}

// In-memory fallback cache
class MemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt: number | null }>();
  isReady = true;

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<void> {
    const expiresAt = mode === 'EX' && ttl ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  }

  async del(...keys: string[]): Promise<void> {
    keys.forEach(k => this.store.delete(k));
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(k => regex.test(k));
  }

  async flushall(): Promise<void> {
    this.store.clear();
  }
}

let cacheClient: CacheClient;

if (process.env.REDIS_URL) {
  try {
    const redis = new Redis(process.env.REDIS_URL);
    
    redis.on('connect', () => console.log('✅ Redis conectado'));
    redis.on('error', (err) => console.warn('⚠️ Redis error (usando fallback):', err.message));

    cacheClient = {
      get: (key) => redis.get(key),
      set: async (key, value, mode, ttl) => {
        if (mode === 'EX' && ttl) await redis.set(key, value, 'EX', ttl);
        else await redis.set(key, value);
      },
      setex: (key, ttl, value) => redis.setex(key, ttl, value).then(() => {}),
      del: (...keys) => redis.del(...keys).then(() => {}),
      keys: (pattern) => redis.keys(pattern),
      flushall: () => redis.flushall().then(() => {}),
      isReady: true,
    };
    console.log('🔌 Usando Redis como cache');
  } catch {
    cacheClient = new MemoryCache();
    console.log('📦 Redis no disponible, usando cache en memoria');
  }
} else {
  cacheClient = new MemoryCache();
  console.log('📦 REDIS_URL no configurado, usando cache en memoria');
}

export { cacheClient };
export type { CacheClient };
