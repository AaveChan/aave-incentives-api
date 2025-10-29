import { formatUnits } from 'viem';

import { getViemClient } from '@/clients/viem';
import { uiPoolDataProviderAbi } from '@/constants/abis';
import { getAaveInstancesBookByChainId } from '@/lib/aave/aave-tokens';
import { Token } from '@/types';

import { TokenPriceFetcherBase } from '../token-price-fetcher-base';

export class AaveTokenPriceFetcher extends TokenPriceFetcherBase {
  constructor() {
    super('Aave');
  }

  async getTokenPrice({ token, blockNumber }: { token: Token; blockNumber?: bigint }) {
    const client = getViemClient(token.chainId);

    const aaveInstances = getAaveInstancesBookByChainId(token.chainId);

    console.log(
      `Aave fetcher: found ${aaveInstances.length} instances for chainId ${token.chainId}`,
    );

    for (const aaveInstance of aaveInstances) {
      const poolDataProvider = aaveInstance.UI_POOL_DATA_PROVIDER;
      const poolAddressesProvider = aaveInstance.POOL_ADDRESSES_PROVIDER;

      const uiPoolData = await client.readContract({
        address: poolDataProvider,
        abi: uiPoolDataProviderAbi,
        functionName: 'getReservesData',
        args: [poolAddressesProvider],
        blockNumber,
      });
      const assetsData = uiPoolData[0];
      const marketData = uiPoolData[1];

      console.log(
        `Aave fetcher checking instance ${aaveInstance.CHAIN_ID} for token ${token.address} on chain ${token.chainId}`,
      );

      const assetData = assetsData.find(
        (data) =>
          data.underlyingAsset === token.address ||
          data.aTokenAddress === token.address ||
          data.variableDebtTokenAddress === token.address,
      );

      if (!assetData) {
        continue;
      }

      const assetsPriceUSD = Number(
        formatUnits(
          assetData.priceInMarketReferenceCurrency,
          marketData.networkBaseTokenPriceDecimals,
        ),
      );

      console.log(
        `Aave fetcher: Price found for token ${token.address} on chain ${token.chainId} in instance ${aaveInstance.CHAIN_ID}: $${assetsPriceUSD}`,
      );

      return assetsPriceUSD;
    }

    return null;
  }
}
