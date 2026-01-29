import { Address } from 'viem';

import { Incentive, IncentiveSource, Status, Token } from '@/types/index.js';

export type UserReward = {
  token: Token;
  source: IncentiveSource;
  claimableAmount: bigint;
  claimableAmountFormatted: number;
  totalAmount?: bigint;
  claimLink: string;
  incentives: Incentive[];
};

export type UserRewardsSummary = {
  totalCount: number;
  totalAmountUsd?: number;
  totalClaimableAmountUsd?: number;
  bySource: Partial<Record<IncentiveSource, { count: number; totalValue?: number }>>;
  byChain: Record<number, { count: number; totalValue?: number }>;
  byStatus: Partial<Record<Status, { count: number; totalValue?: number }>>;
};

export type ClaimData = {
  source: IncentiveSource;
  chainId: number;
  contractAddress: Address;
  functionName: string;
  abi: readonly object[]; // Minimal ABI with just the function we need
  args: unknown[];
  value?: string; // Optional ETH value to send with the transaction
};

export type GetUserRewardsResult = {
  rewards: UserReward[];
  claimData: ClaimData[];
  summary: UserRewardsSummary;
  lastUpdated: string;
};

export type FetchUserRewardsOptions = {
  source?: IncentiveSource[];
  includeZeroBalance?: boolean;
};
