import { Incentive, IncentiveSource, IncentiveType } from '@/types';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema';
import z from 'zod';

export type FetchOptions = z.infer<typeof GetIncentivesQuerySchema>;

export interface IncentiveProvider {
  getIncentives(options?: FetchOptions): Promise<Incentive[]>;
  isHealthy(): Promise<boolean>;
  source: IncentiveSource;
  incentiveType: IncentiveType;
}

export * from './aci-provider/aci-provider';
export * from './merkl-provider/merkl-provider';
export * from './external-points-provider/external-points-provider';
