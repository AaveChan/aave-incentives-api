import { Address } from 'viem';

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
  description: string;
  externalLink: string;
  pointValueUnit?: string;
  tgePrice?: number;
  additionalData?: Record<string, unknown>;
}

export interface PointIncentive {
  programId: PointProgramId;
  chainId: number;
  rewardedTokenAddress: Address;
  campaigns?: PointCampaign[];
}

export type PointCampaign = {
  startTimestamp: number;
  endTimestamp?: number;
  pointValue?: number;
};
