import { Address, formatUnits } from 'viem';

import { createLogger } from '@/config/logger.js';
import { MERKL_DISTRIBUTOR_ABI } from '@/constants/abis/merkl-distributor.js';
import { getMerklDistributorAddress } from '@/constants/merkl-distributors.js';
import { fetchWithTimeout } from '@/lib/http/fetch-with-timeout.js';
import { IncentivesService } from '@/services/incentives.service.js';
import {
  ClaimData,
  FetchUserRewardsOptions,
  Incentive,
  IncentiveSource,
  IncentiveType,
  ProviderName,
  Token,
  UserReward,
} from '@/types/index.js';

import { RewardsProvider } from '../index.js';

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

export type MerklUserRewardsChainResponse = {
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

export class MerklRewardsProvider implements RewardsProvider {
  incentiveSource = IncentiveSource.MERKL_API;
  name = ProviderName.Merkl;
  merklApiUrl = 'https://api.merkl.xyz/v4/users';
  claimLink = 'https://app.merkl.xyz/';
  private logger = createLogger('UserRewardsService');
  private incentivesService = new IncentivesService();

  async getRewards(address: Address, options?: FetchUserRewardsOptions) {
    const userRewards: UserReward[] = [];
    const claimDataByChain: Map<number, ClaimData> = new Map();

    // Get all incentives to match against
    const allIncentives = await this.incentivesService.getIncentives({
      chainId: options?.chainId,
    });

    // Determine which chainIds to fetch
    // If user specified chainIds, use those; otherwise extract from all incentives
    const chainIds =
      options?.chainId || Array.from(new Set(allIncentives.map((incentive) => incentive.chainId)));

    // Fetch rewards for all chains in parallel for better performance
    const chainRewardsPromises = chainIds.map((chainId) =>
      this.fetchMerklUserRewardsForChain(address, chainId).catch((error) => {
        this.logger.error(
          `Failed to fetch rewards for chain ${chainId}, skipping:`,
          error instanceof Error ? error.message : error,
        );
        return []; // Return empty array on error, don't fail the entire request
      }),
    );

    const allChainRewardsArrays = await Promise.all(chainRewardsPromises);

    // Flatten and process all rewards
    for (const chainRewards of allChainRewardsArrays) {
      for (const chainData of chainRewards) {
        // Ensure rewards is an array
        if (!chainData.rewards || !Array.isArray(chainData.rewards)) {
          this.logger.warn(
            `Invalid rewards data for chain ${chainData.chain?.id || 'unknown'}, skipping`,
          );
          continue;
        }

        const chainId = chainData.chain.id;

        // Prepare claim data collection for this chain
        const claimTokenAddresses: Address[] = [];
        const claimAmounts: string[] = [];
        const claimProofs: string[][] = [];

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

          // Build claim data if there's unclaimed amount
          const unclaimedAmount = BigInt(merklReward.amount) - BigInt(merklReward.claimed);
          if (unclaimedAmount > 0n) {
            claimTokenAddresses.push(token.address);
            claimAmounts.push(merklReward.amount); // Use total amount for contract
            claimProofs.push(merklReward.proofs);
          }

          const incentives: Incentive[] = [];

          const matchingIncentives = this.findMatchingIncentives(allIncentives, token);
          incentives.push(...matchingIncentives);

          // Only add UserReward if we found at least one matching incentive

          const userReward: UserReward = {
            token,
            source: IncentiveSource.MERKL_API, // All Merkl rewards normalized to MERKL_API
            claimableAmount: BigInt(merklReward.pending),
            claimableAmountFormatted: Number(
              formatUnits(BigInt(merklReward.pending), token.decimals),
            ),
            totalAmount: BigInt(merklReward.amount),
            claimLink: this.claimLink,
            incentives,
          };

          userRewards.push(userReward);
        }

        // Build ClaimData for this chain if there are claimable rewards
        if (claimTokenAddresses.length > 0 && claimAmounts.length > 0 && claimProofs.length > 0) {
          const distributorAddress = getMerklDistributorAddress(chainId);

          const claimData: ClaimData = {
            source: IncentiveSource.MERKL_API,
            chainId,
            contractAddress: distributorAddress,
            functionName: 'claim',
            abi: MERKL_DISTRIBUTOR_ABI,
            args: [
              [address], // users array with single user
              claimTokenAddresses,
              claimAmounts,
              claimProofs,
            ],
          };

          claimDataByChain.set(chainId, claimData);
        }
      }
    }

    const claimData = Array.from(claimDataByChain.values());

    return { rewards: userRewards, claimData };
  }

  private async fetchMerklUserRewardsForChain(
    address: Address,
    chainId: number,
  ): Promise<MerklUserRewardsChainResponse[]> {
    // breakdownPage=0 is required by Merkl API (we don't paginate breakdowns)
    const url = `${this.merklApiUrl}/${address}/rewards?chainId=${chainId}&breakdownPage=0`;

    this.logger.debug(`Fetching Merkl rewards for ${address} on chain ${chainId}`);

    try {
      const fetchResponse = await fetchWithTimeout(url);
      const rawText = await fetchResponse.text();

      // Parse JSON response
      let responseData;
      try {
        responseData = JSON.parse(rawText);
      } catch (parseError) {
        this.logger.error(`Failed to parse JSON for chain ${chainId}`, parseError);
        return [];
      }

      // Handle both array and object responses
      let response: MerklUserRewardsChainResponse[];
      if (Array.isArray(responseData)) {
        response = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // If it's an object, wrap it in an array
        response = [responseData as MerklUserRewardsChainResponse];
      } else {
        // Invalid response format
        this.logger.warn(`Unexpected response format for chain ${chainId}`, typeof responseData);
        return [];
      }

      // Validate and filter response items
      const validResponses = response.filter((item) => {
        if (!item || typeof item !== 'object') {
          this.logger.warn(`Invalid response item for chain ${chainId}`);
          return false;
        }
        // Ensure rewards field exists and is an array
        if (item.rewards && !Array.isArray(item.rewards)) {
          this.logger.warn(
            `Rewards field is not an array for chain ${chainId}`,
            typeof item.rewards,
          );
          return false;
        }
        return true;
      });

      return validResponses;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Merkl user rewards for ${address} on chain ${chainId}:`,
        error,
      );
      return [];
    }
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
