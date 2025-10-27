import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  RewardType,
  Token,
  TokenReward,
} from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import {
  Campaign,
  MerklOpportunityWithCampaign,
  RewardTokenType as MerklRewardTokenType,
} from './types';
import { AaveTokenType, getAaveToken, getAaveTokenInfo } from '@/lib/aave/aave-tokens';
import { getCurrentTimestamp } from '@/lib/utils/timestamp';
import { ink } from 'viem/chains';

type MerklApiOptions = {
  chainId?: number;
  mainProtocolId?: string;
  status?: string;
};

export type MainProtocolId = (typeof MainProtocolId)[keyof typeof MainProtocolId];

export const MainProtocolId = {
  AAVE: 'aave',
  TYDRO: 'tydro',
} as const;

const chainProtocolMap: Record<number, MainProtocolId> = {
  [ink.id]: MainProtocolId.TYDRO,
  // Add more chain-specific protocols here
  // [OTHER_CHAIN_ID]: MainProtocolId.OTHER,
};

// Default protocol for all other chains
const DEFAULT_PROTOCOL = MainProtocolId.AAVE;

// TODO:
// - do we make also a whitelist of supported tokens (even if Merkl already have a whitelist system) => nice but need to whitelist every provider. Maybe we can just trust Merkl on this.
// - do we display the wrapper token or do we show the underlying (eg: for aEthPYUSDWrapped, do we show aEthPYUSD or the wrapped version)? => for now we just show the wrapper token (default)
// - how can we differentiate a token point reward from a token reward
// - filter by instance too? (in addition to the chainId)

export class MerklProvider implements IncentiveProvider {
  incentiveType = IncentiveType.OFFCHAIN;
  source = IncentiveSource.MERKL_API;

  apiUrl = 'https://api.merkl.xyz/v4/opportunities/campaigns';
  claimLink = 'https://app.merkl.xyz/';
  unknown = 'UNKNOWN';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    let allIncentives: Incentive[] = [];

    const chainId = fetchOptions?.chainId;

    // Determine which protocol to use for this chain
    const protocolId =
      chainId && chainProtocolMap[chainId] ? chainProtocolMap[chainId] : DEFAULT_PROTOCOL;

    const merklOpportunities = await this.fetchIncentives(protocolId, fetchOptions);

    for (const opportunity of merklOpportunities) {
      const rewardMerklToken = opportunity.rewardsRecord.breakdowns[0]?.token;

      const rewardedTokenAddress = opportunity.explorerAddress;

      if (!rewardMerklToken || !rewardedTokenAddress) {
        continue;
      }

      // Skip STATA tokens
      const tokenInfo = getAaveTokenInfo(rewardedTokenAddress, opportunity.chainId);
      if (tokenInfo?.type === AaveTokenType.STATA) {
        continue;
      }

      const rewardToken: Token = {
        name: rewardMerklToken.name,
        address: rewardMerklToken.address,
        symbol: rewardMerklToken.symbol,
        decimals: rewardMerklToken.decimals,
        chainId: opportunity.chainId,
      };

      let rewardedTokenName: string | undefined;
      let rewardedTokenSymbol: string | undefined;
      let rewardedTokenDecimals: number | undefined;

      if (
        rewardMerklToken.address.toLowerCase() === rewardedTokenAddress.toLowerCase() &&
        rewardMerklToken.chainId === opportunity.chainId
      ) {
        rewardedTokenSymbol = rewardMerklToken.symbol;
        rewardedTokenDecimals = rewardMerklToken.decimals;
        rewardedTokenName = rewardMerklToken.name;
      } else {
        const rewardedToken = getAaveToken(rewardedTokenAddress, opportunity.chainId);

        if (rewardedToken) {
          rewardedTokenName = rewardedToken.name;
          rewardedTokenSymbol = rewardedToken.symbol;
          rewardedTokenDecimals = rewardedToken.decimals;
        } else {
          console.warn(
            `Rewarded token not found for address ${rewardedTokenAddress} on chain ${opportunity.chainId}`,
          );
          // fetch onchain => quite slow
          // const client = getViemClient(opportunity.chainId);
          // const data = await client.multicall({
          //   contracts: [
          //     {
          //       address: rewardedTokenAddress,
          //       abi: erc20Abi,
          //       functionName: 'name',
          //     },
          //     {
          //       address: rewardedTokenAddress,
          //       abi: erc20Abi,
          //       functionName: 'symbol',
          //     },
          //     {
          //       address: rewardedTokenAddress,
          //       abi: erc20Abi,
          //       functionName: 'decimals',
          //     },
          //   ],
          // });
          // const [nameRes, symbolRes, decimalsRes] = data;
          // rewardedTokenName = nameRes.result ?? 'UNKNOWN';
          // rewardedTokenSymbol = symbolRes.result ?? 'UNKNOWN';
          // rewardedTokenDecimals = decimalsRes.result ?? 18;

          rewardedTokenName = this.unknown;
          rewardedTokenSymbol = this.unknown;
          rewardedTokenDecimals = 18;
        }
      }

      const merklRewardType = opportunity.rewardsRecord.breakdowns[0]?.token.type;
      const rewardType = merklRewardType ? this.mapRewardType(merklRewardType) : RewardType.UNKNOWN;

      const rewardedToken: Token = {
        name: rewardedTokenName,
        address: rewardedTokenAddress,
        symbol: rewardedTokenSymbol,
        decimals: rewardedTokenDecimals,
        chainId: opportunity.chainId,
      };

      const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
        this.getCampaignConfigs(opportunity.campaigns);

      const tokenReward: TokenReward = {
        type: rewardType,
        token: rewardToken,
        apr: opportunity.apr,
      };

      allIncentives.push({
        name: opportunity.name,
        description: opportunity.description,
        claimLink: this.claimLink,
        chainId: opportunity.chainId,
        rewardedToken,
        reward: tokenReward,
        currentCampaignConfig,
        nextCampaignConfig,
        allCampaignsConfigs,
        incentiveType: this.incentiveType,
        status: opportunity.status,
      });
    }

    console.log(`Total Merkl incentives before filtering: ${allIncentives.length}`);

    console.log(fetchOptions);

    // filtering again
    allIncentives = allIncentives.filter((i) => (chainId ? i.chainId === chainId : true));
    allIncentives = allIncentives.filter((i) =>
      fetchOptions?.status ? i.status === fetchOptions.status : true,
    );

    console.log('Merkl incentives:', allIncentives.length);

    return allIncentives;
  }

  private async fetchIncentives(
    mainProtocolId: MainProtocolId,
    fetchOptions?: FetchOptions,
  ): Promise<MerklOpportunityWithCampaign[]> {
    const url = new URL(this.apiUrl);

    const merklApiOptions: MerklApiOptions = {
      chainId: fetchOptions?.chainId,
      status: fetchOptions?.status,
      mainProtocolId: mainProtocolId,
    };
    for (const [key, value] of Object.entries(merklApiOptions)) {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    }

    const allMerklOpportunities: MerklOpportunityWithCampaign[] = [];

    let merklOpportunities: MerklOpportunityWithCampaign[] = [];
    const itemsPerPage = 100;
    url.searchParams.set('items', itemsPerPage.toString());
    let page = 0;

    do {
      url.searchParams.set('page', page.toString());
      const response = await fetch(url.toString());
      merklOpportunities = (await response.json()) as MerklOpportunityWithCampaign[];

      allMerklOpportunities.push(...merklOpportunities);
      page++;
    } while (merklOpportunities.length > 0);

    return allMerklOpportunities;
  }

  private getCampaignConfigs = (campaigns: Campaign[]) => {
    let currentCampaignConfig: CampaignConfig | undefined;
    let nextCampaignConfig: CampaignConfig | undefined;

    const currentTimestamp = getCurrentTimestamp();
    const currentCampaign = campaigns.filter(
      (campaign) =>
        Number(campaign.startTimestamp) <= currentTimestamp &&
        Number(campaign.endTimestamp) >= currentTimestamp,
    )[0];
    if (currentCampaign) {
      currentCampaignConfig = this.getCampaignConfig(currentCampaign);
    }

    const nextCampaign = campaigns.filter(
      (campaign) =>
        Number(campaign.startTimestamp) > currentTimestamp &&
        Number(campaign.endTimestamp) > currentTimestamp,
    )[0];
    if (nextCampaign) {
      nextCampaignConfig = this.getCampaignConfig(nextCampaign);
    }

    const allCampaignsConfigs = campaigns.map((campaign) => this.getCampaignConfig(campaign));

    return { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs };
  };

  private getCampaignConfig = (campaign: Campaign) => {
    const aprSetup = campaign.params.distributionMethodParameters?.distributionSettings.apr;

    let apr;
    if (aprSetup) {
      apr = Number(aprSetup) * 100;
    }

    const currentCampaignForOpportunity: CampaignConfig = {
      startTimestamp: Number(campaign.startTimestamp),
      endTimestamp: Number(campaign.endTimestamp),
      budget: campaign.amount,
      apr,
    };

    return currentCampaignForOpportunity;
  };

  private mapRewardType(type: MerklRewardTokenType) {
    switch (type) {
      case MerklRewardTokenType.TOKEN:
        return RewardType.TOKEN;
      case MerklRewardTokenType.PRETGE:
        return RewardType.POINTS;
      default:
        return RewardType.UNKNOWN;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
