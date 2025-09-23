import { Address } from 'viem';

import { Status } from '@/types';

enum OpportunityAction {
  LEND = 'LEND',
  BORROW = 'BORROW',
}

// enum OpportunityStatus {
//   LIVE = 'LIVE',
//   PAST = 'PAST',
//   UPCOMING = 'UPCOMING',
// }

type OpportunityStatus = Status;

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
