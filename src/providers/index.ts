import { Address } from 'viem';
import z from 'zod';

import { ClaimData, FetchUserRewardsOptions, UserReward } from '@/services/user-rewards.service.js';
import { IncentiveSource, IncentiveType, ProviderName, RawIncentive } from '@/types/index.js';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema.js';

export type FetchOptions = z.infer<typeof GetIncentivesQuerySchema>;

export interface IncentiveProvider {
  name: ProviderName;
  getIncentives(options?: FetchOptions): Promise<RawIncentive[]>;
  getCacheKey(options?: FetchOptions): string;
  isHealthy(): Promise<boolean>;
  incentiveSource: IncentiveSource;
  incentiveType?: IncentiveType;
}

export interface RewardsProvider {
  name: ProviderName;
  incentiveSource: IncentiveSource;
  getRewards(
    address: Address,
    options?: FetchUserRewardsOptions,
  ): Promise<{ rewards: UserReward[]; claimData: ClaimData[] }>;
}

export * from './aci-provider/aci.provider.js';
export * from './external-points-provider/external-points.provider.js';
export * from './merkl-provider/merkl.provider.js';
export * from './onchain-provider/onchain.provider.js';
