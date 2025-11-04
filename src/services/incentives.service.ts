import { createLogger } from '@/config/logger';
import PRICE_FEED_ORACLES from '@/constants/price-feeds';
import { tokenWrapperMapping } from '@/constants/wrapper-address';
import { getAaveTokenInfo } from '@/lib/aave/aave-tokens';
import {
  ACIProvider,
  ExternalPointsProvider,
  FetchOptions,
  IncentiveProvider,
  MerklProvider,
  OnchainProvider,
} from '@/providers';
import { Incentive, IncentiveSource, RewardType, Status, Token } from '@/types';

export class IncentivesService {
  private logger = createLogger('IncentivesService');

  private providers: IncentiveProvider[] = [
    new ACIProvider(),
    new MerklProvider(),
    new ExternalPointsProvider(),
    new OnchainProvider(),
  ];

  async getIncentives(filters: FetchOptions = {}): Promise<Incentive[]> {
    let allIncentives = await this.fetchIncentives(filters);

    this.enrichedTokens(allIncentives);

    allIncentives = this.applyFilters(allIncentives, filters);

    allIncentives = this.sort(allIncentives);

    // // display the number of token that have a priceFeed undefined
    // const undefinedPricesFeedOracle = allIncentives.filter((incentive) => {
    //   return incentive.reward.type === 'TOKEN' && !incentive.reward.token.priceFeed;
    // });
    // this.logger.verbose(
    //   `There are ${undefinedPricesFeedOracle.length} incentives out of ${allIncentives.length} with undefined reward token priceFeed.`,
    // );

    return allIncentives;
  }

  async fetchIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

    const providersFiltered = this.providers
      .filter(
        (provider) =>
          !fetchOptions?.incentiveType || provider.incentiveType === fetchOptions.incentiveType,
      )
      .filter(
        (provider) =>
          !fetchOptions?.rewardType ||
          !provider.rewardType ||
          provider.rewardType === fetchOptions.rewardType,
      );

    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      providersFiltered.map((provider) => provider.getIncentives(fetchOptions)),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allIncentives.push(...result.value);
      } else {
        this.logger.error(`Provider ${providersFiltered[index]?.source} failed:`, result.reason);
      }
    });

    return allIncentives;
  }

  private applyFilters(incentives: Incentive[], filters: FetchOptions): Incentive[] {
    let incentivesFiltered = [...incentives];

    // Chain ID filter
    if (filters.chainId !== undefined) {
      const chainIds = Array.isArray(filters.chainId) ? filters.chainId : [filters.chainId];
      incentivesFiltered = incentivesFiltered.filter((i) => chainIds.includes(i.chainId));
    }

    // Status filter
    if (filters.status !== undefined) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      incentivesFiltered = incentivesFiltered.filter((i) => statuses.includes(i.status));
    }

    // Incentive type filter
    if (filters.incentiveType !== undefined) {
      const types = Array.isArray(filters.incentiveType)
        ? filters.incentiveType
        : [filters.incentiveType];
      incentivesFiltered = incentivesFiltered.filter((i) => types.includes(i.incentiveType));
    }

    // Reward type filter
    if (filters.rewardType !== undefined) {
      const rewardTypes = Array.isArray(filters.rewardType)
        ? filters.rewardType
        : [filters.rewardType];
      incentivesFiltered = incentivesFiltered.filter((i) => {
        return rewardTypes.includes(i.reward.type);
      });
    }

    return incentivesFiltered;
  }

  private sort(incentives: Incentive[]): Incentive[] {
    const statusOrder: Record<Status, number> = {
      [Status.LIVE]: 0,
      [Status.SOON]: 1,
      [Status.PAST]: 2,
    };

    // Sort: LIVE first, then by APR descending
    return incentives.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }

  private enrichedTokens(incentives: Incentive[]) {
    incentives.forEach((incentive) => {
      incentive.rewardedToken = this.enrichedToken(incentive.rewardedToken);
      if (incentive.reward.type === RewardType.TOKEN) {
        incentive.reward.token = this.enrichedToken(incentive.reward.token);
      }
    });
  }

  private enrichedToken(token: Token): Token {
    // check only if priceFeed is undefined
    if (token.priceFeed) {
      return token;
    }

    const aaveToken = getAaveTokenInfo({
      tokenAddress: token.address,
      chainId: token.chainId,
    });
    if (aaveToken) {
      token = {
        ...token,
        priceFeed: aaveToken.book.ORACLE,
      };
      return token;
    }

    // Wrapper tokens
    const tokenBook = tokenWrapperMapping[token.address];
    if (tokenBook) {
      token = {
        ...token,
        priceFeed: tokenBook.ORACLE,
      };
      return token;
    }

    // hardcoded price feed oracles
    const priceFeedChain = PRICE_FEED_ORACLES[token.chainId];
    if (priceFeedChain) {
      const priceFeedAddress = priceFeedChain[token.address];
      if (priceFeedAddress) {
        token = {
          ...token,
          priceFeed: priceFeedAddress,
        };
      }
      return token;
    }

    return token;
  }

  async getHealthStatus(): Promise<Partial<Record<IncentiveSource, boolean>>> {
    const healthChecks = await Promise.allSettled(
      this.providers.map(async (provider) => ({
        source: provider.source,
        healthy: await provider.isHealthy(),
      })),
    );

    const status: Partial<Record<IncentiveSource, boolean>> = {};
    healthChecks.forEach((result) => {
      if (result.status === 'fulfilled') {
        status[result.value.source] = result.value.healthy;
      }
    });

    return status;
  }
}
