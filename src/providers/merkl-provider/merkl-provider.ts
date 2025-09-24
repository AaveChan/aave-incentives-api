import { Incentive, IncentiveSource, IncentiveType, RewardType, Token } from '@/types';

import { FetchOptions, IncentiveProvider } from '..';
import { MerklOpportunity } from './types';
// import { getViemClient } from '@/clients/viem';
// import { Address, erc20Abi } from 'viem';

type MerklApiOptions = {
  chainId?: number;
  mainProtocolId?: string;
};

export class MerklProvider implements IncentiveProvider {
  apiUrl = 'https://api.merkl.xyz/v4/opportunities';
  claimLink = 'https://app.merkl.xyz/';
  incentiveType = IncentiveType.OFFCHAIN;
  rewardType = RewardType.TOKEN;
  unknown = 'UNKNOWN';

  async getIncentives(fetchOptions?: FetchOptions): Promise<Incentive[]> {
    const merklOpportunities = await this.fetchIncentives(fetchOptions);

    let allIncentives: Incentive[] = [];

    for (const opportunity of merklOpportunities) {
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
        // fetch onchain => quite slow
        // const client = getViemClient(opportunity.chainId);
        // const data = await client.multicall({
        //   contracts: [
        //     {
        //       address: rewardedTokenAddress,
        //       abi: erc20Abi,
        //       functionName: 'name',
        //     },
        //     {
        //       address: rewardedTokenAddress,
        //       abi: erc20Abi,
        //       functionName: 'symbol',
        //     },
        //     {
        //       address: rewardedTokenAddress,
        //       abi: erc20Abi,
        //       functionName: 'decimals',
        //     },
        //   ],
        // });
        // const [nameRes, symbolRes, decimalsRes] = data;
        // rewardedTokenName = nameRes.result ?? 'UNKNOWN';
        // rewardedTokenSymbol = symbolRes.result ?? 'UNKNOWN';
        // rewardedTokenDecimals = decimalsRes.result ?? 18;

        rewardedTokenName = this.unknown;
        rewardedTokenSymbol = this.unknown;
        rewardedTokenDecimals = 18;
      }

      const rewardedToken: Token = {
        name: rewardedTokenName,
        address: rewardedTokenAddress,
        symbol: rewardedTokenSymbol,
        decimals: rewardedTokenDecimals,
        chainId: opportunity.chainId,
      };

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

    allIncentives = allIncentives.filter((i) =>
      fetchOptions?.chainId ? i.chainId === fetchOptions?.chainId : true,
    );

    console.log('Merkl incentives:', allIncentives.length);

    return allIncentives;
  }

  private async fetchIncentives(fetchOptions?: FetchOptions): Promise<MerklOpportunity[]> {
    const url = new URL(this.apiUrl);

    const merklApiOptions: MerklApiOptions = {
      chainId: fetchOptions?.chainId,
      mainProtocolId: 'aave',
    };
    for (const [key, value] of Object.entries(merklApiOptions)) {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    }

    const allMerklOpportunities: MerklOpportunity[] = [];

    let merklOpportunities: MerklOpportunity[] = [];
    const itemsPerPage = 100;
    url.searchParams.set('items', itemsPerPage.toString());
    let page = 0;

    do {
      url.searchParams.set('page', page.toString());
      const response = await fetch(url.toString());
      merklOpportunities = (await response.json()) as MerklOpportunity[];

      allMerklOpportunities.push(...merklOpportunities);
      page++;
    } while (merklOpportunities.length > 0);

    return allMerklOpportunities;
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
