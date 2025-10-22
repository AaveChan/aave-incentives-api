import {
  AaveV3Arbitrum,
  AaveV3Base,
  AaveV3Ethereum,
  AaveV3EthereumEtherFi,
  AaveV3EthereumLido,
  AaveV3Linea,
  AaveV3Plasma,
  AaveV3Scroll,
  AaveV3Sonic,
} from '@bgd-labs/aave-address-book';
import { PointProgram, POINT_PROGRAM_IDS, PointCampaign } from '../types';
import { arbitrum, base, linea, mainnet, plasma, scroll, sonic, zksync } from 'viem/chains';

export const pointPrograms: PointProgram[] = [
  {
    id: POINT_PROGRAM_IDS.ETHERFI,
    name: 'Etherfi Loyalty Points',
    protocol: 'Etherfi',
    description:
      'Earn Etherfi loyalty points - eETH/weETH holders, eBTC, eUSD, Liquid vaults and using ether.fi assets in integrated DeFi protocols will earn ether.fi Loyalty Points.',
    externalLink: 'https://www.ether.fi/app/portfolio',
    pointValueUnit: 'x',
  },
  {
    id: POINT_PROGRAM_IDS.ETHENA,
    name: 'Ethena Points',
    protocol: 'Ethena',
    description: 'Earn Ethena Points',
    externalLink: 'https://app.ethena.fi/overview',
    pointValueUnit: 'x',
  },
  {
    id: POINT_PROGRAM_IDS.KELP,
    name: 'Kernel Points',
    protocol: 'Kelp DAO',
    description:
      'Earn Kernel Points - Kernel Points are a measurement system that rewards users for depositing assets into the Kernel ecosystem. 1 Kernel Point = 1 Kelp Grand Mile = 1000 Kelp Miles',
    externalLink: 'https://kelpdao.xyz/miles',
    pointValueUnit: 'x',
  },
  {
    id: POINT_PROGRAM_IDS.SONIC,
    name: 'Sonic Points',
    protocol: 'Sonic',
    description:
      'Earn Sonic Points - Sonic Points are user-focused airdrop points that can be earned as part of the ~200 million S airdrop.',
    externalLink: 'https://my.soniclabs.com/points',
    pointValueUnit: 'x',
  },
];

export const pointCampaigns: PointCampaign[] = [
  // ===== ETHERFI CAMPAIGNS =====
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3EthereumEtherFi.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.eBTC.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: plasma.id,
    rewardedTokenAddress: AaveV3Plasma.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: base.id,
    rewardedTokenAddress: AaveV3Base.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: arbitrum.id,
    rewardedTokenAddress: AaveV3Arbitrum.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: linea.id,
    rewardedTokenAddress: AaveV3Linea.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: scroll.id,
    rewardedTokenAddress: AaveV3Scroll.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI,
    chainId: zksync.id,
    rewardedTokenAddress: AaveV3Scroll.ASSETS.weETH.A_TOKEN,
    pointValue: 3,
  },

  // ===== ETHENA CAMPAIGNS =====
  // Different point values per asset (USDe vs sUSDe)
  {
    programId: POINT_PROGRAM_IDS.ETHENA,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.USDe.A_TOKEN,
    pointValue: 5,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHENA,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.sUSDe.A_TOKEN,
    pointValue: 5,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHENA,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3EthereumLido.ASSETS.sUSDe.A_TOKEN,
    pointValue: 5,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHENA,
    chainId: plasma.id,
    rewardedTokenAddress: AaveV3Plasma.ASSETS.USDe.A_TOKEN,
    pointValue: 5,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHENA,
    chainId: plasma.id,
    rewardedTokenAddress: AaveV3Plasma.ASSETS.sUSDe.A_TOKEN,
    pointValue: 5,
  },
  // all PTs

  // ===== KELP CAMPAIGNS =====
  {
    programId: POINT_PROGRAM_IDS.KELP,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
  },
  {
    programId: POINT_PROGRAM_IDS.KELP,
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3EthereumLido.ASSETS.rsETH.A_TOKEN,
  },
  {
    programId: POINT_PROGRAM_IDS.KELP,
    chainId: base.id,
    rewardedTokenAddress: AaveV3Base.ASSETS.wrsETH.A_TOKEN,
  },
  {
    programId: POINT_PROGRAM_IDS.KELP,
    chainId: arbitrum.id,
    rewardedTokenAddress: AaveV3Base.ASSETS.wrsETH.A_TOKEN,
  },

  // ===== SONIC CAMPAIGNS =====
  {
    programId: POINT_PROGRAM_IDS.SONIC,
    chainId: sonic.id,
    rewardedTokenAddress: AaveV3Sonic.ASSETS.wS.A_TOKEN,
    pointValue: 12,
  },
  {
    programId: POINT_PROGRAM_IDS.SONIC,
    chainId: sonic.id,
    rewardedTokenAddress: AaveV3Sonic.ASSETS.USDC.A_TOKEN,
    pointValue: 8,
  },
  {
    programId: POINT_PROGRAM_IDS.SONIC,
    chainId: sonic.id,
    rewardedTokenAddress: AaveV3Sonic.ASSETS.stS.A_TOKEN,
    pointValue: 12,
  },
  {
    programId: POINT_PROGRAM_IDS.SONIC,
    chainId: sonic.id,
    rewardedTokenAddress: AaveV3Sonic.ASSETS.WETH.A_TOKEN,
    pointValue: 4,
  },
];
