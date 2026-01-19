import { Address } from 'viem';

import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { createLogger } from '@/config/logger.js';
import { fetchWithTimeout } from '@/lib/http/fetch-with-timeout.js';
import { withCache } from '@/lib/utils/cache.js';
import { Incentive, IncentiveSource, Status, Token } from '@/types/index.js';

import { IncentivesService } from './incentives.service.js';

// Merkl API Types for User Rewards
type MerklChain = {
  id: number;
  name: string;
  icon: string;
  liveCampaigns: number;
  endOfDisputePeriod: number;
  explorers: {
    type: string;
    url: string;
    chainId: number;
  }[];
  lastClaimsOnchainFetchTimestamp?: string;
};

type MerklCampaignStatus = {
  computedUntil: string;
  processingStarted: string;
  status: string;
  preComputeProcessingStarted?: string;
  preComputeStatus?: string;
  delay: number;
  error: string;
  details: null;
};

type MerklRewardBreakdown = {
  reason: string;
  amount: string;
  claimed: string;
  pending: string;
  campaignId: string;
  campaignStatus?: MerklCampaignStatus;
};

type MerklRewardToken = {
  address: Address;
  chainId: number;
  symbol: string;
  decimals: number;
  name?: string;
};

type MerklUserReward = {
  root: string;
  recipient: string;
  proofs: string[];
  token: MerklRewardToken;
  breakdowns: MerklRewardBreakdown[];
  claimed: string;
  amount: string;
  pending: string;
};

type MerklUserRewardsChainResponse = {
  chain: MerklChain;
  rewards: MerklUserReward[];
};

// Our API Response Types
export type IncentiveRewardBreakdown = {
  incentive: Incentive; // Full incentive object with name, claimLink, source, etc.
  amount: string; // Amount from this specific incentive
  amountRaw: bigint; // Raw amount for calculations
  claimed: string; // Amount already claimed from this incentive
  pending: string; // Amount pending from this incentive
};

export type UserReward = {
  token: Token; // The reward token (includes address, chainId, symbol, decimals, etc.)
  source: IncentiveSource; // The source of rewards (ACI_MASIV_API normalized to MERKL_API)
  totalAmount: string; // Total amount across all incentives (string for JSON safety)
  totalAmountRaw: bigint; // Total raw amount for calculations
  totalClaimed: string; // Total claimed across all incentives
  totalPending: string; // Total pending across all incentives
  claimable: boolean; // Whether any amount is currently claimable
  claimLink: string; // Link to claim rewards (same for all campaigns from same source)
  incentives: IncentiveRewardBreakdown[]; // Breakdown by incentive/campaign
};

export type UserRewardsSummary = {
  bySource: Record<IncentiveSource, { count: number; totalValue?: number }>;
  byChain: Record<number, { count: number; totalValue?: number }>;
  byStatus: Record<Status, { count: number }>;
};

export type GetUserRewardsResult = {
  rewards: UserReward[];
  totalCount: number;
  totalValueUsd?: number;
  lastUpdated: string;
  summary?: UserRewardsSummary;
};

export type FetchUserRewardsOptions = {
  chainId?: number[];
  source?: IncentiveSource[];
  includeZeroBalance?: boolean;
};

export class UserRewardsService {
  private logger = createLogger('UserRewardsService');
  private incentivesService = new IncentivesService();

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

    // Fetch Merkl rewards (covers both MERKL_API and ACI_MASIV_API sources)
    const merklRewards = await this.fetchMerklUserRewards(address, options);
    allRewards.push(...merklRewards);

    // Filter by source if specified
    let filteredRewards = allRewards;
    if (options?.source) {
      filteredRewards = filteredRewards.filter((reward) => {
        // Check if the normalized source matches the filter
        const normalizedSourceMatches = options.source?.includes(reward.source);
        // Also check if any incentive's original source matches
        const originalSourceMatches = reward.incentives.some((breakdown) =>
          options.source?.includes(breakdown.incentive.source),
        );
        return normalizedSourceMatches || originalSourceMatches;
      });
    }

    // Filter zero balances unless explicitly requested
    if (!options?.includeZeroBalance) {
      filteredRewards = filteredRewards.filter((reward) => BigInt(reward.totalAmount) > 0n);
    }

    // Calculate total value
    const totalValueUsd = this.calculateTotalValue(filteredRewards);

    // Generate summary
    const summary = this.generateSummary(filteredRewards);

    return {
      rewards: filteredRewards,
      totalCount: filteredRewards.length,
      totalValueUsd,
      lastUpdated: new Date().toISOString(),
      summary,
    };
  }

  private async fetchMerklUserRewards(
    address: Address,
    options?: FetchUserRewardsOptions,
  ): Promise<UserReward[]> {
    // Temporary structure to collect individual breakdowns
    type TempRewardBreakdown = {
      token: Token;
      incentive: Incentive;
      amount: string;
      amountRaw: bigint;
      claimed: string;
      pending: string;
      claimable: boolean;
    };

    const rewardBreakdowns: TempRewardBreakdown[] = [];

    // Get all incentives to match against
    const allIncentives = await this.incentivesService.getIncentives({
      chainId: options?.chainId,
    });

    // Determine which chainIds to fetch
    // If user specified chainIds, use those; otherwise extract from all incentives
    const chainIds =
      options?.chainId || Array.from(new Set(allIncentives.map((incentive) => incentive.chainId)));

    // Fetch rewards for each chain
    for (const chainId of chainIds) {
      const chainRewards = await this.fetchMerklUserRewardsForChain(address, chainId);

      for (const chainData of chainRewards) {
        for (const merklReward of chainData.rewards) {
          const rewardToken = merklReward.token;

          // Create Token object
          const token: Token = {
            address: rewardToken.address,
            chainId: rewardToken.chainId,
            symbol: rewardToken.symbol,
            decimals: rewardToken.decimals,
            name: rewardToken.name || rewardToken.symbol,
          };

          // Iterate through each campaign breakdown
          for (const breakdown of merklReward.breakdowns) {
            // Try to find matching incentive for this specific campaign
            const matchingIncentive = this.findMatchingIncentive(
              allIncentives,
              token,
              breakdown.campaignId,
            );

            if (!matchingIncentive) {
              this.logger.warn(
                `No matching incentive found for campaign ${breakdown.campaignId} with token ${token.symbol} on chain ${chainId}`,
              );
              continue;
            }

            // Calculate claimable status for this breakdown
            const claimable =
              breakdown.campaignStatus?.status === 'SUCCESS' && BigInt(breakdown.pending) > 0n;

            rewardBreakdowns.push({
              token,
              incentive: matchingIncentive,
              amount: breakdown.amount,
              amountRaw: BigInt(breakdown.amount),
              claimed: breakdown.claimed,
              pending: breakdown.pending,
              claimable,
            });
          }
        }
      }
    }

    // Group by token (address + chainId)
    return this.groupRewardsByToken(rewardBreakdowns);
  }

  private groupRewardsByToken(
    breakdowns: Array<{
      token: Token;
      incentive: Incentive;
      amount: string;
      amountRaw: bigint;
      claimed: string;
      pending: string;
      claimable: boolean;
    }>,
  ): UserReward[] {
    const groupedMap = new Map<string, UserReward>();

    for (const breakdown of breakdowns) {
      // Normalize source: ACI_MASIV_API -> MERKL_API (they share the same claiming infrastructure)
      const normalizedSource =
        breakdown.incentive.source === IncentiveSource.ACI_MASIV_API
          ? IncentiveSource.MERKL_API
          : breakdown.incentive.source;

      // Create unique key for token (address + chainId + normalized source)
      const tokenKey = `${breakdown.token.address.toLowerCase()}-${breakdown.token.chainId}-${normalizedSource}`;

      let grouped = groupedMap.get(tokenKey);

      if (!grouped) {
        // First time seeing this token+source combination, create new group
        // Determine the appropriate claim link based on the normalized source
        const claimLink =
          normalizedSource === IncentiveSource.MERKL_API
            ? 'https://app.merkl.xyz/'
            : breakdown.incentive.claimLink;

        grouped = {
          token: breakdown.token,
          source: normalizedSource,
          totalAmount: '0',
          totalAmountRaw: 0n,
          totalClaimed: '0',
          totalPending: '0',
          claimable: false,
          claimLink,
          incentives: [],
        };
        groupedMap.set(tokenKey, grouped);
      }

      // Add this breakdown to the group
      grouped.incentives.push({
        incentive: breakdown.incentive,
        amount: breakdown.amount,
        amountRaw: breakdown.amountRaw,
        claimed: breakdown.claimed,
        pending: breakdown.pending,
      });

      // Aggregate totals
      grouped.totalAmountRaw += breakdown.amountRaw;
      grouped.totalAmount = grouped.totalAmountRaw.toString();

      const claimedBigInt = BigInt(breakdown.claimed);
      const currentClaimedBigInt = BigInt(grouped.totalClaimed);
      grouped.totalClaimed = (currentClaimedBigInt + claimedBigInt).toString();

      const pendingBigInt = BigInt(breakdown.pending);
      const currentPendingBigInt = BigInt(grouped.totalPending);
      grouped.totalPending = (currentPendingBigInt + pendingBigInt).toString();

      // If any breakdown is claimable, the whole group is claimable
      if (breakdown.claimable) {
        grouped.claimable = true;
      }
    }

    return Array.from(groupedMap.values());
  }

  private async fetchMerklUserRewardsForChain(
    address: Address,
    chainId: number,
  ): Promise<MerklUserRewardsChainResponse[]> {
    const merklApiUrl = 'https://api.merkl.xyz/v4/users';
    const allChainRewards: MerklUserRewardsChainResponse[] = [];
    let page = 0;
    const maxPages = 10; // Safety limit

    while (page < maxPages) {
      const url = `${merklApiUrl}/${address}/rewards?chainId=${chainId}&breakdownPage=${page}`;
      this.logger.debug(`Fetching Merkl rewards for ${address} on chain ${chainId}, page ${page}`);

      try {
        const fetchResponse = await fetchWithTimeout(url);
        const response = (await fetchResponse.json()) as MerklUserRewardsChainResponse[];

        if (!response || response.length === 0) {
          // No more data for this chain
          break;
        }

        allChainRewards.push(...response);

        // Check if we need to fetch more pages
        // If response has rewards, there might be more pages
        const hasRewards = response.some((chain) => chain.rewards && chain.rewards.length > 0);
        if (!hasRewards) {
          break;
        }

        page++;
      } catch (error) {
        this.logger.error(
          `Failed to fetch Merkl user rewards for ${address} on chain ${chainId}, page ${page}:`,
          error,
        );
        break;
      }
    }

    return allChainRewards;
  }

  private findMatchingIncentive(
    incentives: Incentive[],
    rewardToken: Token,
    campaignId: string,
  ): Incentive | undefined {
    // Try to find incentive by campaign ID first
    for (const incentive of incentives) {
      // Check if reward token matches
      const rewardMatches =
        incentive.type === 'TOKEN' &&
        incentive.rewardToken.address.toLowerCase() === rewardToken.address.toLowerCase() &&
        incentive.rewardToken.chainId === rewardToken.chainId;

      if (!rewardMatches) {
        continue;
      }

      // Check if campaign ID matches any in allCampaignsConfigs
      if (incentive.allCampaignsConfigs) {
        const campaignMatch = Object.keys(incentive.allCampaignsConfigs).some(
          (id) => id.toLowerCase() === campaignId.toLowerCase(),
        );
        if (campaignMatch) {
          return incentive;
        }
      }
    }

    // Fallback: find by reward token only if no campaign match found
    return incentives.find(
      (inc) =>
        inc.type === 'TOKEN' &&
        inc.rewardToken.address.toLowerCase() === rewardToken.address.toLowerCase() &&
        inc.rewardToken.chainId === rewardToken.chainId,
    );
  }

  private calculateTotalValue(rewards: UserReward[]): number | undefined {
    let totalValue = 0;
    let hasAnyPrice = false;

    for (const reward of rewards) {
      const amount = BigInt(reward.totalAmount);
      const price = reward.token.price;
      const decimals = reward.token.decimals;

      if (price !== undefined && amount > 0n) {
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
      for (const breakdown of reward.incentives) {
        const source = breakdown.incentive.source;
        const status = breakdown.incentive.status;

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
      const amount = BigInt(reward.totalAmount);
      const price = reward.token.price;
      const decimals = reward.token.decimals;

      if (price !== undefined && amount > 0n) {
        const amountInUnits = Number(amount) / 10 ** decimals;
        const value = amountInUnits * price;

        // Add value to chain
        if (byChain[chainId].totalValue !== undefined) {
          byChain[chainId].totalValue! += value;
        }

        // Distribute value across sources proportionally
        for (const breakdown of reward.incentives) {
          const source = breakdown.incentive.source;
          const breakdownAmount = BigInt(breakdown.amount);
          const breakdownValue = (Number(breakdownAmount) / 10 ** decimals) * price;

          const sourceEntry = bySource[source];
          if (sourceEntry && sourceEntry.totalValue !== undefined) {
            sourceEntry.totalValue += breakdownValue;
          }
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
