import { Address } from 'viem';

export type Incentive = TokenIncentive | PointIncentive | PointWithoutValueIncentive;

export type BaseIncentive<T extends RewardType = RewardType> = {
  name: string;
  chainId: number;
  rewardedTokens: Token[];
  incentiveType: IncentiveType;
  status: Status;
  description: string;
  claimLink: string;
  rewardType: T;
  currentCampaignConfig?: CampaignConfig;
  nextCampaignConfig?: CampaignConfig;
  allCampaignsConfigs?: CampaignConfig[];
  infosLink?: string;
  additionalData?: Record<string, unknown>;
};

export type TokenIncentive = BaseIncentive<RewardType.TOKEN> & {
  rewardToken: Token;
  currentApr: number;
};

export type PointIncentive = BaseIncentive<RewardType.POINT> & {
  point: Point;
  pointValue: number;
  pointValueUnit?: string;
};

export type PointWithoutValueIncentive = BaseIncentive<RewardType.POINT_WITHOUT_VALUE> & {
  point: Point;
};

export interface Token {
  name: string;
  symbol: string;
  address: Address;
  chainId: number;
  decimals: number;
  price?: number;
  priceFeed?: Address;
}

export interface Point {
  name: string;
  protocol: string;
  tgePrice?: number;
}

export type CampaignConfig = {
  startTimestamp: number; // Can be 0 if undated start
  endTimestamp?: number; // Can be undefined if no end
  budget?: string; // if token incentive
  apr?: number; // if token incentive
  pointValue?: number; // if point incentive
};

export enum IncentiveType {
  ONCHAIN = 'ONCHAIN',
  OFFCHAIN = 'OFFCHAIN',
  EXTERNAL = 'EXTERNAL',
}

export enum RewardType {
  TOKEN = 'TOKEN',
  POINT = 'POINT',
  POINT_WITHOUT_VALUE = 'POINT_WITHOUT_VALUE',
}

export enum Status {
  PAST = 'PAST',
  LIVE = 'LIVE',
  SOON = 'SOON',
}

export enum IncentiveSource {
  ACI_ROUNDS = 'ACI_ROUNDS',
  MERKL_API = 'MERKL_API',
  METROM_API = 'METROM_API',
  ONCHAIN_RPC = 'ONCHAIN_RPC',
  HARDCODED = 'HARDCODED', // For external points, incentives without end date, etc
}

export type GetIncentivesResponse = {
  success: boolean;
  data: {
    incentives: Incentive[];
    totalCount: number;
    lastUpdated: string;
  };
};
