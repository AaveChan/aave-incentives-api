import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { withTimeout } from './timeout.js';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve when promise completes before timeout', async () => {
    const promise = Promise.resolve('success');

    const result = withTimeout(promise, 5000);

    await expect(result).resolves.toBe('success');
  });

  it('should reject when promise takes longer than timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('too late'), 10000));

    const resultPromise = withTimeout(promise, 5000);

    await vi.advanceTimersByTimeAsync(5000);

    await expect(resultPromise).rejects.toThrow('Operation timed out');
  });

  it('should use custom error message when provided', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('too late'), 10000));

    const customMessage = 'Custom timeout error';
    const resultPromise = withTimeout(promise, 5000, customMessage);

    await vi.advanceTimersByTimeAsync(5000);

    await expect(resultPromise).rejects.toThrow(customMessage);
  });

  it('should reject when promise rejects before timeout', async () => {
    const promise = Promise.reject(new Error('Promise error'));

    const resultPromise = withTimeout(promise, 5000);

    await expect(resultPromise).rejects.toThrow('Promise error');
  });

  it('should handle promises that resolve with complex objects', async () => {
    const complexObject = { id: 1, data: ['a', 'b', 'c'], nested: { value: true } };
    const promise = Promise.resolve(complexObject);

    const result = withTimeout(promise, 5000);

    await expect(result).resolves.toEqual(complexObject);
  });

  it('should handle promises that resolve with null or undefined', async () => {
    const promiseNull = Promise.resolve(null);
    const promiseUndefined = Promise.resolve(undefined);

    await expect(withTimeout(promiseNull, 5000)).resolves.toBeNull();
    await expect(withTimeout(promiseUndefined, 5000)).resolves.toBeUndefined();
  });

  it('should timeout at exact specified time', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('done'), 10000));

    const resultPromise = withTimeout(promise, 3000);

    // Advance to just before timeout
    await vi.advanceTimersByTimeAsync(2999);
    expect(resultPromise).not.toBe(expect.anything());

    // Advance to timeout
    await vi.advanceTimersByTimeAsync(1);

    await expect(resultPromise).rejects.toThrow();
  });
});
