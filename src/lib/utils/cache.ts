import NodeCache from 'node-cache';

const cache = new NodeCache();

// export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
//   fn: T,
//   keyBuilder: (...args: Parameters<T>) => string,
//   ttlSeconds: number,
// ): T {
//   return (async (...args: Parameters<T>) => {
//     const key = keyBuilder(...args);
//     const cached = cache.get(key);
//     if (cached) return cached;
//     const result = await fn(...args);
//     cache.set(key, result, ttlSeconds);
//     return result;
//   }) as T;
// }

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

// export function withCache<Args extends any[], Return>(
//   fn: (...args: Args) => Promise<Return>,
//   keyBuilder: (...args: Args) => string,
//   ttl: number,
// ): (...args: Args) => Promise<Return> {
//   return async (...args: Args): Promise<Return> => {
//     const key = keyBuilder(...args);
//     const cached = cache.get<Return>(key);
//     if (cached !== undefined) {
//       return cached;
//     }
//     const result = await fn(...args);
//     cache.set(key, result, ttl);
//     return result;
//   };
// }

// support only 1 arg
// export function withCache<Arg, Return>(
//   fn: (arg: Arg) => Promise<Return>,
//   keyBuilder: (arg: Arg) => string,
//   ttl: number,
// ): (arg: Arg) => Promise<Return> {
//   return async (arg) => {
//     const key = keyBuilder(arg);
//     const cached = cache.get<Return>(key);
//     if (cached !== undefined) return cached;

//     const result = await fn(arg);
//     cache.set(key, result, ttl);
//     return result;
//   };
// }
