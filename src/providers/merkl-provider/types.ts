import { Address } from 'viem';

import { Status } from '@/types/index.js';

enum OpportunityAction {
  LEND = 'LEND',
  BORROW = 'BORROW',
}

type OpportunityStatus = Status;

export type MerklOpportunityWithCampaign = MerklOpportunity & {
  campaigns: Campaign[];
};

export type MerklOpportunity = {
  name: string;
  description: string;
  howToSteps: string[];
  chainId: number;
  type: string;
  identifier: Address;
  status: OpportunityStatus;
  action: OpportunityAction;
  tvl: number;
  apr: number;
  dailyRewards: number;
  tags: [];
  id: string;
  explorerAddress?: Address;
  tokens: MerklToken[];
  rewardsRecord: {
    id: string;
    total: number;
    timestamp: string;
    breakdowns: {
      token: MerklToken;
      amount: string;
      value: number;
      distributionType: string;
      id: string;
      campaignId: string;
      dailyRewardsRecordId: string;
    }[];
  };
};

export enum RewardTokenType {
  TOKEN = 'TOKEN',
  PRETGE = 'PRETGE',
}

export enum CampaignStatus {
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
}

export enum DistributionMethod {
  MAX_APR = 'MAX_APR',
  DUTCH_AUCTION = 'DUTCH_AUCTION',
}

export type MerklToken = {
  address: Address;
  chainId: number;
  decimals: number;
  icon: string;
  id: string;
  isNative: boolean;
  isTest: boolean;
  name: string;
  symbol: string;
  type: RewardTokenType;
  verified: boolean;
  displaySymbol?: string;
  price?: number;
  priceSource?: string;
  updatedAt?: number;
};

export type Campaign = {
  id: string;
  computeChainId: number;
  distributionChainId: number;
  campaignId: string;
  type: string;
  subType: number;
  amount: string;
  startTimestamp: string;
  endTimestamp: string;
  creatorAddress: string;
  apr: number;
  dailyRewards: number;
  creator: {
    address: string;
    tags: string[];
    creatorId: string;
  };
  params: {
    distributionMethodParameters?: {
      distributionMethod: DistributionMethod;
      distributionSettings: {
        apr: string; // 2% => "0.02"
        targetToken: Address;
        symbolTargetToken: string;
        rewardTokenPricing: boolean;
        targetTokenPricing: boolean;
        decimalsTargetToken: number;
      };
    };
  };
  description: string;
  chain: {
    id: number;
    name: string;
    icon: string;
    liveCampaigns: number;
    endOfDisputePeriod: number;
    explorers: {
      type: string;
      url: string;
      chainId: number;
    }[];
  };
  rewardToken: MerklToken;
  distributionChain: {
    id: number;
    name: string;
    icon: string;
    liveCampaigns: number;
    endOfDisputePeriod: number;
    explorers: {
      type: string;
      url: string;
      chainId: number;
    }[];
  };
  distributionType: string;
  campaignStatus: {
    computedUntil: string;
    processingStarted: string;
    status: CampaignStatus;
    delay: number;
    error: string;
    details: null;
  };
  createdAt: string;
  rootCampaignId: string;
  parentCampaignId: string;
  childCampaignIds: string[];
};

// Merkl User Rewards

type MerklChain = {
  id: number;
  name: string;
  icon: string;
  liveCampaigns: number;
  endOfDisputePeriod: number;
  explorers: {
    type: string;
    url: string;
    chainId: number;
  }[];
  lastClaimsOnchainFetchTimestamp?: string;
};

type MerklCampaignStatus = {
  computedUntil: string;
  processingStarted: string;
  status: string;
  preComputeProcessingStarted?: string;
  preComputeStatus?: string;
  delay: number;
  error: string;
  details: null;
};

type MerklRewardBreakdown = {
  reason: string;
  amount: string;
  claimed: string;
  pending: string;
  campaignId: string;
  campaignStatus?: MerklCampaignStatus;
};

export type MerklRewardToken = {
  address: Address;
  chainId: number;
  symbol: string;
  decimals: number;
};

type MerklUserReward = {
  root: string;
  recipient: string;
  proofs: string[];
  token: MerklRewardToken;
  breakdowns: MerklRewardBreakdown[];
  claimed: string;
  amount: string;
  pending: string;
};

export type MerklUserRewardsChainResponse = {
  chain: MerklChain;
  rewards: MerklUserReward[];
};
