import crypto from 'crypto';
import { Address } from 'viem';

import { createLogger } from '@/config/logger.js';
import PRICE_FEED_ORACLES from '@/constants/price-feeds/index.js';
import { tokenWrapperMapping } from '@/constants/wrapper-address.js';
import { getAaveTokenInfo } from '@/lib/aave/aave-tokens.js';
import { toNonEmpty } from '@/lib/utils/non-empty-array.js';
import {
  ACIProvider,
  ExternalPointsProvider,
  FetchOptions,
  IncentiveProvider,
  MerklProvider,
  OnchainProvider,
} from '@/providers/index.js';
import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  RawIncentive,
  Status,
  Token,
} from '@/types/index.js';

export class IncentivesService {
  private logger = createLogger('IncentivesService');

  public providers: IncentiveProvider[] = [
    new ACIProvider(),
    new MerklProvider(),
    new ExternalPointsProvider(),
    new OnchainProvider(),
  ];

  async getIncentives(filters: FetchOptions = {}): Promise<Incentive[]> {
    const allRawIncentives = await this.fetchIncentives(filters);

    let allIncentives: Incentive[] = [];

    for (const incentive of allRawIncentives) {
      const id = this.generateIncentiveId({
        source: incentive.source,
        chainId: incentive.chainId,
        rewardedTokenAddresses: incentive.rewardedTokens.map((t) => t.address),
        reward:
          incentive.type === IncentiveType.TOKEN
            ? incentive.rewardToken.address
            : incentive.point.name,
      });
      allIncentives.push({
        ...incentive,
        id,
      });
    }

    this.enrichedTokens(allIncentives);

    allIncentives = this.applyFilters(allIncentives, filters);

    allIncentives = this.gatherEqualIncentives(allIncentives);

    allIncentives = this.sort(allIncentives);

    return allIncentives;
  }

  async fetchIncentives(fetchOptions?: FetchOptions): Promise<RawIncentive[]> {
    const allIncentives: RawIncentive[] = [];

    let providersFiltered = fetchOptions?.source
      ? this.providers.filter((provider) => fetchOptions.source?.includes(provider.incentiveSource))
      : this.providers;

    // filter by incentive type, but if type is not specified on provider, include it
    providersFiltered = fetchOptions?.type
      ? this.providers.filter((provider) =>
          provider.incentiveType && fetchOptions.type
            ? fetchOptions.type.includes(provider.incentiveType)
            : true,
        )
      : this.providers;

    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      providersFiltered.map((provider) => provider.getIncentives(fetchOptions)),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allIncentives.push(...result.value);
      } else {
        this.logger.error(
          `Provider ${providersFiltered[index]?.incentiveSource} failed:`,
          result.reason,
        );
      }
    });

    return allIncentives;
  }

  private generateIncentiveId({
    source,
    chainId,
    rewardedTokenAddresses,
    reward,
  }: {
    source: IncentiveSource;
    chainId: number;
    rewardedTokenAddresses: Address[];
    reward: Address | string; // rewardToken or point name
  }): string {
    const normalizedRewarded = rewardedTokenAddresses.join('-').toLowerCase().replace('0x', '');
    const normalizedReward = reward.toLowerCase().replace('0x', '');

    const uniqueString = `${source}:${chainId}:${normalizedRewarded}:${normalizedReward}`;

    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');

    return `inc_${hash.substring(0, 16)}`; // 20 chars total
  }

  private applyFilters(incentives: Incentive[], filters: FetchOptions): Incentive[] {
    let incentivesFiltered = [...incentives];

    // Rewarded token addresses filter
    if (filters.rewardedTokenAddress !== undefined) {
      const rewardedTokenAddressesNormalized = filters.rewardedTokenAddress.map((address) =>
        address.toLowerCase(),
      );
      incentivesFiltered = incentivesFiltered.filter((i) =>
        i.rewardedTokens.some((t) =>
          rewardedTokenAddressesNormalized.includes(t.address.toLowerCase()),
        ),
      );
    }

    // Reward token addresses filter
    if (filters.rewardTokenAddress !== undefined) {
      const rewardedTokenAddressesNormalized = filters.rewardTokenAddress.map((address) =>
        address.toLowerCase(),
      );
      incentivesFiltered = incentivesFiltered.filter(
        (i) =>
          i.type === IncentiveType.TOKEN &&
          rewardedTokenAddressesNormalized.includes(i.rewardToken.address.toLowerCase()),
      );
    }

    // Chain ID filter
    if (filters.chainId !== undefined) {
      const chainIds = filters.chainId;
      incentivesFiltered = incentivesFiltered.filter((i) => chainIds.includes(i.chainId));
    }

    // Status filter
    if (filters.status !== undefined) {
      const status = filters.status;
      incentivesFiltered = incentivesFiltered.filter((i) => status.includes(i.status));
    }

    // Incentive source filter
    if (filters.source !== undefined) {
      const sources = filters.source;
      incentivesFiltered = incentivesFiltered.filter((i) => sources.includes(i.source));
    }

    // Incentive type filter
    if (filters.type !== undefined) {
      const types = filters.type;
      incentivesFiltered = incentivesFiltered.filter((i) => types.includes(i.type));
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
    let incentivesSorted = incentives.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    incentivesSorted = this.sortIncentivesCampaigns(incentivesSorted);

    return incentivesSorted;
  }

  private enrichedTokens(incentives: Incentive[]) {
    incentives.forEach((incentive) => {
      try {
        incentive.rewardedTokens = toNonEmpty(incentive.rewardedTokens.map(this.enrichedToken));
      } catch {
        this.logger.error(
          `Incentive ${incentive.id} has no valid rewarded tokens after enrichment`,
        );
      }
      if (incentive.type === IncentiveType.TOKEN) {
        incentive.rewardToken = this.enrichedToken(incentive.rewardToken);
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
        source: provider.incentiveSource,
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

  private gatherEqualIncentives = (incentives: Incentive[]): Incentive[] => {
    const getMaxTimestamp = (campaigns: CampaignConfig[]): number => {
      return Math.max(...campaigns.map((campaign) => campaign.endTimestamp || 0));
    };

    const incentiveMap: Record<string, Incentive> = {};

    for (const incentive of incentives) {
      const existingIncentive = incentiveMap[incentive.id];
      if (existingIncentive) {
        const mergedCampaignsConfigs = [
          ...(existingIncentive.allCampaignsConfigs || []),
          ...(incentive.allCampaignsConfigs || []),
        ];

        // Determine the most relevant currentCampaignConfig (prefer the more recent)
        if (
          getMaxTimestamp(existingIncentive.allCampaignsConfigs || []) >
          getMaxTimestamp(incentive.allCampaignsConfigs || [])
        ) {
          existingIncentive.allCampaignsConfigs = mergedCampaignsConfigs;
        } else {
          incentive.allCampaignsConfigs = mergedCampaignsConfigs;
          incentiveMap[incentive.id] = incentive;
        }
      } else {
        incentiveMap[incentive.id] = incentive;
      }
    }

    return Object.values(incentiveMap);
  };

  private sortIncentivesCampaigns = (incentives: Incentive[]): Incentive[] => {
    // use startTimestamp because it is always defined
    const sortCampaignsByEndTimestamp = (campaigns: CampaignConfig[]): CampaignConfig[] => {
      return campaigns.sort((a, b) => a.startTimestamp - b.startTimestamp);
    };

    return incentives.map((incentive) => {
      if (incentive.allCampaignsConfigs) {
        incentive.allCampaignsConfigs = sortCampaignsByEndTimestamp(incentive.allCampaignsConfigs);
      }
      return incentive;
    });
  };
}
