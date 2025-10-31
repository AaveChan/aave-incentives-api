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
import { Address, zeroAddress } from 'viem';
import { ink } from 'viem/chains';

import { createLogger } from '@/config/logger';
import { Token } from '@/types';

import { getChain } from '../utils/chains';
import { AaveV3HorizonRWA } from './horizon-assets';

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

const safetyModuleTokens: Address[] = [
  AaveSafetyModule.STK_GHO,
  AaveSafetyModule.STK_AAVE,
  AaveSafetyModule.STK_ABPT,
  AaveSafetyModule.STK_AAVE_WSTETH_BPTV2,
];
const abpt = '0x41A08648C3766F9F9d85598fF102a08f4ef84F84';
const twentywstETHEightyAAVE = '0x3de27EFa2F1AA663Ae5D458857e731c129069F29';

export type AaveInstanceName = keyof typeof AaveInstanceEntries;

export type AaveInstanceBook = (typeof AaveInstanceEntries)[AaveInstanceName];

const AllAddressBooksAssets = Object.fromEntries(
  Object.entries(AaveInstanceEntries).map(([key, instance]) => [key, { ...instance.ASSETS }]),
);

const AllAddressBooksChainIds = Object.fromEntries(
  Object.entries(AaveInstanceEntries).map(([key, instance]) => [key, instance.CHAIN_ID]),
);

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
 * @param params.tokenAddress - The address of the token.
 * @param params.chainId - The chain ID where the token is located.
 * @param params.instanceName - (Optional) The Aave instance name. Useful when fetching by the underlying token and if the token exists in multiple instances on the same chain.
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
  const chain = getChain(chainId);

  if (safetyModuleTokens.includes(tokenAddress)) {
    const type = AaveTokenType.STK;
    let tokenBookName: string | undefined;
    let symbol: string | undefined;
    let name: string | undefined;
    let underlyingTokenAddress: Address | undefined;
    let priceFeed: Address | undefined;

    switch (tokenAddress) {
      case AaveSafetyModule.STK_GHO:
        tokenBookName = 'STK_GHO';
        symbol = 'Saving GHO';
        name = 'sGHO';
        underlyingTokenAddress = AaveV3Ethereum.ASSETS.GHO.UNDERLYING;
        priceFeed = AaveV3Ethereum.ASSETS.GHO.ORACLE; // use GHO price feed for stkGHO
        break;
      case AaveSafetyModule.STK_AAVE:
        tokenBookName = 'STK_AAVE';
        symbol = 'Staked Aave';
        name = 'stkAAVE';
        underlyingTokenAddress = AaveV3Ethereum.ASSETS.AAVE.UNDERLYING;
        priceFeed = AaveV3Ethereum.ASSETS.AAVE.ORACLE; // use AAVE price feed for stkAAVE
        break;
      case AaveSafetyModule.STK_ABPT:
        tokenBookName = 'STK_ABPT';
        symbol = 'stkABPT';
        name = 'Staked Aave Balance Pool Token';
        underlyingTokenAddress = abpt;
        break;
      case AaveSafetyModule.STK_AAVE_WSTETH_BPTV2:
        tokenBookName = 'STK_AAVE_WSTETH_BPTV2';
        symbol = 'stkAAVEwstETHBPTv2';
        name = 'stk AAVE/wstETH BPTv2';
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
        priceOracle: priceFeed,
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

  for (const [addressBookKey, assets] of Object.entries(AllAddressBooksAssets)) {
    const chainIdOfBook = AllAddressBooksChainIds[addressBookKey];

    // If the chainId or instanceName don't match, skip this book
    if (chainIdOfBook !== chainId || (instanceName && addressBookKey !== instanceName)) {
      continue;
    }

    let type: AaveTokenType | undefined;
    let book: BookType | undefined;
    let tokenBookName: string | undefined;
    let instanceType: AaveInstanceType | undefined;
    let symbol: string | undefined;
    let name: string | undefined;
    let underlyingTokenAddress: Address | undefined;
    let priceFeedOracle: Address | undefined;

    const entries: [string, BookType][] = Object.entries(assets);

    for (const [assetName, asset] of entries) {
      book = asset;
      tokenBookName = assetName;
      underlyingTokenAddress = asset.UNDERLYING;
      priceFeedOracle = asset.ORACLE;
      instanceType = getAaveInstanceFromInstanceFullName(addressBookKey);

      switch (tokenAddress) {
        case asset.A_TOKEN:
          type = AaveTokenType.A;
          book = asset;
          symbol = getATokenSymbol(assetName, chain.name, instanceType);
          name = getATokenName(assetName, chain.name, instanceType);
          break;
        case asset.V_TOKEN:
          type = AaveTokenType.V;
          symbol = getVTokenSymbol(assetName, chain.name, instanceType);
          name = getVTokenName(assetName, chain.name, instanceType);
          break;
        case asset.STATA_TOKEN:
        case asset.STATIC_A_TOKEN:
          type = AaveTokenType.STATA;
          symbol = getStataTokenSymbol(assetName, chain.name, instanceType);
          name = getStataTokenName(assetName, chain.name, instanceType);
          break;
        case asset.UNDERLYING:
          type = AaveTokenType.UNDERLYING;
          symbol = assetName;
          name = assetName; // tokenInfo.name is the symbol. So the name here is not really accurate.
          break;
      }

      if (type && name && symbol) {
        const token: Token = {
          name: name,
          symbol: symbol,
          address: tokenAddress,
          chainId: chainId,
          decimals: book.decimals,
          priceOracle: priceFeedOracle,
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
    }
  }

  // // check oracle address if the token is a wrapper token
  // const aTokenBook = tokenWrapperMapping[tokenAddress];
  // if (aTokenBook) {
  //   const token: Token = {
  //     name: aTokenBook.name,
  //     symbol: aTokenBook.symbol,
  //     address: tokenAddress,
  //     chainId: chainId,
  //     decimals: aTokenBook.decimals,
  //     priceOracle: aTokenBook.priceOracle,
  //   };

  //   const aaveTokenInfo: AaveTokenInfo = {
  //     ...token,
  //     type: AaveTokenType.A,
  //     book: aTokenBook.book,
  //     bookName: aTokenBook.bookName,
  //     instanceType: aTokenBook.instanceType,
  //     underlyingTokenAddress: aTokenBook.underlyingTokenAddress,
  //   };
  // }

  const logger = createLogger('getAaveTokenAllData');
  logger.warn(
    `Token ${tokenAddress} not found on chain ${chainId} ${
      instanceName ? `for instance ${instanceName}` : ''
    }`,
  );

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
