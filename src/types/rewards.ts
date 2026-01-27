import { Address } from 'viem';

import { Incentive, IncentiveSource, Status, Token } from '@/types/index.js';

export type UserReward = {
  token: Token;
  source: IncentiveSource;
  claimableAmount: bigint; // Human readable amount
  claimableAmountFormatted: number; // Raw amount in wei/smallest unit
  totalAmount?: bigint; // Total amount across all incentives (string for JSON safety)
  totalClaimed?: bigint; // Total claimed across all incentives
  claimLink: string; // Link to claim rewards (same for all campaigns from same source)
  incentives: Incentive[]; // Breakdown by incentive/campaign
};

export type UserRewardsSummary = {
  bySource: Record<IncentiveSource, { count: number; totalValue?: number }>;
  byChain: Record<number, { count: number; totalValue?: number }>;
  byStatus: Record<Status, { count: number }>;
};

export type ClaimData = {
  chainId: number;
  contractAddress: Address;
  functionName: string;
  abi: readonly object[]; // Minimal ABI with just the function we need
  args: unknown[];
  value?: string; // Optional ETH value to send with the transaction
};

export type GetUserRewardsResult = {
  rewards: UserReward[];
  totalCount: number;
  totalValueUsd?: number;
  lastUpdated: string;
  claimData: Partial<Record<IncentiveSource, ClaimData[]>>; // Claim transaction data grouped by chain+source
  summary: UserRewardsSummary;
};

export type FetchUserRewardsOptions = {
  chainId?: number[];
  source?: IncentiveSource[];
  includeZeroBalance?: boolean;
};
