import { AaveSafetyModule } from '@bgd-labs/aave-address-book';
import { Address } from 'viem';

import { createLogger } from '@/config/logger';
import { GHO } from '@/constants/tokens';
import { compareTokens, tokenToString } from '@/lib/token/token';
import { Token } from '@/types';

import { AaveTokenPriceFetcher } from './fetchers/aave-fetcher';
import { ChainlinkTokenPriceFetcher } from './fetchers/chainlink-fetcher/chainlink-fetcher';
import { CoingeckoTokenPriceFetcher } from './fetchers/coingecko-fetcher';
import { HardcodedTokenPriceFetcher } from './fetchers/hardcoded-fetcher';
import { TokenPriceFetcherBase } from './token-price-fetcher-base';

const fetchersByTokenAddress = new Map<Address, TokenPriceFetcherBase>([
  // [stkGHO.address, new AaveTokenPriceFetcher()],
]);

const proxyTokenMap = new Map<Address, Token>([[AaveSafetyModule.STK_GHO, GHO]]);

export class TokenPriceFetcherService {
  private logger = createLogger('IncentiveService');

  aaveFetcher = new AaveTokenPriceFetcher();
  chainlinkFetcher = new ChainlinkTokenPriceFetcher();
  coingeckoFetcher = new CoingeckoTokenPriceFetcher();
  hardcodedFetcher = new HardcodedTokenPriceFetcher();

  async getTokenPrice(params: { token: Token; blockNumber?: bigint }) {
    const tokenRequested = params.token;
    const proxyToken = proxyTokenMap.get(params.token.address);
    if (proxyToken) {
      params.token = proxyToken;
    }

    const fetcher = fetchersByTokenAddress.get(params.token.address);
    if (fetcher) {
      const price = await fetcher.getTokenPrice(params);
      if (price) {
        return price;
      } else {
        this.logger.warn(
          `A fetcher is setup for ${getTokenFullInfo(
            params.token,
            tokenRequested,
          )}, but no price found`,
        );
      }
    }

    const priceFetchers = [
      this.aaveFetcher,
      this.chainlinkFetcher,
      this.coingeckoFetcher,
      this.hardcodedFetcher,
    ];

    for (const fetcher of priceFetchers) {
      const price = await fetcher.getTokenPrice(params);
      if (price) {
        this.logger.verbose(
          `${fetcher.fetcherName} fetcher: Price found for ${getTokenFullInfo(
            params.token,
            tokenRequested,
          )}: ${price}`,
        );
        return price;
      }
    }

    // throw new Error(`No price found for ${getTokenFullInfo(params.token, tokenRequested)}`);
    this.logger.warn(`No price found for ${getTokenFullInfo(params.token, tokenRequested)}`);
    return null;
  }
}

const getTokenFullInfo = (token: Token, tokenRequested?: Token) => {
  const displayTokenRequested = tokenRequested && !compareTokens(token, tokenRequested);
  return `${tokenToString(token)} ${
    displayTokenRequested ? `(on behalf of ${tokenRequested.symbol})` : ''
  }`;
};
