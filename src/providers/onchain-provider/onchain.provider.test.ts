import { AaveV3Ethereum } from '@aave-dao/aave-address-book';
import { mainnet } from 'viem/chains';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnchainProvider } from './onchain.provider.js';

// Mock the config module
vi.mock('@/config/http', () => ({
  HTTP_CONFIG: {
    HEALTH_CHECK_TIMEOUT_MS: 100, // 100ms for faster tests
  },
}));

describe('OnchainProvider', () => {
  let provider: OnchainProvider;

  beforeEach(() => {
    provider = new OnchainProvider();
  });

  describe('isHealthy', () => {
    it('should return true when incentives data is returned within timeout', async () => {
      const mockIncentivesData = [{ underlyingAsset: `0x123` }, { underlyingAsset: `0x456` }];

      vi.spyOn(provider.aaveUIIncentiveService, 'getUiIncentivesData').mockResolvedValue(
        mockIncentivesData as unknown as Awaited<
          ReturnType<typeof provider.aaveUIIncentiveService.getUiIncentivesData>
        >,
      );

      const result = await provider.isHealthy();

      expect(result).toBe(true);
      expect(provider.aaveUIIncentiveService.getUiIncentivesData).toHaveBeenCalledWith(
        AaveV3Ethereum,
        mainnet.id,
      );
    });

    it('should return false when incentives data is empty', async () => {
      vi.spyOn(provider.aaveUIIncentiveService, 'getUiIncentivesData').mockResolvedValue([]);

      const result = await provider.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false when request times out', async () => {
      vi.spyOn(provider.aaveUIIncentiveService, 'getUiIncentivesData').mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([{ underlyingAsset: `0x123` }] as unknown as Awaited<
                  ReturnType<typeof provider.aaveUIIncentiveService.getUiIncentivesData>
                >),
              200,
            ),
          ),
      );

      const result = await provider.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false when RPC call throws an error', async () => {
      vi.spyOn(provider.aaveUIIncentiveService, 'getUiIncentivesData').mockRejectedValue(
        new Error('RPC error'),
      );

      const result = await provider.isHealthy();

      expect(result).toBe(false);
    });

    it('should return false when RPC call returns null', async () => {
      vi.spyOn(provider.aaveUIIncentiveService, 'getUiIncentivesData').mockResolvedValue(
        null as unknown as [],
      );

      const result = await provider.isHealthy();

      expect(result).toBe(false);
    });
  });
});
