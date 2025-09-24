import { Incentive, IncentiveSource, IncentiveType, RewardType, Status } from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import { campaignsData } from './campaigns';
import campaignsRoundsFile from './rounds.json';
import { CampaignName, Round } from './types';

export class ACIProvider implements IncentiveProvider {
  claimLink = 'https://apps.aavechan.com/merit';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const incentives: Incentive[] = [];

    for (const [campaignName, campaign] of Object.entries(campaignsData)) {
      // const campaign = campaignsData[campaignName as CampaignName];

      const rounds: Round[] = campaignsRoundsFile[campaignName as CampaignName];
      const lastRound = rounds[rounds.length - 1]; // Get the latest round only

      if (!lastRound) continue;

      const status = this.getStatus(
        Number(lastRound.startTimestamp),
        Number(lastRound.endTimestamp),
      );

      incentives.push({
        name: campaign.actionName ?? campaign.displayName,
        description: campaign.actionName ?? campaign.displayName,
        claimLink: this.claimLink,
        chainId: campaign.actionToken.chainId,
        rewardedToken: campaign.actionToken,
        rewardToken: campaign.rewardToken,
        apr: lastRound.apr ? parseFloat(lastRound.apr) : undefined,
        budget: lastRound.budget ? lastRound.budget : undefined,
        maxBudget: lastRound.maxBudget ? lastRound.maxBudget : undefined,
        startTimestamp: Number(lastRound.startTimestamp),
        endTimestamp: Number(lastRound.endTimestamp),
        incentiveType: IncentiveType.OFFCHAIN,
        rewardType: RewardType.TOKEN,
        infosLink: campaign.infosLink,
        status,
      });
    }

    if (fetchOptions?.chainId) {
      return incentives.filter((i) => i.chainId === fetchOptions.chainId);
    }

    console.log('ACI incentives:', incentives.length);

    return incentives;
  }

  private getStatus(start: number, end: number): Status {
    const now = Date.now();
    if (now < start) return Status.UPCOMING;
    if (now >= start && now <= end) return Status.LIVE;
    return Status.PAST;
  }

  // async getIncentives(): Promise<Incentive[]> {
  //   const campaignsRounds = campaignsRoundsFile as Rounds;

  //   const incentives: Incentive[] = [];

  //   for (const [campaignName, rounds] of Object.entries(campaignsRounds)) {
  //     const lastRound = rounds[rounds.length - 1]; // Get the latest round only

  //     if (!lastRound) continue;

  //     // check if campaignName is of type CampaignName
  //     if (!Object.keys(campaignsData).includes(campaignName)) continue;

  //     for (const round of rounds) {
  //       const campaign = campaignsData[campaignName as CampaignName];

  //       const status = this.getStatus(Number(round.startTimestamp), Number(round.endTimestamp));

  //       incentives.push({
  //         name: campaign.actionName ?? campaign.displayName,
  //         description: campaign.actionName ?? campaign.displayName,
  //         claimLink: this.claimLink,
  //         chainId: campaign.actionToken.chainId,
  //         rewardedToken: campaign.actionToken,
  //         rewardToken: campaign.rewardToken,
  //         apr: round.apr ? parseFloat(round.apr) : undefined,
  //         budget: round.budget ? BigInt(round.budget) : undefined,
  //         maxBudget: round.maxBudget ? BigInt(round.maxBudget) : undefined,
  //         startTimestamp: Number(round.startTimestamp),
  //         endTimestamp: Number(round.endTimestamp),
  //         incentiveType: IncentiveType.OFFCHAIN,
  //         rewardType: RewardType.TOKEN,
  //         infosLink: campaign.infosLink,
  //         status,
  //       });
  //     }
  //   }
  //   return incentives;
  // }

  async isHealthy(): Promise<boolean> {
    try {
      return Object.keys(campaignsRoundsFile).length > 0;
    } catch {
      return false;
    }
  }

  getSource() {
    return IncentiveSource.ACI_ROUNDS;
  }
}
