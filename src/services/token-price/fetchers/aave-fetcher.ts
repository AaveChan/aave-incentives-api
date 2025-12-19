import { formatUnits } from 'viem';

import { getViemClient } from '@/clients/viem.js';
import { createLogger } from '@/config/logger.js';
import { uiPoolDataProviderAbi } from '@/constants/abis/index.js';
import { getAaveInstancesBookByChainId } from '@/lib/aave/aave-tokens.js';
import { Token } from '@/types/index.js';

import { TokenPriceFetcherBase } from '../token-price-fetcher-base.js';

export class AaveTokenPriceFetcher extends TokenPriceFetcherBase {
  logger = createLogger('AaveTokenPriceFetcher');

  constructor() {
    super('Aave');
  }

  async getTokenPrice({ token, blockNumber }: { token: Token; blockNumber?: bigint }) {
    const client = getViemClient(token.chainId);

    const aaveInstances = getAaveInstancesBookByChainId(token.chainId);

    for (const aaveInstance of aaveInstances) {
      const poolDataProvider = aaveInstance.UI_POOL_DATA_PROVIDER;
      const poolAddressesProvider = aaveInstance.POOL_ADDRESSES_PROVIDER;

      let uiPoolData;
      try {
        uiPoolData = await client.readContract({
          address: poolDataProvider,
          abi: uiPoolDataProviderAbi,
          functionName: 'getReservesData',
          args: [poolAddressesProvider],
          blockNumber,
        });
      } catch (e) {
        this.logger.error('Failed to read contract data, continuing to next instance');
        this.logger.error(e);
        continue;
      }

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

      return assetsPriceUSD;
    }

    return null;
  }
}
