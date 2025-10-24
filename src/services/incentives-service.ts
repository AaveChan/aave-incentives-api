import {
  ACIProvider,
  ExternalPointsProvider,
  FetchOptions,
  IncentiveProvider,
  MerklProvider,
} from '@/providers';
import { OnchainProvider } from '@/providers/onchain-provider/onchain-provider';
import { Incentive, IncentiveSource, Status } from '@/types';

export class IncentivesService {
  private providers: IncentiveProvider[] = [
    new ACIProvider(),
    new MerklProvider(),
    new ExternalPointsProvider(),
    new OnchainProvider(),
  ];

  async getAllIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      this.providers
        .filter(
          (provider) =>
            (!fetchOptions?.incentiveType ||
              provider.incentiveType === fetchOptions.incentiveType) &&
            (!fetchOptions?.rewardType || provider.rewardType === fetchOptions.rewardType),
        )
        .map((provider) => provider.getIncentives(fetchOptions)),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allIncentives.push(...result.value);
      } else {
        console.error(`Provider ${this.providers[index]?.source} failed:`, result.reason);
      }
    });

    return this.sort(allIncentives);
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
