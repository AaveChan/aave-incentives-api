import { Incentive, IncentiveSource } from '@/types';

export interface FetchOptions {
  chainId?: number;
}

export interface IncentiveProvider {
  getIncentives(options?: FetchOptions): Promise<Incentive[]>;
  getSource(): IncentiveSource;
  isHealthy(): Promise<boolean>;
}

export * from './aci-provider/aci-provider';
export * from './merkl-provider/merkl-provider';
// ... etc
