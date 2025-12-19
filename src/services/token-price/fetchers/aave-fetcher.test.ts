import { AaveV3Ethereum } from '@bgd-labs/aave-address-book';
import { zeroAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { describe, expect, test } from 'vitest';

import { Token } from '@/types/index.js';

import { AaveTokenPriceFetcher } from './aave-fetcher.js';

describe('Aave Fetcher', () => {
  const fetcher = new AaveTokenPriceFetcher();

  test('getTokenPrice', async () => {
    const token: Token = {
      name: 'USDS',
      symbol: 'USDS',
      decimals: 18,
      address: AaveV3Ethereum.ASSETS.USDS.UNDERLYING,
      chainId: mainnet.id,
    };

    const price = await fetcher.getTokenPrice({ token });

    expect(price).toBeGreaterThanOrEqual(0.9);
    expect(price).toBeLessThanOrEqual(1.1);
  });

  test('getTokenPrice with blockNumber', async () => {
    const token: Token = {
      name: 'USDS',
      symbol: 'USDS',
      decimals: 18,
      address: AaveV3Ethereum.ASSETS.USDS.UNDERLYING,
      chainId: mainnet.id,
    };

    const price = await fetcher.getTokenPrice({ token, blockNumber: 24047535n });

    expect(price).toBeGreaterThanOrEqual(0.9);
    expect(price).toBeLessThanOrEqual(1.1);
  });

  test('getTokenPrice: not valid token', async () => {
    const token: Token = {
      name: 'test',
      symbol: 'test',
      decimals: 18,
      address: zeroAddress,
      chainId: mainnet.id,
    };

    const price = await fetcher.getTokenPrice({ token });

    expect(price).toBeNull();
  });
});
