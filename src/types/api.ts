import { Address } from 'viem';

import { NonEmptyArray } from '@/lib/utils/non-empty-array.js';

export type ApiResponse<T, E> = {
  success: boolean;
  data?: T;
  error?: E;
};

export type GetIncentivesResponse = ApiResponse<
  {
    incentives: Incentive[];
    totalCount: number;
    lastUpdated: string;
  },
  undefined
>;

export type ApiErrorResponse = ApiResponse<
  undefined,
  {
    message: string;
    code: string;
    details?: {
      field: string;
      message: string;
    }[];
  }
>;

export type Incentive = RawIncentive & {
  id: string;
};

export type RawIncentive = RawTokenIncentive | RawPointIncentive | RawPointWithoutValueIncentive;

export type BaseIncentive<T extends IncentiveType = IncentiveType> = {
  name: string;
  chainId: number;
  rewardedToken: Token;
  involvedTokens: NonEmptyTokens;
  type: T;
  source: IncentiveSource;
  status: Status;
  description: string;
  claimLink: string;
  allCampaignsConfigs: CampaignConfig[];
  currentCampaignConfig?: CampaignConfig;
  nextCampaignConfig?: CampaignConfig;
  id?: string; // Unique identifier: chainId-rewardedTokens-rewardTokenAddress|point.name
  infosLink?: string;
  additionalData?: Record<string, unknown>;
};

export type RawTokenIncentive = BaseIncentive<IncentiveType.TOKEN> & {
  rewardToken: Token;
  currentApr?: number;
};

export type RawPointIncentive = BaseIncentive<IncentiveType.POINT> & {
  point: Point;
  pointValue?: number;
  pointValueUnit?: string;
};

export type RawPointWithoutValueIncentive = BaseIncentive<IncentiveType.POINT_WITHOUT_VALUE> & {
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

export type NonEmptyTokens = NonEmptyArray<Token>;

export interface Point {
  name: string;
  protocol: string;
  tgePrice?: number;
  token?: Token;
}

export type CampaignConfig = {
  startTimestamp: number; // Can be BASE_TIMESTAMP if undated start
  endTimestamp?: number; // Can be undefined if no end
  budget?: string; // if token incentive
  apr?: number; // if token incentive
  pointValue?: number; // if point incentive
};

export enum IncentiveType {
  TOKEN = 'TOKEN',
  POINT = 'POINT',
  POINT_WITHOUT_VALUE = 'POINT_WITHOUT_VALUE',
}

export enum Status {
  PAST = 'PAST',
  LIVE = 'LIVE',
  SOON = 'SOON',
}

// provider & incentive source
export enum IncentiveSource {
  ACI_MASIV_API = 'ACI_MASIV_API',
  MERKL_API = 'MERKL_API',
  ONCHAIN_RPC = 'ONCHAIN_RPC',
  LOCAL_CONFIG = 'LOCAL_CONFIG', // For external points, incentives without end date, etc
}

export enum ProviderName {
  ACI = 'ACIProvider',
  Merkl = 'MerklProvider',
  ExternalPoints = 'ExternalPointsProvider',
  Onchain = 'OnchainProvider',
}
