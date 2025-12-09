import { Address } from 'viem';

import { CampaignConfig, IncentiveType } from '@/types/api.js';

export const POINT_PROGRAM_IDS = {
  ETHERFI: 'etherfi',
  ETHENA: 'ethena',
  KELP: 'kelp',
  SONIC: 'sonic',
} as const;

export type PointProgramId = (typeof POINT_PROGRAM_IDS)[keyof typeof POINT_PROGRAM_IDS];

export interface PointProgram {
  id: PointProgramId;
  name: string;
  protocol: string;
  type: IncentiveType.POINT | IncentiveType.POINT_WITHOUT_VALUE;
  description: string;
  externalLink: string;
  seasons?: Record<string, CampaignConfig>;
  pointValueUnit?: string;
  tgePrice?: number;
  additionalData?: Record<string, unknown>;
}

// export interface PointIncentives {
//   programId: PointProgramId;
//   chainId: number;
//   rewardedTokens: RewardToken[];
//   campaigns?: PointCampaign[];
// }

export interface PointIncentives {
  chainId: number;
  rewardedTokenAddresses: Address[];
  pointValues?: PointIncentivesValues;
  campaigns?: PointCampaign[];
}

export type PointIncentivesValues = PointIncentivesValuesPerSeason | number;

export type PointIncentivesValuesPerSeason = Record<string, number>;

export type PointCampaign = {
  startTimestamp: number;
  endTimestamp?: number;
  pointValue?: number;
};

// export type RewardToken = {
//   address: Address;
//   deploymentBlock: number;
//   deploymentTimestamp: number;
// };
