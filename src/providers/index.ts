import z from 'zod';

import { Incentive, IncentiveSource, IncentiveType, RewardType } from '@/types';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema';

export type FetchOptions = z.infer<typeof GetIncentivesQuerySchema>;

export interface IncentiveProvider {
  getIncentives(options?: FetchOptions): Promise<Incentive[]>;
  isHealthy(): Promise<boolean>;
  source: IncentiveSource;
  incentiveType: IncentiveType;
  rewardType?: RewardType;
}

export * from './aci-provider/aci.provider';
export * from './external-points-provider/external-points.provider';
export * from './merkl-provider/merkl.provider';
export * from './onchain-provider/onchain.provider';
