import { getViemClient } from '@/clients/viem.js';
import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { uiIncentiveDataProviderAbi, uiPoolDataProviderAbi } from '@/constants/abis/index.js';
import { aaveInstanceEntries } from '@/lib/aave/aave-instances.js';
import { AaveInstanceBook } from '@/lib/aave/aave-tokens.js';
import { withCache } from '@/lib/utils/cache.js';

// UI Incentives Types
type IncentivesData = Awaited<ReturnType<AaveUiIncentiveService['getUiIncentivesData']>>;
export type aIncentivesData = IncentivesData[number]['aIncentiveData'];
export type aTokenInfo = aIncentivesData['rewardsTokenInformation'][number];
export type vIncentivesData = Awaited<
  ReturnType<AaveUiIncentiveService['getUiIncentivesData']>
>[number]['vIncentiveData'];
export type vTokenInfo = vIncentivesData['rewardsTokenInformation'][number];

// UI Pool Types
// type AssetsData = Awaited<ReturnType<typeof getUiPoolData>>[0];
// type AssetData = AssetsData[number];
// type MarketsData = Awaited<ReturnType<typeof getUiPoolData>>[1];

export class AaveUiIncentiveService {
  getUiIncentivesDataByChainId = async (chainId: number) => {
    const allIncentives: IncentivesData[] = [];
    Object.entries(aaveInstanceEntries).forEach(async ([, aaveInstanceBook]) => {
      if (aaveInstanceBook.CHAIN_ID === chainId) {
        const incentives = await this.getUiIncentivesData(aaveInstanceBook, chainId);
        allIncentives.push(incentives);
      }
    });
    return allIncentives;
  };

  _getUiIncentivesData = async (aaveInstanceBook: AaveInstanceBook, chainId: number) => {
    const client = getViemClient(chainId);
    const pool_provider = aaveInstanceBook.POOL_ADDRESSES_PROVIDER;
    const uiIncentiveDataProvider = aaveInstanceBook.UI_INCENTIVE_DATA_PROVIDER;
    return await client.readContract({
      address: uiIncentiveDataProvider,
      functionName: 'getReservesIncentivesData',
      abi: uiIncentiveDataProviderAbi,
      args: [pool_provider],
    });
  };

  getUiIncentivesData = withCache(
    this._getUiIncentivesData.bind(this),
    (aaveInstanceBook, chainId) =>
      `uiIncentivesData:${chainId}:${aaveInstanceBook.POOL_ADDRESSES_PROVIDER}`,
    CACHE_TTLS.UI_INCENTIVES,
  );

  getUiPoolData = async (aaveInstanceBook: AaveInstanceBook, chainId: number) => {
    const client = getViemClient(chainId);
    return await client.readContract({
      address: aaveInstanceBook.UI_POOL_DATA_PROVIDER,
      abi: uiPoolDataProviderAbi,
      functionName: 'getReservesData',
      args: [aaveInstanceBook.POOL_ADDRESSES_PROVIDER],
    });
  };
}
