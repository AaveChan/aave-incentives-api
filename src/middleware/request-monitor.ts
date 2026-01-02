import { NextFunction, Request, Response } from 'express';

import { createLogger } from '@/config/logger.js';

const logger = createLogger('RequestMonitor');

const requestCounts = new Map<string, number>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const WARN_THRESHOLD = 100; // Warn if >100 requests per minute

setInterval(() => {
  requestCounts.clear();
}, WINDOW_MS);

function getClientIp(req: Request): string {
  console.log('req.headers', req.headers);
  console.log('req.ip', req.ip);
  console.log('req.ips', req.ips);
  console.log('realIp', req.headers['x-vercel-forwarded-for']);
  console.log('realIp', req.headers['x-real-ip']);
  console.log('forwarded', req.headers['x-forwarded-for']);

  // Vercel's guaranteed header (can't be overwritten by upstream proxies)
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (typeof vercelIp === 'string') {
    return vercelIp.split(',')[0]?.trim() ?? 'unknown';
  }

  // Fallback: x-real-ip
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  // Fallback: last IP in x-forwarded-for
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    return ips[ips.length - 1] ?? 'unknown';
  }

  return req.ip ?? 'unknown';
}

export function requestMonitor(req: Request, _res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const count = (requestCounts.get(ip) ?? 0) + 1;
  requestCounts.set(ip, count);

  if (count === WARN_THRESHOLD) {
    logger.warn(`High traffic from IP: ${ip} (${count} requests/min)`);
  }

  next();
}
