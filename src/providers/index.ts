import z from 'zod';

import { Incentive, IncentiveSource, IncentiveType } from '@/types/index.js';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema.js';

export type FetchOptions = z.infer<typeof GetIncentivesQuerySchema>;

export interface IncentiveProvider {
  getIncentives(options?: FetchOptions): Promise<Incentive[]>;
  isHealthy(): Promise<boolean>;
  source: IncentiveSource;
  incentiveType?: IncentiveType;
}

export * from './aci-provider/aci.provider.js';
export * from './external-points-provider/external-points.provider.js';
export * from './merkl-provider/merkl.provider.js';
export * from './onchain-provider/onchain.provider.js';
