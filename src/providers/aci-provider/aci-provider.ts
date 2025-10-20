import {
  CampaignConfig,
  Incentive,
  IncentiveSource,
  IncentiveType,
  RewardType,
  Status,
  Token,
} from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import campaignsRoundsFile from './rounds.json';
import { Actions, Campaign, Token as AciInfraToken } from './types';
import { getViemClient } from '@/clients/viem';
import { mainnet } from 'viem/chains';
export class ACIProvider implements IncentiveProvider {
  claimLink = 'https://apps.aavechan.com/merit';
  apiUrl = 'http://localhost:3000/api/merit/all-actions-data';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const aciIncentives = await this.fetchIncentives(fetchOptions);

    let incentives: Incentive[] = [];

    // 2 things to fix
    // - provide rounds with timestamp instead of blockNumber through ACI API
    // - setupAction data not in an array, or create a function to gather all data from the array in 1 string
    // - make the name of ACIInfraToken type defined
    for (const [actionName, action] of Object.entries(aciIncentives)) {
      const currentCampaignConfig = await this.getCampaignConfig(action.campaigns, Status.LIVE);
      // const nextCampaignConfig = await this.getCampaignConfig(action.campaigns, Status.UPCOMING);

      console.log('---------------- action:', actionName);
      console.log(currentCampaignConfig);
      // console.log(nextCampaignConfig);

      let status: Status | undefined;
      // if (nextCampaignConfig) {
      //   status = Status.UPCOMING;
      // }
      if (currentCampaignConfig) {
        status = Status.LIVE;
      }

      const description = action.info.actionsData[0]?.description; // mayb change it for not an array

      const actionToken = action.actionTokens[0] as AciInfraToken; // ensure it's defined (not clean but do the job)

      incentives.push({
        name: action.displayName,
        description: description ? description : '',
        claimLink: this.claimLink,
        chainId: action.chainId,
        rewardedToken: this.convertAciInfraTokenToIncentiveToken(actionToken),
        rewardToken: this.convertAciInfraTokenToIncentiveToken(action.rewardToken),
        apr: action.apr,
        currentCampaignConfig,
        // nextCampaignConfig,
        incentiveType: IncentiveType.OFFCHAIN,
        rewardType: RewardType.TOKEN,
        infosLink: action.info.forumLink.link,
        status,
      });
    }

    incentives = incentives.filter((i) =>
      fetchOptions?.chainId ? i.chainId === fetchOptions?.chainId : true,
    );

    console.log('ACI incentives:', incentives.length);

    return incentives;
  }

  private convertAciInfraTokenToIncentiveToken = (aciInfraToken: AciInfraToken): Token => {
    const token: Token = {
      name: aciInfraToken.name ? aciInfraToken.name : '', // TODO: fix the potential undefined name
      symbol: aciInfraToken.symbol,
      address: aciInfraToken.address,
      chainId: aciInfraToken.chainId,
      decimals: aciInfraToken.decimals,
    };

    return token;
  };

  private async fetchIncentives(fetchOptions?: FetchOptions): Promise<Actions> {
    const url = new URL(this.apiUrl);

    let allAciIncentives: Actions = {};

    const response = await fetch(url.toString());
    allAciIncentives = (await response.json()) as Actions;

    return allAciIncentives;
  }

  // private getStatus(start: number, end: number): Status {
  //   const now = Date.now();
  //   if (now < start) return Status.UPCOMING;
  //   if (now >= start && now <= end) return Status.LIVE;
  //   return Status.PAST;
  // }

  private getCampaignConfig = async (campaigns: Campaign[], status: Status) => {
    const client = getViemClient(mainnet.id);
    /**
     * Get the block generation speed in seconds/block (seconds per block)
     * @param client
     * @returns the number of seconds per block
     */
    const getBlockGenerationSpeed = async (chainId: number): Promise<number> => {
      const client = getViemClient(chainId);
      const blockNumber = 1_000_000n;
      const blockB = await client.getBlock();
      const blockA = await client.getBlock({
        blockNumber: blockB.number - blockNumber,
      });
      const duration = blockB.timestamp - blockA.timestamp;
      const speed = Number(duration) / Number(blockNumber);

      return speed;
    };

    // Helper function to get timestamp from block number
    async function getBlockTimestamp(blockNumber: bigint): Promise<bigint> {
      const block = await client.getBlock({ blockNumber });
      return block.timestamp;
    }

    /**
     * Get the corresponding block number on the other chain (with estimation)
     * Useful when the block number is in the future
     * @param timestamp
     * @param client
     * @returns
     */
    const getBlockTimestampEstimation = async (blockNumber: bigint) => {
      const mainChainCurrentBlock = await client.getBlock();
      const mainChainBlockGenerationSpeed = await getBlockGenerationSpeed(mainnet.id);
      const blockDuration = blockNumber - mainChainCurrentBlock.number;
      const timeDuration = BigInt(
        Math.floor(Number(blockDuration) * mainChainBlockGenerationSpeed),
      );

      const timestamp = mainChainCurrentBlock.timestamp + timeDuration;

      return timestamp;
    };

    const getBlockTimestampWithEstimation = async (blockNumber: bigint): Promise<bigint> => {
      const currentBlockNumber = await client.getBlockNumber();
      if (currentBlockNumber < blockNumber) {
        // The block number provided is in the future
        return getBlockTimestampEstimation(blockNumber);
      } else {
        return await getBlockTimestamp(blockNumber);
      }
    };

    // Campaigns are based on mainnet block numbers
    const currentBlockNumber = await getViemClient(mainnet.id).getBlockNumber();
    const currentCampaign = campaigns.find((campaign) => {
      return (
        (status === Status.LIVE &&
          currentBlockNumber >= BigInt(campaign.startBlock) &&
          currentBlockNumber <= BigInt(campaign.endBlock)) ||
        (status === Status.UPCOMING && currentBlockNumber < BigInt(campaign.startBlock))
      );
    });

    if (!currentCampaign) return undefined;

    const startTimestamp = await getBlockTimestampWithEstimation(
      BigInt(currentCampaign.startBlock),
    );
    const endTimestamp = await getBlockTimestampWithEstimation(BigInt(currentCampaign.endBlock));

    if (!startTimestamp || !endTimestamp) return undefined;

    const campaignConfig: CampaignConfig = {
      startTimestamp: Number(startTimestamp),
      endTimestamp: Number(endTimestamp),
      // budget: currentCampaign.budget ? currentCampaign.budget : undefined, // not provided by ACI Infra
      // apr: currentCampaign.apr ? currentCampaign.apr : undefined, // not provided by ACI Infra
    };

    return campaignConfig;
  };

  // private getCampaignConfig = (campaigns: Campaign[], status: Status) => {
  //   // Campaigns are based on mainnet block numbers
  //   const currentTimestamp = Math.floor(Date.now() / 1000);
  //   const currentCampaign = campaigns.find((campaign) => {
  //     return (
  //       (status == Status.LIVE &&
  //         currentTimestamp >= Number(campaign.startTimestamp) &&
  //         currentTimestamp <= Number(campaign.endTimestamp)) ||
  //       (status == Status.UPCOMING && currentTimestamp < Number(campaign.startTimestamp))
  //     );
  //   });

  //   if (!currentCampaign) return undefined;

  //   const campaignConfig: CampaignConfig = {
  //     startTimestamp: Number(currentCampaign.startTimestamp),
  //     endTimestamp: Number(currentCampaign.endTimestamp),
  //     // budget: currentCampaign.budget ? currentCampaign.budget : undefined, // provided sometimes by ACI Infra, but sometimes wrong budget are defined (because overwritten by script)
  //     // apr: currentCampaign.apr ? currentCampaign.apr : undefined, // provided sometimes by ACI Infra (overwritten by script)
  //   };

  //   return campaignConfig;
  // };

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
