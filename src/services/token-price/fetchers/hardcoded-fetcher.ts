import { Token } from '@/types/index.js';

import { TokenPriceFetcherBase } from '../token-price-fetcher-base.js';

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
