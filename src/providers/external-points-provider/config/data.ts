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
import { PointProgram, POINT_PROGRAM_IDS, PointIncentive, PointProgramId } from '../types';
import { arbitrum, base, linea, mainnet, plasma, scroll, sonic, zksync } from 'viem/chains';

export const pointPrograms: Record<PointProgramId, PointProgram> = {
  [POINT_PROGRAM_IDS.ETHERFI]: {
    id: POINT_PROGRAM_IDS.ETHERFI,
    name: 'Etherfi Loyalty Points',
    protocol: 'Etherfi',
    description: 'Earn Etherfi loyalty points',
    externalLink: 'https://www.ether.fi/app/portfolio',
    pointValueUnit: 'x',
  },
  [POINT_PROGRAM_IDS.ETHENA]: {
    id: POINT_PROGRAM_IDS.ETHENA,
    name: 'Ethena Points',
    protocol: 'Ethena',
    description: 'Earn Ethena Points',
    externalLink: 'https://app.ethena.fi/overview',
    pointValueUnit: 'x',
  },
  [POINT_PROGRAM_IDS.KELP]: {
    id: POINT_PROGRAM_IDS.KELP,
    name: 'Kernel Points',
    protocol: 'Kelp DAO',
    description:
      'Earn Kernel Points - Kernel Points are a measurement system that rewards users for depositing assets into the Kernel ecosystem. 1 Kernel Point = 1 Kelp Grand Mile = 1000 Kelp Miles',
    externalLink: 'https://kelpdao.xyz/miles',
    pointValueUnit: 'x',
  },
  [POINT_PROGRAM_IDS.SONIC]: {
    id: POINT_PROGRAM_IDS.SONIC,
    name: 'Sonic Points',
    protocol: 'Sonic',
    description:
      'Earn Sonic Points - Sonic Points are user-focused airdrop points that can be earned as part of the ~200 million S airdrop.',
    externalLink: 'https://my.soniclabs.com/points',
    pointValueUnit: 'x',
  },
};

export const pointCampaigns: Record<PointProgramId, PointIncentive[]> = {
  [POINT_PROGRAM_IDS.ETHERFI]: [
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3Ethereum.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3EthereumEtherFi.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3Ethereum.ASSETS.eBTC.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: plasma.id,
      rewardedTokenAddress: AaveV3Plasma.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: base.id,
      rewardedTokenAddress: AaveV3Base.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: arbitrum.id,
      rewardedTokenAddress: AaveV3Arbitrum.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: linea.id,
      rewardedTokenAddress: AaveV3Linea.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: scroll.id,
      rewardedTokenAddress: AaveV3Scroll.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: zksync.id,
      rewardedTokenAddress: AaveV3Scroll.ASSETS.weETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 3,
        },
      ],
    },
  ],
  [POINT_PROGRAM_IDS.ETHENA]: [
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3Ethereum.ASSETS.USDe.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3Ethereum.ASSETS.sUSDe.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3EthereumLido.ASSETS.sUSDe.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: plasma.id,
      rewardedTokenAddress: AaveV3Plasma.ASSETS.USDe.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: plasma.id,
      rewardedTokenAddress: AaveV3Plasma.ASSETS.sUSDe.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 5,
        },
      ],
    },
    // all PTs
  ],
  [POINT_PROGRAM_IDS.KELP]: [
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: mainnet.id,
      rewardedTokenAddress: AaveV3EthereumLido.ASSETS.rsETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: base.id,
      rewardedTokenAddress: AaveV3Base.ASSETS.wrsETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: arbitrum.id,
      rewardedTokenAddress: AaveV3Base.ASSETS.wrsETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
        },
      ],
    },
  ],
  [POINT_PROGRAM_IDS.SONIC]: [
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddress: AaveV3Sonic.ASSETS.wS.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 12,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddress: AaveV3Sonic.ASSETS.USDC.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 8,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddress: AaveV3Sonic.ASSETS.stS.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 12,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddress: AaveV3Sonic.ASSETS.WETH.A_TOKEN,
      campaigns: [
        {
          startTimestamp: 1735700400,
          pointValue: 4,
        },
      ],
    },
  ],
};
