import crypto from 'crypto';
import { Address } from 'viem';

import { CampaignConfig, Incentive, Point } from '@/types/index.js';

// export function generateIncentiveId(
//   chainId: number,
//   rewardedTokenAddresses: Address[],
//   rewardTokenAddress?: Address,
//   rewardPointName?: string,
// ): string {
//   if (!rewardTokenAddress && !rewardPointName) {
//     throw new Error('Either rewardTokenAddress or rewardPointName must be provided');
//   }
//   const normalizedRewarded = rewardedTokenAddresses.join('-').toLowerCase().replace('0x', '');
//   const normalizedReward = rewardTokenAddress?.toLowerCase().replace('0x', '') || '';
//   const pointName = rewardPointName?.toLowerCase() || '';

//   const uniqueString = `${chainId}:${normalizedRewarded}:${normalizedReward}:${pointName}`;

//   const hash = crypto.createHash('md5').update(uniqueString).digest('hex');

//   return `inc_${hash.substring(0, 16)}`; // 20 chars total
// }

export function generateIncentiveId({
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

// maybe peut être faire un service exprès, plutôt qu'une lib utils

export const sortIncentivesAllCampaigns = (incentives: Incentive[]): Incentive[] => {
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

export const gatherEqualIncentives = (incentives: Incentive[]): Incentive[] => {
  const getMaxTimestamp = (campaigns: CampaignConfig[]): number => {
    return Math.max(...campaigns.map((campaign) => campaign.endTimestamp || 0));
  };

  const incentiveMap: Record<string, Incentive> = {};

  for (const incentive of incentives) {
    const existingIncentive = incentiveMap[incentive.id];
    if (existingIncentive) {
      console.log(`Merging incentive with id ${incentive.id}`);
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
      console.log(`Adding new incentive with id ${incentive.id}`);
      incentiveMap[incentive.id] = incentive;
    }
  }

  return Object.values(incentiveMap);
};
