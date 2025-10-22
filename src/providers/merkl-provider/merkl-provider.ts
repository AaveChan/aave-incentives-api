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
import { Campaign, MerklOpportunityWithCampaign } from './types';
import { getAaveToken } from '@/lib/aave/aave-tokens';
import { getCurrentTimestamp } from '@/lib/utils/timestamp';

type MerklApiOptions = {
  chainId?: number;
  mainProtocolId?: string;
};

export class MerklProvider implements IncentiveProvider {
  apiUrl = 'https://api.merkl.xyz/v4/opportunities/campaigns';
  claimLink = 'https://app.merkl.xyz/';
  incentiveType = IncentiveType.OFFCHAIN;
  rewardType = RewardType.TOKEN;
  unknown = 'UNKNOWN';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const merklOpportunities = await this.fetchIncentives(fetchOptions);

    let allIncentives: Incentive[] = [];

    for (const opportunity of merklOpportunities) {
      const rewardMerklToken = opportunity?.rewardsRecord?.breakdowns[0]?.token;

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

      const rewardedToken: Token = {
        name: rewardedTokenName,
        address: rewardedTokenAddress,
        symbol: rewardedTokenSymbol,
        decimals: rewardedTokenDecimals,
        chainId: opportunity.chainId,
      };

      const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
        await this.getCampaignConfigs(opportunity.campaigns);

      const tokenReward: TokenReward = {
        type: RewardType.TOKEN,
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

    allIncentives = allIncentives.filter((i) =>
      fetchOptions?.chainId ? i.chainId === fetchOptions?.chainId : true,
    );

    console.log('Merkl incentives:', allIncentives.length);

    return allIncentives;
  }

  private async fetchIncentives(
    fetchOptions?: FetchOptions,
  ): Promise<MerklOpportunityWithCampaign[]> {
    const url = new URL(this.apiUrl);

    const merklApiOptions: MerklApiOptions = {
      chainId: fetchOptions?.chainId,
      mainProtocolId: 'aave',
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

  private getCampaignConfigs = async (campaigns: Campaign[]) => {
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
    const aprSetup =
      Number(campaign.params.distributionMethodParameters.distributionSettings.apr) * 100;

    const currentCampaignForOpportunity: CampaignConfig = {
      startTimestamp: Number(campaign.startTimestamp),
      endTimestamp: Number(campaign.endTimestamp),
      budget: campaign.amount,
      apr: aprSetup,
    };

    return currentCampaignForOpportunity;
  };

  getSource(): IncentiveSource {
    return IncentiveSource.MERKL_API;
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
