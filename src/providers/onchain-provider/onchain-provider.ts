import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  RewardType,
  Status,
  Token,
  TokenReward,
} from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import {
  AaveInstanceEntries,
  AaveTokenType,
  getAaveToken,
  getAaveTokenInfo,
} from '@/lib/aave/aave-tokens';
import {
  aIncentivesData,
  getUiIncentivesData,
  getUiPoolData,
  vIncentivesData,
} from './aave-incentives';
import { Address, formatUnits } from 'viem';
import { aTokenAbi } from '@/constants/abis';
import { getViemClient } from '@/clients/viem';
import { BASE_TIMESTAMP, getCurrentTimestamp } from '@/lib/utils/timestamp';

const INSTANCES_ENABLED: string[] = [
  'AaveV3Ethereum',
  'AaveV3Optimism',
  'AaveV3Arbitrum',
  'AaveV3Metis',
  'AaveV3Base',
  'AaveV3Avalanche',
  'AaveV3Polygon',
];

// TODO: fetch all LM events to get all campaign (start and end timestamps) instead of only relying on the current incentives data (which only gives current emission data)

export class OnchainProvider implements IncentiveProvider {
  incentiveType = IncentiveType.ONCHAIN;
  rewardType = RewardType.TOKEN;
  source = IncentiveSource.ONCHAIN_RPC;

  claimLink = 'https://app.aave.com/?marketName=proto_mainnet_v3';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const incentives = await this.fetchIncentives(fetchOptions);

    return incentives;
  }

  private async fetchIncentives(fetchOptions?: FetchOptions) {
    let allIncentives: Incentive[] = [];

    for (const [aaveInstanceName, aaveInstanceBook] of Object.entries(AaveInstanceEntries)) {
      // optimize fetching only for enabled instances
      if (!INSTANCES_ENABLED.includes(aaveInstanceName)) {
        continue;
      }

      if (fetchOptions?.chainId ? aaveInstanceBook.CHAIN_ID === fetchOptions?.chainId : true) {
        const chainId = aaveInstanceBook.CHAIN_ID;
        const incentivesData = await getUiIncentivesData(aaveInstanceBook, chainId);

        const uiPoolData = await getUiPoolData(aaveInstanceBook, chainId);
        const assetsData = uiPoolData[0];

        for (const incentiveData of incentivesData) {
          const asset = assetsData.find(
            (assetData) => assetData.underlyingAsset === incentiveData.underlyingAsset,
          );
          if (!asset) {
            throw new Error(`aToken not found for ${incentiveData.underlyingAsset}`);
          }

          const aIncentives = await this.mapLmIncentiveToApiIncentive({
            aaveInstanceName,
            incentivesData: incentiveData.aIncentiveData,
            underlyingTokenAddress: asset.underlyingAsset,
            type: AaveTokenType.A,
            chainId,
          });

          allIncentives.push(...aIncentives);

          const vIncentives = await this.mapLmIncentiveToApiIncentive({
            aaveInstanceName,
            incentivesData: incentiveData.vIncentiveData,
            underlyingTokenAddress: asset.underlyingAsset,
            type: AaveTokenType.V,
            chainId,
          });

          allIncentives.push(...vIncentives);
        }
      }
    }

    return allIncentives;
  }

  mapLmIncentiveToApiIncentive = async ({
    aaveInstanceName,
    incentivesData,
    underlyingTokenAddress,
    type,
    chainId,
  }: {
    aaveInstanceName: string;
    incentivesData: aIncentivesData | vIncentivesData;
    underlyingTokenAddress: Address;
    type: AaveTokenType.A | AaveTokenType.V;
    chainId: number;
  }) => {
    let allIncentives: Incentive[] = [];

    const client = getViemClient(chainId);

    const underlyingToken = getAaveToken(underlyingTokenAddress, chainId);
    const underlyingTokenAaveInfo = getAaveTokenInfo(underlyingTokenAddress, chainId);

    if (!underlyingToken || !underlyingTokenAaveInfo) {
      throw new Error(
        `Rewarded token address not found for underlying token ${underlyingTokenAddress} on chain ${chainId}`,
      );
    }

    const rewardedTokenAddress =
      type == AaveTokenType.A
        ? underlyingTokenAaveInfo.book.A_TOKEN
        : underlyingTokenAaveInfo.book.V_TOKEN;

    if (!rewardedTokenAddress) {
      return [];
    }

    const rewardedToken = getAaveToken(rewardedTokenAddress, chainId);

    if (!rewardedToken) {
      throw new Error(
        `Rewarded token not found for address ${rewardedTokenAddress} on chain ${chainId}`,
      );
    }

    console.log({
      underlying: underlyingToken.address,
      underlyingName: underlyingToken.symbol,
      address: rewardedTokenAddress,
      // abi: aTokenAbi,
      functionName: 'totalSupply',
    });

    const currentTimestamp = getCurrentTimestamp();

    if (incentivesData.rewardsTokenInformation.length > 0) {
      for (const rewardTokenInfo of incentivesData.rewardsTokenInformation) {
        if (rewardTokenInfo) {
          const status =
            rewardTokenInfo.emissionEndTimestamp > currentTimestamp ? Status.LIVE : Status.PAST;

          let apr: number | undefined;
          if (status === Status.LIVE) {
            const rewardedTokenSupply = await client.readContract({
              address: rewardedTokenAddress,
              abi: aTokenAbi,
              functionName: 'totalSupply',
            });
            const rewardedTokenSupplyFormatted = Number(
              formatUnits(rewardedTokenSupply, rewardTokenInfo.rewardTokenDecimals),
            );

            const rewardPerYear = rewardTokenInfo.emissionPerSecond * 365n * 24n * 60n * 60n;
            const rewardPerYearFormatted = Number(
              formatUnits(rewardPerYear, rewardTokenInfo.rewardTokenDecimals),
            );
            apr = rewardPerYearFormatted / rewardedTokenSupplyFormatted;
          }

          const currentCampaignConfig: CampaignConfig = {
            startTimestamp: BASE_TIMESTAMP, // TODO: use event to get it. In the meantime set a fixed date.
            endTimestamp: Number(rewardTokenInfo.emissionEndTimestamp),
            apr,
          };

          const allCampaignsConfigs = [currentCampaignConfig];

          const rewardToken: Token = {
            name: rewardTokenInfo.rewardTokenSymbol, // TODO: fetch name onchain? or fetch the token from all aave tokens and if it's not part of it find it in a cache hardcoded in the project?
            symbol: rewardTokenInfo.rewardTokenSymbol,
            address: rewardTokenInfo.rewardTokenAddress,
            chainId,
            decimals: rewardTokenInfo.rewardTokenDecimals,
          };
          const reward: TokenReward = {
            type: RewardType.TOKEN,
            token: rewardToken,
            apr,
          };

          console.log(rewardTokenInfo);

          allIncentives.push({
            name: this.getIncentiveName(underlyingToken, type, aaveInstanceName),
            description: this.getIncentiveDescription(
              underlyingToken,
              rewardToken,
              type,
              aaveInstanceName,
            ),
            claimLink: this.claimLink,
            chainId,
            rewardedToken,
            reward,
            currentCampaignConfig,
            allCampaignsConfigs,
            incentiveType: this.incentiveType,
            status,
          });
        }
      }
    }

    return allIncentives;
  };

  private getIncentiveName = (
    underlyingToken: Token,
    type: AaveTokenType,
    instanceName: string,
  ) => {
    const prefix = type === AaveTokenType.A ? 'Supply' : 'Borrow';
    const incentiveName = `${prefix} ${underlyingToken.symbol} on ${instanceName}`;
    return incentiveName;
  };

  private getIncentiveDescription = (
    underlyingToken: Token,
    rewardToken: Token,
    type: AaveTokenType,
    instanceName: string,
  ) => {
    const prefix = type === AaveTokenType.A ? 'Supply' : 'Borrow';
    const incentiveName = `${prefix} your ${underlyingToken.symbol} on ${instanceName} to start earning ${rewardToken.symbol} rewards.`;
    return incentiveName;
  };

  async isHealthy(): Promise<boolean> {
    try {
      const client = getViemClient(1);
      const blockNumber = await client.getBlockNumber();
      return blockNumber > 0 ? true : false;
    } catch {
      return false;
    }
  }
}
