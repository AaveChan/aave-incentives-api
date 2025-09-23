import { Incentive, IncentiveSource, IncentiveType, RewardType, Token } from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import { MerklOpportunity } from './types';

export class MerklProvider implements IncentiveProvider {
  name = 'Merkl';
  apiUrl = 'https://api.merkl.xyz/v4/opportunities';
  claimLink = 'https://app.merkl.xyz/';
  incentiveType = IncentiveType.OFFCHAIN;
  rewardType = RewardType.TOKEN;

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const response = await fetch(`${this.apiUrl}?mainProtocolId=aave`);
    const merklOpportunities = (await response.json()) as MerklOpportunity[];

    const allIncentives: Incentive[] = [];

    for (const opportunity of merklOpportunities) {
      // If chainId filter is provided, skip non-matching opportunities
      if (fetchOptions?.chainId && opportunity.chainId !== fetchOptions.chainId) {
        continue;
      }

      const rewardMerklToken = opportunity?.rewardsRecord?.breakdowns[0]?.token;

      const rewardedTokenAddress = opportunity.explorerAddress;

      if (!rewardMerklToken || !rewardedTokenAddress) {
        continue;
      }

      const rewardToken: Token = {
        name: rewardMerklToken.name,
        address: rewardMerklToken.address,
        symbol: rewardMerklToken.symbol,
        decimals: rewardMerklToken.decimals,
        chainId: opportunity.chainId,
      };

      let rewardedTokenName: string | undefined;
      let rewardedTokenSymbol: string | undefined;
      let rewardedTokenDecimals: number | undefined;

      if (
        rewardMerklToken.address.toLowerCase() === rewardedTokenAddress.toLowerCase() &&
        rewardMerklToken.chainId === opportunity.chainId
      ) {
        rewardedTokenSymbol = rewardMerklToken.symbol;
        rewardedTokenDecimals = rewardMerklToken.decimals;
        rewardedTokenName = rewardMerklToken.name;
      } else {
        // fetch onchain
        // For simplicity, we'll skip this part in this example
        rewardedTokenName = 'UNKNOWN';
        rewardedTokenSymbol = 'UNKNOWN';
        rewardedTokenDecimals = 18;
      }

      const rewardedToken: Token = {
        name: rewardedTokenName,
        address: rewardedTokenAddress,
        symbol: rewardedTokenSymbol,
        decimals: rewardedTokenDecimals,
        chainId: opportunity.chainId,
      };

      // Map Merkl opportunity to Incentive
      allIncentives.push({
        name: opportunity.name,
        description: opportunity.description,
        claimLink: this.claimLink,
        chainId: opportunity.chainId,
        rewardedToken,
        rewardToken,
        apr: opportunity.apr,
        budget: undefined,
        maxBudget: undefined,
        startTimestamp: undefined,
        endTimestamp: undefined,
        incentiveType: this.incentiveType,
        rewardType: this.rewardType,
        status: opportunity.status,
      });
    }

    console.log('Merkl incentives:', allIncentives.length);

    return allIncentives;
  }

  getSource(): IncentiveSource {
    return IncentiveSource.MERKL_API;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
