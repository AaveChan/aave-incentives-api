import crypto from 'crypto';
import { Address } from 'viem';

import { HTTP_CONFIG } from '@/config/http.js';
import { createLogger } from '@/config/logger.js';
import PRICE_FEED_ORACLES from '@/constants/price-feeds/index.js';
import { wrapperTokenMappingBook } from '@/constants/wrapper-address.js';
import { getAaveTokenInfo } from '@/lib/aave/aave-tokens.js';
import { normalizeAddress } from '@/lib/address/address.js';
import { toNonEmpty } from '@/lib/utils/non-empty-array.js';
import { withTimeout } from '@/lib/utils/timeout.js';
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
  GlobalStatus,
  Incentive,
  IncentiveSource,
  IncentiveType,
  ProvidersStatus,
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
        involvedTokensAddresses: incentive.involvedTokens.map((t) => t.address),
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

  async getProvidersStatus(): Promise<ProvidersStatus> {
    const providersStatus: Record<string, boolean> = {};

    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const healthy = await provider.isHealthy();
          providersStatus[provider.name] = healthy;
        } catch {
          providersStatus[provider.name] = false;
        }
      }),
    );

    const values = Object.values(providersStatus);

    const isHealthy = values.every(Boolean);
    const isUnhealthy = values.every((v) => !v);

    const globalStatus = isHealthy
      ? GlobalStatus.HEALTHY
      : isUnhealthy
        ? GlobalStatus.DOWN
        : GlobalStatus.DEGRADED;

    return { status: globalStatus, providersStatus };
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
      providersFiltered.map((provider) =>
        withTimeout(
          provider.getIncentives(fetchOptions),
          HTTP_CONFIG.PROVIDER_TIMEOUT_MS,
          `Provider ${provider.incentiveSource} timeout`,
        ),
      ),
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
    involvedTokensAddresses,
    reward,
  }: {
    source: IncentiveSource;
    chainId: number;
    involvedTokensAddresses: Address[];
    reward: Address | string; // rewardToken or point name
  }): string {
    const normalizedRewarded = involvedTokensAddresses.join('-').toLowerCase().replace('0x', '');
    const normalizedReward = reward.toLowerCase().replace('0x', '');

    const uniqueString = `${source}:${chainId}:${normalizedRewarded}:${normalizedReward}`;

    const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');

    return `inc_${hash.substring(0, 16)}`; // 20 chars total
  }

  private applyFilters(incentives: Incentive[], filters: FetchOptions): Incentive[] {
    let incentivesFiltered = [...incentives];

    // Reward token addresses filter
    if (filters.rewardTokenAddress !== undefined) {
      const rewardedTokenAddressesNormalized = filters.rewardTokenAddress.map(normalizeAddress);
      incentivesFiltered = incentivesFiltered.filter(
        (i) =>
          i.type === IncentiveType.TOKEN &&
          rewardedTokenAddressesNormalized.includes(normalizeAddress(i.rewardToken.address)),
      );
    }

    // Rewarded token addresses filter
    if (filters.rewardedTokenAddress !== undefined) {
      const rewardedTokenAddressesNormalized = filters.rewardedTokenAddress.map(normalizeAddress);
      incentivesFiltered = incentivesFiltered.filter((i) =>
        rewardedTokenAddressesNormalized.includes(normalizeAddress(i.rewardedToken.address)),
      );
    }

    // Involved token addresses filter
    if (filters.involvedTokenAddress !== undefined) {
      const involvedTokenAddressesNormalized = filters.involvedTokenAddress.map(normalizeAddress);
      incentivesFiltered = incentivesFiltered.filter((i) =>
        i.involvedTokens.some((t) =>
          involvedTokenAddressesNormalized.includes(normalizeAddress(t.address)),
        ),
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
        incentive.rewardedToken = this.enrichedToken(incentive.rewardedToken);
        incentive.involvedTokens = toNonEmpty(incentive.involvedTokens.map(this.enrichedToken));
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
    const tokenBook = wrapperTokenMappingBook[token.chainId]?.[token.address];
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
