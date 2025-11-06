import 'dotenv/config';

import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';

import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { createLogger } from '@/config/logger.js';

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

export class HttpCacheMiddleware {
  private logger = createLogger('HttpCacheMiddleware');
  private cache: NodeCache;

  constructor(ttl: number = CACHE_TTLS.REQUEST_CACHE) {
    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: ttl * 0.4,
      useClones: false,
    });
  }

  cacheResponse(ttl?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (process.env.DISABLE_CACHE === 'true') {
        this.logger.info('[HTTP Cache] Disabled via env variable');
        return next();
      }

      const cacheKey = this.generateCacheKey(req);

      const cached = this.cache.get<CachedResponse>(cacheKey);

      if (cached) {
        this.logger.info(`[HTTP Cache] HIT: ${req.path}`);

        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);

        return res.status(cached.statusCode).set(cached.headers).json(cached.body);
      }

      this.logger.info(`[HTTP Cache] MISS: ${req.path}`);
      res.set('X-Cache', 'MISS');

      // Binding needed to preserve original 'this' context (needed for res.json)
      const originalJson = res.json.bind(res);

      res.json = (body: unknown) => {
        // Only cache 2xx
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cachedResponse: CachedResponse = {
            statusCode: res.statusCode,
            headers: this.getRelevantHeaders(res),
            body,
          };

          if (ttl) {
            this.cache.set(cacheKey, cachedResponse, ttl);
          } else {
            this.cache.set(cacheKey, cachedResponse);
          }

          this.logger.info(`[HTTP Cache] STORED: ${cacheKey}`);
        }

        return originalJson(body);
      };

      next();
    };
  }

  private generateCacheKey(req: Request): string {
    const keyData = {
      method: req.method,
      path: req.path,
      query: req.query,
    };

    // deterministic
    const hash = crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');

    // short and clear key (eg: "http:GET:/api/incentives:a3f5b2c9d1e4f7a8b2c5d8e1f4a7b0c3")
    return `http:${req.method}:${req.path}:${hash}`;
  }

  private getRelevantHeaders(res: Response): Record<string, string> {
    const relevantHeaders = ['content-type', 'cache-control', 'etag'];

    const headers: Record<string, string> = {};
    relevantHeaders.forEach((header) => {
      const value = res.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    return headers;
  }

  // Manually invalidate cache entries
  invalidate(pattern?: string) {
    if (pattern) {
      const keys = this.cache.keys();
      const matching = keys.filter((key) => key.includes(pattern));
      this.cache.del(matching);
      this.logger.info(`[HTTP Cache] Invalidated ${matching.length} keys matching: ${pattern}`);
    } else {
      this.cache.flushAll();
      this.logger.info('[HTTP Cache] Cleared all cache');
    }
  }

  getStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats(),
    };
  }
}
