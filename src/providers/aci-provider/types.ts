import { AaveInstanceType, AaveTokenType, BookType } from '@/lib/aave/aave-tokens';
import { Address } from 'viem';

export type Actions = Record<ActionName, Action>;

type Action = {
  actionName: ActionName;
  actionTokens: Token[];
  rewardToken: Token;
  chainId: number;
  instance: AaveInstanceType | null;
  displayName: string;
  campaigns: Campaign[];
  info: InfoData;
  apr?: number;
  frequency?: Frequency;
};

export type Token = {
  symbol: string;
  address: Address;
  chainId: number;
  decimals: number;
  type: AaveTokenType;
  name?: string;
  underlyingToken?: Token;
  instance: AaveInstanceType | null;
  book?: BookType;
};

type ActionName = string;

// export type Campaign = {
//   roundNumber: number;
//   startTimestamp: string;
//   endTimestamp: string;
//   rewardAmount?: string;
//   campaignId?: string;
// };

export type Campaign = {
  roundNumber: number;
  startBlock: string;
  endBlock: string;
  rewardAmount?: string;
  campaignId?: string;
};

enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi-weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BI_ANNUALLY = 'bi-annually',
  ANNUALLY = 'annually',
}

type InfoData = {
  actionsData: ActionData[];
  boostersData: BoosterData[];
  dilutersData: DiluterData[];
  forumLink: ForumLink;
  otherInfo?: string;
};

type ActionData = {
  action: string;
  description: string;
};

type BoosterData = {
  name: string;
  description: string;
  boostValue: number;
};

type DiluterData = {
  diluter: string;
};

type ForumLink = {
  title: string;
  link: string;
};

// export type Campaign = {
//   actionName: CampaignName;
//   actionToken: Token;
//   rewardToken: Token;
//   chainId: number;
//   displayName?: string;
//   infosLink?: string;
// };

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
