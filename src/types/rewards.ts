import { Address } from 'viem';

import { Incentive, IncentiveSource, Status, Token } from '@/types/index.js';

export type UserReward = {
  token: Token;
  source: IncentiveSource;
  claimableAmount: bigint;
  claimableAmountFormatted: number;
  totalAmount?: bigint; // Total amount across all campaigns
  claimLink: string; // Link to claim rewards (same for all campaigns from same source)
  incentives: Incentive[]; // Breakdown by incentive/campaign
};

export type UserRewardsSummary = {
  totalCount: number;
  totalAmountUsd?: number;
  totalClaimableAmountUsd?: number;
  bySource: Record<IncentiveSource, { count: number; totalValue?: number }>;
  byChain: Record<number, { count: number; totalValue?: number }>;
  byStatus: Record<Status, { count: number }>;
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
  claimData: ClaimData[]; // Claim transaction data
  summary: UserRewardsSummary;
  lastUpdated: string;
};

export type FetchUserRewardsOptions = {
  source?: IncentiveSource[];
  includeZeroBalance?: boolean;
};
