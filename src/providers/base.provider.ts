import { withCache } from '@/lib/utils/cache.js';
import { AaveUiIncentiveService } from '@/services/aave-ui-incentive.service.js';
import { ERC20Service } from '@/services/erc20.service.js';
import { TokenPriceFetcherService } from '@/services/token-price/token-price-fetcher.service.js';
import { IncentiveSource, IncentiveType, ProviderName, RawIncentive } from '@/types/index.js';

import { FetchOptions, IncentiveProvider } from './index.js';

export abstract class BaseIncentiveProvider implements IncentiveProvider {
  abstract name: ProviderName;
  abstract incentiveSource: IncentiveSource;
  incentiveType?: IncentiveType;

  protected abstract _getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]>;
  abstract isHealthy(): Promise<boolean>;

  // Shared services
  tokenPriceFetcherService = new TokenPriceFetcherService();
  erc20Service = new ERC20Service();
  aaveUIIncentiveService = new AaveUiIncentiveService();

  getIncentives: (opts?: FetchOptions) => Promise<RawIncentive[]>;

  constructor(protected readonly cacheTtl: number) {
    this.getIncentives = withCache(
      (opts?: FetchOptions) => this._getIncentives(opts),
      (opts?: FetchOptions) => this.getCacheKey(opts),
      cacheTtl,
    );
  }

  getCacheKey(_fetchOptions?: FetchOptions): string {
    return `provider:${this.name}`;
  }
}
