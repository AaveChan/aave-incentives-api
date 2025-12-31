import { AaveV3Ethereum } from '@bgd-labs/aave-address-book';
import { Address, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

import { HTTP_CONFIG } from '@/config/http.js';
import { createLogger } from '@/config/logger.js';
import { aaveInstanceEntries } from '@/lib/aave/aave-instances.js';
import { AaveInstanceName, AaveTokenType, getAaveToken } from '@/lib/aave/aave-tokens.js';
import { BASE_TIMESTAMP, getCurrentTimestamp } from '@/lib/utils/timestamp.js';
import {
  AaveUiIncentiveService,
  aIncentivesData,
  aTokenInfo,
  vIncentivesData,
  vTokenInfo,
} from '@/services/aave-ui-incentive.service.js';
import { ERC20Service } from '@/services/erc20.service.js';
import { TokenPriceFetcherService } from '@/services/token-price/token-price-fetcher.service.js';
import {
  CampaignConfig,
  IncentiveSource,
  IncentiveType,
  ProviderName,
  RawIncentive,
  RawTokenIncentive,
  Status,
  Token,
} from '@/types/index.js';

import { BaseIncentiveProvider } from '../base.provider.js';
import { FetchOptions } from '../index.js';

const INSTANCES_ENABLED: string[] = [
  'AaveV3Ethereum',
  'AaveV3Metis',
  // 'AaveV3Arbitrum',
  // 'AaveV3Base',
  // 'AaveV3Avalanche',
  // 'AaveV3Polygon',
];

// TODO: fetch all LM events to get all campaign (start and end timestamps) instead of only relying on the current incentives data (which only gives current emission data)

export class OnchainProvider extends BaseIncentiveProvider {
  name = ProviderName.Onchain;
  incentiveSource = IncentiveSource.ONCHAIN_RPC;
  incentiveType = IncentiveType.TOKEN as const;
  claimLink = 'https://app.aave.com/';

  private logger = createLogger(this.name);

  tokenPriceFetcherService = new TokenPriceFetcherService();
  erc20Service = new ERC20Service();
  aaveUIIncentiveService = new AaveUiIncentiveService();

  async _getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]> {
    const incentives = await this.fetchIncentives(fetchOptions);

    return incentives;
  }

  getCacheKey(fetchOptions?: FetchOptions): string {
    return `provider:${this.name}:${fetchOptions?.chainId?.join(',') ?? 'all'}`;
  }

  private async fetchIncentives(fetchOptions?: FetchOptions) {
    const allIncentives: RawIncentive[] = [];

    for (const [instanceName, aaveInstanceBook] of Object.entries(aaveInstanceEntries)) {
      const aaveInstanceName = instanceName as AaveInstanceName;
      // optimize fetching only for enabled instances
      if (!INSTANCES_ENABLED.includes(aaveInstanceName)) {
        continue;
      }

      if (fetchOptions?.chainId ? fetchOptions.chainId.includes(aaveInstanceBook.CHAIN_ID) : true) {
        const chainId = aaveInstanceBook.CHAIN_ID;
        // console.time(`getUiIncentivesData-${chainId}`);
        const incentivesData = await this.aaveUIIncentiveService.getUiIncentivesData(
          aaveInstanceBook,
          chainId,
        );
        // console.timeEnd(`getUiIncentivesData-${chainId}`);

        for (const incentiveData of incentivesData) {
          const aIncentives = await this.mapLmIncentiveToApiIncentive({
            aaveInstanceName,
            incentivesData: incentiveData.aIncentiveData,
            rewardedTokenAddress: incentiveData.aIncentiveData.tokenAddress,
            underlyingTokenAddress: incentiveData.underlyingAsset,
            type: AaveTokenType.A,
            chainId,
          });

          allIncentives.push(...aIncentives);

          const vIncentives = await this.mapLmIncentiveToApiIncentive({
            aaveInstanceName,
            incentivesData: incentiveData.vIncentiveData,
            rewardedTokenAddress: incentiveData.vIncentiveData.tokenAddress,
            underlyingTokenAddress: incentiveData.underlyingAsset,
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
    rewardedTokenAddress,
    underlyingTokenAddress,
    type,
    chainId,
  }: {
    aaveInstanceName: AaveInstanceName;
    incentivesData: aIncentivesData | vIncentivesData;
    rewardedTokenAddress: Address;
    underlyingTokenAddress: Address;
    type: AaveTokenType.A | AaveTokenType.V;
    chainId: number;
  }) => {
    const allIncentives: RawIncentive[] = [];

    if (incentivesData.rewardsTokenInformation.length <= 0) {
      return allIncentives;
    }

    const rewardedToken = getAaveToken({
      tokenAddress: rewardedTokenAddress,
      chainId,
    });

    const underlyingToken = getAaveToken({
      tokenAddress: underlyingTokenAddress,
      chainId,
    });

    if (!rewardedToken || !underlyingToken) {
      this.logger.error(
        `Rewarded token address not found for token ${rewardedTokenAddress} on chain ${chainId}. Maybe update the aave-address-book package?`,
      );
      return allIncentives;
    }

    const currentTimestamp = getCurrentTimestamp();

    for (const rewardTokenInfo of incentivesData.rewardsTokenInformation) {
      if (rewardTokenInfo) {
        const status =
          rewardTokenInfo.emissionEndTimestamp > currentTimestamp ? Status.LIVE : Status.PAST;

        const priceFormatted = Number(
          formatUnits(rewardTokenInfo.rewardPriceFeed, rewardTokenInfo.priceFeedDecimals),
        );

        const rewardToken: Token = {
          name: rewardTokenInfo.rewardTokenSymbol, // TODO: fetch name onchain? or fetch the token from all aave tokens and if it's not part of it find it in a cache hardcoded in the project?
          symbol: rewardTokenInfo.rewardTokenSymbol,
          address: rewardTokenInfo.rewardTokenAddress,
          chainId,
          decimals: rewardTokenInfo.rewardTokenDecimals,
          priceFeed: rewardTokenInfo.rewardOracleAddress,
          price: priceFormatted,
        };

        const { apr, currentCampaignConfig, allCampaignsConfigs } = await this.getCampaignConfigs({
          chainId,
          status,
          rewardedToken,
          rewardToken,
          rewardTokenInfo,
        });

        // console.log(
        //   `Generated incentive ID: ${id} for rewardedToken ${rewardedToken.address} and rewardToken ${rewardToken.address} on chain ${chainId}`,
        // );

        const incentive: RawTokenIncentive = {
          name: this.getIncentiveName(underlyingToken, type),
          description: this.getIncentiveDescription(
            underlyingToken,
            rewardToken,
            type,
            aaveInstanceName,
          ),
          claimLink: this.claimLink,
          chainId,
          source: this.incentiveSource,
          type: this.incentiveType,
          rewardedToken,
          involvedTokens: [rewardedToken],
          rewardToken,
          currentApr: apr,
          currentCampaignConfig,
          allCampaignsConfigs,
          status,
        };

        allIncentives.push(incentive);
      }
    }

    return allIncentives;
  };

  private getCampaignConfigs = async ({
    chainId,
    status,
    rewardedToken,
    rewardToken,
    rewardTokenInfo,
  }: {
    chainId: number;
    status: Status;
    rewardedToken: Token;
    rewardToken: Token;
    rewardTokenInfo: aTokenInfo | vTokenInfo;
  }): Promise<{
    apr: number | undefined;
    currentCampaignConfig: CampaignConfig;
    allCampaignsConfigs: CampaignConfig[];
  }> => {
    let apr: number | undefined;
    if (status === Status.LIVE) {
      // console.time(`2-getTokenPrice-${rewardedToken.address}-${rewardToken.address}`);
      const rewardedTokenPrice = await this.tokenPriceFetcherService.getTokenPrice({
        token: rewardedToken,
      });
      const rewardTokenPrice = await this.tokenPriceFetcherService.getTokenPrice({
        token: rewardToken,
      });
      // console.timeEnd(`2-getTokenPrice-${rewardedToken.address}-${rewardToken.address}`);

      if (!rewardedTokenPrice || !rewardTokenPrice) {
        apr = 0;
      } else {
        // console.time(`getTotalSupply-${rewardedToken.address}`);
        const rewardedTokenSupply = await this.erc20Service.getTotalSupply({
          chainId,
          tokenAddress: rewardedToken.address,
        });
        // console.timeEnd(`getTotalSupply-${rewardedToken.address}`);

        const rewardedTokenSupplyFormatted = Number(
          formatUnits(rewardedTokenSupply, rewardedToken.decimals),
        );
        const rewardedTokenSupplyUSD = rewardedTokenSupplyFormatted * rewardedTokenPrice;

        const rewardPerYear = rewardTokenInfo.emissionPerSecond * 365n * 24n * 60n * 60n;
        const rewardPerYearFormatted = Number(formatUnits(rewardPerYear, rewardToken.decimals));
        const rewardPerYearUSD = rewardPerYearFormatted * rewardTokenPrice;

        apr = (rewardPerYearUSD / rewardedTokenSupplyUSD) * 100;
      }
    }

    const currentCampaignConfig: CampaignConfig = {
      startTimestamp: BASE_TIMESTAMP, // TODO: use event to get it. In the meantime set a fixed date.
      endTimestamp: Number(rewardTokenInfo.emissionEndTimestamp),
      apr,
    };

    const allCampaignsConfigs = [currentCampaignConfig];
    return {
      apr,
      currentCampaignConfig,
      allCampaignsConfigs,
    };
  };

  private getIncentiveName = (underlyingToken: Token, type: AaveTokenType) => {
    const prefix = type === AaveTokenType.A ? 'Supply' : 'Borrow';
    const incentiveName = `${prefix} ${underlyingToken.symbol}`;
    return incentiveName;
  };

  private getIncentiveDescription = (
    underlyingToken: Token,
    rewardToken: Token,
    type: AaveTokenType,
    instanceName: string,
  ) => {
    const prefix = type === AaveTokenType.A ? 'Supply' : 'Borrow';
    const incentiveName = `${prefix} ${underlyingToken.symbol} on ${instanceName} to start earning ${rewardToken.symbol} rewards.`;
    return incentiveName;
  };

  async isHealthy(): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), HTTP_CONFIG.HEALTH_CHECK_TIMEOUT_MS),
      );

      const incentivesData = await Promise.race([
        this.aaveUIIncentiveService.getUiIncentivesData(AaveV3Ethereum, mainnet.id),
        timeoutPromise,
      ]);

      return incentivesData.length > 0;
    } catch {
      return false;
    }
  }
}
