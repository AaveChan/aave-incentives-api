import { AaveV3Ethereum } from '@bgd-labs/aave-address-book';
import { mainnet } from 'viem/chains';

import { Token } from '@/types';

export const GHO: Token = {
  name: 'GHO Token',
  symbol: 'GHO',
  chainId: mainnet.id,
  address: AaveV3Ethereum.ASSETS.GHO.UNDERLYING,
  decimals: AaveV3Ethereum.ASSETS.GHO.decimals,
  priceOracle: AaveV3Ethereum.ASSETS.GHO.ORACLE,
};
