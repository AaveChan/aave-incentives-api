import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  Point,
  PointReward,
  RewardType,
  Status,
} from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import {
  campaignsByChainId,
  pointProgramsMap,
  pointCampaignsArray as pointCampaignsData,
} from './config/config';
import { PointCampaign, PointIncentive, PointProgram } from './types';
import { getAaveToken } from '@/lib/aave/aave-tokens';
import { getCurrentTimestamp } from '@/lib/utils/timestamp';

export class ExternalPointsProvider implements IncentiveProvider {
  name = 'ExternalPoints';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const incentives: Incentive[] = [];

    let pointCampaigns: PointIncentive[] = [];

    if (fetchOptions?.chainId) {
      pointCampaigns = campaignsByChainId.get(fetchOptions.chainId) || [];
    } else {
      pointCampaigns = pointCampaignsData;
    }

    for (const campaign of pointCampaigns) {
      const program = pointProgramsMap.get(campaign.programId);

      if (!program) {
        console.warn(`Point program ${campaign.programId} not found`);
        continue;
      }

      const incentive = this.mapCampaignToIncentive(campaign, program);
      if (incentive) {
        incentives.push(incentive);
      }
    }

    return incentives;
  }

  getSource(): IncentiveSource {
    return IncentiveSource.HARDCODED;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  private mapCampaignToIncentive(
    incentive: PointIncentive,
    program: PointProgram,
  ): Incentive | null {
    const rewardedToken = getAaveToken(incentive.rewardedTokenAddress, incentive.chainId);

    if (!rewardedToken) {
      console.warn(
        `Token ${incentive.rewardedTokenAddress} not found on chain ${incentive.chainId}`,
      );
      return null;
    }

    const campaigns = incentive.campaigns || [];

    const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
      this.getCampaignConfigs(campaigns);

    let status: Status = Status.PAST;
    let pointValue: number | undefined = undefined;
    if (currentCampaignConfig) {
      status = Status.LIVE;
      pointValue = currentCampaignConfig.pointValue;
    } else if (nextCampaignConfig) {
      status = Status.UPCOMING;
    }

    const point: Point = {
      name: program.name,
      protocol: program.protocol,
      tgePrice: program.tgePrice,
    };

    const pointReward: PointReward = {
      type: RewardType.EXTERNAL_POINT,
      point,
      pointValue,
      pointValueUnit: program.pointValueUnit,
    };

    return {
      name: program.name,
      description: program.description,
      claimLink: program.externalLink,
      chainId: incentive.chainId,
      rewardedToken,
      reward: pointReward,
      currentCampaignConfig,
      nextCampaignConfig,
      allCampaignsConfigs,
      incentiveType: IncentiveType.EXTERNAL,
      status,
    };
  }

  private getCampaignConfigs = (campaigns: PointCampaign[]) => {
    let currentCampaignConfig: CampaignConfig | undefined;
    let nextCampaignConfig: CampaignConfig | undefined;

    const currentTimestamp = getCurrentTimestamp();
    // Current: start <= now && (end is undefined OR end >= now)
    const currentCampaign = campaigns
      .sort((a, b) => Number(b.startTimestamp) - Number(a.startTimestamp))
      .find((campaign) => {
        const start = Number(campaign.startTimestamp);
        const end = campaign.endTimestamp !== undefined ? Number(campaign.endTimestamp) : undefined;
        return start <= currentTimestamp && (end === undefined || end >= currentTimestamp);
      });
    if (currentCampaign) {
      currentCampaignConfig = this.getCampaignConfig(currentCampaign);
    }

    // Next: campaign with the smallest start > now, and not the current campaign
    const nextCampaign = campaigns
      .filter((campaign) => !currentCampaign || campaign !== currentCampaign)
      .sort((a, b) => Number(a.startTimestamp) - Number(b.startTimestamp))
      .find((campaign) => Number(campaign.startTimestamp) > currentTimestamp);
    if (nextCampaign) {
      nextCampaignConfig = this.getCampaignConfig(nextCampaign);
    }

    const allCampaignsConfigs = campaigns.map((campaign) => this.getCampaignConfig(campaign));

    return { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs };
  };

  private getCampaignConfig = (campaign: PointCampaign) => {
    const currentCampaignForOpportunity: CampaignConfig = {
      startTimestamp: Number(campaign.startTimestamp),
      endTimestamp: Number(campaign.endTimestamp),
      pointValue: campaign.pointValue,
    };

    return currentCampaignForOpportunity;
  };
}
