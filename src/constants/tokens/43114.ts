import { AaveV3Avalanche } from '@bgd-labs/aave-address-book';
import { avalanche } from 'viem/chains';

import { Token } from '@/types';

export const aAvaSAVAX: Token = {
  name: 'Aave Avalanche SAVAX',
  symbol: 'aAvaSAVAX',
  address: AaveV3Avalanche.ASSETS.sAVAX.A_TOKEN,
  chainId: avalanche.id,
  decimals: AaveV3Avalanche.ASSETS.sAVAX.decimals,
};
