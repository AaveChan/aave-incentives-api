import { ACIProvider, FetchOptions, IncentiveProvider, MerklProvider } from '@/providers';
import { ExternalPointsProvider } from '@/providers/external-points-provider/external-points-provider';
import { Incentive, IncentiveSource, Status } from '@/types';

export class IncentivesService {
  private providers: IncentiveProvider[] = [
    new ACIProvider(),
    new MerklProvider(),
    new ExternalPointsProvider(),
  ];
  // private providers: IncentiveProvider[] = [new MerklProvider()];
  // private providers: IncentiveProvider[] = [new ACIProvider()];

  async getAllIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.getIncentives(fetchOptions)),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allIncentives.push(...result.value);
      } else {
        console.error(`Provider ${this.providers[index]?.getSource()} failed:`, result.reason);
      }
    });

    return this.sort(allIncentives);
  }

  private sort(incentives: Incentive[]): Incentive[] {
    const statusOrder: Record<Status, number> = {
      [Status.LIVE]: 0,
      [Status.UPCOMING]: 1,
      [Status.PAST]: 2,
    };

    // Sort: LIVE first, then by APR descending
    return incentives.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }

  async getHealthStatus(): Promise<Partial<Record<IncentiveSource, boolean>>> {
    const healthChecks = await Promise.allSettled(
      this.providers.map(async (provider) => ({
        source: provider.getSource(),
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
