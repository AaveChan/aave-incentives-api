import { AaveV3Sonic } from '@bgd-labs/aave-address-book';
import { sonic } from 'viem/chains';

import { Token } from '@/types';

export const aSonwS: Token = {
  name: 'Aave Sonic wS',
  symbol: 'aSonwS',
  address: AaveV3Sonic.ASSETS.wS.A_TOKEN,
  chainId: sonic.id,
  decimals: AaveV3Sonic.ASSETS.wS.decimals,
};

export const aSonUSDC: Token = {
  name: 'Aave Sonic USDC',
  symbol: 'aSonUSDC',
  address: AaveV3Sonic.ASSETS.USDC.A_TOKEN,
  chainId: sonic.id,
  decimals: AaveV3Sonic.ASSETS.USDC.decimals,
};
