import * as allChains from 'viem/chains';
import { Chain } from 'viem/chains';

// const { ...chains } = all;

// function isChain(value: unknown): value is Chain {
//   return (
//     typeof value === 'object' &&
//     value !== null &&
//     'id' in value &&
//     typeof (value as { id?: unknown }).id === 'number'
//   );
// }

// const chains: Chain[] = Object.values(allChains).filter(isChain);

// const chains = Object.values(allChains).filter(
//   (c): c is Chain => typeof (c as unknown as Chain).id === 'number',
// );

const chains = allChains as unknown as Record<string, Chain>;

/**
 * Gets the chain object for the given chain id.
 * @param chainId - Chain id of the target EVM chain.
 * @returns Viem's chain object.
 */
export function getChain(chainId: number) {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain;
    }
  }

  throw new Error(`Chain with id ${chainId} not found`);
}
