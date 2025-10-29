import { Address } from 'viem';
import { arbitrum, avalanche, base, mainnet, polygon, sonic } from 'viem/chains';

import { Token } from '@/types';

import { TokenPriceFetcherBase } from '../token-price-fetcher-base';

type CoingeckoTokenPrice = {
  [address: Address]: {
    usd: number | undefined;
  };
};

// source: https://docs.coingecko.com/v3.0.1/reference/asset-platforms-list
const assetPlatforms: Record<number, string> = {
  [mainnet.id]: 'ethereum',
  [arbitrum.id]: 'arbitrum-one',
  [base.id]: 'base',
  [avalanche.id]: 'avalanche',
  [polygon.id]: 'polygon-pos',
  [sonic.id]: 'sonic',
};

// source: https://docs.coingecko.com/v3.0.1/reference/simple-supported-currencies
const supportedCurrencies = ['usd', 'eth', 'btc'];

export class CoingeckoTokenPriceFetcher extends TokenPriceFetcherBase {
  constructor() {
    super('Coingecko');
  }

  async getTokenPrice(params: { token: Token; blockNumber?: bigint }) {
    if (params.blockNumber) {
      throw new Error(`blockNumber is not supported by ${this.fetcherName} price fetcher`);
    }

    const assetPlatform = assetPlatforms[params.token.chainId];
    const price = assetPlatform
      ? await this.getCoingeckoTokenPrice(assetPlatform, params.token.address)
      : null;
    return price;
  }

  private getCoingeckoTokenPrice = async (
    assetPlatform: string,
    tokenAddress: Address,
    currency = 'usd',
  ) => {
    const fetchTokenPrice = async () => {
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${assetPlatform}?contract_addresses=${tokenAddress}&vs_currencies=${currency}`;
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      };
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Error while fetching token price. Status: ${response.status}`);
        }
        const responseFormatted = await response.json();
        const coingeckoTokenPrice = responseFormatted as CoingeckoTokenPrice;

        return coingeckoTokenPrice;
      } catch {
        // throw Error(`Error while fetching token price: ${error}`);
        return null;
      }
    };

    if (!supportedCurrencies.includes(currency)) {
      // throw new Error(`Currency ${currency} is not supported`);
      return null;
    }

    const coingeckoTokenPrice = await fetchTokenPrice();

    if (!coingeckoTokenPrice) {
      return null;
    }

    const price = coingeckoTokenPrice[tokenAddress.toLowerCase() as Address];

    if (!price) {
      return null;
    }

    const usdPrice = price.usd;

    return usdPrice ? usdPrice : null;
  };
}
