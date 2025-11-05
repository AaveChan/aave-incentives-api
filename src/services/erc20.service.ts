import { Address, erc20Abi } from 'viem';

import { getViemClient } from '@/clients/viem.js';
import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { withCache } from '@/lib/utils/cache.js';

export class ERC20Service {
  getTotalSupply = withCache(
    this._getTotalSupply.bind(this),
    ({ chainId, tokenAddress }) => `totalSupply:${chainId}:${tokenAddress.toLowerCase()}`,
    CACHE_TTLS.TOTAL_SUPPLY,
  );

  private async _getTotalSupply({
    chainId,
    tokenAddress,
  }: {
    chainId: number;
    tokenAddress: Address;
  }) {
    const client = getViemClient(chainId);

    const totalSupply: bigint = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'totalSupply',
    });

    return totalSupply;
  }
}
