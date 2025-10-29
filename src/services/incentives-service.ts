import { createLogger } from '@/config/logger';
import {
  ACIProvider,
  ExternalPointsProvider,
  FetchOptions,
  IncentiveProvider,
  MerklProvider,
  OnchainProvider,
} from '@/providers';
import { Incentive, IncentiveSource, Status } from '@/types';

export class IncentivesService {
  private logger = createLogger('IncentivesService');

  private providers: IncentiveProvider[] = [
    new ACIProvider(),
    new MerklProvider(),
    new ExternalPointsProvider(),
    new OnchainProvider(),
  ];

  async getIncentives(filters: FetchOptions = {}): Promise<Incentive[]> {
    const allIncentives = await this.fetchIncentives(filters);

    const allIncentivesFiltered = this.applyFilters(allIncentives, filters);

    const allIncentivesSorted = this.sort(allIncentivesFiltered);

    return allIncentivesSorted;
  }

  async fetchIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      this.providers
        .filter(
          (provider) =>
            !fetchOptions?.incentiveType || provider.incentiveType === fetchOptions.incentiveType,
        )
        .map((provider) => provider.getIncentives(fetchOptions)),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allIncentives.push(...result.value);
      } else {
        this.logger.error(`Provider ${this.providers[index]?.source} failed:`, result.reason);
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
