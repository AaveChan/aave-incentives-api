import { AaveSafetyModule, AaveV3Ethereum } from '@bgd-labs/aave-address-book';
import { mainnet } from 'viem/chains';

import { Token } from '@/types';

export const stkGHO: Token = {
  name: 'stk GHO',
  symbol: 'stkGHO',
  address: AaveSafetyModule.STK_GHO,
  chainId: mainnet.id,
  decimals: 18,
};

export const GHO: Token = {
  name: 'GHO Token',
  symbol: 'GHO',
  chainId: mainnet.id,
  address: AaveV3Ethereum.ASSETS.GHO.UNDERLYING,
  decimals: AaveV3Ethereum.ASSETS.GHO.decimals,
};
