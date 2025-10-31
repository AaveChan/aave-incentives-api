import { ink } from 'viem/chains';

import { createLogger } from '@/config/logger';
import { ACI_ADDRESSES } from '@/constants/aci-addresses';
import { AaveTokenType, getAaveToken, getAaveTokenInfo } from '@/lib/aave/aave-tokens';
import { tokenToString } from '@/lib/token/token';
import { getCurrentTimestamp } from '@/lib/utils/timestamp';
import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  Reward,
  RewardType,
  Token,
} from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import {
  Campaign,
  MerklOpportunityWithCampaign,
  RewardTokenType as MerklRewardTokenType,
} from './types';

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

const WHITELISTED_CREATORS = [...ACI_ADDRESSES];
export class MerklProvider implements IncentiveProvider {
  private logger = createLogger('MerklProvider');
  incentiveType = IncentiveType.OFFCHAIN;
  source = IncentiveSource.MERKL_API;

  apiUrl = 'https://api.merkl.xyz/v4/opportunities/campaigns';
  claimLink = 'https://app.merkl.xyz/';
  unknown = 'UNKNOWN';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

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
        const rewardedToken = getAaveToken({
          tokenAddress: rewardedTokenAddress,
          chainId: opportunity.chainId,
        });

        if (rewardedToken) {
          rewardedTokenName = rewardedToken.name;
          rewardedTokenSymbol = rewardedToken.symbol;
          rewardedTokenDecimals = rewardedToken.decimals;
        } else {
          this.logger.error(
            `Aave rewarded token not found for address ${rewardedTokenAddress} on chain ${opportunity.chainId}`,
          );

          rewardedTokenName = this.unknown;
          rewardedTokenSymbol = this.unknown;
          rewardedTokenDecimals = 18;
        }
      }

      const merklRewardType = opportunity.rewardsRecord.breakdowns[0]?.token.type;
      const rewardType = merklRewardType ? this.mapRewardType(merklRewardType) : null;

      if (!rewardType) {
        this.logger.error(`Unknown reward type for token ${tokenToString(rewardToken)}`);
        continue;
      }

      const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
        this.getCampaignConfigs(opportunity.campaigns);

      let tokenReward: Reward | undefined;
      if (rewardType == RewardType.POINT) {
        tokenReward = {
          type: rewardType,
          point: {
            name: rewardedToken.name,
            protocol: protocolId,
          },
        };
      }
      if (rewardType == RewardType.TOKEN) {
        tokenReward = {
        type: rewardType,
        token: rewardToken,
        apr: opportunity.apr,
      };
      }

      if (!tokenReward) {
        this.logger.error(`Failed to map reward for opportunity ${opportunity.name}`);
        continue;
      }

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

    let allMerklOpportunities: MerklOpportunityWithCampaign[] = [];

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

    // Filter campaigns to only include whitelisted creators
    allMerklOpportunities.forEach(
      (opportunity) =>
        (opportunity.campaigns = opportunity.campaigns.filter((campaign) =>
          WHITELISTED_CREATORS.includes(campaign.creatorAddress),
        )),
    );
    allMerklOpportunities = allMerklOpportunities.filter(
      (opportunity) => opportunity.campaigns.length > 0,
    );

    allMerklOpportunities = allMerklOpportunities.filter((opportunity) => {
      const rewardedTokenAddress = opportunity.explorerAddress;
      if (!rewardedTokenAddress) {
        return false;
      } else {
        const aaveTokenInfo = getAaveTokenInfo({
          tokenAddress: rewardedTokenAddress,
          chainId: opportunity.chainId,
        });
        if (!aaveTokenInfo?.type || aaveTokenInfo.type === AaveTokenType.STATA) {
          return false;
        }
      }
      return true;
    });

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
        return RewardType.POINT;
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
