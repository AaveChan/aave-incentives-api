import { Address } from 'viem';

import { AaveInstanceType, AaveTokenType, BookType } from '@/lib/aave/aave-tokens.js';

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
  name: string;
  address: Address;
  chainId: number;
  decimals: number;
  type: AaveTokenType;
  underlyingToken?: Token;
  instance: AaveInstanceType | null;
  book?: BookType;
};

type ActionName = string;

export type Campaign = {
  roundNumber: number;
  startTimestamp: string;
  endTimestamp: string;
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
  wholeDescriptionString: string;
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
