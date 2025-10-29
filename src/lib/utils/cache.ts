import NodeCache from 'node-cache';

const cache = new NodeCache();

export function withCache<Args extends unknown[], Return>(
  fn: (...args: Args) => Promise<Return>,
  keyBuilder: (...args: Args) => string,
  ttlSeconds: number,
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
    const key = keyBuilder(...args);
    const cached = cache.get<Return>(key);
    if (cached !== undefined) return cached;

    const result = await fn(...args);
    cache.set(key, result, ttlSeconds);
    return result;
  };
}
