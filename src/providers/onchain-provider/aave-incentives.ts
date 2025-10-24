import { getViemClient } from '@/clients/viem';
import { uiIncentiveDataProviderAbi, uiPoolDataProviderAbi } from '@/constants/abis';
import { AaveInstanceBook, AaveInstanceEntries } from '@/lib/aave/aave-tokens';

// UI Incentives Types
type IncentivesData = Awaited<ReturnType<typeof getUiIncentivesData>>;
export type aIncentivesData = IncentivesData[number]['aIncentiveData'];
// type aTokenInfo = aIncentivesData['rewardsTokenInformation'][number];
export type vIncentivesData = Awaited<
  ReturnType<typeof getUiIncentivesData>
>[number]['vIncentiveData'];
// type vTokenInfo = vIncentivesData['rewardsTokenInformation'][number];

// UI Pool Types
// type AssetsData = Awaited<ReturnType<typeof getUiPoolData>>[0];
// type AssetData = AssetsData[number];
// type MarketsData = Awaited<ReturnType<typeof getUiPoolData>>[1];

export const getUiIncentivesDataByChainId = async (chainId: number) => {
  const allIncentives: IncentivesData[] = [];
  Object.entries(AaveInstanceEntries).forEach(async ([, aaveInstanceBook]) => {
    if (aaveInstanceBook.CHAIN_ID === chainId) {
      const incentives = await getUiIncentivesData(aaveInstanceBook, chainId);
      allIncentives.push(incentives);
    }
  });
  return allIncentives;
};

export const getUiIncentivesData = async (aaveInstanceBook: AaveInstanceBook, chainId: number) => {
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

export const getUiPoolData = async (aaveInstanceBook: AaveInstanceBook, chainId: number) => {
  const client = getViemClient(chainId);
  return await client.readContract({
    address: aaveInstanceBook.UI_POOL_DATA_PROVIDER,
    abi: uiPoolDataProviderAbi,
    functionName: 'getReservesData',
    args: [aaveInstanceBook.POOL_ADDRESSES_PROVIDER],
  });
};
