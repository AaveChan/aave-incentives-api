import { CACHE_TTLS } from '@/config/cache-ttls.js';
import { createLogger } from '@/config/logger.js';
import { fetchWithTimeout } from '@/lib/http/fetch-with-timeout.js';
import { toNonEmpty } from '@/lib/utils/non-empty-array.js';
import { getCurrentTimestamp } from '@/lib/utils/timestamp.js';
import {
  CampaignConfig,
  IncentiveSource,
  IncentiveType,
  NonEmptyTokens,
  ProviderName,
  RawIncentive,
  RawTokenIncentive,
  Status,
  Token,
} from '@/types/index.js';

import { BaseIncentiveProvider } from '../base.provider.js';
import { Actions, Campaign, Token as AciInfraToken } from './types.js';

export class ACIProvider extends BaseIncentiveProvider {
  name = ProviderName.ACI;
  incentiveSource = IncentiveSource.ACI_MASIV_API;
  override incentiveType = IncentiveType.TOKEN as const;

  logger = createLogger(this.name);

  claimLink = 'https://apps.aavechan.com/merit';
  apiUrl = 'https://apps.aavechan.com/api/merit/all-actions-data';

  constructor() {
    super(CACHE_TTLS.PROVIDER.ACI);
  }

  async _getIncentives(): Promise<RawIncentive[]> {
    const aciIncentives = await this.fetchIncentives();

    const incentives: RawIncentive[] = [];

    // things to fix
    // - ✅ provide rounds with timestamp instead of blockNumber through ACI API
    // - ✅ setupAction data not in an array, or create a function to gather all data from the array in 1 string
    // - ✅ make the name of ACIInfraToken type defined
    // - ❌ switch from action.actionTokens to action.actionToken (no array)
    for (const [, action] of Object.entries(aciIncentives)) {
      const currentCampaignConfig = this.getCampaignConfigFromStatus(action.campaigns, Status.LIVE);
      const nextCampaignConfig = this.getCampaignConfigFromStatus(action.campaigns, Status.SOON);
      const allCampaignsConfigs = this.getAllCampaignsConfigs(action.campaigns);

      let status: Status = Status.PAST;
      if (nextCampaignConfig) {
        status = Status.SOON;
      }
      if (currentCampaignConfig) {
        status = Status.LIVE;
      }

      const description = action.info.wholeDescriptionString;

      const rawInvolvedTokens = action.actionTokens.map(this.aciInfraTokenToIncentiveToken);
      let involvedTokens: NonEmptyTokens;
      try {
        involvedTokens = toNonEmpty(rawInvolvedTokens);
      } catch {
        this.logger.error(
          `No valid rewarded tokens for action ${action.displayName} on chain ${action.chainId}`,
        );
        continue;
      }
      const rewardedToken = involvedTokens[0];

      const rewardToken = this.aciInfraTokenToIncentiveToken(action.rewardToken);

      const incentive: RawTokenIncentive = {
        name: action.displayName,
        description: description ? description : '',
        claimLink: this.claimLink,
        chainId: action.chainId,
        type: this.incentiveType,
        source: this.incentiveSource,
        rewardedToken,
        involvedTokens,
        rewardToken: rewardToken,
        currentApr: action.apr,
        currentCampaignConfig,
        nextCampaignConfig,
        allCampaignsConfigs,
        infosLink: action.info.forumLink.link,
        status,
      };

      incentives.push(incentive);
    }

    return incentives;
  }

  private aciInfraTokenToIncentiveToken = (aciInfraToken: AciInfraToken): Token => {
    const token: Token = {
      name: aciInfraToken.name,
      symbol: aciInfraToken.symbol,
      address: aciInfraToken.address,
      chainId: aciInfraToken.chainId,
      decimals: aciInfraToken.decimals,
      priceFeed: aciInfraToken.book?.ORACLE,
    };

    return token;
  };

  private async fetchIncentives(): Promise<Actions> {
    const url = new URL(this.apiUrl);

    let allAciIncentives: Actions = {};

    const response = await fetch(url.toString());
    allAciIncentives = (await response.json()) as Actions;

    return allAciIncentives;
  }

  private getCampaignConfigFromStatus = (campaigns: Campaign[], status: Status) => {
    // Campaigns are based on mainnet block numbers
    const currentTimestamp = getCurrentTimestamp();
    const currentCampaign = campaigns.find((campaign) => {
      return (
        (status == Status.LIVE &&
          currentTimestamp >= Number(campaign.startTimestamp) &&
          currentTimestamp <= Number(campaign.endTimestamp)) ||
        (status == Status.SOON && currentTimestamp < Number(campaign.startTimestamp))
      );
    });

    if (!currentCampaign) return undefined;

    return this.getCampaignConfig(currentCampaign);
  };

  private getAllCampaignsConfigs = (campaigns: Campaign[]) => {
    return campaigns.map((campaign) => this.getCampaignConfig(campaign));
  };

  private getCampaignConfig = (campaign: Campaign) => {
    let budget;

    if (campaign.fixedBudget !== undefined) {
      budget = campaign.fixedBudget;
    } else if (campaign.fixedApr?.maxBudget !== undefined) {
      budget = campaign.fixedApr.maxBudget;
    }

    const campaignConfig: CampaignConfig = {
      startTimestamp: Number(campaign.startTimestamp),
      endTimestamp: Number(campaign.endTimestamp),
      budget,
      apr: campaign.fixedApr ? campaign.fixedApr.apr : undefined,
    };

    return campaignConfig;
  };

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(this.apiUrl);
      return response.ok;
    } catch {
      return false;
    }
  }
}
