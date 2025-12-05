import * as allChains from 'viem/chains';

const { ...chains } = allChains;
// No issue with the 2 follwing config:
// - package.json "type": undefined & tsconfig.json "module": "nodenext" "moduleResolution": "nodenext"
// - package.json "type": "module" & tsconfig.json "module": "ESNext" "moduleResolution": "bundler"
// But with:
// - package.json "type": "module" & tsconfig.json "module": "nodenext" "moduleResolution": "nodenext"
// Type is import("/Users/martin/Desktop/dev/projects/aci/aave-incentives-api/node_modules/.pnpm/viem@2.38.5_typescript@5.9.3_zod@4.1.12/node_modules/viem/_types/chains/index") | { blockExplorers: { ...
// So chainId is not always defined
// So either do:
// const chains = allChains as unknown as Record<string, Chain>;
// Or create a hardcoded list of chains we want to support
// const chains = allChains;

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
