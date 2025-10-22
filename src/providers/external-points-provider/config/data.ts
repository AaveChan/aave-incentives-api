// services/providers/ExternalPoints/pointPrograms.ts
import { AaveV3Base, AaveV3Ethereum } from '@bgd-labs/aave-address-book';
import { PointProgram, POINT_PROGRAM_IDS, PointCampaign } from '../types';
import { base, mainnet } from 'viem/chains';

// Use array - cleaner, no ID duplication
export const pointPrograms: PointProgram[] = [
  {
    id: POINT_PROGRAM_IDS.ETHERFI,
    name: 'Etherfi Loyalty Points',
    protocol: 'Etherfi',
    description:
      'Earn Etherfi loyalty points and EigenLayer points by supplying liquid restaking tokens',
    externalLink: 'https://www.ether.fi/points',
    pointValueUnit: 'per_token',
    tgePrice: undefined,
    additionalData: {
      includesEigenLayer: true,
    },
  },
  {
    id: POINT_PROGRAM_IDS.ETHENA,
    name: 'Ethena Sats',
    protocol: 'Ethena',
    description: 'Earn Ethena Sats by supplying USDe or sUSDe',
    externalLink: 'https://www.ethena.fi/sats',
    pointValueUnit: 'per_dollar',
    tgePrice: undefined,
  },
  {
    id: POINT_PROGRAM_IDS.KELP,
    name: 'Kelp Miles',
    protocol: 'Kelp DAO',
    description: 'Earn Kelp Miles and EigenLayer points by supplying rsETH',
    externalLink: 'https://kelpdao.xyz/miles',
    pointValueUnit: 'per_token',
    tgePrice: undefined,
    additionalData: {
      includesEigenLayer: true,
    },
  },
  {
    id: POINT_PROGRAM_IDS.RENZO,
    name: 'Renzo ezPoints',
    protocol: 'Renzo',
    description: 'Earn Renzo ezPoints by supplying ezETH',
    externalLink: 'https://renzoprotocol.com/ezpoints',
    pointValueUnit: 'per_token',
    tgePrice: undefined,
  },
  {
    id: POINT_PROGRAM_IDS.EIGENLAYER,
    name: 'EigenLayer Points',
    protocol: 'EigenLayer',
    description: 'Earn EigenLayer points by supplying liquid restaking tokens',
    externalLink: 'https://www.eigenlayer.xyz',
    pointValueUnit: 'multiplier',
    tgePrice: undefined,
  },
  {
    id: POINT_PROGRAM_IDS.SONIC,
    name: 'Sonic Points',
    protocol: 'Sonic',
    description: 'Earn Sonic Points by participating in Sonic ecosystem',
    externalLink: 'https://sonic.game',
    pointValueUnit: 'per_dollar',
    tgePrice: undefined,
  },
  {
    id: POINT_PROGRAM_IDS.KERNEL,
    name: 'Kernel Points',
    protocol: 'Kernel',
    description: 'Earn Kernel points by supplying eligible assets',
    externalLink: 'https://kernel.community',
    pointValueUnit: 'per_token',
    tgePrice: undefined,
  },
];

export const pointCampaigns: PointCampaign[] = [
  // ===== ETHERFI CAMPAIGNS =====
  // Same point value across ALL chains - define once!
  {
    programId: POINT_PROGRAM_IDS.ETHERFI, // ✅ Type-safe & autocomplete!
    chainId: mainnet.id,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.weETH.A_TOKEN,
    pointValue: 1,
  },
  {
    programId: POINT_PROGRAM_IDS.ETHERFI, // ✅ Type-safe & autocomplete!
    chainId: base.id,
    rewardedTokenAddress: AaveV3Base.ASSETS.weETH.A_TOKEN,
    pointValue: 1,
  },

  // ===== ETHENA CAMPAIGNS =====
  // Different point values per asset (USDe vs sUSDe)
  {
    programId: POINT_PROGRAM_IDS.ETHENA,
    chainId: 1,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.USDe.A_TOKEN,
    pointValue: 20, // 20 sats per dollar
  },

  // ===== KELP CAMPAIGNS =====
  {
    programId: POINT_PROGRAM_IDS.KELP,
    chainId: 1,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
    pointValue: 10, // 10 miles per ETH equivalent per day
  },

  // ===== RENZO CAMPAIGNS =====
  // Example: Different point values per chain (if needed)
  {
    programId: POINT_PROGRAM_IDS.RENZO,
    chainId: 1, // Ethereum: standard rate
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.ezETH.A_TOKEN,
    pointValue: 1,
  },

  // ===== EIGENLAYER (Multiple Assets, Same Chain) =====
  // All liquid restaking tokens on Ethereum
  {
    programId: POINT_PROGRAM_IDS.EIGENLAYER,
    chainId: 1,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.weETH.A_TOKEN,
    pointValue: 1,
  },
  {
    programId: POINT_PROGRAM_IDS.EIGENLAYER,
    chainId: 1,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
    pointValue: 1,
  },
  {
    programId: POINT_PROGRAM_IDS.EIGENLAYER,
    chainId: 1,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.ezETH.A_TOKEN,
    pointValue: 1,
  },

  // ===== SONIC CAMPAIGNS =====
  {
    programId: POINT_PROGRAM_IDS.SONIC,
    chainId: 146, // Sonic chain only
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.USDC.A_TOKEN,
    pointValue: 100, // 100 points per dollar per day
  },
  {
    programId: POINT_PROGRAM_IDS.SONIC,
    chainId: 146,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.WETH.A_TOKEN,
    pointValue: 150, // Higher rate for WETH
  },

  // ===== KERNEL CAMPAIGNS =====
  {
    programId: POINT_PROGRAM_IDS.KERNEL,
    chainId: 1,
    rewardedTokenAddress: AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
    pointValue: 1,
    startTimestamp: 1704067200, // January 1, 2024
    endTimestamp: 1735689600, // December 31, 2024
  },
];
