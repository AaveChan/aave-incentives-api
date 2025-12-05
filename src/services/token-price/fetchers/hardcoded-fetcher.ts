import { Token } from '@/types/index';

import { TokenPriceFetcherBase } from '../token-price-fetcher-base';

export class HardcodedTokenPriceFetcher extends TokenPriceFetcherBase {
  constructor() {
    super('Hardcoded');
  }

  async getTokenPrice(params: { token: Token; blockNumber?: bigint }) {
    switch (params.token.symbol) {
      case 'GHO':
      case 'sGHO':
        return 1;
      default:
        return null;
    }
  }
}
