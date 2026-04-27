import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private client: Redis | null = null;

  constructor() {
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        }
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis Error:', err.message);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis conectado correctamente');
      });
    } catch (error) {
      console.warn('⚠️ No se pudo inicializar Redis. El sistema funcionará sin caché.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlInSeconds: number = 3600): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
    } catch (err) {
      console.error('Redis Set Error:', err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('Redis Del Error:', err);
    }
  }

  async flush(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.flushall();
    } catch (err) {
      console.error('Redis Flush Error:', err);
    }
  }
}

export const redisService = new RedisService();
