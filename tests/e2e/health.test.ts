import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { GlobalStatus, ProvidersStatus } from '../../src/types/index.js';
import { request, startTestServer, stopTestServer } from '../setup/test-helpers.js';

describe('Health Endpoint E2E', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request('/health');
      expect(response.status).toBe(200);
    });

    it('should return healthy status', async () => {
      const response = await request('/health');
      const data: ProvidersStatus = await response.json();

      expect(data).toHaveProperty('status');
      expect(data.status).toBe(GlobalStatus.HEALTHY);
    });

    it('should respond within 5 seconds', async () => {
      const start = Date.now();
      await request('/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('should have correct content-type', async () => {
      const response = await request('/health');
      const contentType = response.headers.get('content-type');

      expect(contentType).toContain('application/json');
    });
  });
});
