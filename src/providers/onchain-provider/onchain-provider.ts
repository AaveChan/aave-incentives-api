import { Address, formatUnits } from 'viem';

import { getViemClient } from '@/clients/viem';
import { aTokenAbi } from '@/constants/abis';
import {
  AaveInstanceEntries,
  AaveInstanceName,
  AaveTokenType,
  getAaveToken,
  getAaveTokenAllData,
} from '@/lib/aave/aave-tokens';
import { BASE_TIMESTAMP, getCurrentTimestamp } from '@/lib/utils/timestamp';
import { TokenPriceFetcherService } from '@/services/token-price/token-price-fetcher-service';
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
  aIncentivesData,
  aTokenInfo,
  getUiIncentivesData,
  vIncentivesData,
  vTokenInfo,
} from './aave-incentives';

const INSTANCES_ENABLED: string[] = [
  'AaveV3Ethereum',
  'AaveV3Metis',
  // 'AaveV3Arbitrum',
  // 'AaveV3Base',
  // 'AaveV3Avalanche',
  // 'AaveV3Polygon',
];

// TODO: fetch all LM events to get all campaign (start and end timestamps) instead of only relying on the current incentives data (which only gives current emission data)

export class OnchainProvider implements IncentiveProvider {
  incentiveType = IncentiveType.ONCHAIN;
  rewardType = RewardType.TOKEN;
  source = IncentiveSource.ONCHAIN_RPC;
  claimLink = 'https://app.aave.com/?marketName=proto_mainnet_v3'; // TODO: remoe the end

  tokenPriceFetcherService: TokenPriceFetcherService;

  constructor() {
    this.tokenPriceFetcherService = new TokenPriceFetcherService();
  }

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const incentives = await this.fetchIncentives(fetchOptions);

    return incentives;
  }

  private async fetchIncentives(fetchOptions?: FetchOptions) {
    const allIncentives: Incentive[] = [];

    for (const [instanceName, aaveInstanceBook] of Object.entries(AaveInstanceEntries)) {
      const aaveInstanceName = instanceName as AaveInstanceName;
      // optimize fetching only for enabled instances
      if (!INSTANCES_ENABLED.includes(aaveInstanceName)) {
        continue;
      }

      if (fetchOptions?.chainId ? aaveInstanceBook.CHAIN_ID === fetchOptions?.chainId : true) {
        const chainId = aaveInstanceBook.CHAIN_ID;
        console.time(`test-${chainId}`);
        const incentivesData = await getUiIncentivesData(aaveInstanceBook, chainId);
        console.timeEnd(`test-${chainId}`);

        console.log('incentivesData');
        // console.log(incentivesData);
        console.log(incentivesData.length);

        // const uiPoolData = await getUiPoolData(aaveInstanceBook, chainId);

        for (const incentiveData of incentivesData) {
          // console.time(`${incentiveData.aIncentiveData.tokenAddress}--`);
          const aIncentives = await this.mapLmIncentiveToApiIncentive({
            aaveInstanceName,
            incentivesData: incentiveData.aIncentiveData,
            underlyingTokenAddress: incentiveData.underlyingAsset,
            type: AaveTokenType.A,
            chainId,
          });
          // console.timeEnd(`${incentiveData.aIncentiveData.tokenAddress}--`);

          allIncentives.push(...aIncentives);

          const vIncentives = await this.mapLmIncentiveToApiIncentive({
            aaveInstanceName,
            incentivesData: incentiveData.vIncentiveData,
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
    underlyingTokenAddress,
    type,
    chainId,
  }: {
    aaveInstanceName: AaveInstanceName;
    incentivesData: aIncentivesData | vIncentivesData;
    underlyingTokenAddress: Address;
    type: AaveTokenType.A | AaveTokenType.V;
    chainId: number;
  }) => {
    const allIncentives: Incentive[] = [];

    const tokenData = getAaveTokenAllData({
      tokenAddress: underlyingTokenAddress,
      chainId,
      instanceName: aaveInstanceName,
    });

    if (!tokenData || !tokenData.token || !tokenData.aaveTokenInfo) {
      throw new Error(
        `Rewarded token address not found for underlying token ${underlyingTokenAddress} on chain ${chainId}`,
      );
    }

    const { token: underlyingToken, aaveTokenInfo: underlyingTokenAaveInfo } = tokenData;

    const rewardedTokenAddress =
      type == AaveTokenType.A
        ? underlyingTokenAaveInfo.book.A_TOKEN
        : underlyingTokenAaveInfo.book.V_TOKEN;

    if (!rewardedTokenAddress) {
      return [];
    }

    const rewardedToken = getAaveToken({
      tokenAddress: rewardedTokenAddress,
      chainId,
      instanceName: aaveInstanceName,
    });

    if (!rewardedToken) {
      throw new Error(
        `Rewarded token not found for address ${rewardedTokenAddress} on chain ${chainId}`,
      );
    }

    const currentTimestamp = getCurrentTimestamp();

    // const rewardedTokenEmissionTimestamps: Map<
    //   Address,
    //   {
    //     emissionPerSecond: bigint;
    //     emissionEndTimestamp: bigint;
    //   }
    // > = new Map();

    if (incentivesData.rewardsTokenInformation.length > 0) {
      for (const rewardTokenInfo of incentivesData.rewardsTokenInformation) {
        // rewardedTokenEmissionTimestamps.set(rewardedToken.address, {
        //   emissionPerSecond: rewardTokenInfo.emissionPerSecond,
        //   emissionEndTimestamp: rewardTokenInfo.emissionEndTimestamp,
        // });

        if (rewardTokenInfo) {
          const status =
            rewardTokenInfo.emissionEndTimestamp > currentTimestamp ? Status.LIVE : Status.PAST;

          const rewardToken: Token = {
            name: rewardTokenInfo.rewardTokenSymbol, // TODO: fetch name onchain? or fetch the token from all aave tokens and if it's not part of it find it in a cache hardcoded in the project?
            symbol: rewardTokenInfo.rewardTokenSymbol,
            address: rewardTokenInfo.rewardTokenAddress,
            chainId,
            decimals: rewardTokenInfo.rewardTokenDecimals,
          };

          const { apr, currentCampaignConfig, allCampaignsConfigs } = await this.getCampaignConfigs(
            {
              chainId,
              status,
              rewardedToken,
              rewardToken,
              rewardTokenInfo,
            },
          );

          const reward: TokenReward = {
            type: RewardType.TOKEN,
            token: rewardToken,
            apr,
          };

          allIncentives.push({
            name: this.getIncentiveName(underlyingToken, type),
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

    // await this.getCampaignConfigs({
    //   chainId,
    //   allIncentives,
    //   rewardedTokenEmissionTimestamps,
    // });

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
    const client = getViemClient(chainId);

    let apr: number | undefined;
    if (status === Status.LIVE) {
      // const rewardedTokenAsssetPrice = getAaveAssetTokenPriceFromPoolData({
      //   aaveTokenAddress: rewardedTokenAddress,
      //   uiPoolData,
      // });

      const rewardedTokenPrice = await this.tokenPriceFetcherService.getTokenPrice({
        token: rewardedToken,
      });
      const rewardTokenPrice = await this.tokenPriceFetcherService.getTokenPrice({
        token: rewardToken,
      });

      // console.time(`test-total-supply-${chainId}`);
      console.time(`${rewardedToken.address}`);
      const rewardedTokenSupply = await client.readContract({
        address: rewardedToken.address,
        abi: aTokenAbi,
        functionName: 'totalSupply',
      });
      console.timeEnd(`${rewardedToken.address}`);
      // console.timeEnd(`test-total-supply-${chainId}`);

      const rewardedTokenSupplyFormatted = Number(
        formatUnits(rewardedTokenSupply, rewardedToken.decimals),
      );
      const rewardedTokenSupplyUSD = rewardedTokenSupplyFormatted * rewardedTokenPrice;

      const rewardPerYear = rewardTokenInfo.emissionPerSecond * 365n * 24n * 60n * 60n;
      const rewardPerYearFormatted = Number(formatUnits(rewardPerYear, rewardToken.decimals));
      const rewardPerYearUSD = rewardPerYearFormatted * rewardTokenPrice;

      apr = rewardPerYearUSD / rewardedTokenSupplyUSD;
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

  // private getCampaignConfigs = async ({
  //   chainId,
  //   allIncentives,
  //   rewardedTokenEmissionTimestamps,
  // }: {
  //   chainId: number;
  //   allIncentives: Incentive[];
  //   rewardedTokenEmissionTimestamps: Map<
  //     Address,
  //     {
  //       emissionPerSecond: bigint;
  //       emissionEndTimestamp: bigint;
  //     }
  //   >;
  // }) => {
  //   const allRewardedTokenAddresses = Array.from(rewardedTokenEmissionTimestamps.keys());

  //   const client = getViemClient(chainId);

  //   const calls = allRewardedTokenAddresses.map((rewardedTokenAddress) => ({
  //     address: rewardedTokenAddress,
  //     abi: aTokenAbi,
  //     functionName: 'totalSupply',
  //   }));

  //   const results = await client.multicall({
  //     contracts: calls,
  //   });

  //   const rewardedTokenSupplies: Map<Address, bigint> = new Map();
  //   results.forEach((result, index) => {
  //     const rewardedTokenAddress = allRewardedTokenAddresses[index];
  //     if (!rewardedTokenAddress) {
  //       throw new Error('Rewarded token address not found in multicall results mapping.');
  //     }
  //     const totalSupply = result.result as bigint | undefined;
  //     if (!totalSupply) {
  //       throw new Error(
  //         `No result for rewarded token address ${rewardedTokenAddress} in multicall results.`,
  //       );
  //     }
  //     rewardedTokenSupplies.set(rewardedTokenAddress, totalSupply);
  //   });

  //   for (const incentive of allIncentives) {
  //     const result = rewardedTokenEmissionTimestamps.get(incentive.rewardedToken.address);
  //     if (!result) {
  //       throw new Error(
  //         `Emission end timestamp not found for rewarded token address ${incentive.rewardedToken.address} on chain ${chainId}`,
  //       );
  //     }
  //     const { emissionPerSecond, emissionEndTimestamp } = result;

  //     const rewardedTokenAddress = incentive.rewardedToken.address;
  //     const tokenReward = incentive.reward as TokenReward;
  //     const rewardToken = tokenReward.token;

  //     let apr: number | undefined;
  //     if (incentive.status === Status.LIVE) {
  //       console.time(`test-total-supply-${chainId}`);
  //       const rewardedTokenSupply = rewardedTokenSupplies.get(rewardedTokenAddress);
  //       if (!rewardedTokenSupply) {
  //         throw new Error(
  //           `No total supply found for rewarded token address ${rewardedTokenAddress} on chain ${chainId}`,
  //         );
  //       }
  //       console.timeEnd(`test-total-supply-${chainId}`);

  //       const rewardedTokenSupplyFormatted = Number(
  //         formatUnits(rewardedTokenSupply, rewardToken.decimals),
  //       );

  //       const rewardPerYear = emissionPerSecond * 365n * 24n * 60n * 60n;
  //       const rewardPerYearFormatted = Number(formatUnits(rewardPerYear, rewardToken.decimals));
  //       apr = rewardPerYearFormatted / rewardedTokenSupplyFormatted;
  //     }

  //     const currentCampaignConfig: CampaignConfig = {
  //       startTimestamp: BASE_TIMESTAMP,
  //       endTimestamp: Number(emissionEndTimestamp),
  //       apr,
  //     };

  //     const reward = incentive.reward as TokenReward;
  //     reward.apr = apr;

  //     incentive.currentCampaignConfig = currentCampaignConfig;
  //     incentive.allCampaignsConfigs = [currentCampaignConfig];
  //   }
  // };

  // private getCampaignConfigs = async ({
  //   chainId,
  //   status,
  //   rewardedTokenAddress,
  //   rewardTokenInfo,
  // }: {
  //   chainId: number;
  //   status: Status;
  //   rewardedTokenAddress: Address;
  //   rewardTokenInfo: aTokenInfo | vTokenInfo;
  //   uiPoolData: UiPoolData;
  // }): Promise<{
  //   apr: number | undefined;
  //   currentCampaignConfig: CampaignConfig;
  //   allCampaignsConfigs: CampaignConfig[];
  // }> => {
  //   const client = getViemClient(chainId);

  //   let apr: number | undefined;
  //   if (status === Status.LIVE) {
  //     // const rewardedTokenAsssetPrice = getAaveAssetTokenPriceFromPoolData({
  //     //   aaveTokenAddress: rewardedTokenAddress,
  //     //   uiPoolData,
  //     // });

  //     const rewardedTokenAsssetPrice = await this.tokenPriceFetcherService.getTokenPrice();

  //     // console.time(`test-total-supply-${chainId}`);
  //     console.time(`${rewardedTokenAddress}`);
  //     const rewardedTokenSupply = await client.readContract({
  //       address: rewardedTokenAddress,
  //       abi: aTokenAbi,
  //       functionName: 'totalSupply',
  //     });
  //     console.timeEnd(`${rewardedTokenAddress}`);
  //     // console.timeEnd(`test-total-supply-${chainId}`);

  //     const rewardedTokenSupplyFormatted = Number(
  //       formatUnits(rewardedTokenSupply, rewardTokenInfo.rewardTokenDecimals),
  //     );
  //     const rewardedTokenSupplyUSD = rewardedTokenSupplyFormatted * rewardedTokenAsssetPrice;

  //     const rewardPerYear = rewardTokenInfo.emissionPerSecond * 365n * 24n * 60n * 60n;
  //     const rewardPerYearFormatted = Number(
  //       formatUnits(rewardPerYear, rewardTokenInfo.rewardTokenDecimals),
  //     );
  //     apr = rewardPerYearFormatted / rewardedTokenSupplyFormatted;
  //   }

  //   const currentCampaignConfig: CampaignConfig = {
  //     startTimestamp: BASE_TIMESTAMP, // TODO: use event to get it. In the meantime set a fixed date.
  //     endTimestamp: Number(rewardTokenInfo.emissionEndTimestamp),
  //     apr,
  //   };

  //   const allCampaignsConfigs = [currentCampaignConfig];
  //   return {
  //     apr,
  //     currentCampaignConfig,
  //     allCampaignsConfigs,
  //   };
  // };

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
