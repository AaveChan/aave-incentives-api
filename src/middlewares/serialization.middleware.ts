import { NextFunction, Request, Response } from 'express';

import { convertBigIntToString } from '@/lib/utils/serialization.js';

/**
 * Middleware that automatically serializes BigInt values to strings in JSON responses.
 * This middleware intercepts the res.json() method and applies BigInt serialization
 * transparently to all response data.
 *
 * @example
 * // Apply globally in app.ts
 * app.use(serializeBigIntMiddleware());
 *
 * // Or per-route
 * router.get('/path', serializeBigIntMiddleware(), handler);
 */
export function serializeBigIntMiddleware() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Store the original json method
    const originalJson = res.json.bind(res);

    // Override res.json to serialize BigInt values
    res.json = function (body: unknown) {
      const serialized = convertBigIntToString(body);
      return originalJson(serialized);
    };

    next();
  };
}
