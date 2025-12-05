import { mainnet } from 'viem/chains';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Token } from '@/types/index.js';

import { CoingeckoTokenPriceFetcher } from './coingecko-fetcher.js';

const token: Token = {
  name: 'Renzo',
  symbol: 'REZ',
  decimals: 18,
  address: '0x3b50805453023a91a8bf641e279401a0b23fa6f9',
  chainId: mainnet.id,
};

describe('Coingecko', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockResponse: Response = {
      ok: true,
      json: () =>
        Promise.resolve({
          '0x3b50805453023a91a8bf641e279401a0b23fa6f9': {
            usd: 0.01550861,
          },
        }),
    } as Response;

    globalThis.fetch = vi.fn(() => Promise.resolve(mockResponse));
  });

  test('getTokenPrice: valid token', async () => {
    const fetcher = new CoingeckoTokenPriceFetcher();

    const price = await fetcher.getTokenPrice({ token });

    expect(price).toBe(0.01550861);
  });

  test('getTokenPrice: error unsupported blockNumber', async () => {
    const fetcher = new CoingeckoTokenPriceFetcher();

    await expect(
      fetcher.getTokenPrice({
        token,
        blockNumber: 123456789n,
      }),
    ).rejects.toThrow();
  });

  test('getTokenPrice: error in request response', async () => {
    const mockResponse: Response = {
      ok: false,
      json: () => Promise.resolve({}),
    } as Response;

    globalThis.fetch = vi.fn(() => Promise.resolve(mockResponse));

    const fetcher = new CoingeckoTokenPriceFetcher();

    await expect(
      fetcher.getTokenPrice({
        token,
        blockNumber: 123456789n,
      }),
    ).rejects.toThrow();
  });
});
