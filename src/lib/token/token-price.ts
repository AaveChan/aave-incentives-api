import { Address, formatUnits } from 'viem';

import { getViemClient } from '@/clients/viem';
import { uIPoolDataProviderABI } from '@/constants/abis';

import { AaveInstanceBook } from '../aave/aave-tokens';

// UI Pool Types
export type UiPoolData = Awaited<ReturnType<typeof getUiPoolData>>;
export type AssetsData = Awaited<ReturnType<typeof getUiPoolData>>[0];
export type MarketsData = Awaited<ReturnType<typeof getUiPoolData>>[1];

export const getAaveAssetTokenPriceFromPoolData = ({
  aaveTokenAddress,
  uiPoolData,
}: {
  aaveTokenAddress: Address;
  uiPoolData: UiPoolData;
}) => {
  const assetsData = uiPoolData[0];
  const marketData = uiPoolData[1];

  const assetData = findAssetData(assetsData, aaveTokenAddress);

  if (!assetData) {
    throw new Error(`asset data not found for ${aaveTokenAddress}`);
  }

  const assetsPriceUSD = Number(
    formatUnits(assetData.priceInMarketReferenceCurrency, marketData.networkBaseTokenPriceDecimals),
  );

  return assetsPriceUSD;
};

export const getUiPoolData = async (aaveInstanceBook: AaveInstanceBook, chainId: number) => {
  const client = getViemClient(chainId);
  return await client.readContract({
    address: aaveInstanceBook.UI_POOL_DATA_PROVIDER,
    abi: uIPoolDataProviderABI,
    functionName: 'getReservesData',
    args: [aaveInstanceBook.POOL_ADDRESSES_PROVIDER],
  });
};

const findAssetData = (assetData: AssetsData, asset: Address) => {
  return assetData.find(
    (data) =>
      data.underlyingAsset === asset ||
      data.aTokenAddress === asset ||
      data.variableDebtTokenAddress === asset,
  );
};
