import { type Chain, createPublicClient, fallback, http } from 'viem';
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  celo,
  gnosis,
  ink,
  linea,
  mainnet,
  mantle,
  metis,
  optimism,
  plasma,
  polygon,
  scroll,
  sonic,
  zksync,
} from 'viem/chains';

import { getChain } from '@/lib/utils/chains.js';

const CHAIN_CONFIG: Record<number, { alchemyPrefix: string; publicRpcs: string[] }> = {
  [mainnet.id]: {
    alchemyPrefix: 'eth-mainnet',
    publicRpcs: ['https://ethereum-rpc.publicnode.com'],
  },
  [base.id]: { alchemyPrefix: 'base-mainnet', publicRpcs: ['https://base-rpc.publicnode.com'] },
  [arbitrum.id]: {
    alchemyPrefix: 'arb-mainnet',
    publicRpcs: ['https://arbitrum-one-rpc.publicnode.com'],
  },
  [optimism.id]: {
    alchemyPrefix: 'opt-mainnet',
    publicRpcs: ['https://optimism-rpc.publicnode.com'],
  },
  [zksync.id]: { alchemyPrefix: 'zksync-mainnet', publicRpcs: ['https://1rpc.io/zksync2-era'] },
  [polygon.id]: {
    alchemyPrefix: 'polygon-mainnet',
    publicRpcs: ['https://polygon-bor-rpc.publicnode.com'],
  },
  [avalanche.id]: {
    alchemyPrefix: 'avax-mainnet',
    publicRpcs: ['https://avalanche-c-chain-rpc.publicnode.com'],
  },
  [gnosis.id]: {
    alchemyPrefix: 'gnosis-mainnet',
    publicRpcs: ['https://gnosis-rpc.publicnode.com'],
  },
  [metis.id]: { alchemyPrefix: 'metis-mainnet', publicRpcs: ['https://metis-pokt.nodies.app'] },
  [scroll.id]: {
    alchemyPrefix: 'scroll-mainnet',
    publicRpcs: ['https://scroll-rpc.publicnode.com'],
  },
  [bsc.id]: { alchemyPrefix: 'bnb-mainnet', publicRpcs: ['https://bsc-rpc.publicnode.com'] },
  [linea.id]: { alchemyPrefix: 'linea-mainnet', publicRpcs: ['https://linea-rpc.publicnode.com'] },
  [sonic.id]: { alchemyPrefix: 'sonic-mainnet', publicRpcs: ['https://rpc.soniclabs.com'] },
  [celo.id]: { alchemyPrefix: 'celo-mainnet', publicRpcs: ['wss://celo.drpc.org'] },
  [plasma.id]: { alchemyPrefix: 'plasma-mainnet', publicRpcs: ['https://plasma.drpc.org'] },
  [ink.id]: { alchemyPrefix: 'ink-mainnet', publicRpcs: ['https://ink.drpc.org'] },
  [mantle.id]: { alchemyPrefix: 'mantle-mainnet', publicRpcs: ['https://mantle.drpc.org'] },
};

const getChainConfig = (chain: Chain) => {
  const config = CHAIN_CONFIG[chain.id];
  if (!config) throw new Error(`Chain ${chain.name} (${chain.id}) not supported`);
  return config;
};

export const getViemClient = (chainId: number = 1, cacheTimeSec: number = 0) => {
  const chain = getChain(chainId);
  const { alchemyPrefix, publicRpcs } = getChainConfig(chain);
  const alchemyApiKey = process.env.ALCHEMY_API_KEY;

  const rpcs = alchemyApiKey
    ? [
        http(`https://${alchemyPrefix}.g.alchemy.com/v2/${alchemyApiKey}`),
        ...publicRpcs.map((rpc) => http(rpc)),
      ]
    : publicRpcs.map((rpc) => http(rpc));

  return createPublicClient({
    cacheTime: cacheTimeSec * 1000,
    pollingInterval: cacheTimeSec * 1000,
    batch: { multicall: true },
    chain,
    transport: fallback(rpcs),
  });
};
