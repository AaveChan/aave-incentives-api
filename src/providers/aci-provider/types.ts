import { Token } from '@/types';

export type Campaign = {
  actionName: CampaignName;
  actionToken: Token;
  rewardToken: Token;
  chainId: number;
  displayName?: string;
  infosLink?: string;
};

export type Round = {
  startTimestamp: string;
  endTimestamp: string;
  budget?: string;
  apr?: string;
  maxBudget?: string;
  campaignId?: string;
};

export enum CampaignName {
  HoldSgho = 'ethereum-sgho',
  AvalancheSupplySAvax = 'avalanche-supply-savax',
}

export type Rounds = Record<CampaignName, Round[]>;
