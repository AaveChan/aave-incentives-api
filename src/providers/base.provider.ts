import { Address } from 'viem';

import { withCache } from '@/lib/utils/cache.js';
import { AaveUiIncentiveService } from '@/services/aave-ui-incentive.service.js';
import { ERC20Service } from '@/services/erc20.service.js';
import { TokenPriceFetcherService } from '@/services/token-price/token-price-fetcher.service.js';
import {
  ClaimData,
  FetchUserRewardsOptions,
  IncentiveSource,
  IncentiveType,
  ProviderName,
  RawIncentive,
  UserReward,
} from '@/types/index.js';

import { FetchOptions, IncentiveProvider } from './index.js';

export abstract class BaseIncentiveProvider implements IncentiveProvider {
  abstract name: ProviderName;
  abstract incentiveSource: IncentiveSource;
  incentiveType?: IncentiveType;

  protected abstract _getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]>;

  protected _getRewards(
    _address: Address,
    _chainIds: number[],
    _options?: FetchUserRewardsOptions,
  ): Promise<{ rewards: UserReward[]; claimData: ClaimData[] }> {
    return Promise.resolve({ rewards: [], claimData: [] });
  }

  abstract isHealthy(): Promise<boolean>;

  // Shared services
  tokenPriceFetcherService = new TokenPriceFetcherService();
  erc20Service = new ERC20Service();
  aaveUIIncentiveService = new AaveUiIncentiveService();

  getIncentives: (opts?: FetchOptions) => Promise<RawIncentive[]>;
  getRewards: (
    address: Address,
    chainIds: number[],
    options?: FetchUserRewardsOptions,
  ) => Promise<{ rewards: UserReward[]; claimData: ClaimData[] }>;

  getCacheKey(_fetchOptions?: FetchOptions): string {
    return `provider:${this.name}`;
  }

  getCacheKeyUserRewards(
    address: Address,
    chainIds?: number[],
    options?: FetchUserRewardsOptions,
  ): string {
    const chainIdsKey = chainIds ? [...chainIds].sort().join(',') : 'all';
    const sources = options?.source ? [...options.source].sort().join(',') : 'all';
    return `user-rewards:${address}:${chainIdsKey}:${sources}`;
  }

  constructor(protected readonly cacheTtl: number) {
    this.getIncentives = withCache(
      (opts?: FetchOptions) => this._getIncentives(opts),
      (opts?: FetchOptions) => this.getCacheKey(opts),
      cacheTtl,
    );

    this.getRewards = withCache(
      (address: Address, chainIds: number[], options?: FetchUserRewardsOptions) =>
        this._getRewards(address, chainIds, options),
      (address: Address, chainIds: number[], options?: FetchUserRewardsOptions) =>
        this.getCacheKeyUserRewards(address, chainIds, options),
      cacheTtl,
    );
  }
}
