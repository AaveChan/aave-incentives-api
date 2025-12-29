import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { fetchWithTimeout } from './fetch-with-timeout.js';

// Mock the config module
vi.mock('@/config/http', () => ({
  HTTP_CONFIG: {
    HEALTH_CHECK_TIMEOUT_MS: 100, // 100ms for faster tests
  },
}));

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchWithTimeout', () => {
  const TEST_URL = 'https://api.example.com/test';

  it('should return response when request completes within timeout', async () => {
    server.use(
      http.get(TEST_URL, async () => {
        await delay(50); // Faster than 100ms timeout
        return HttpResponse.json({ success: true }, { status: 200 });
      }),
    );

    const response = await fetchWithTimeout(TEST_URL);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });

  it('should throw error when request exceeds timeout', async () => {
    server.use(
      http.get(TEST_URL, async () => {
        await delay(200); // Longer than 100ms timeout
        return HttpResponse.json({ success: true }, { status: 200 });
      }),
    );

    await expect(fetchWithTimeout(TEST_URL)).rejects.toThrow();
  });

  it('should use custom timeout when provided', async () => {
    server.use(
      http.get(TEST_URL, async () => {
        await delay(150); // Between 100ms and 200ms
        return HttpResponse.json({ success: true }, { status: 200 });
      }),
    );

    // Should timeout with 100ms
    await expect(fetchWithTimeout(TEST_URL, 100)).rejects.toThrow();

    // Should succeed with 200ms
    const response = await fetchWithTimeout(TEST_URL, 200);
    expect(response.ok).toBe(true);
  });

  it('should throw error when network error occurs', async () => {
    server.use(
      http.get(TEST_URL, () => {
        return HttpResponse.error();
      }),
    );

    await expect(fetchWithTimeout(TEST_URL)).rejects.toThrow();
  });

  it('should return non-ok response for server errors', async () => {
    server.use(
      http.get(TEST_URL, async () => {
        await delay(50);
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }),
    );

    const response = await fetchWithTimeout(TEST_URL);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should handle immediate responses', async () => {
    server.use(
      http.get(TEST_URL, () => {
        return HttpResponse.json({ success: true }, { status: 200 });
      }),
    );

    const response = await fetchWithTimeout(TEST_URL);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });
});
