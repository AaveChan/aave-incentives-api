import { mainnet } from 'viem/chains';

import { Token } from '@/types/index';

import { CoingeckoTokenPriceFetcher } from './coingecko-fetcher';

const token: Token = {
  name: 'Renzo',
  symbol: 'REZ',
  decimals: 18,
  address: '0x3b50805453023a91a8bf641e279401a0b23fa6f9',
  chainId: mainnet.id,
};

describe('Coingecko', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => {
          return Promise.resolve({
            '0x3b50805453023a91a8bf641e279401a0b23fa6f9': {
              usd: 0.01550861,
            },
          });
        },
      }),
    ) as jest.Mock;
  });

  test('getTokenPrice: valid token', async () => {
    const fetcher = new CoingeckoTokenPriceFetcher();

    const price = await fetcher.getTokenPrice({
      token,
    });

    expect(price).toBe(0.01550861);
  });

  test('getTokenPrice: error unsupported blockNumber', async () => {
    const fetcher = new CoingeckoTokenPriceFetcher();

    await expect(async () => {
      await fetcher.getTokenPrice({
        token,
        blockNumber: 123456789n,
      });
    }).rejects.toThrow();
  });

  test('getTokenPrice: error in request response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => {
          return Promise.resolve({});
        },
      }),
    ) as jest.Mock;

    const fetcher = new CoingeckoTokenPriceFetcher();

    await expect(async () => {
      await fetcher.getTokenPrice({
        token,
        blockNumber: 123456789n,
      });
    }).rejects.toThrow();
  });
});
