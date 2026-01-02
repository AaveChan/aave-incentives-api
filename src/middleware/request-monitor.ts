import { NextFunction, Request, Response } from 'express';

import { createLogger } from '@/config/logger.js';

const logger = createLogger('RequestMonitor');

// Track requests per IP (resets every WINDOW_MS)
const requestCounts = new Map<string, number>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const WARN_THRESHOLD = 100; // Warn if >100 requests per minute

// Reset counts periodically
setInterval(() => {
  requestCounts.clear();
}, WINDOW_MS);

function getClientIp(req: Request): string {
  console.log('req.headers', req);
  console.log('req.headers', req.headers);
  console.log('req.ip', req.ip);
  console.log('req.ips', req.ips);
  console.log('realIp', req.headers['x-real-ip']);
  console.log('forwarded', req.headers['x-forwarded-for']);

  // Vercel sets x-real-ip to the actual client IP
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  // Fallback: last IP in x-forwarded-for (rightmost = closest to server = real)
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    return ips[ips.length - 1] ?? 'unknown';
  }

  return req.ip ?? 'unknown';
}

export function requestMonitor(req: Request, _res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  console.log('Client IP:', ip);
  const count = (requestCounts.get(ip) ?? 0) + 1;
  requestCounts.set(ip, count);

  if (count === WARN_THRESHOLD) {
    logger.warn(`High traffic from IP: ${ip} (${count} requests/min)`);
  }

  next();
}
