import { Address, formatUnits } from 'viem';

import { getViemClient } from '@/clients/viem';
import { chainLinkPriceFeedAbi } from '@/constants/abis/index';
import { Token } from '@/types/index';

import { TokenPriceFetcherBase } from '../../token-price-fetcher-base';
import { priceFeeds } from './price-feeds';

export class ChainlinkTokenPriceFetcher extends TokenPriceFetcherBase {
  constructor() {
    super('Chainlink');
  }

  async getTokenPrice({ token, blockNumber }: { token: Token; blockNumber?: bigint }) {
    const priceFeedsForChain = priceFeeds[token.chainId];

    if (!priceFeedsForChain) {
      return null;
    }

    const priceFeed = priceFeedsForChain[token.address];

    if (priceFeed) {
      const price = await this.fetchPriceFromFeed({
        chainId: token.chainId,
        feedAddress: priceFeed,
        blockNumber,
      });
      return price;
    } else {
      return null;
    }
  }

  /**
   * Fetch a Chainlink AggregatorV3Interface Oracle contract price feed
   * @param client viem client
   * @param feedAddress address of the contract
   * @param blockNumber block number to fetch the price from
   * @returns price of the feed
   */
  private fetchPriceFromFeed = async ({
    chainId,
    feedAddress,
    blockNumber,
  }: {
    chainId: number;
    feedAddress: Address;
    blockNumber?: bigint;
  }) => {
    const client = getViemClient(chainId);

    try {
      const decimals = await client.readContract({
        address: feedAddress,
        abi: chainLinkPriceFeedAbi,
        functionName: 'decimals',
        blockNumber,
      });

      // [uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound]
      const latestAnswer = await client.readContract({
        address: feedAddress,
        abi: chainLinkPriceFeedAbi,
        functionName: 'latestAnswer',
        blockNumber,
      });
      const price = Number(formatUnits(latestAnswer, decimals));
      return price;
    } catch {
      // return no price if the block number is before oracle deployments
      return null;
    }
  };
}
