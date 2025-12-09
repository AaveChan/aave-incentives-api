import { Address } from 'viem';

import { IncentiveType } from '@/types/api.js';

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
  seasons?: PointSeasons;
  pointValueUnit?: string;
  tgePrice?: number;
  additionalData?: Record<string, unknown>;
}

export interface PointIncentives {
  chainId: number;
  rewardedTokenAddresses: Address[];
  pointValues?: PointIncentivesValues;
  campaigns?: PointCampaign[];
}

export type PointIncentivesValues = PointIncentivesValuesPerSeason | number;

export type PointIncentivesValuesPerSeason = Record<string, number>;

export type PointSeasons = Record<string, PointSeason>;

export type PointSeason = {
  startTimestamp: number;
  endTimestamp?: number;
};

export type PointCampaign = {
  startTimestamp: number;
  endTimestamp?: number;
  pointValue?: number;
};

export type ProgramPointIncentives = Record<PointProgramId, PointIncentives[]>;
