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
import { pointProgramsMap } from './config/config.js';
import { programPointIncentives } from './config/data.js';
import {
  PointCampaign,
  PointIncentives,
  PointIncentivesValuesPerSeason,
  PointProgram,
  PointProgramId,
} from './types.js';

export class ExternalPointsProvider extends BaseIncentiveProvider {
  private logger = createLogger('ExternalPointsProvider');

  name = 'ExternalPointsProvider';

  incentiveSource = IncentiveSource.LOCAL_CONFIG;

  async getIncentives(): Promise<RawIncentive[]> {
    const allIncentives: RawIncentive[] = [];

    for (const [programId, pointIncentives] of Object.entries(programPointIncentives)) {
      const program = pointProgramsMap.get(programId as PointProgramId);
      if (!program) {
        this.logger.error(`Point program ${programId} not found`);
        continue;
      }

      for (const incentives of pointIncentives) {
        const incentivesFormatted = this.mapPointIncentiveToIncentives(incentives, program);

        if (incentivesFormatted) {
          allIncentives.push(...incentivesFormatted);
        }
      }
    }

    return allIncentives;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  private mapPointIncentiveToIncentives(
    pointIncentives: PointIncentives,
    program: PointProgram,
  ): RawIncentive[] {
    const incentives: RawIncentive[] = [];

    if (!pointIncentives.campaigns && (!pointIncentives.pointValues || !program.seasons)) {
      this.logger.error(
        `Point incentives for program ${program.id} on chain ${pointIncentives.chainId} has neither campaigns nor point values`,
      );
      return [];
    }

    for (const address of pointIncentives.rewardedTokenAddresses) {
      const rewardedToken = getAaveToken({
        tokenAddress: address,
        chainId: pointIncentives.chainId,
      });

      if (!rewardedToken) {
        return [];
      }

      let campaigns: CampaignConfig[] = [];

      if (pointIncentives.campaigns) {
        campaigns = pointIncentives.campaigns;
      } else if (pointIncentives.pointValues && program.seasons) {
        const seasons = program.seasons;
        if (seasons) {
          if (typeof pointIncentives.pointValues === 'number') {
            const pointValue = pointIncentives.pointValues;
            campaigns = Object.entries(seasons).map(([, campaign]) => {
              return {
                ...campaign,
                pointValue,
              };
            });
          } else {
            const seasonsCampaigns = Object.entries(seasons).map(([seasonId, campaign]) => {
              const values = pointIncentives.pointValues as PointIncentivesValuesPerSeason;
              const pointValue = values[seasonId];
              return pointValue
                ? {
                    ...campaign,
                    pointValue,
                  }
                : undefined;
            });
            campaigns = seasonsCampaigns.filter((campaign) => campaign !== undefined);
          }
        }
      } else {
        this.logger.error(
          `Point incentives for program ${program.id} on chain ${pointIncentives.chainId} has no campaigns but has point values without seasons`,
        );
        return [];
      }

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

      const baseIncentive: BaseIncentive<PointProgram['type']> = {
        name: program.name,
        description: program.description,
        type: program.type,
        claimLink: program.externalLink,
        chainId: pointIncentives.chainId,
        rewardedTokens: [rewardedToken],
        source: this.incentiveSource,
        currentCampaignConfig,
        nextCampaignConfig,
        allCampaignsConfigs,
        status,
      };

      if (baseIncentive.type === IncentiveType.POINT) {
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
