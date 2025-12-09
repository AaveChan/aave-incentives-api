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
  AaveV3ZkSync,
} from '@bgd-labs/aave-address-book';
import { arbitrum, base, linea, mainnet, plasma, scroll, sonic, zksync } from 'viem/chains';

import { IncentiveType } from '@/types/api.js';

import { POINT_PROGRAM_IDS, PointIncentives, PointProgram, PointProgramId } from '../types.js';

// For simplicity:
// - if an asset is onboarded during a season, we defined the fact that it has been eligible for the whole season from day 1 (while in reality it started when the asset was onboarded)
// - also for PT: when the PT reach maturity, we let the campaign run until the end of the season even if the PT is not valid anymore
export const pointPrograms: Record<PointProgramId, PointProgram> = {
  [POINT_PROGRAM_IDS.ETHERFI]: {
    id: POINT_PROGRAM_IDS.ETHERFI,
    name: 'Etherfi Loyalty Points',
    protocol: 'Etherfi',
    type: IncentiveType.POINT,
    description: 'Earn Etherfi loyalty points',
    externalLink: 'https://www.ether.fi/app/portfolio',
    pointValueUnit: 'x',
    seasons: {
      '1': {
        startTimestamp: 1700006400, // 15/11/23 00:00:00
        endTimestamp: 1710460799, // 14/03/24 23:59:59
      },
      '2': {
        startTimestamp: 1710460800, // 15/03/24 00:00:00
        endTimestamp: 1719791999, // 30/06/24 23:59:59
      },
      '3': {
        startTimestamp: 1719792000, // 01/07/24 00:00:00
        endTimestamp: 1726358399, // 14/09/24 23:59:59
      },
      '4': {
        startTimestamp: 1726358400, // 15/09/24 00:00:00
        endTimestamp: 1738367999, // 31/01/25 23:59:59
      },
      '5': {
        startTimestamp: 1738368000, // 01/02/25 00:00:00
        endTimestamp: 1748735999, // 31/05/25 23:59:59
      },
      '6': {
        startTimestamp: 1748736000, // 01/06/25 00:00:00
        endTimestamp: 1756684799, // 31/08/25 23:59:59
      },
      '7': {
        startTimestamp: 1756684800, // 01/09/25 00:00:00
      },
    },
  },
  [POINT_PROGRAM_IDS.ETHENA]: {
    id: POINT_PROGRAM_IDS.ETHENA,
    name: 'Ethena Points',
    protocol: 'Ethena',
    type: IncentiveType.POINT,
    description: 'Earn Ethena Points',
    externalLink: 'https://app.ethena.fi/overview',
    pointValueUnit: 'x',
    seasons: {
      '1': {
        startTimestamp: 1708300800, // 19/02/24 00:00:00
        endTimestamp: 1712015999, // 01/04/24 23:59:59
        pointValue: 5,
      },
      '2': {
        startTimestamp: 1712016000, // 02/04/24 00:00:00
        endTimestamp: 1725321599, // 02/09/24 23:59:59
        pointValue: 5,
      },
      '3': {
        startTimestamp: 1725321600, // 03/09/24 00:00:00
        endTimestamp: 1742687999, // 22/03/25 23:59:59
        pointValue: 5,
      },
      '4': {
        startTimestamp: 1742688000, // 23/03/25 00:00:00
        endTimestamp: 1758671999, // 23/09/25 23:59:59
        pointValue: 5,
      },
      '5': {
        startTimestamp: 1758672000, // 24/09/25 00:00:00
        pointValue: 5,
      },
    },
  },
  [POINT_PROGRAM_IDS.KELP]: {
    id: POINT_PROGRAM_IDS.KELP,
    name: 'Kernel Points',
    protocol: 'Kelp DAO',
    type: IncentiveType.POINT,
    description:
      'Earn Kernel Points - Kernel Points are a measurement system that rewards users for depositing assets into the Kernel ecosystem. 1 Kernel Point = 1 Kelp Grand Mile = 1000 Kelp Miles',
    externalLink: 'https://kelpdao.xyz/miles',
    pointValueUnit: 'x',
    seasons: {
      '1': {
        startTimestamp: 1702339200, // 12/12/23 00:00:00
        endTimestamp: 1735689599, // 31/12/24 23:59:59
      },
      '2': {
        startTimestamp: 1735689600, // 01/01/25 00:00:00
        endTimestamp: 1746057599, // 30/04/25 23:59:59
      },
      '3': {
        startTimestamp: 1746057600, // 01/05/25 00:00:00
        endTimestamp: 1756684799, // 31/08/25 23:59:59
      },
      '4': {
        startTimestamp: 1756684800, // 01/09/25 00:00:00
        endTimestamp: 1740787199, // 31/08/25 23:59:59
      },
    },
  },
  [POINT_PROGRAM_IDS.SONIC]: {
    id: POINT_PROGRAM_IDS.SONIC,
    name: 'Sonic Points',
    protocol: 'Sonic',
    type: IncentiveType.POINT,
    description:
      'Earn Sonic Points - Sonic Points are user-focused airdrop points that can be earned as part of the ~200 million S airdrop.',
    externalLink: 'https://my.soniclabs.com/points',
    pointValueUnit: 'x',
    seasons: {
      '1': {
        startTimestamp: 1734480000, // 18/12/24 00:00:00
        endTimestamp: 1750204799, // 17/06/25 23:59:59
      },
      '2': {
        startTimestamp: 1750204800, // 18/06/25 00:00:00
        endTimestamp: 1761955200, // 01/11/25 00:00:00
      },
    },
  },
};

export const pointIncentives: Record<PointProgramId, PointIncentives[]> = {
  [POINT_PROGRAM_IDS.ETHERFI]: [
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.weETH.A_TOKEN,
        AaveV3Ethereum.ASSETS.eBTC.A_TOKEN,
      ],
      pointValues: {
        '2': 3,
        '3': 3,
        '4': 3,
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [AaveV3EthereumEtherFi.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '3': 3,
        '4': 3,
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
    {
      chainId: plasma.id,
      rewardedTokenAddresses: [AaveV3Plasma.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '7': 3,
      },
    },
    {
      chainId: base.id,
      rewardedTokenAddresses: [AaveV3Base.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '2': 3,
        '3': 3,
        '4': 3,
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
    {
      chainId: arbitrum.id,
      rewardedTokenAddresses: [AaveV3Arbitrum.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '2': 3,
        '3': 3,
        '4': 3,
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
    {
      chainId: linea.id,
      rewardedTokenAddresses: [AaveV3Linea.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
    {
      chainId: scroll.id,
      rewardedTokenAddresses: [AaveV3Scroll.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '3': 3,
        '4': 3,
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
    {
      chainId: zksync.id,
      rewardedTokenAddresses: [AaveV3ZkSync.ASSETS.weETH.A_TOKEN],
      pointValues: {
        '4': 3,
        '5': 3,
        '6': 3,
        '7': 3,
      },
    },
  ],
  [POINT_PROGRAM_IDS.KELP]: [
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
        AaveV3EthereumLido.ASSETS.rsETH.A_TOKEN,
      ],
      pointValues: {
        '1': 2,
        '2': 2,
        '3': 2,
        '4': 2,
      },
    },
    {
      chainId: base.id,
      rewardedTokenAddresses: [AaveV3Base.ASSETS.wrsETH.A_TOKEN],
      pointValues: {
        '2': 2,
        '3': 2,
        '4': 2,
      },
    },
    {
      chainId: arbitrum.id,
      rewardedTokenAddresses: [AaveV3Arbitrum.ASSETS.rsETH.A_TOKEN],
      pointValues: {
        '2': 2,
        '3': 2,
        '4': 2,
      },
    },
  ],
  [POINT_PROGRAM_IDS.SONIC]: [
    {
      chainId: sonic.id,
      rewardedTokenAddresses: [
        AaveV3Sonic.ASSETS.wS.A_TOKEN, // 03/03/25
        AaveV3Sonic.ASSETS.stS.A_TOKEN, // 30/04/25
      ],
      pointValues: {
        '1': 8,
        '2': 12,
      },
    },
    {
      chainId: sonic.id,
      rewardedTokenAddresses: [
        AaveV3Sonic.ASSETS.USDC.A_TOKEN, // 03/03/25
      ],
      pointValues: {
        '1': 10,
        '2': 8,
      },
    },
    {
      chainId: sonic.id,
      rewardedTokenAddresses: [
        AaveV3Sonic.ASSETS.WETH.A_TOKEN, // 03/03/25
      ],
      pointValues: 4,
    },
  ],
  [POINT_PROGRAM_IDS.ETHENA]: [
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.USDe.A_TOKEN, // 06/06/24
        AaveV3Ethereum.ASSETS.sUSDe.A_TOKEN, // 27/06/24
      ],
      pointValues: {
        '2': 5,
        '3': 5,
        '4': 5,
        '5': 5,
      },
    },
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3EthereumLido.ASSETS.sUSDe.A_TOKEN, // 18/11/24
      ],
      pointValues: {
        '3': 5,
        '4': 5,
        '5': 5,
      },
    },
    {
      chainId: plasma.id,
      rewardedTokenAddresses: [
        AaveV3Plasma.ASSETS.USDe.A_TOKEN, // 23/09/25
        AaveV3Plasma.ASSETS.sUSDe.A_TOKEN, // 23/09/25
      ],
      pointValues: {
        '4': 5,
        '5': 5,
      },
    },
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.PT_USDe_31JUL2025.A_TOKEN, // 27/05/25
        AaveV3Ethereum.ASSETS.PT_USDe_25SEP2025.A_TOKEN, // 30/07/25
        AaveV3Ethereum.ASSETS.PT_USDe_27NOV2025.A_TOKEN, // 09/09/25
      ],
      pointValues: {
        '4': 2,
      },
    },
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.PT_sUSDE_31JUL2025.A_TOKEN, // 29/04/25
        AaveV3Ethereum.ASSETS.PT_sUSDE_25SEP2025.A_TOKEN, // 16/07/25
        AaveV3Ethereum.ASSETS.PT_sUSDE_27NOV2025.A_TOKEN, // 04/09/25
      ],
      pointValues: {
        '4': 1,
      },
    },
    {
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.PT_eUSDE_29MAY2025.A_TOKEN, // 29/04/25
        AaveV3Ethereum.ASSETS.PT_eUSDE_14AUG2025.A_TOKEN, // 27/05/25
      ],
      pointValues: {
        '4': 2,
      },
    },
  ],
};
