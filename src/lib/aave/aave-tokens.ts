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
  metis,
  optimism,
  plasma,
  polygon,
  scroll,
  sonic,
  zksync,
} from 'viem/chains';

export type BookType = {
  decimals: number;
  id: number;
  UNDERLYING: Address;
  A_TOKEN: Address;
  V_TOKEN?: Address;
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

export type AaveTokenInfo = Token & {
  type: AaveTokenType;
  book: BookType;
  bookName: string;
  instanceType: AaveInstanceType | null;
  underlyingTokenAddress: Address;
};

// export const AaveInstanceEntriesByChainId = {
//   [mainnet.id]: {
//     AaveV3Ethereum: AaveV3Ethereum,
//     AaveV3EthereumEtherFi: AaveV3EthereumEtherFi,
//     AaveV3EthereumLido: AaveV3EthereumLido,
//     AaveV3HorizonRWA: AaveV3HorizonRWA,
//   },
//   [arbitrum.id]: {
//     AaveV3Arbitrum: AaveV3Arbitrum,
//   },
//   [avalanche.id]: {
//     AaveV3Avalanche: AaveV3Avalanche,
//   },
//   [base.id]: {
//     AaveV3Base: AaveV3Base,
//   },
//   [bsc.id]: {
//     AaveV3BNB: AaveV3BNB,
//   },
//   [linea.id]: {
//     AaveV3Linea: AaveV3Linea,
//   },
//   [polygon.id]: {
//     AaveV3Polygon: AaveV3Polygon,
//   },
//   [optimism.id]: {
//     AaveV3Optimism: AaveV3Optimism,
//   },
//   [zksync.id]: {
//     AaveV3ZkSync: AaveV3ZkSync,
//   },
//   [scroll.id]: {
//     AaveV3Scroll: AaveV3Scroll,
//   },
//   [gnosis.id]: {
//     AaveV3Gnosis: AaveV3Gnosis,
//   },
//   [metis.id]: {
//     AaveV3Metis: AaveV3Metis,
//   },
//   [celo.id]: {
//     AaveV3Celo: AaveV3Celo,
//   },
//   [plasma.id]: {
//     AaveV3Plasma: AaveV3Plasma,
//   },
//   [sonic.id]: {
//     AaveV3Sonic: AaveV3Sonic,
//   },
//   [ink.id]: {
//     AaveV3InkWhitelabel: AaveV3InkWhitelabel,
//   },
// } as const;

export const AaveInstanceEntries = {
  AaveV3Arbitrum: AaveV3Arbitrum,
  AaveV3Avalanche: AaveV3Avalanche,
  AaveV3Base: AaveV3Base,
  AaveV3BNB: AaveV3BNB,
  AaveV3Celo: AaveV3Celo,
  AaveV3Ethereum: AaveV3Ethereum,
  AaveV3EthereumEtherFi: AaveV3EthereumEtherFi,
  AaveV3EthereumLido: AaveV3EthereumLido,
  AaveV3Gnosis: AaveV3Gnosis,
  AaveV3InkWhitelabel: AaveV3InkWhitelabel,
  AaveV3Linea: AaveV3Linea,
  AaveV3Metis: AaveV3Metis,
  AaveV3Optimism: AaveV3Optimism,
  AaveV3Plasma: AaveV3Plasma,
  AaveV3Polygon: AaveV3Polygon,
  AaveV3Scroll: AaveV3Scroll,
  AaveV3Sonic: AaveV3Sonic,
  AaveV3ZkSync: AaveV3ZkSync,
  AaveV3HorizonRWA: AaveV3HorizonRWA,
} as const;

const stkTokens: Address[] = [
  AaveSafetyModule.STK_GHO,
  AaveSafetyModule.STK_AAVE,
  AaveSafetyModule.STK_ABPT,
  AaveSafetyModule.STK_AAVE_WSTETH_BPTV2,
];

// export const AaveInstanceEntries = Object.fromEntries(
//   Object.values(AaveInstanceEntriesByChainId).flatMap(Object.entries),
// );

export type AaveInstanceName = keyof typeof AaveInstanceEntries;

export type AaveInstanceBook = (typeof AaveInstanceEntries)[AaveInstanceName];

const AllAddressBooksAssets = Object.fromEntries(
  Object.entries(AaveInstanceEntries).map(([key, instance]) => [key, { ...instance.ASSETS }]),
);

const AllAddressBooksChainIds = Object.fromEntries(
  Object.entries(AaveInstanceEntries).map(([key, instance]) => [key, instance.CHAIN_ID]),
);

// do a record of AaveInstanceBook but classed by chainIds: Record<number,Record<AaveInstanceName, AaveInstanceBook>>

const abpt = '0x41A08648C3766F9F9d85598fF102a08f4ef84F84';
const twentywstETHEightyAAVE = '0x3de27EFa2F1AA663Ae5D458857e731c129069F29';

// export const getAaveToken = (
//   tokenAddress: Address,
//   chainId: number,
//   instanceName: AaveInstanceName,
// ) => {
//   const tokenInfo = getAaveTokenInfo(tokenAddress, chainId, instanceName);
//   const chain = getChain(chainId);
//   let symbol: string | undefined;
//   let name: string | undefined;
//   switch (tokenInfo?.type) {
//     case AaveTokenType.A:
//       symbol = getATokenSymbol(tokenInfo.name, chain.name, tokenInfo.instanceType);
//       name = getATokenName(tokenInfo.name, chain.name, tokenInfo.instanceType);
//       break;
//     case AaveTokenType.V:
//       symbol = getVTokenSymbol(tokenInfo.name, chain.name, tokenInfo.instanceType);
//       name = getVTokenName(tokenInfo.name, chain.name, tokenInfo.instanceType);
//       break;
//     case AaveTokenType.STATA:
//       symbol = getStataTokenSymbol(tokenInfo.name, chain.name, tokenInfo.instanceType);
//       name = getStataTokenName(tokenInfo.name, chain.name, tokenInfo.instanceType);
//       break;
//     case AaveTokenType.STK:
//       symbol = tokenInfo.name;
//       name = tokenInfo.name; // tokenInfo.name is the symbol. So the name here is not really accurate.
//       break;
//     case AaveTokenType.UNDERLYING:
//       symbol = tokenInfo.name;
//       name = tokenInfo.name; // tokenInfo.name is the symbol. So the name here is not really accurate.
//       break;
//     case AaveTokenType.NOT_LISTED:
//     default:
//       return undefined;
//   }

//   if (symbol && name) {
//     const aaveToken: Token = {
//       address: tokenAddress,
//       symbol: symbol,
//       name: name,
//       decimals: tokenInfo.book.decimals,
//       chainId: chainId,
//     };

//     return aaveToken;
//   }
// };

export const getAaveToken = ({
  tokenAddress,
  chainId,
  instanceName,
}: {
  tokenAddress: Address;
  chainId: number;
  instanceName?: AaveInstanceName;
}): Token | undefined => {
  const tokenInfo = getAaveTokenAllData({
    tokenAddress,
    chainId,
    instanceName,
  });
  return tokenInfo ? tokenInfo.token : undefined;
};

/**
 * Get Aave token information.
 * @param param0 - The parameters for fetching the token information.
 * @param param0.tokenAddress - The address of the token.
 * @param param0.chainId - The chain ID where the token is located.
 * @param param0.instanceName - (Optional) The Aave instance name. Useful when fetching by the underlying token and if the token exists in multiple instances on the same chain.
 * @returns The Aave token information or undefined if not found.
 */
export const getAaveTokenInfo = ({
  tokenAddress,
  chainId,
  instanceName,
}: {
  tokenAddress: Address;
  chainId: number;
  instanceName?: AaveInstanceName;
}): AaveTokenInfo | undefined => {
  const tokenInfo = getAaveTokenAllData({
    tokenAddress,
    chainId,
    instanceName,
  });
  return tokenInfo ? tokenInfo.aaveTokenInfo : undefined;
};

export const getAaveTokenAllData = ({
  tokenAddress,
  chainId,
  instanceName,
}: {
  tokenAddress: Address;
  chainId: number;
  instanceName?: AaveInstanceName;
}): {
  token: Token;
  aaveTokenInfo: AaveTokenInfo;
} | null => {
  let type = AaveTokenType.NOT_LISTED;
  let book: BookType | undefined;
  let tokenBookName: string | undefined;
  let instanceType: AaveInstanceType | undefined;
  let symbol: string | undefined;
  let name: string | undefined;
  let underlyingTokenAddress: Address | undefined;

  const chain = getChain(chainId);

  if (stkTokens.includes(tokenAddress)) {
    type = AaveTokenType.STK;

    switch (tokenAddress) {
      case AaveSafetyModule.STK_GHO:
        tokenBookName = 'STK_GHO';
        name = 'stkGHO';
        underlyingTokenAddress = AaveV3Ethereum.ASSETS.GHO.UNDERLYING;
        break;
      case AaveSafetyModule.STK_AAVE:
        tokenBookName = 'STK_AAVE';
        name = 'stkAAVE';
        underlyingTokenAddress = AaveV3Ethereum.ASSETS.AAVE.UNDERLYING;
        break;
      case AaveSafetyModule.STK_ABPT:
        tokenBookName = 'STK_ABPT';
        name = 'stkABPT';
        underlyingTokenAddress = abpt;
        break;
      case AaveSafetyModule.STK_AAVE_WSTETH_BPTV2:
        tokenBookName = 'STK_AAVE_WSTETH_BPTV2';
        name = 'stkAAVEwstETHBPTv2';
        underlyingTokenAddress = twentywstETHEightyAAVE;
        break;
    }

    if (name && tokenBookName && symbol && underlyingTokenAddress) {
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

      const token: Token = {
        name: name,
        symbol: symbol,
        address: tokenAddress,
        chainId: chainId,
        decimals: 18,
      };

      const aaveTokenInfo: AaveTokenInfo = {
        ...token,
        type: type,
        book,
        bookName: tokenBookName,
        instanceType: null,
        underlyingTokenAddress,
      };

      return {
        token,
        aaveTokenInfo,
      };
    }
  }

  for (const [key, assets] of Object.entries(AllAddressBooksAssets)) {
    const chainIdOfBook = AllAddressBooksChainIds[key];

    // If the chainId or instanceName don't match, skip this book
    if (chainIdOfBook !== chainId || (instanceName && key !== instanceName)) {
      continue;
    }

    const entries: [string, BookType][] = Object.entries(assets);

    for (const [assetName, asset] of entries) {
      switch (tokenAddress) {
        case asset.A_TOKEN:
          type = AaveTokenType.A;
          book = asset;
          tokenBookName = assetName;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          symbol = getATokenSymbol(assetName, chain.name, instanceType);
          name = getATokenName(assetName, chain.name, instanceType);
          underlyingTokenAddress = asset.UNDERLYING;
          break;
        case asset.V_TOKEN:
          type = AaveTokenType.V;
          book = asset;
          tokenBookName = assetName;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          symbol = getVTokenSymbol(assetName, chain.name, instanceType);
          name = getVTokenName(assetName, chain.name, instanceType);
          underlyingTokenAddress = asset.UNDERLYING;
          break;
        case asset.STATA_TOKEN:
        case asset.STATIC_A_TOKEN:
          type = AaveTokenType.STATA;
          book = asset;
          tokenBookName = assetName;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          symbol = getStataTokenSymbol(assetName, chain.name, instanceType);
          name = getStataTokenName(assetName, chain.name, instanceType);
          underlyingTokenAddress = asset.UNDERLYING;
          break;
        case asset.UNDERLYING:
          type = AaveTokenType.UNDERLYING;
          book = asset;
          tokenBookName = assetName;
          instanceType = getAaveInstanceFromInstanceFullName(key);
          symbol = assetName;
          name = assetName; // tokenInfo.name is the symbol. So the name here is not really accurate.
          underlyingTokenAddress = asset.UNDERLYING;
          break;
      }
    }
  }

  if (type && name && tokenBookName && symbol && book && instanceType && underlyingTokenAddress) {
    const token: Token = {
      name: name,
      symbol: symbol,
      address: tokenAddress,
      chainId: chainId,
      decimals: book.decimals,
    };

    const aaveTokenInfo: AaveTokenInfo = {
      ...token,
      type,
      book,
      bookName: tokenBookName,
      instanceType,
      underlyingTokenAddress,
    };

    return {
      token,
      aaveTokenInfo,
    };
  }

  return null;
};

export const getAaveInstanceBook = (aaveInstanceName: AaveInstanceName) => {
  return AaveInstanceEntries[aaveInstanceName];
};

export const getAaveInstancesBookByChainId = (chainId: number) => {
  const instances: AaveInstanceBook[] = [];
  for (const instance of Object.values(AaveInstanceEntries)) {
    if (instance.CHAIN_ID === chainId) {
      instances.push(instance);
    }
  }
  return instances;
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
