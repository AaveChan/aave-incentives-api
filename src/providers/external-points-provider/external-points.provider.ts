import { createLogger } from '@/config/logger';
import { getAaveToken } from '@/lib/aave/aave-tokens';
import { getCurrentTimestamp } from '@/lib/utils/timestamp';
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
  pointCampaignsArray as pointCampaignsData,
  pointProgramsMap,
} from './config/config';
import { PointCampaign, PointIncentives, PointProgram } from './types';

export class ExternalPointsProvider implements IncentiveProvider {
  private logger = createLogger('ExternalPointsProvider');

  source = IncentiveSource.HARDCODED;
  incentiveType = IncentiveType.EXTERNAL;
  rewardType = RewardType.POINT as const;

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

    let pointCampaigns: PointIncentives[] = [];

    if (fetchOptions?.chainId) {
      pointCampaigns = campaignsByChainId.get(fetchOptions.chainId) || [];
    } else {
      pointCampaigns = pointCampaignsData;
    }

    for (const campaign of pointCampaigns) {
      const program = pointProgramsMap.get(campaign.programId);

      if (!program) {
        this.logger.error(`Point program ${campaign.programId} not found`);
        continue;
      }

      const incentives = this.mapPointIncentiveToIncentives(campaign, program);

      if (incentives) {
        allIncentives.push(...incentives);
      }
    }

    return allIncentives;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  private mapPointIncentiveToIncentives(
    pointIncentive: PointIncentives,
    program: PointProgram,
  ): Incentive[] {
    const incentives: Incentive[] = [];
    for (const rewardedTokenAddress of pointIncentive.rewardedTokenAddresses) {
      const rewardedToken = getAaveToken({
        tokenAddress: rewardedTokenAddress,
        chainId: pointIncentive.chainId,
      });

      if (!rewardedToken) {
        return [];
      }

      const campaigns = pointIncentive.campaigns || [];

      const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
        this.getCampaignConfigs(campaigns);

      let status: Status = Status.PAST;
      let pointValue: number | undefined = undefined;
      if (currentCampaignConfig) {
        status = Status.LIVE;
        pointValue = currentCampaignConfig.pointValue;
      } else if (nextCampaignConfig) {
        status = Status.SOON;
      }

      const point: Point = {
        name: program.name,
        protocol: program.protocol,
        tgePrice: program.tgePrice,
      };

      const pointReward: PointReward = {
        type: this.rewardType,
        point,
        pointValue,
        pointValueUnit: program.pointValueUnit,
      };

      const incentive: Incentive = {
        name: program.name,
        description: program.description,
        claimLink: program.externalLink,
        chainId: pointIncentive.chainId,
        rewardedToken,
        reward: pointReward,
        currentCampaignConfig,
        nextCampaignConfig,
        allCampaignsConfigs,
        incentiveType: IncentiveType.EXTERNAL,
        status,
      };

      incentives.push(incentive);
    }

    return incentives;
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
      endTimestamp: campaign.endTimestamp ? Number(campaign.endTimestamp) : undefined,
      pointValue: campaign.pointValue,
    };

    return currentCampaignForOpportunity;
  };
}
