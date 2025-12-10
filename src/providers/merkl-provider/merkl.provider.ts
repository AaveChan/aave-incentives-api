import { ink } from 'viem/chains';

import { createLogger } from '@/config/logger.js';
import { ACI_ADDRESSES } from '@/constants/aci-addresses.js';
import { AaveTokenType, getAaveTokenInfo } from '@/lib/aave/aave-tokens.js';
import { tokenToString } from '@/lib/token/token.js';
import { getCurrentTimestamp } from '@/lib/utils/timestamp.js';
import {
  BaseIncentive,
  CampaignConfig,
  IncentiveSource,
  IncentiveType,
  RawIncentive,
  RawPointWithoutValueIncentive,
  RawTokenIncentive,
  Token,
} from '@/types/index.js';

import { BaseIncentiveProvider } from '../base.provider.js';
import { FetchOptions } from '../index.js';
import {
  Campaign,
  MerklOpportunityWithCampaign,
  MerklToken,
  RewardTokenType as MerklRewardTokenType,
} from './types.js';

type MerklApiOptions = {
  chainId?: string;
  mainProtocolId?: string;
  status?: string;
};

export type MainProtocolId = (typeof MainProtocolId)[keyof typeof MainProtocolId];

export const MainProtocolId = {
  AAVE: 'aave',
  TYDRO: 'tydro',
} as const;

const chainProtocolMap: Record<number, MainProtocolId> = {
  [ink.id]: MainProtocolId.TYDRO, // Aave on Ink is managed by Tydro
  // Add more chain-specific protocols here
  // [OTHER_CHAIN_ID]: MainProtocolId.OTHER,
};

// Default protocol for all other chains
const DEFAULT_PROTOCOL = MainProtocolId.AAVE;

const WHITELISTED_CREATORS = [...ACI_ADDRESSES];
export class MerklProvider extends BaseIncentiveProvider {
  private logger = createLogger('MerklProvider');

  name = 'MerklProvider';
  incentiveSource = IncentiveSource.MERKL_API;

  apiUrl = 'https://api.merkl.xyz/v4/opportunities/campaigns';
  claimLink = 'https://app.merkl.xyz/';
  unknown = 'UNKNOWN';

  async getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]> {
    const allIncentives: RawIncentive[] = [];

    const chainIds = fetchOptions?.chainIds;

    const protocolIds = chainIds
      ? chainIds.map((chainId) => this.getProtocolId(chainId))
      : [DEFAULT_PROTOCOL];

    const merklOpportunities = await this.fetchIncentives(protocolIds, fetchOptions);

    for (const opportunity of merklOpportunities) {
      const rewardedMerklTokens = opportunity.tokens;
      const rewardedMerklTokensFiltered = this.filterMerklTokens(rewardedMerklTokens);
      const rewardedTokens = rewardedMerklTokensFiltered.map(this.merklInfraTokenToIncentiveToken);

      const opportunityRewardTokens = this.getRewardTokensOpportunity(opportunity);

      for (const merklRewardToken of opportunityRewardTokens) {
        const rewardToken = this.merklInfraTokenToIncentiveToken(merklRewardToken);

        const merklRewardType = merklRewardToken.type;
        const rewardType = merklRewardType ? this.mapRewardType(merklRewardType) : null;

        if (!rewardType) {
          this.logger.error(`Unknown reward type for token ${tokenToString(rewardToken)}`);
          continue;
        }

        // get campaign of the current reward token only
        const campaigns = opportunity.campaigns.filter(
          (campaign) => campaign.rewardToken.address === rewardToken.address,
        );

        const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
          this.getCampaignConfigs(campaigns);

        const baseIncentive: Omit<BaseIncentive, 'type'> = {
          name: opportunity.name,
          description: opportunity.description,
          claimLink: this.claimLink,
          chainId: opportunity.chainId,
          rewardedTokens,
          source: this.incentiveSource,
          currentCampaignConfig,
          nextCampaignConfig,
          allCampaignsConfigs,
          status: opportunity.status,
        };

        if (rewardType == IncentiveType.POINT) {
          const protocolId = this.getProtocolId(opportunity.chainId);
          const pointIncentive: RawPointWithoutValueIncentive = {
            ...baseIncentive,
            type: IncentiveType.POINT_WITHOUT_VALUE,
            point: {
              name: rewardToken.name,
              protocol: protocolId,
            },
          };
          allIncentives.push(pointIncentive);
        }
        if (rewardType == IncentiveType.TOKEN) {
          const pointIncentive: RawTokenIncentive = {
            ...baseIncentive,
            type: IncentiveType.TOKEN,
            rewardToken,
            currentApr: opportunity.apr,
          };
          allIncentives.push(pointIncentive);
        }
      }
    }

    return allIncentives;
  }

  private getProtocolId(chainId: number): MainProtocolId {
    return chainProtocolMap[chainId] || DEFAULT_PROTOCOL;
  }

  private async fetchIncentives(
    mainProtocolIds: MainProtocolId[],
    fetchOptions?: FetchOptions,
  ): Promise<MerklOpportunityWithCampaign[]> {
    const url = new URL(this.apiUrl);

    const merklApiOptions: MerklApiOptions = {
      chainId: fetchOptions?.chainIds?.join(','),
      status: fetchOptions?.status,
      mainProtocolId: mainProtocolIds.join(','),
    };
    console.log(merklApiOptions);
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

      console.log(merklOpportunities);

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

  private getRewardTokensOpportunity = (
    opportunity: MerklOpportunityWithCampaign,
  ): MerklToken[] => {
    const opportunityRewardTokens = opportunity.campaigns.map((campaign) => campaign.rewardToken);

    const uniqueOpportunityRewardTokens = Array.from(
      new Set(opportunityRewardTokens.map((t) => t.address)),
    ).map((address) => {
      return opportunityRewardTokens.find((t) => t.address === address);
    });

    const filteredUniqueOpportunityRewardTokens = uniqueOpportunityRewardTokens.filter(
      (token) => token !== undefined,
    );

    return filteredUniqueOpportunityRewardTokens;
  };

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
        return IncentiveType.TOKEN;
      case MerklRewardTokenType.PRETGE:
        return IncentiveType.POINT;
    }
  }

  private merklInfraTokenToIncentiveToken = (merklToken: MerklToken): Token => {
    const token: Token = {
      name: merklToken.name,
      address: merklToken.address,
      symbol: merklToken.symbol,
      decimals: merklToken.decimals,
      chainId: merklToken.chainId,
    };
    return token;
  };

  private filterMerklTokens = (tokens: MerklToken[]): MerklToken[] =>
    tokens.filter((token) => {
      const aaveTokenInfo = getAaveTokenInfo({
        tokenAddress: token.address,
        chainId: token.chainId,
      });
      if (
        !aaveTokenInfo?.type ||
        aaveTokenInfo.type === AaveTokenType.STATA ||
        aaveTokenInfo.type === AaveTokenType.UNDERLYING
      ) {
        return false;
      }
      return true;
    });

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
