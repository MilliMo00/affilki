import { MemoryRateLimiter } from "./memory";

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

/** Интерфейс под замену на Redis/Upstash, когда процессов станет больше одного. */
export interface RateLimiter {
  /** Засчитывает попытку по ключу: не больше `limit` за окно `windowMs`. */
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

export const rateLimiter: RateLimiter = new MemoryRateLimiter();
