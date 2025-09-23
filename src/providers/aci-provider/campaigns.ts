import { mainnet } from 'viem/chains';

import { aAvaSAVAX, sGHO } from '@/constants/tokens';

import { Campaign, CampaignName } from './types';

export const campaignsData: Record<CampaignName, Campaign> = {
  [CampaignName.HoldSgho]: {
    actionName: CampaignName.HoldSgho,
    actionToken: sGHO,
    rewardToken: sGHO,
    chainId: mainnet.id,
    displayName: 'Hold sGHO on Ethereum',
  },
  [CampaignName.AvalancheSupplySAvax]: {
    actionName: CampaignName.AvalancheSupplySAvax,
    actionToken: aAvaSAVAX,
    rewardToken: aAvaSAVAX,
    chainId: mainnet.id,
    displayName: 'Supply sAVAX on Avalanche',
  },
};
