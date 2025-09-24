import { getChain } from '@/lib/utils/chains';
// import 'dotenv/config';

import { Chain, createPublicClient, fallback, FallbackTransport, http } from 'viem';
import {
  arbitrum,
  avalanche,
  base,
  gnosis,
  mainnet,
  metis,
  optimism,
  polygon,
  zksync,
  scroll,
  bsc,
  linea,
  sonic,
  celo,
} from 'viem/chains';

export const ETHEREUM_RPCS = ['https://ethereum-rpc.publicnode.com'];
export const BASE_RPCS = ['https://base-rpc.publicnode.com'];
export const ARBITRUM_RPCS = ['https://arbitrum-one-rpc.publicnode.com'];
export const OPTIMISM_RPCS = ['https://optimism-rpc.publicnode.com'];
export const ZKSYNC_RPCS = ['https://1rpc.io/zksync2-era'];
export const POLYGON_RPCS = ['https://polygon-bor-rpc.publicnode.com'];
export const AVALANCHE_RPCS = ['https://avalanche-c-chain-rpc.publicnode.com'];
export const GNOSIS_RPCS = ['https://gnosis-rpc.publicnode.com'];
export const METIS_RPCS = ['https://metis-pokt.nodies.app'];
export const SCROLL_RPCS = ['https://scroll-rpc.publicnode.com'];
export const BSC_RPCS = ['https://bsc-rpc.publicnode.com'];
export const LINEA_RPCS = ['https://linea-rpc.publicnode.com'];
export const SONIC_RPCS = ['https://rpc.soniclabs.com'];
export const CELO_RPCS = ['wss://celo.drpc.org'];

const getTransport = (chain: Chain): FallbackTransport => {
  switch (chain.id) {
    case mainnet.id:
      return fallback(ETHEREUM_RPCS.map((rpc) => http(rpc)));
    case base.id:
      return fallback(BASE_RPCS.map((rpc) => http(rpc)));
    case arbitrum.id:
      return fallback(ARBITRUM_RPCS.map((rpc) => http(rpc)));
    case optimism.id:
      return fallback(OPTIMISM_RPCS.map((rpc) => http(rpc)));
    case zksync.id:
      return fallback(ZKSYNC_RPCS.map((rpc) => http(rpc)));
    case polygon.id:
      return fallback(POLYGON_RPCS.map((rpc) => http(rpc)));
    case avalanche.id:
      return fallback(AVALANCHE_RPCS.map((rpc) => http(rpc)));
    case gnosis.id:
      return fallback(GNOSIS_RPCS.map((rpc) => http(rpc)));
    case metis.id:
      return fallback(METIS_RPCS.map((rpc) => http(rpc)));
    case scroll.id:
      return fallback(SCROLL_RPCS.map((rpc) => http(rpc)));
    case bsc.id:
      return fallback(BSC_RPCS.map((rpc) => http(rpc)));
    case linea.id:
      return fallback(LINEA_RPCS.map((rpc) => http(rpc)));
    case sonic.id:
      return fallback(SONIC_RPCS.map((rpc) => http(rpc)));
    case celo.id:
      return fallback(CELO_RPCS.map((rpc) => http(rpc)));
    default:
      throw new Error(`Chain ${chain.name} (${chain.id}) not supported`);
  }
};

const getPublicClient = (chain: Chain) => {
  return createPublicClient({
    cacheTime: 0,
    batch: {
      multicall: true,
    },
    chain: chain,
    transport: getTransport(chain),
  });
};

const getAlchemyPrefix = (chain: Chain): string => {
  switch (chain.id) {
    case mainnet.id:
      return 'eth-mainnet';
    case base.id:
      return 'base-mainnet';
    case arbitrum.id:
      return 'arb-mainnet';
    case optimism.id:
      return 'opt-mainnet';
    case zksync.id:
      return 'zksync-mainnet';
    case polygon.id:
      return 'polygon-mainnet';
    case avalanche.id:
      return 'avax-mainnet';
    case gnosis.id:
      return 'gnosis-mainnet';
    case metis.id:
      return 'metis-mainnet';
    case scroll.id:
      return 'scroll-mainnet';
    case bsc.id:
      return 'bnb-mainnet';
    case sonic.id:
      return 'sonic-mainnet';
    case linea.id:
      return 'linea-mainnet';
    case celo.id:
      return 'celo-mainnet';
    default:
      throw new Error(`Chain ${chain.name} (${chain.id}) not supported`);
  }
};

const getAlchemyClient = (prefix: string, chain: Chain) => {
  return createPublicClient({
    cacheTime: 0,
    batch: {
      multicall: true,
    },
    chain: chain,
    transport: http(`https://${prefix}.g.alchemy.com/v2/` + process.env.ALCHEMY_PROJECT_ID),
  });
};

export const getViemClient = (chainId: number = 1) => {
  const alchemyProjectId = process.env.ALCHEMY_PROJECT_ID;

  const chain = getChain(chainId);

  if (alchemyProjectId) {
    const prefix = getAlchemyPrefix(chain);
    return getAlchemyClient(prefix, chain);
  } else {
    return getPublicClient(chain);
  }
};
