import { Token } from '@/types';

export abstract class TokenPriceFetcherBase {
  public fetcherName: string;

  constructor(fetcherName: string) {
    this.fetcherName = fetcherName;
  }

  abstract getTokenPrice(params: { token: Token; blockNumber?: bigint }): Promise<number | null>;
}
