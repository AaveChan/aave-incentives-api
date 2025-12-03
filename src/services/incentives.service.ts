import { createLogger } from '@/config/logger.js';
import PRICE_FEED_ORACLES from '@/constants/price-feeds/index.js';
import { tokenWrapperMapping } from '@/constants/wrapper-address.js';
import { getAaveTokenInfo } from '@/lib/aave/aave-tokens.js';
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
    let allIncentives = await this.fetchIncentives(filters);

    this.enrichedTokens(allIncentives);

    allIncentives = this.applyFilters(allIncentives, filters);

    allIncentives = this.sort(allIncentives);

    allIncentives = this.gatherEqualIncentives(allIncentives);

    // // display the number of token that have a priceFeed undefined
    // const undefinedPricesFeedOracle = allIncentives.filter((incentive) => {
    //   return incentive.reward.type === 'TOKEN' && !incentive.reward.token.priceFeed;
    // });
    // this.logger.verbose(
    //   `There are ${undefinedPricesFeedOracle.length} incentives out of ${allIncentives.length} with undefined reward token priceFeed.`,
    // );

    return allIncentives;
  }

  async fetchIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const allIncentives: Incentive[] = [];

    const providersFiltered = this.providers.filter(
      (provider) => !fetchOptions?.source || provider.incentiveSource === fetchOptions.source,
    );

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

  private applyFilters(incentives: Incentive[], filters: FetchOptions): Incentive[] {
    let incentivesFiltered = [...incentives];

    // Chain ID filter
    if (filters.chainId !== undefined) {
      const chainIds = Array.isArray(filters.chainId) ? filters.chainId : [filters.chainId];
      incentivesFiltered = incentivesFiltered.filter((i) => chainIds.includes(i.chainId));
    }

    // Status filter
    if (filters.status !== undefined) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      incentivesFiltered = incentivesFiltered.filter((i) => statuses.includes(i.status));
    }

    // Incentive source filter
    if (filters.source !== undefined) {
      const sources = Array.isArray(filters.source) ? filters.source : [filters.source];
      incentivesFiltered = incentivesFiltered.filter((i) => sources.includes(i.source));
    }

    // Incentive type filter
    if (filters.type !== undefined) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
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
      incentive.rewardedTokens = incentive.rewardedTokens.map(this.enrichedToken);
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
        // Merge allCampaignsConfigs
        const mergedCampaignsConfigs = [
          ...(existingIncentive.allCampaignsConfigs || []),
          ...(incentive.allCampaignsConfigs || []),
        ];

        // Determine the most relevant currentCampaignConfig (prefer LIVE status)
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
        // console.log(`Adding new incentive with id ${incentive.id}`);
        incentiveMap[incentive.id] = incentive;
      }
    }

    return Object.values(incentiveMap);
  };

  private sortIncentivesCampaigns = (incentives: Incentive[]): Incentive[] => {
    const sortCampaignsByEndTimestamp = (campaigns: CampaignConfig[]): CampaignConfig[] => {
      return campaigns.sort((a, b) =>
        a.endTimestamp && b.endTimestamp ? a.endTimestamp - b.endTimestamp : 0,
      );
    };

    return incentives.map((incentive) => {
      if (incentive.allCampaignsConfigs) {
        incentive.allCampaignsConfigs = sortCampaignsByEndTimestamp(incentive.allCampaignsConfigs);
      }
      return incentive;
    });
  };
}
