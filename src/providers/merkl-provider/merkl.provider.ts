import { Address, formatUnits, getAbiItem } from 'viem';
import { ink } from 'viem/chains';

import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { createLogger } from '@/config/logger.js';
import { MERKL_DISTRIBUTOR_ABI } from '@/constants/abis/merkl-distributor.js';
import { ACI_ADDRESSES } from '@/constants/aci-addresses.js';
import { getMerklDistributorAddress } from '@/constants/merkl-distributors.js';
import { AaveTokenType, getAaveToken, getAaveTokenInfo } from '@/lib/aave/aave-tokens.js';
import { fetchWithTimeout } from '@/lib/http/fetch-with-timeout.js';
import { tokenToString } from '@/lib/token/token.js';
import { uniqueArray } from '@/lib/utils/array.js';
import { toNonEmpty } from '@/lib/utils/non-empty-array.js';
import { getCurrentTimestamp } from '@/lib/utils/timestamp.js';
import {
  BaseIncentive,
  CampaignConfig,
  ClaimData,
  FetchUserRewardsOptions,
  IncentiveSource,
  IncentiveType,
  NonEmptyTokens,
  ProviderName,
  RawIncentive,
  RawPointWithoutValueIncentive,
  RawTokenIncentive,
  Token,
  UserReward,
} from '@/types/index.js';

import { BaseIncentiveProvider } from '../base.provider.js';
import { FetchOptions } from '../index.js';
import {
  Campaign,
  MerklOpportunityWithCampaign,
  MerklRewardToken,
  MerklToken,
  MerklUserRewardsChainResponse,
  RewardTokenType as MerklRewardTokenType,
} from './types.js';

type MerklApiOptions = {
  campaigns?: boolean;
  chainId?: string;
  mainProtocolId?: string;
  status?: string;
};

export type MainProtocolId = (typeof MainProtocolId)[keyof typeof MainProtocolId];

export const MainProtocolId = {
  AAVE: 'aave',
  TYDRO: 'tydro',
} as const;

const chainProtocolMap: Record<number, MainProtocolId> = {
  [ink.id]: MainProtocolId.TYDRO, // Aave on Ink is managed by Tydro
  // Add more chain-specific protocols here
  // [OTHER_CHAIN_ID]: MainProtocolId.OTHER,
};

// Default protocol for all other chains
const DEFAULT_PROTOCOL = MainProtocolId.AAVE;

const WHITELISTED_CREATORS = [...ACI_ADDRESSES];
export class MerklProvider extends BaseIncentiveProvider {
  name = ProviderName.Merkl;
  incentiveSource = IncentiveSource.MERKL_API;

  merklApiUrl = 'https://api.merkl.xyz/v4';
  opportunityApiUrl = `${this.merklApiUrl}/opportunities`;
  userRewardsApiUrl = `${this.merklApiUrl}/users`;

  claimLink = 'https://app.merkl.xyz/';

  private logger = createLogger(this.name);

  constructor() {
    super(CACHE_TTLS.PROVIDER.MERKL);
  }

  // INCENTIVES

  async _getIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]> {
    const allIncentives: RawIncentive[] = [];

    const protocolIds = this.getProtocolIds(fetchOptions);
    const merklOpportunities = await this.fetchIncentives(protocolIds);

    for (const opportunity of merklOpportunities) {
      const rewardedMerklTokens = opportunity.tokens;
      const rewardedMerklTokensFiltered = this.filterMerklTokens(rewardedMerklTokens);
      let rawInvolvedTokens = rewardedMerklTokensFiltered.map(this.merklInfraTokenToIncentiveToken);

      let rewardedToken: Token | undefined;

      if (opportunity.explorerAddress) {
        const explorerToken = getAaveToken({
          tokenAddress: opportunity.explorerAddress,
          chainId: opportunity.chainId,
        });
        if (explorerToken) {
          const isAlreadyIncluded = rawInvolvedTokens.find(
            (t) => t.address === explorerToken.address && t.chainId === explorerToken.chainId,
          );
          if (!isAlreadyIncluded) {
            rawInvolvedTokens = [...rawInvolvedTokens, explorerToken];
          }
          rewardedToken = explorerToken;
        }
      }

      let involvedTokens: NonEmptyTokens;
      try {
        involvedTokens = toNonEmpty(rawInvolvedTokens);
      } catch {
        this.logger.error(
          `No valid rewarded tokens for opportunity ${opportunity.name} on chain ${opportunity.chainId}`,
        );
        continue;
      }

      // If explorerToken is not found, set the first involved token as rewarded token
      if (!rewardedToken) {
        this.logger.error(
          `No explorer token for opportunity ${opportunity.name} on chain ${opportunity.chainId}, setting the first involved token as rewarded token`,
        );
        rewardedToken = involvedTokens[0];
      }

      const opportunityRewardTokens = this.getRewardTokensOpportunity(opportunity);

      for (const merklRewardToken of opportunityRewardTokens) {
        const rewardToken = this.merklInfraTokenToIncentiveToken(merklRewardToken);

        const merklRewardType = merklRewardToken.type;
        const rewardType = merklRewardType ? this.mapRewardType(merklRewardType) : null;

        if (!rewardType) {
          this.logger.error(`Unknown reward type for token ${tokenToString(rewardToken)}`);
          continue;
        }

        // get campaign of the current reward token only
        const campaigns = opportunity.campaigns.filter(
          (campaign) => campaign.rewardToken.address === rewardToken.address,
        );

        const { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs } =
          this.getCampaignConfigs(campaigns);

        const baseIncentive: Omit<BaseIncentive, 'type'> = {
          name: opportunity.name,
          description: opportunity.description,
          claimLink: this.claimLink,
          chainId: opportunity.chainId,
          rewardedToken,
          involvedTokens,
          source: this.incentiveSource,
          currentCampaignConfig,
          nextCampaignConfig,
          allCampaignsConfigs,
          status: opportunity.status,
        };

        if (rewardType === IncentiveType.POINT) {
          const protocolId = this.getProtocolId(opportunity.chainId);
          const pointIncentive: RawPointWithoutValueIncentive = {
            ...baseIncentive,
            type: IncentiveType.POINT_WITHOUT_VALUE,
            point: {
              name: rewardToken.name,
              protocol: protocolId,
              token: rewardToken,
            },
          };
          allIncentives.push(pointIncentive);
        }
        if (rewardType === IncentiveType.TOKEN) {
          const pointIncentive: RawTokenIncentive = {
            ...baseIncentive,
            type: IncentiveType.TOKEN,
            rewardToken,
            currentApr: opportunity.apr,
          };
          allIncentives.push(pointIncentive);
        }
      }
    }

    return allIncentives;
  }

  private getProtocolId(chainId: number): MainProtocolId {
    return chainProtocolMap[chainId] || DEFAULT_PROTOCOL;
  }

  private getProtocolIds(fetchOptions?: FetchOptions): MainProtocolId[] {
    const chainIds = fetchOptions?.chainId;
    const protocolIds = chainIds
      ? chainIds.map((chainId) => this.getProtocolId(chainId))
      : [DEFAULT_PROTOCOL];
    return uniqueArray(protocolIds);
  }

  override getCacheKey(fetchOptions?: FetchOptions): string {
    const protocolIds = this.getProtocolIds(fetchOptions);
    return `provider:${this.name}:${protocolIds.sort().join(',')}`;
  }

  private async fetchIncentives(
    mainProtocolIds: MainProtocolId[],
  ): Promise<MerklOpportunityWithCampaign[]> {
    const url = new URL(this.opportunityApiUrl);

    const merklApiOptions: MerklApiOptions = {
      campaigns: true,
      mainProtocolId: mainProtocolIds.join(','),
    };

    for (const [key, value] of Object.entries(merklApiOptions)) {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    }

    let allMerklOpportunities: MerklOpportunityWithCampaign[] = [];

    let merklOpportunities: MerklOpportunityWithCampaign[] = [];
    const itemsPerPage = 100;
    url.searchParams.set('items', itemsPerPage.toString());
    let page = 0;

    do {
      url.searchParams.set('page', page.toString());
      const response = await fetch(url.toString());
      merklOpportunities = (await response.json()) as MerklOpportunityWithCampaign[];

      allMerklOpportunities.push(...merklOpportunities);
      page++;
    } while (merklOpportunities.length > 0);

    // Filter campaigns to only include whitelisted creators
    allMerklOpportunities.forEach(
      (opportunity) =>
        (opportunity.campaigns = opportunity.campaigns.filter((campaign) =>
          WHITELISTED_CREATORS.includes(campaign.creatorAddress),
        )),
    );
    allMerklOpportunities = allMerklOpportunities.filter(
      (opportunity) => opportunity.campaigns.length > 0,
    );

    allMerklOpportunities = allMerklOpportunities.filter((opportunity) => {
      const rewardedTokenAddress = opportunity.explorerAddress;
      if (!rewardedTokenAddress) {
        return false;
      } else {
        const aaveTokenInfo = getAaveTokenInfo({
          tokenAddress: rewardedTokenAddress,
          chainId: opportunity.chainId,
        });
        if (!aaveTokenInfo?.type || aaveTokenInfo.type === AaveTokenType.STATA) {
          return false;
        }
      }
      return true;
    });

    return allMerklOpportunities;
  }

  private getRewardTokensOpportunity = (
    opportunity: MerklOpportunityWithCampaign,
  ): MerklToken[] => {
    const opportunityRewardTokens = opportunity.campaigns.map((campaign) => campaign.rewardToken);

    const uniqueOpportunityRewardTokens = Array.from(
      new Set(opportunityRewardTokens.map((t) => t.address)),
    ).map((address) => {
      return opportunityRewardTokens.find((t) => t.address === address);
    });

    const filteredUniqueOpportunityRewardTokens = uniqueOpportunityRewardTokens.filter(
      (token) => token !== undefined,
    );

    return filteredUniqueOpportunityRewardTokens;
  };

  private getCampaignConfigs = (campaigns: Campaign[]) => {
    let currentCampaignConfig: CampaignConfig | undefined;
    let nextCampaignConfig: CampaignConfig | undefined;

    const currentTimestamp = getCurrentTimestamp();
    const currentCampaign = campaigns.filter(
      (campaign) =>
        Number(campaign.startTimestamp) <= currentTimestamp &&
        Number(campaign.endTimestamp) >= currentTimestamp,
    )[0];
    if (currentCampaign) {
      currentCampaignConfig = this.getCampaignConfig(currentCampaign);
    }

    const nextCampaign = campaigns.filter(
      (campaign) =>
        Number(campaign.startTimestamp) > currentTimestamp &&
        Number(campaign.endTimestamp) > currentTimestamp,
    )[0];
    if (nextCampaign) {
      nextCampaignConfig = this.getCampaignConfig(nextCampaign);
    }

    const allCampaignsConfigs = campaigns.map((campaign) => this.getCampaignConfig(campaign));

    return { currentCampaignConfig, nextCampaignConfig, allCampaignsConfigs };
  };

  private getCampaignConfig = (campaign: Campaign) => {
    const aprSetup = campaign.params.distributionMethodParameters?.distributionSettings.apr;

    let apr;
    if (aprSetup) {
      apr = Number(aprSetup) * 100;
    }

    const currentCampaignForOpportunity: CampaignConfig = {
      startTimestamp: Number(campaign.startTimestamp),
      endTimestamp: Number(campaign.endTimestamp),
      budget: campaign.amount,
      apr,
    };

    return currentCampaignForOpportunity;
  };

  private mapRewardType(type: MerklRewardTokenType) {
    switch (type) {
      case MerklRewardTokenType.TOKEN:
        return IncentiveType.TOKEN;
      case MerklRewardTokenType.PRETGE:
        return IncentiveType.POINT;
    }
  }

  private filterMerklTokens = (tokens: MerklToken[]): MerklToken[] =>
    tokens.filter((token) => {
      const aaveTokenInfo = getAaveTokenInfo({
        tokenAddress: token.address,
        chainId: token.chainId,
      });
      if (
        !aaveTokenInfo?.type ||
        aaveTokenInfo.type === AaveTokenType.STATA ||
        aaveTokenInfo.type === AaveTokenType.UNDERLYING
      ) {
        return false;
      }
      return true;
    });

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(this.opportunityApiUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  // USER REWARDS

  protected override async _getRewards(
    address: Address,
    chainIds: number[],
    _options?: FetchUserRewardsOptions,
  ) {
    const userRewards: UserReward[] = [];
    const claimDataByChain: Map<number, ClaimData> = new Map();

    if (chainIds.length === 0) {
      this.logger.warn('No chainIds specified for user rewards fetch');
      return { rewards: [], claimData: [] };
    }

    // Fetch rewards for all chains in parallel
    const chainRewardsPromises = chainIds.map((chainId) =>
      this.fetchMerklUserRewardsForChain(address, chainId).catch((error) => {
        this.logger.error(
          `Failed to fetch rewards for chain ${chainId}, skipping:`,
          error instanceof Error ? error.message : error,
        );
        return [];
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
        const claimUsers: Address[] = []; // Even if there is only one user, Merkl expects an array length equal to the number of tokens claimed
        const claimTokenAddresses: Address[] = [];
        const claimAmounts: string[] = [];
        const claimProofs: string[][] = [];

        for (const merklReward of chainData.rewards) {
          const rewardToken = merklReward.token;

          // Create Token object
          const token: Token = this.merklInfraTokenToIncentiveToken(rewardToken);

          // merklReward:
          // - amount: amount available to claim
          // - claimed: amount already claimed
          // - pending: amount pending (not yet claimable, but soon to be)

          // Build claim data if there's unclaimed amount
          const unclaimedAmount = BigInt(merklReward.amount) - BigInt(merklReward.claimed);
          if (unclaimedAmount > 0n) {
            claimUsers.push(address);
            claimTokenAddresses.push(token.address);
            claimAmounts.push(merklReward.amount); // Use total amount for contract
            claimProofs.push(merklReward.proofs);
          }

          const userReward: UserReward = {
            token,
            source: IncentiveSource.MERKL_API,
            claimableAmount: unclaimedAmount,
            claimableAmountFormatted: Number(formatUnits(unclaimedAmount, token.decimals)),
            totalAmount: BigInt(merklReward.amount),
            claimLink: this.claimLink,
            incentives: [], // Empty array - matching will be done in service layer
          };

          userRewards.push(userReward);
        }

        // Build ClaimData for this chain if there are claimable rewards
        if (claimTokenAddresses.length > 0 && claimAmounts.length > 0 && claimProofs.length > 0) {
          const distributorAddress = getMerklDistributorAddress(chainId);

          const abiClaim = [
            getAbiItem({
              abi: MERKL_DISTRIBUTOR_ABI,
              name: 'claim',
            }),
          ];

          const claimData: ClaimData = {
            source: IncentiveSource.MERKL_API,
            chainId,
            contractAddress: distributorAddress,
            functionName: 'claim',
            abi: abiClaim,
            args: [
              claimUsers, // users array with single user
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
    const url = `${this.userRewardsApiUrl}/${address}/rewards?chainId=${chainId}&breakdownPage=0`;

    this.logger.debug(`Fetching Merkl rewards for ${address} on chain ${chainId}`);

    try {
      const response = await fetch(url);
      const merklUserRewards = await response.json();

      if (Array.isArray(merklUserRewards)) {
        // Validate and filter response items
        const merklUserRewardsFiltered = merklUserRewards.filter((item) => {
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
        return merklUserRewardsFiltered;
      } else {
        // Invalid response format
        this.logger.warn(
          `Unexpected response format for chain ${chainId}`,
          typeof merklUserRewards,
        );
        return [];
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch Merkl user rewards for ${address} on chain ${chainId}:`,
        error,
      );
      return [];
    }
  }

  // COMMON METHODS

  private merklInfraTokenToIncentiveToken = (merklToken: MerklToken | MerklRewardToken): Token => {
    const token: Token = {
      name: (merklToken as MerklToken).name ?? merklToken.symbol,
      address: merklToken.address,
      symbol: merklToken.symbol,
      decimals: merklToken.decimals,
      chainId: merklToken.chainId,
      price: merklToken.price,
    };
    return token;
  };
}
