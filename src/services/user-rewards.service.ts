import { Address, formatUnits } from 'viem';

import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { withCache } from '@/lib/utils/cache.js';
import { IncentiveProvider, MerklProvider } from '@/providers/index.js';
import {
  ClaimData,
  FetchUserRewardsOptions,
  GetUserRewardsResult,
  Incentive,
  IncentiveSource,
  IncentiveType,
  Status,
  Token,
  UserReward,
  UserRewardsSummary,
} from '@/types/index.js';

import { IncentivesService } from './incentives.service.js';

export class UserRewardsService {
  private providers: IncentiveProvider[] = [new MerklProvider()];
  private incentivesService = new IncentivesService();

  constructor() {
    this.getUserRewards = withCache(
      (address: Address, chainIds?: number[], options?: FetchUserRewardsOptions) =>
        this._getUserRewards(address, chainIds, options),
      (address: Address, chainIds?: number[], options?: FetchUserRewardsOptions) =>
        this.getCacheKey(address, chainIds, options),
      CACHE_TTLS.PROVIDER.MERKL,
    );
  }

  getUserRewards: (
    address: Address,
    chainIds?: number[],
    options?: FetchUserRewardsOptions,
  ) => Promise<GetUserRewardsResult>;

  private async _getUserRewards(
    address: Address,
    chainIds?: number[],
    options?: FetchUserRewardsOptions,
  ): Promise<GetUserRewardsResult> {
    // Get all incentives for matching (filtered by chainId if provided)
    const allIncentives = await this.incentivesService.getIncentives({
      chainId: chainIds,
    });

    // If no chainIds provided, derive from incentives
    const effectiveChainIds =
      chainIds ?? Array.from(new Set(allIncentives.map((incentive) => incentive.chainId)));

    const allRewards: UserReward[] = [];
    const allClaimData: ClaimData[] = [];
    const rewardsPromises = this.providers.map(async (provider) => {
      const rewardsResults = await provider.getRewards(address, effectiveChainIds, options);
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

    // Match incentives to rewards
    const rewardsWithIncentives = allRewards.map((reward) => ({
      ...reward,
      incentives: this.findMatchingIncentives(allIncentives, reward.token),
    }));

    // Apply filters
    let filteredRewards = rewardsWithIncentives;
    let filteredClaimData = allClaimData;

    if (options?.source) {
      filteredRewards = filteredRewards.filter((reward) => options.source?.includes(reward.source));
      filteredClaimData = filteredClaimData.filter((claimData) =>
        options.source?.includes(claimData.source),
      );
    }

    if (!options?.includeZeroBalance) {
      filteredRewards = filteredRewards.filter((reward) => reward.claimableAmount > 0n);
    }

    if (effectiveChainIds.length > 0) {
      filteredClaimData = filteredClaimData.filter((claimData) =>
        effectiveChainIds.includes(claimData.chainId),
      );
    }

    const summary = this.generateSummary(filteredRewards);

    return {
      rewards: filteredRewards,
      lastUpdated: new Date().toISOString(),
      summary,
      claimData: filteredClaimData,
    };
  }

  private calculateTotalClaimableValue(rewards: UserReward[]) {
    let totalAmountUsd = 0;
    let totalClaimableAmountUsd = 0;
    let hasAnyPrice = false;

    for (const reward of rewards) {
      const amount = reward.totalAmount ? BigInt(reward.totalAmount) : undefined;
      const claimableAmount = reward.claimableAmount ? BigInt(reward.claimableAmount) : undefined;
      const price = reward.token.price;
      const decimals = reward.token.decimals;

      if (price !== undefined && amount !== undefined && claimableAmount !== undefined) {
        hasAnyPrice = true;
        const amountInUnits = Number(formatUnits(amount, decimals));
        const claimableAmountInUnits = Number(formatUnits(claimableAmount, decimals));
        totalAmountUsd += amountInUnits * price;
        totalClaimableAmountUsd += claimableAmountInUnits * price;
      }
    }

    return hasAnyPrice
      ? {
          totalAmountUsd,
          totalClaimableAmountUsd,
        }
      : undefined;
  }

  private generateSummary(rewards: UserReward[]): UserRewardsSummary {
    const totals = this.calculateTotalClaimableValue(rewards);

    const byChain: Record<number, { count: number; totalValue?: number }> = {};
    const bySource: Partial<Record<IncentiveSource, { count: number; totalValue?: number }>> = {};
    const byStatus: Partial<Record<Status, { count: number; totalValue?: number }>> = {};

    const addToGroup = <K extends string | number>(
      group: Record<K, { count: number; totalValue?: number }>,
      key: K,
      value?: number,
    ) => {
      if (!group[key]) {
        group[key] = { count: 0, totalValue: 0 };
      }
      group[key].count++;
      if (value !== undefined) {
        group[key].totalValue = (group[key].totalValue ?? 0) + value;
      }
    };

    for (const reward of rewards) {
      // Calculate value once per reward
      const amount = reward.totalAmount ? BigInt(reward.totalAmount) : undefined;
      const price = reward.token.price;
      const decimals = reward.token.decimals;
      const value =
        price !== undefined && amount !== undefined && amount > 0n
          ? (Number(amount) / 10 ** decimals) * price
          : undefined;

      // By chain (count rewards/tokens)
      addToGroup(byChain, reward.token.chainId, value);

      // By source and status (count incentives)
      for (const incentive of reward.incentives) {
        addToGroup(
          bySource as Record<IncentiveSource, { count: number; totalValue?: number }>,
          incentive.source,
          value,
        );
        addToGroup(
          byStatus as Record<Status, { count: number; totalValue?: number }>,
          incentive.status,
          value,
        );
      }
    }

    return {
      totalCount: rewards.length,
      totalAmountUsd: totals?.totalAmountUsd,
      totalClaimableAmountUsd: totals?.totalClaimableAmountUsd,
      bySource,
      byChain,
      byStatus,
    };
  }

  private findMatchingIncentives(incentives: Incentive[], rewardToken: Token): Incentive[] {
    const matchingIncentives: Incentive[] = [];
    for (const incentive of incentives) {
      const tokenMatches =
        incentive.type === IncentiveType.TOKEN &&
        incentive.rewardToken.address.toLowerCase() === rewardToken.address.toLowerCase() &&
        incentive.rewardToken.chainId === rewardToken.chainId;

      const pointMatches =
        incentive.type === IncentiveType.POINT_WITHOUT_VALUE &&
        !!incentive.point.token &&
        incentive.point.token.address.toLowerCase() === rewardToken.address.toLowerCase() &&
        incentive.point.token.chainId === rewardToken.chainId;

      if (tokenMatches || pointMatches) {
        matchingIncentives.push(incentive);
      }
    }

    return matchingIncentives;
  }

  private getCacheKey(
    address: Address,
    chainIds?: number[],
    options?: FetchUserRewardsOptions,
  ): string {
    const chainIdsKey = chainIds?.sort().join(',') || 'all';
    const sources = options?.source?.sort().join(',') || 'all';
    return `user-rewards:${address}:${chainIdsKey}:${sources}`;
  }
}
