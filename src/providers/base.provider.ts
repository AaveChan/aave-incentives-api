import { AaveUiIncentiveService } from '@/services/aave-ui-incentive.service.js';
import { ERC20Service } from '@/services/erc20.service.js';
import { TokenPriceFetcherService } from '@/services/token-price/token-price-fetcher.service.js';
import { IncentiveSource, IncentiveType, RawIncentive } from '@/types/index.js';

import { FetchOptions, IncentiveProvider } from './index.js';

export abstract class BaseIncentiveProvider implements IncentiveProvider {
  abstract incentiveSource: IncentiveSource;
  incentiveType?: IncentiveType;
  // Providers must implement this
  abstract getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]>;
  abstract isHealthy(): Promise<boolean>;

  // Shared services
  tokenPriceFetcherService = new TokenPriceFetcherService();
  erc20Service = new ERC20Service();
  aaveUIIncentiveService = new AaveUiIncentiveService();

  // protected generateIncentiveId({
  //   source,
  //   chainId,
  //   rewardedTokenAddresses,
  //   reward,
  // }: {
  //   source: IncentiveSource;
  //   chainId: number;
  //   rewardedTokenAddresses: Address[];
  //   reward: Address | Point;
  // }): string {
  //   const normalizedRewarded = rewardedTokenAddresses.join('-').toLowerCase().replace('0x', '');
  //   const normalizedReward = reward
  //     ? typeof reward === 'string'
  //       ? reward.toLowerCase().replace('0x', '')
  //       : reward.name.toLowerCase()
  //     : '';

  //   const uniqueString = `${source}:${chainId}:${normalizedRewarded}:${normalizedReward}`;

  //   const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');

  //   return `inc_${hash.substring(0, 16)}`; // 20 chars total
  // }
}
