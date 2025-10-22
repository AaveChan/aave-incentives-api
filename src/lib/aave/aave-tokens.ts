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
  AaveV3InkWhitelabel,
  AaveV3Linea,
  AaveV3Metis,
  AaveV3Optimism,
  AaveV3Plasma,
  AaveV3Polygon,
  AaveV3Scroll,
  AaveV3Sonic,
  AaveV3ZkSync,
} from '@bgd-labs/aave-address-book';
import { AaveV3HorizonRWA } from './horizon-assets';
import { Address, zeroAddress } from 'viem';
import { getChain } from '../utils/chains';
import { Token } from '@/types';
import { ink } from 'viem/chains';

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
  STATA = 'STATA_TOKEN',
  STK = 'STK_TOKEN',
  UNDERLYING = 'UNDERLYING',
  NOT_LISTED = 'NOT_LISTED',
}

export enum AaveInstanceType {
  CORE = 'Core',
  PRIME = 'Prime',
  ETHERFI = 'EtherFi',
  HORIZON_RWA = 'Horizon RWA',
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
  AaveV3HorizonRWA: { ...AaveV3HorizonRWA.ASSETS },
  AaveV3Plasma: { ...AaveV3Plasma.ASSETS },
  AaveV3InkWhitelabel: { ...AaveV3InkWhitelabel.ASSETS },
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
  AaveV3HorizonRWA: AaveV3HorizonRWA.CHAIN_ID,
  AaveV3Plasma: AaveV3Plasma.CHAIN_ID,
  AaveV3InkWhitelabel: AaveV3InkWhitelabel.CHAIN_ID,
};

const abpt = '0x41A08648C3766F9F9d85598fF102a08f4ef84F84';
const twentywstETHEightyAAVE = '0x3de27EFa2F1AA663Ae5D458857e731c129069F29';

export const getAaveToken = (tokenAddress: Address, chainId: number) => {
  const tokenInfo = getAaveTokenInfo(tokenAddress, chainId);
  const chain = getChain(chainId);
  let symbol: string | undefined;
  let name: string | undefined;
  switch (tokenInfo?.type) {
    case AaveTokenType.A:
      symbol = getATokenSymbol(tokenInfo.name, chain.name, tokenInfo.instanceType);
      name = getATokenName(tokenInfo.name, chain.name, tokenInfo.instanceType);
      break;
    case AaveTokenType.V:
      symbol = getVTokenSymbol(tokenInfo.name, chain.name, tokenInfo.instanceType);
      name = getVTokenName(tokenInfo.name, chain.name, tokenInfo.instanceType);
      break;
    case AaveTokenType.STATA:
      symbol = getStataTokenSymbol(tokenInfo.name, chain.name, tokenInfo.instanceType);
      name = getStataTokenName(tokenInfo.name, chain.name, tokenInfo.instanceType);
      break;
    case AaveTokenType.STK:
      name = tokenInfo.name;
      symbol = tokenInfo.name;
      break;
    case AaveTokenType.UNDERLYING:
    case AaveTokenType.NOT_LISTED:
    default:
      return undefined;
  }

  if (symbol && name) {
    const aaveToken: Token = {
      address: tokenAddress,
      symbol: symbol,
      name: name,
      decimals: tokenInfo.book.decimals,
      chainId: chainId,
    };

    return aaveToken;
  }
};

export const getAaveTokenInfo = (tokenAddress: Address, chainId: number) => {
  let tokenType = AaveTokenType.NOT_LISTED;
  let tokenBook: BookType | undefined;
  let tokenBookName: string | undefined;
  let instanceType: AaveInstanceType | undefined;

  const stkTokens: Address[] = [
    AaveSafetyModule.STK_GHO,
    AaveSafetyModule.STK_AAVE,
    AaveSafetyModule.STK_ABPT,
    AaveSafetyModule.STK_AAVE_WSTETH_BPTV2,
  ];
  if (stkTokens.includes(tokenAddress)) {
    tokenType = AaveTokenType.STK;

    let name: string | undefined;
    let underlyingTokenAddress: Address | undefined;
    switch (tokenAddress) {
      case AaveSafetyModule.STK_GHO:
        name = 'stkGHO';
        underlyingTokenAddress = AaveV3Ethereum.ASSETS.GHO.UNDERLYING;
        break;
      case AaveSafetyModule.STK_AAVE:
        name = 'stkAAVE';
        underlyingTokenAddress = AaveV3Ethereum.ASSETS.AAVE.UNDERLYING;
        break;
      case AaveSafetyModule.STK_ABPT:
        name = 'stkABPT';
        underlyingTokenAddress = abpt;
        break;
      case AaveSafetyModule.STK_AAVE_WSTETH_BPTV2:
        name = 'stkAAVEwstETHBPTv2';
        underlyingTokenAddress = twentywstETHEightyAAVE;
        break;
    }

    if (name && underlyingTokenAddress) {
      const book: BookType = {
        decimals: 18,
        id: chainId,
        UNDERLYING: underlyingTokenAddress,
        A_TOKEN: zeroAddress,
        V_TOKEN: zeroAddress,
        INTEREST_RATE_STRATEGY: zeroAddress,
        ORACLE: zeroAddress,
        STATIC_A_TOKEN: zeroAddress,
        STATA_TOKEN: zeroAddress,
        STK_TOKEN: tokenAddress,
      };
      return {
        type: tokenType,
        book,
        name,
        instanceType: AaveInstanceType.CORE,
      };
    }
  }

  for (const [key, assets] of Object.entries(AllAddressBooksAssets)) {
    const chainIdOfBook = AllAddressBooksChainIds[key];
    if (chainIdOfBook !== chainId) {
      continue;
    }
    console.log('Checking Aave address book:', key, 'for token address:', tokenAddress);
    console.log(assets);

    const entries: [string, BookType][] = Object.entries(assets);
    console.log('Entries in address book:', entries.length);
    for (const [name, asset] of entries) {
      switch (tokenAddress) {
        case asset.A_TOKEN:
          console.log('Found A_TOKEN match in book:', key, 'for token:', name);
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
        case asset.STATA_TOKEN:
        case asset.STATIC_A_TOKEN:
          tokenType = AaveTokenType.STATA;
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

  if (tokenBook && tokenBookName) {
    return {
      type: tokenType,
      book: tokenBook,
      name: tokenBookName,
      instanceType,
    };
  }
};

const getAaveInstanceFromInstanceFullName = (instanceFullName: string) => {
  if (instanceFullName.toLowerCase().includes('lido')) {
    return AaveInstanceType.PRIME;
  } else if (instanceFullName.toLowerCase().includes('etherfi')) {
    return AaveInstanceType.ETHERFI;
  } else if (instanceFullName.toLowerCase().includes('horizon')) {
    return AaveInstanceType.HORIZON_RWA;
  } else {
    return AaveInstanceType.CORE;
  }
};

const getSymbolPrefix = (chainName: string, instanceType?: AaveInstanceType) => {
  if (instanceType && instanceType === AaveInstanceType.HORIZON_RWA) {
    return 'HorRwa';
  } else if (chainName == ink.name) {
    return 'InkWl';
  }

  let prefix = chainName.substring(0, 3).toLowerCase();
  prefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);

  if (instanceType && instanceType !== AaveInstanceType.CORE) {
    prefix += instanceType;
  }

  return prefix;
};

const getNamePrefix = (chainName: string, instanceType?: AaveInstanceType) => {
  if (instanceType && instanceType === AaveInstanceType.HORIZON_RWA) {
    return AaveInstanceType.HORIZON_RWA;
  } else if (chainName == ink.name) {
    return 'InkWhitelabel';
  } else if (instanceType && instanceType !== AaveInstanceType.CORE) {
    return `${chainName} ${instanceType}`;
  }
  return `${chainName}`;
};

const getATokenSymbol = (
  underlyingSymbol: string,
  chainName: string,
  instanceType?: AaveInstanceType,
) => {
  const prefix = getSymbolPrefix(chainName, instanceType);
  return `a${prefix}${underlyingSymbol}`;
};

const getStataTokenSymbol = (
  underlyingSymbol: string,
  chainName: string,
  instanceType?: AaveInstanceType,
) => {
  const aTokenSymbol = getATokenSymbol(underlyingSymbol, chainName, instanceType);
  return `w${aTokenSymbol}`;
};

const getATokenName = (
  underlyingSymbol: string,
  chainName: string,
  instanceType?: AaveInstanceType,
) => {
  const namePrefix = getNamePrefix(chainName, instanceType);
  return `Aave ${namePrefix} ${underlyingSymbol}`;
};

const getStataTokenName = (
  underlyingSymbol: string,
  chainName: string,
  instanceType?: AaveInstanceType,
) => {
  const aTokenName = getATokenName(underlyingSymbol, chainName, instanceType);
  return `Wrapped ${aTokenName}`;
};

const getVTokenSymbol = (
  underlyingSymbol: string,
  chainName: string,
  instanceType?: AaveInstanceType,
) => {
  const prefix = getSymbolPrefix(chainName, instanceType);
  return `variableDebt${prefix}${underlyingSymbol}`;
};

const getVTokenName = (
  underlyingSymbol: string,
  chainName: string,
  instanceType?: AaveInstanceType,
) => {
  const namePrefix = getNamePrefix(chainName, instanceType);
  return `Aave ${namePrefix} Variable Debt ${underlyingSymbol}`;
};
