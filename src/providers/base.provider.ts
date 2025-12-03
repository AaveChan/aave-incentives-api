import crypto from 'crypto';
import { Address } from 'viem';

import { AaveUiIncentiveService } from '@/services/aave-ui-incentive.service.js';
import { ERC20Service } from '@/services/erc20.service.js';
import { TokenPriceFetcherService } from '@/services/token-price/token-price-fetcher.service.js';
import { CampaignConfig, Incentive, IncentiveSource, IncentiveType, Point } from '@/types/index.js';

import { FetchOptions, IncentiveProvider } from './index.js';

export abstract class BaseIncentiveProvider implements IncentiveProvider {
  abstract name: string;
  abstract incentiveSource: IncentiveSource;
  incentiveType?: IncentiveType;
  // Providers must implement this
  abstract getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]>;
  abstract isHealthy(): Promise<boolean>;

  // Shared services
  tokenPriceFetcherService = new TokenPriceFetcherService();
  erc20Service = new ERC20Service();
  aaveUIIncentiveService = new AaveUiIncentiveService();

  protected generateIncentiveId({
    chainId,
    rewardedTokenAddresses,
    reward,
  }: {
    chainId: number;
    rewardedTokenAddresses: Address[];
    reward: Address | Point;
  }): string {
    const normalizedRewarded = rewardedTokenAddresses.join('-').toLowerCase().replace('0x', '');
    const normalizedReward = reward
      ? typeof reward === 'string'
        ? reward.toLowerCase().replace('0x', '')
        : reward.name.toLowerCase()
      : '';

    const uniqueString = `${chainId}:${normalizedRewarded}:${normalizedReward}`;

    const hash = crypto.createHash('md5').update(uniqueString).digest('hex');

    return `inc_${hash.substring(0, 16)}`; // 20 chars total
  }

  protected sortIncentivesAllCampaigns = (incentives: Incentive[]): Incentive[] => {
    const sortCampaignsByEndTimestamp = (campaigns: CampaignConfig[]): CampaignConfig[] => {
      return campaigns.sort((a, b) =>
        a.endTimestamp && b.endTimestamp ? a.endTimestamp - b.endTimestamp : 0,
      );
    };

    return incentives.map((incentive) => {
      if (incentive.allCampaignsConfigs) {
        incentive.allCampaignsConfigs = sortCampaignsByEndTimestamp(incentive.allCampaignsConfigs);
      }
      return incentive;
    });
  };

  protected gatherEqualIncentives = (incentives: Incentive[]): Incentive[] => {
    const getMaxTimestamp = (campaigns: CampaignConfig[]): number => {
      return Math.max(...campaigns.map((campaign) => campaign.endTimestamp || 0));
    };

    const incentiveMap: Record<string, Incentive> = {};

    for (const incentive of incentives) {
      const existingIncentive = incentiveMap[incentive.id];
      if (existingIncentive) {
        // console.log(`Merging incentive with id ${incentive.id}`);
        // Merge allCampaignsConfigs
        const mergedCampaignsConfigs = [
          ...(existingIncentive.allCampaignsConfigs || []),
          ...(incentive.allCampaignsConfigs || []),
        ];

        // Determine the most relevant currentCampaignConfig (prefer LIVE status)
        if (
          getMaxTimestamp(existingIncentive.allCampaignsConfigs || []) >
          getMaxTimestamp(incentive.allCampaignsConfigs || [])
        ) {
          existingIncentive.allCampaignsConfigs = mergedCampaignsConfigs;
        } else {
          incentive.allCampaignsConfigs = mergedCampaignsConfigs;
          incentiveMap[incentive.id] = incentive;
        }
      } else {
        // console.log(`Adding new incentive with id ${incentive.id}`);
        incentiveMap[incentive.id] = incentive;
      }
    }

    return Object.values(incentiveMap);
  };
}
