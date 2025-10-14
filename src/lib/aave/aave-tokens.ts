import {
  AaveSafetyModule,
  AaveV3Arbitrum,
  AaveV3Avalanche,
  AaveV3Base,
  AaveV3BNB,
  AaveV3Celo,
  AaveV3Ethereum,
  AaveV3EthereumEtherFi,
  AaveV3EthereumLido,
  AaveV3Gnosis,
  AaveV3Linea,
  AaveV3Metis,
  AaveV3Optimism,
  AaveV3Polygon,
  AaveV3Scroll,
  AaveV3Sonic,
  AaveV3ZkSync,
} from '@bgd-labs/aave-address-book';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { getChain } from '../utils/chains';
import { Token } from '@/types';

export type BookType = {
  decimals: number;
  id: number;
  UNDERLYING: Address;
  A_TOKEN: Address;
  V_TOKEN: Address;
  INTEREST_RATE_STRATEGY: Address;
  ORACLE: Address;
  STATIC_A_TOKEN?: Address;
  STATA_TOKEN?: Address;
  STK_TOKEN?: Address;
};

export enum AaveTokenType {
  A = 'A_TOKEN',
  V = 'V_TOKEN',
  STK = 'STK_TOKEN',
  UNDERLYING = 'UNDERLYING',
  NOT_LISTED = 'NOT_LISTED',
}

export enum AaveInstanceType {
  CORE = 'Core',
  PRIME = 'Prime',
  ETHERFI = 'EtherFi',
}

const AllAddressBooksAssets = {
  AaveV3Ethereum: { ...AaveV3Ethereum.ASSETS },
  AaveV3EthereumLido: { ...AaveV3EthereumLido.ASSETS },
  AaveV3EthereumEtherFi: { ...AaveV3EthereumEtherFi.ASSETS },
  AaveV3Optimism: { ...AaveV3Optimism.ASSETS },
  AaveV3Base: { ...AaveV3Base.ASSETS },
  AaveV3Avalanche: { ...AaveV3Avalanche.ASSETS },
  AaveV3Gnosis: { ...AaveV3Gnosis.ASSETS },
  AaveV3ZkSync: { ...AaveV3ZkSync.ASSETS },
  AaveV3Scroll: { ...AaveV3Scroll.ASSETS },
  AaveV3Arbitrum: { ...AaveV3Arbitrum.ASSETS },
  AaveV3Polygon: { ...AaveV3Polygon.ASSETS },
  AaveV3BNB: { ...AaveV3BNB.ASSETS },
  AaveV3Metis: { ...AaveV3Metis.ASSETS },
  AaveV3Sonic: { ...AaveV3Sonic.ASSETS },
  AaveV3Linea: { ...AaveV3Linea.ASSETS },
  AaveV3Celo: { ...AaveV3Celo.ASSETS },
};

const AllAddressBooksChainIds: { [key: string]: number } = {
  AaveV3Ethereum: AaveV3Ethereum.CHAIN_ID,
  AaveV3EthereumLido: AaveV3EthereumLido.CHAIN_ID,
  AaveV3EthereumEtherFi: AaveV3EthereumEtherFi.CHAIN_ID,
  AaveV3Optimism: AaveV3Optimism.CHAIN_ID,
  AaveV3Base: AaveV3Base.CHAIN_ID,
  AaveV3Avalanche: AaveV3Avalanche.CHAIN_ID,
  AaveV3Gnosis: AaveV3Gnosis.CHAIN_ID,
  AaveV3ZkSync: AaveV3ZkSync.CHAIN_ID,
  AaveV3Scroll: AaveV3Scroll.CHAIN_ID,
  AaveV3Arbitrum: AaveV3Arbitrum.CHAIN_ID,
  AaveV3Polygon: AaveV3Polygon.CHAIN_ID,
  AaveV3BNB: AaveV3BNB.CHAIN_ID,
  AaveV3Metis: AaveV3Metis.CHAIN_ID,
  AaveV3Sonic: AaveV3Sonic.CHAIN_ID,
  AaveV3Linea: AaveV3Linea.CHAIN_ID,
  AaveV3Celo: AaveV3Celo.CHAIN_ID,
};

export const getAaveToken = (tokenAddress: Address, chainId: number) => {
  const tokenInfo = getAaveTokenInfo(tokenAddress, chainId);
  const chain = getChain(chainId);
  let symbol: string | undefined;
  let name: string | undefined;
  switch (tokenInfo?.type) {
    case AaveTokenType.A:
      symbol = getATokenSymbol(tokenInfo.name, chain.name);
      name = getATokenName(tokenInfo.name, chain.name);
      break;
    case AaveTokenType.V:
      symbol = getVTokenSymbol(tokenInfo.name, chain.name);
      name = getVTokenName(tokenInfo.name, chain.name);
      break;
    case AaveTokenType.STK:
      // Handle stk tokens separately
      switch (tokenAddress) {
        case AaveSafetyModule.STK_GHO:
          name = 'stkGHO';
          symbol = 'stkGHO';
          break;
        case AaveSafetyModule.STK_AAVE:
          name = 'stkAAVE';
          symbol = 'stkAAVE';
          break;
        case AaveSafetyModule.STK_ABPT:
          name = 'stkABPT';
          symbol = 'stkABPT';
          break;
        case AaveSafetyModule.STK_AAVE_WSTETH_BPTV2:
          name = 'stk AAVE/wstETH BPTv2';
          symbol = 'stkAAVEwstETHBPTv2';
          break;
      }
    case AaveTokenType.UNDERLYING:
    case AaveTokenType.NOT_LISTED:
    default:
      return null;
  }

  if (!symbol || !name) {
    return null;
  }

  const aaveToken: Token = {
    address: tokenAddress,
    symbol: symbol,
    name: name,
    decimals: tokenInfo.book.decimals,
    chainId: chainId,
  };

  return aaveToken;
};

export const getAaveTokenInfo = (tokenAddress: Address, chainId: number) => {
  let tokenType = AaveTokenType.NOT_LISTED;
  let tokenBook: BookType | undefined;
  let tokenBookName: string | undefined;
  let instanceType: AaveInstanceType | null = null;

  const stkTokens: Address[] = [
    AaveSafetyModule.STK_GHO,
    AaveSafetyModule.STK_AAVE,
    AaveSafetyModule.STK_ABPT,
    AaveSafetyModule.STK_AAVE_WSTETH_BPTV2,
  ];
  if (stkTokens.includes(tokenAddress)) {
    tokenType = AaveTokenType.STK;
  }

  for (const [key, assets] of Object.entries(AllAddressBooksAssets)) {
    const chainIdOfBook = AllAddressBooksChainIds[key];
    if (chainIdOfBook !== chainId) {
      continue;
    }

    const entries: [string, BookType][] = Object.entries(assets);
    for (const [name, asset] of entries) {
      switch (tokenAddress) {
        case asset.A_TOKEN:
          tokenType = AaveTokenType.A;
          tokenBook = asset;
          tokenBookName = name;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          break;
        case asset.V_TOKEN:
          tokenType = AaveTokenType.V;
          tokenBook = asset;
          tokenBookName = name;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          break;
        case asset.UNDERLYING:
          tokenType = AaveTokenType.UNDERLYING;
          tokenBook = asset;
          tokenBookName = name;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          break;
      }
    }
  }

  if (!tokenBook || !tokenBookName) {
    // console.log(`Aave token information not found for address ${tokenAddress}`);
    return null;
  }

  return {
    type: tokenType,
    book: tokenBook,
    name: tokenBookName,
    instanceType,
  };
};

const getAaveInstanceFromInstanceFullName = (instanceFullName: string) => {
  if (instanceFullName.toLowerCase().includes('lido')) {
    return AaveInstanceType.PRIME;
  } else if (instanceFullName.toLowerCase().includes('etherfi')) {
    return AaveInstanceType.ETHERFI;
  } else {
    return AaveInstanceType.CORE;
  }
};

const getSymbolPrefix = (chainName: string) => {
  // get the first 3 letter, and set the first letter to uppercase
  const prefix = chainName.substring(0, 3).toLowerCase();
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
};

const getATokenSymbol = (underlyingSymbol: string, chainName: string) => {
  const prefix = getSymbolPrefix(chainName);
  return `a${prefix}${underlyingSymbol}`;
};

const getATokenName = (underlyingSymbol: string, chainName: string) => {
  return `Aave ${chainName} ${underlyingSymbol}`;
};

const getVTokenSymbol = (underlyingSymbol: string, chainName: string) => {
  const prefix = getSymbolPrefix(chainName);
  return `variableDebt${prefix}${underlyingSymbol}`;
};

const getVTokenName = (underlyingSymbol: string, chainName: string) => {
  return `Aave ${chainName} Variable Debt ${underlyingSymbol}`;
};
