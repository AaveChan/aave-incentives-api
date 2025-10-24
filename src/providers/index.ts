import { Incentive, IncentiveSource } from '@/types';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema';
import z from 'zod';

export type FetchOptions = z.infer<typeof GetIncentivesQuerySchema>;

export interface IncentiveProvider {
  getIncentives(options?: FetchOptions): Promise<Incentive[]>;
  isHealthy(): Promise<boolean>;
  source: IncentiveSource;
  incentiveType: string;
  rewardType: string; // maybe define it directly in each campaign (eg: Merkl can have token and points (in the form of a token but still point))
}

export * from './aci-provider/aci-provider';
export * from './merkl-provider/merkl-provider';
export * from './external-points-provider/external-points-provider';
