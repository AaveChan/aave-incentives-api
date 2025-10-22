import { Address } from 'viem';

// Define program IDs as const to get string literal types
export const POINT_PROGRAM_IDS = {
  ETHERFI: 'etherfi',
  ETHENA: 'ethena',
  KELP: 'kelp',
  RENZO: 'renzo',
  EIGENLAYER: 'eigenlayer',
  SONIC: 'sonic',
  KERNEL: 'kernel',
} as const;

// Extract the type from the const object
export type PointProgramId = (typeof POINT_PROGRAM_IDS)[keyof typeof POINT_PROGRAM_IDS];

// Define the point program itself
export interface PointProgram {
  id: PointProgramId; // Now type-safe!
  name: string; // e.g., "Etherfi Loyalty Points"
  protocol: string; // e.g., "Etherfi"
  description: string;
  externalLink: string;
  pointValueUnit: 'per_dollar' | 'per_token' | 'per_day' | 'multiplier'; // What the value represents
  tgePrice?: number;
  additionalData?: Record<string, unknown>;
}

// Define individual campaigns under a point program
export interface PointCampaign {
  programId: PointProgramId; // Type-safe reference!
  chainId: number; // Support multiple chains with same config
  rewardedTokenAddress: Address; // Should be the key of the token in aave-address-book lib
  pointValue: number; // Points earned per unit (e.g., per dollar, per token)
  startTimestamp?: number;
  endTimestamp?: number;
  campaignSpecificData?: Record<string, unknown>;
}
