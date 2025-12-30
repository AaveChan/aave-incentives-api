import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { GetIncentivesResponse, Token } from '../../src/types/api.js';
import { request, requestJson, startTestServer, stopTestServer } from '../setup/test-helpers.js';

describe('Incentives API E2E', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('GET /incentives', () => {
    it('should return 200 status', async () => {
      const response = await request('/incentives');
      expect(response.status).toBe(200);
    });

    it('should return an array of incentives', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>('/incentives');

      expect(Array.isArray(incentivesResponse.data?.incentives)).toBe(true);
    });

    it('should return at least one incentive', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>('/incentives');

      expect(incentivesResponse.data?.incentives.length).toBeGreaterThan(0);
    });

    it('should return valid incentive structure', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>('/incentives');
      const firstIncentive = incentivesResponse.data?.incentives[0];

      if (!firstIncentive) {
        throw new Error('No incentives returned');
      }

      // Check required fields
      expect(firstIncentive).toHaveProperty('name');
      expect(firstIncentive).toHaveProperty('chainId');
      expect(firstIncentive).toHaveProperty('type');
      expect(firstIncentive).toHaveProperty('source');
      expect(firstIncentive).toHaveProperty('rewardedToken');
      expect(firstIncentive).toHaveProperty('involvedTokens');

      // Check types
      expect(typeof firstIncentive.name).toBe('string');
      expect(typeof firstIncentive.chainId).toBe('number');
      expect(typeof firstIncentive.type).toBe('string');
      expect(typeof firstIncentive.source).toBe('string');
      expect(Array.isArray(firstIncentive.involvedTokens)).toBe(true);
    });

    it('should complete within 15 seconds', async () => {
      const start = Date.now();
      await requestJson('/incentives');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(15000);
    });

    it('should have valid token addresses', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>('/incentives');

      incentivesResponse.data?.incentives.forEach((incentive) => {
        if (incentive.rewardedToken?.address) {
          expect(incentive.rewardedToken.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        }

        incentive.involvedTokens?.forEach((token: Token) => {
          if (token.address) {
            expect(token.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
          }
        });
      });
    });
  });

  describe('Query Parameters', () => {
    it('should filter by chainId', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>('/incentives?chainId=1');

      incentivesResponse.data?.incentives.forEach((incentive) => {
        expect(incentive.chainId).toBe(1);
      });
    });

    it('should filter by multiple chainIds', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>(
        '/incentives?chainId=1,137',
      );

      incentivesResponse.data?.incentives.forEach((incentive) => {
        expect([1, 137]).toContain(incentive.chainId);
      });
    });

    it('should filter by source', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>(
        '/incentives?source=MERKL_API',
      );

      incentivesResponse.data?.incentives.forEach((incentive) => {
        expect(incentive.source).toBe('MERKL_API');
      });
    });

    it('should filter by type', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>('/incentives?type=TOKEN');

      incentivesResponse.data?.incentives.forEach((incentive) => {
        expect(incentive.type).toBe('TOKEN');
      });
    });

    it('should combine multiple filters', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>(
        '/incentives?chainId=1&type=TOKEN&source=MERKL_API',
      );

      incentivesResponse.data?.incentives.forEach((incentive) => {
        expect(incentive.chainId).toBe(1);
        expect(incentive.type).toBe('TOKEN');
        expect(incentive.source).toBe('MERKL_API');
      });
    });

    it('should return empty array for non-existent chainId', async () => {
      const incentivesResponse = await requestJson<GetIncentivesResponse>(
        '/incentives?chainId=99999',
      );

      expect(Array.isArray(incentivesResponse.data?.incentives)).toBe(true);
      expect(incentivesResponse.data?.incentives.length).toBe(0);
    });

    it('should handle invalid query parameters', async () => {
      const response = await request('/incentives?invalid=param');

      // Return 400: Invalid query parameters
      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() => requestJson<GetIncentivesResponse>('/incentives'));

      const results = await Promise.all(requests);

      results.forEach((incentivesResponse) => {
        expect(Array.isArray(incentivesResponse.data?.incentives)).toBe(true);
      });
    });

    it('should handle repeated requests efficiently', async () => {
      const start1 = Date.now();
      await requestJson('/incentives');
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await requestJson('/incentives');
      const duration2 = Date.now() - start2;

      // Both should complete within reasonable time
      expect(duration1).toBeLessThan(20000);
      expect(duration2).toBeLessThan(20000);
    });
  });
});
