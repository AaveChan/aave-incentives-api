import { Address, formatUnits } from 'viem';

import { HTTP_CONFIG } from '@/config/http.js';
import { createLogger } from '@/config/logger.js';
import { withTimeout } from '@/lib/utils/timeout.js';
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

  private logger = createLogger('IncentivesService');

  async getUserRewards(
    address: Address,
    chainIds?: number[],
    options?: FetchUserRewardsOptions,
  ): Promise<GetUserRewardsResult> {
    const allIncentives = await this.incentivesService.getIncentives({
      chainId: chainIds,
    });

    const effectiveChainIds =
      chainIds ?? Array.from(new Set(allIncentives.map((incentive) => incentive.chainId)));

    const allRewards: UserReward[] = [];
    const allClaimData: ClaimData[] = [];

    const rewardsResults: { rewards: UserReward[]; claimData: ClaimData[] }[] = [];
    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      this.providers.map((provider) =>
        withTimeout(
          provider.getRewards(address, effectiveChainIds, options),
          HTTP_CONFIG.PROVIDER_TIMEOUT_MS,
          `Provider ${provider.incentiveSource} timeout`,
        ),
      ),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        rewardsResults.push(...(result.value ? [result.value] : []));
      } else {
        this.logger.error(
          `Provider ${this.providers[index]?.incentiveSource} failed:`,
          result.reason,
        );
      }
    });

    for (const result of rewardsResults) {
      allRewards.push(...result.rewards);
      allClaimData.push(...result.claimData);
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
      const amount = reward.totalAmount ? BigInt(reward.totalAmount) : undefined;
      const price = reward.token.price;
      const decimals = reward.token.decimals;
      const value =
        price !== undefined && amount !== undefined && amount > 0n
          ? (Number(amount) / 10 ** decimals) * price
          : undefined;

      // By chain
      addToGroup(byChain, reward.token.chainId, value);

      // By source and status
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
}
