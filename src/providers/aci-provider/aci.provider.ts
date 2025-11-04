import { createLogger } from '@/config/logger';
import { getCurrentTimestamp } from '@/lib/utils/timestamp';
import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  RewardType,
  Status,
  Token,
  TokenReward,
} from '@/types';

import { IncentiveProvider } from '..';
import { Actions, Campaign, Token as AciInfraToken } from './types';

export class ACIProvider implements IncentiveProvider {
  source = IncentiveSource.ACI_ROUNDS;
  incentiveType = IncentiveType.OFFCHAIN;
  rewardType = RewardType.TOKEN as const;

  logger = createLogger('ACIProvider');

  claimLink = 'https://apps.aavechan.com/merit';
  apiUrl = 'https://apps.aavechan.com/api/merit/all-actions-data';

  async getIncentives(): Promise<Incentive[]> {
    const aciIncentives = await this.fetchIncentives();

    const incentives: Incentive[] = [];

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

      const actionToken = action.actionTokens[0];

      if (!actionToken) {
        this.logger.warn(
          `No action token defined for action ${action.displayName}, skipping incentive creation.`,
        );
        continue;
      }

      const rewardedToken = this.convertAciInfraTokenToIncentiveToken(actionToken);
      const rewardToken = this.convertAciInfraTokenToIncentiveToken(action.rewardToken);

      const tokenReward: TokenReward = {
        type: this.rewardType,
        token: rewardToken,
        apr: action.apr,
      };

      incentives.push({
        name: action.displayName,
        description: description ? description : '',
        claimLink: this.claimLink,
        chainId: action.chainId,
        rewardedToken,
        reward: tokenReward,
        currentCampaignConfig,
        nextCampaignConfig,
        allCampaignsConfigs,
        incentiveType: IncentiveType.OFFCHAIN,
        infosLink: action.info.forumLink.link,
        status,
      });
    }

    return incentives;
  }

  private convertAciInfraTokenToIncentiveToken = (aciInfraToken: AciInfraToken): Token => {
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
    const campaignConfig: CampaignConfig = {
      startTimestamp: Number(campaign.startTimestamp),
      endTimestamp: Number(campaign.endTimestamp),
      // budget: currentCampaign.budget ? currentCampaign.budget : undefined, // provided sometimes by ACI Infra, but sometimes wrong budget are defined (because overwritten by script)
      // apr: currentCampaign.apr ? currentCampaign.apr : undefined, // provided sometimes by ACI Infra (overwritten by script)
    };

    return campaignConfig;
  };

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
