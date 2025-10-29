import { formatUnits } from 'viem';

import { getViemClient } from '@/clients/viem';
import { createLogger } from '@/config/logger';
import { uiPoolDataProviderAbi } from '@/constants/abis';
import { getAaveInstancesBookByChainId } from '@/lib/aave/aave-tokens';
import { Token } from '@/types';

import { TokenPriceFetcherBase } from '../token-price-fetcher-base';

export class AaveTokenPriceFetcher extends TokenPriceFetcherBase {
  private logger = createLogger('IncentiveService');

  constructor() {
    super('Aave');
  }

  async getTokenPrice({ token, blockNumber }: { token: Token; blockNumber?: bigint }) {
    const client = getViemClient(token.chainId);

    const aaveInstances = getAaveInstancesBookByChainId(token.chainId);

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

      this.logger.info(
        `Aave fetcher: Price found for token ${token.address} on chain ${token.chainId}: $${assetsPriceUSD}`,
      );

      return assetsPriceUSD;
    }

    return null;
  }
}
