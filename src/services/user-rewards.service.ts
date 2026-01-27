import { Address } from 'viem';

import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { withCache } from '@/lib/utils/cache.js';
import { RewardsProvider } from '@/providers/index.js';
import { MerklRewardsProvider } from '@/providers/merkl-provider/merkl-rewards.provider.js';
import {
  ClaimData,
  FetchUserRewardsOptions,
  GetUserRewardsResult,
  IncentiveSource,
  Status,
  UserReward,
  UserRewardsSummary,
} from '@/types/index.js';

export class UserRewardsService {
  public providers: RewardsProvider[] = [new MerklRewardsProvider()];

  constructor() {
    // Bind cached method
    this.getUserRewards = withCache(
      (address: Address, options?: FetchUserRewardsOptions) =>
        this._getUserRewards(address, options),
      (address: Address, options?: FetchUserRewardsOptions) => this.getCacheKey(address, options),
      CACHE_TTLS.PROVIDER.MERKL, // Use same TTL as Merkl provider
    );
  }

  getUserRewards: (
    address: Address,
    options?: FetchUserRewardsOptions,
  ) => Promise<GetUserRewardsResult>;

  private async _getUserRewards(
    address: Address,
    options?: FetchUserRewardsOptions,
  ): Promise<GetUserRewardsResult> {
    const allRewards: UserReward[] = [];
    const allClaimData: ClaimData[] = [];

    // fetch all providers in parallel
    const rewardsPromises = this.providers.map(async (provider) => {
      const rewardsResults = await provider.getRewards(address, options);
      return {
        source: provider.incentiveSource,
        rewardsResults,
      };
    });

    const rewardsResults = await Promise.all(rewardsPromises);

    for (const result of rewardsResults) {
      allRewards.push(...result.rewardsResults.rewards);
      allClaimData.push(...result.rewardsResults.claimData);
    }

    // Filter by source if specified
    let filteredRewards = allRewards;
    if (options?.source) {
      filteredRewards = filteredRewards.filter((reward) => options.source?.includes(reward.source));
    }

    // Filter zero balances unless explicitly requested
    if (!options?.includeZeroBalance) {
      filteredRewards = filteredRewards.filter((reward) => reward.claimableAmount > 0n);
    }

    // Calculate total value
    const totalValueUsd = this.calculateTotalValue(filteredRewards);

    // Generate summary
    const summary = this.generateSummary(filteredRewards);

    // Filter claim data by source and chain if needed
    let filteredClaimData = allClaimData;
    if (options?.source) {
      filteredClaimData = filteredClaimData.filter((claimData) =>
        options.source?.includes(claimData.source),
      );
    }
    if (options?.chainId) {
      filteredClaimData = filteredClaimData.filter((claimData) =>
        options.chainId?.includes(claimData.chainId),
      );
    }

    return {
      rewards: filteredRewards,
      totalCount: filteredRewards.length,
      totalValueUsd,
      lastUpdated: new Date().toISOString(),
      summary,
      claimData: filteredClaimData,
    };
  }

  private calculateTotalValue(rewards: UserReward[]): number | undefined {
    // TODO: Decide if this should calculate total accumulated value (totalAmount)
    // or only claimable value (claimableAmount). Currently uses totalAmount.
    let totalValue = 0;
    let hasAnyPrice = false;

    for (const reward of rewards) {
      const amount = reward.totalAmount ? BigInt(reward.totalAmount) : undefined;
      const price = reward.token.price;
      const decimals = reward.token.decimals;

      if (price !== undefined && amount !== undefined && amount > 0n) {
        hasAnyPrice = true;
        // Convert bigint to number: amount / 10^decimals * price
        const amountInUnits = Number(amount) / 10 ** decimals;
        totalValue += amountInUnits * price;
      }
    }

    return hasAnyPrice ? totalValue : undefined;
  }

  private generateSummary(rewards: UserReward[]): UserRewardsSummary {
    const bySource: Record<string, { count: number; totalValue?: number }> = {};
    const byChain: Record<number, { count: number; totalValue?: number }> = {};
    const byStatus: Record<string, { count: number }> = {};

    for (const reward of rewards) {
      const chainId = reward.token.chainId;

      // Iterate through incentive breakdowns to count by source and status
      for (const incentive of reward.incentives) {
        const source = incentive.source;
        const status = incentive.status;

        // By source
        if (!bySource[source]) {
          bySource[source] = { count: 0, totalValue: 0 };
        }
        bySource[source].count++;

        // By status
        if (!byStatus[status]) {
          byStatus[status] = { count: 0 };
        }
        byStatus[status].count++;
      }

      // By chain (count tokens, not breakdowns)
      if (!byChain[chainId]) {
        byChain[chainId] = { count: 0, totalValue: 0 };
      }
      byChain[chainId].count++;

      // Add value if available
      const amount = reward.totalAmount ? BigInt(reward.totalAmount) : undefined;
      const price = reward.token.price;
      const decimals = reward.token.decimals;

      if (price !== undefined && amount !== undefined && amount > 0n) {
        const amountInUnits = Number(amount) / 10 ** decimals;
        const value = amountInUnits * price;

        // Add value to chain
        if (byChain[chainId].totalValue !== undefined) {
          byChain[chainId].totalValue! += value;
        }
      }
    }

    return {
      bySource: bySource as Record<IncentiveSource, { count: number; totalValue?: number }>,
      byChain: byChain as Record<number, { count: number; totalValue?: number }>,
      byStatus: byStatus as Record<Status, { count: number }>,
    };
  }

  private getCacheKey(address: Address, options?: FetchUserRewardsOptions): string {
    const chainIds = options?.chainId?.sort().join(',') || 'all';
    const sources = options?.source?.sort().join(',') || 'all';
    return `user-rewards:${address}:${chainIds}:${sources}`;
  }
}
