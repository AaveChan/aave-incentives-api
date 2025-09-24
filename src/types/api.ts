export interface Incentive {
  name: string; // (eg: Borrow USDC on Base)
  chainId: number;
  rewardedToken: Token;
  rewardToken?: Token; // (if token incentive)
  rewardPoint?: Point; // (if point incentive)
  budget?: string; // (if token incentive)
  apr?: number; // (if token incentive)
  maxBudget?: string; // (if token incentive)
  startTimestamp?: number; // (no timestamps if external points or GHO discount?)
  endTimestamp?: number; // (no timestamps if external points or GHO discount?)
  incentiveType: IncentiveType; // => idk: marc wants to market every campaign as MASIv campaign (masiv campaign are incentives run by the ACI, no matter what infra is). So maybe type would be: “MASIv”, “Onchain”, “External”, or “Offchain” instead of masiv
  rewardType: RewardType;
  status?: Status;
  description: string; // (eg: Borrow USDC on Base. Holding aBasUSDC token dilute your rewards. An health factor of 2 is require to
  claimLink: string; // (eg: Merkl)
  infosLink?: string; // (eg: forum or tweet)
  additionalData?: Record<string, unknown>;
}

export interface Token {
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  decimals: number;
  // abi?: any;
  price?: number;
}

export interface Point {
  name: string;
  protocol: string;
  tgePrice?: number;
}

/* eslint-disable no-unused-vars */
export enum IncentiveType {
  ONCHAIN = 'ONCHAIN',
  OFFCHAIN = 'OFFCHAIN',
  EXTERNAL = 'EXTERNAL',
}

export enum RewardType {
  TOKEN = 'TOKEN',
  POINTS = 'POINTS',
  EXTERNAL_POINT = 'EXTERNAL_POINT',
}

export enum Status {
  PAST = 'PAST',
  LIVE = 'LIVE',
  UPCOMING = 'UPCOMING',
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
