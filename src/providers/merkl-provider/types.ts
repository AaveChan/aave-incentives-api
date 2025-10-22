import { Address } from 'viem';

import { Status } from '@/types';

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
  tokens: {
    id: string;
    name: string;
    chainId: number;
    address: Address;
    decimals: number;
    icon: string;
    verified: boolean;
    isTest: boolean;
    price: number;
    symbol: string;
  }[];
  rewardsRecord: {
    id: string;
    total: number;
    timestamp: string;
    breakdowns: {
      token: {
        id: string;
        name: string;
        chainId: number;
        address: string;
        decimals: number;
        symbol: string;
        displaySymbol: string;
        icon: string;
        verified: boolean;
        isTest: boolean;
        type: string;
        isNative: boolean;
        price: number;
      };
      amount: string;
      value: number;
      distributionType: string;
      id: string;
      campaignId: string;
      dailyRewardsRecordId: string;
    }[];
  };
};

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
  id: string;
  name: string;
  chainId: number;
  address: string;
  decimals: number;
  icon: string;
  verified: boolean;
  isNative: boolean;
  isTest: boolean;
  price: number;
  symbol: string;
  type: string;
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
    distributionMethodParameters: {
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
