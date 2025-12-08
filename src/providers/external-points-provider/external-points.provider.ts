import { createLogger } from '@/config/logger.js';
import { getAaveToken } from '@/lib/aave/aave-tokens.js';
import { getCurrentTimestamp } from '@/lib/utils/timestamp.js';
import {
  BaseIncentive,
  CampaignConfig,
  IncentiveSource,
  IncentiveType,
  Point,
  RawIncentive,
  RawPointIncentive,
  RawPointWithoutValueIncentive,
  Status,
} from '@/types/index.js';

import { BaseIncentiveProvider } from '../base.provider.js';
import { FetchOptions } from '../index.js';
import {
  campaignsByChainId,
  pointCampaignsArray as pointCampaignsData,
  pointProgramsMap,
} from './config/config.js';
import { PointCampaign, PointIncentives, PointProgram } from './types.js';

export class ExternalPointsProvider extends BaseIncentiveProvider {
  private logger = createLogger('ExternalPointsProvider');

  name = 'ExternalPointsProvider';

  incentiveSource = IncentiveSource.LOCAL_CONFIG;

  async getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]> {
    const allIncentives: RawIncentive[] = [];

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
  ): RawIncentive[] {
    const incentives: RawIncentive[] = [];
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

      const baseIncentive: Omit<BaseIncentive, 'type'> = {
        name: program.name,
        description: program.description,
        claimLink: program.externalLink,
        chainId: pointIncentive.chainId,
        rewardedTokens: [rewardedToken],
        source: this.incentiveSource,
        currentCampaignConfig,
        nextCampaignConfig,
        allCampaignsConfigs,
        status,
      };

      if (pointValue) {
        const incentive: RawPointIncentive = {
          ...baseIncentive,
          type: IncentiveType.POINT,
          point,
          pointValue,
          pointValueUnit: program.pointValueUnit,
        };
        incentives.push(incentive);
      } else {
        const incentive: RawPointWithoutValueIncentive = {
          ...baseIncentive,
          type: IncentiveType.POINT_WITHOUT_VALUE,
          point,
        };
        incentives.push(incentive);
      }
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
