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

import { BASE_TIMESTAMP } from '@/lib/utils/timestamp.js';

import { POINT_PROGRAM_IDS, PointIncentives, PointProgram, PointProgramId } from '../types.js';

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

export const pointCampaigns: Record<PointProgramId, PointIncentives[]> = {
  [POINT_PROGRAM_IDS.ETHERFI]: [
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.weETH.A_TOKEN,
        AaveV3EthereumEtherFi.ASSETS.weETH.A_TOKEN,
        AaveV3Ethereum.ASSETS.eBTC.A_TOKEN,
      ],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: plasma.id,
      rewardedTokenAddresses: [AaveV3Plasma.ASSETS.weETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: base.id,
      rewardedTokenAddresses: [AaveV3Base.ASSETS.weETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: arbitrum.id,
      rewardedTokenAddresses: [AaveV3Arbitrum.ASSETS.weETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: linea.id,
      rewardedTokenAddresses: [AaveV3Linea.ASSETS.weETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: scroll.id,
      rewardedTokenAddresses: [AaveV3Scroll.ASSETS.weETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHERFI,
      chainId: zksync.id,
      rewardedTokenAddresses: [AaveV3ZkSync.ASSETS.weETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
          pointValue: 3,
        },
      ],
    },
  ],
  [POINT_PROGRAM_IDS.KELP]: [
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.rsETH.A_TOKEN,
        AaveV3EthereumLido.ASSETS.rsETH.A_TOKEN,
      ],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: base.id,
      rewardedTokenAddresses: [AaveV3Base.ASSETS.wrsETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.KELP,
      chainId: arbitrum.id,
      rewardedTokenAddresses: [AaveV3Arbitrum.ASSETS.rsETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: BASE_TIMESTAMP,
        },
      ],
    },
  ],
  // S1 Start Date = Dec 18, 2024: 1734480000
  // S1 End Date = June 18, 2025: 1750204800

  // S2 Start Date = June 18, 2025: 1750204800
  // S2 End Date = Nov 01, 2025: 1761955200
  [POINT_PROGRAM_IDS.SONIC]: [
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddresses: [AaveV3Sonic.ASSETS.wS.A_TOKEN, AaveV3Sonic.ASSETS.stS.A_TOKEN],
      campaigns: [
        // S1
        {
          startTimestamp: 1734480000,
          endTimestamp: 1750204800,
          pointValue: 8,
        },
        {
          startTimestamp: 1750204800,
          endTimestamp: 1761955200,
          pointValue: 12,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddresses: [AaveV3Sonic.ASSETS.USDC.A_TOKEN],
      campaigns: [
        {
          startTimestamp: 1734480000,
          endTimestamp: 1750204800,
          pointValue: 10,
        },
        {
          startTimestamp: 1750204800,
          endTimestamp: 1761955200,
          pointValue: 8,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.SONIC,
      chainId: sonic.id,
      rewardedTokenAddresses: [AaveV3Sonic.ASSETS.WETH.A_TOKEN],
      campaigns: [
        {
          startTimestamp: 1734480000,
          endTimestamp: 1750204800,
          pointValue: 4,
        },
        {
          startTimestamp: 1750204800,
          endTimestamp: 1761955200,
          pointValue: 4,
        },
      ],
    },
  ],
  [POINT_PROGRAM_IDS.ETHENA]: [
    // // season 1
    // {
    //   startTimestamp: 1708300800, // 19/02/24 00:00:00
    //   endTimestamp: 1712015999, // 01/04/24 23:59:59
    //   pointValue: 5,
    // },
    // // season 2
    // {
    //   startTimestamp: 1712016000, // 02/04/24 00:00:00
    //   endTimestamp: 1725321599, // 02/09/24 23:59:59
    //   pointValue: 5,
    // },
    // // season 3
    // {
    //   startTimestamp: 1725321600, // 03/09/24 00:00:00
    //   endTimestamp: 1742687999, // 22/03/25 23:59:59
    //   pointValue: 5,
    // },
    // // season 4
    // {
    //   startTimestamp: 1742688000, // 23/03/25 00:00:00
    //   endTimestamp: 1758671999, // 23/09/25 23:59:59
    //   pointValue: 5,
    // },
    // // season 5
    // {
    //   startTimestamp: 1758672000, // 24/09/25 00:00:00
    //   pointValue: 5,
    // },
    // For simplicity:
    // - if an asset is onboarded during a season, we defined the fact that it has been eligible for the whole season from day 1 (while in reality it started when the asset was onboarded)
    // - also for PT: when the PT reach maturity, we let the campaign run until the end of the season even if the PT is not valid anymore
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.USDe.A_TOKEN, // onboarding: 06/06/24
        AaveV3Ethereum.ASSETS.sUSDe.A_TOKEN, // onboarding: 27/06/24
      ],
      campaigns: [
        // season 2
        {
          startTimestamp: 1712016000, // 02/04/24 00:00:00
          endTimestamp: 1725321599, // 02/09/24 23:59:59
          pointValue: 5,
        },
        // season 3
        {
          startTimestamp: 1725321600, // 03/09/24 00:00:00
          endTimestamp: 1742687999, // 22/03/25 23:59:59
          pointValue: 5,
        },
        // season 4
        {
          startTimestamp: 1742688000, // 23/03/25 00:00:00
          endTimestamp: 1758671999, // 23/09/25 23:59:59
          pointValue: 5,
        },
        // season 5
        {
          startTimestamp: 1758672000, // 24/09/25 00:00:00
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3EthereumLido.ASSETS.sUSDe.A_TOKEN, // onboarding: 18/11/24
      ],
      campaigns: [
        // season 3
        {
          startTimestamp: 1725321600, // 03/09/24 00:00:00
          endTimestamp: 1742687999, // 22/03/25 23:59:59
          pointValue: 5,
        },
        // season 4
        {
          startTimestamp: 1742688000, // 23/03/25 00:00:00
          endTimestamp: 1758671999, // 23/09/25 23:59:59
          pointValue: 5,
        },
        // season 5
        {
          startTimestamp: 1758672000, // 24/09/25 00:00:00
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: plasma.id,
      rewardedTokenAddresses: [
        AaveV3Plasma.ASSETS.USDe.A_TOKEN, // onboarding: 23/09/25
        AaveV3Plasma.ASSETS.sUSDe.A_TOKEN, // onboarding: 23/09/25
      ],
      campaigns: [
        // season 5
        {
          startTimestamp: 1758672000, // 24/09/25 00:00:00
          pointValue: 5,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.PT_USDe_31JUL2025.A_TOKEN, // onboarding: 27/05/25
        AaveV3Ethereum.ASSETS.PT_USDe_25SEP2025.A_TOKEN, // onboarding: 30/07/25
        AaveV3Ethereum.ASSETS.PT_USDe_27NOV2025.A_TOKEN, // onboarding: 09/09/25
      ],
      campaigns: [
        // season 4
        {
          startTimestamp: 1742688000, // 23/03/25 00:00:00
          endTimestamp: 1758671999, // 23/09/25 23:59:59
          pointValue: 2,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.PT_sUSDE_31JUL2025.A_TOKEN, // onboarding: 29/04/25
        AaveV3Ethereum.ASSETS.PT_sUSDE_25SEP2025.A_TOKEN, // onboarding: 16/07/25
        AaveV3Ethereum.ASSETS.PT_sUSDE_27NOV2025.A_TOKEN, // onboarding: 04/09/25
      ],
      campaigns: [
        // season 4
        {
          startTimestamp: 1742688000, // 23/03/25 00:00:00
          endTimestamp: 1758671999, // 23/09/25 23:59:59
          pointValue: 1,
        },
      ],
    },
    {
      programId: POINT_PROGRAM_IDS.ETHENA,
      chainId: mainnet.id,
      rewardedTokenAddresses: [
        AaveV3Ethereum.ASSETS.PT_eUSDE_29MAY2025.A_TOKEN, // onboarding: 29/04/25
        AaveV3Ethereum.ASSETS.PT_eUSDE_14AUG2025.A_TOKEN, // onboarding: 27/05/25
      ],
      campaigns: [
        // season 4
        {
          startTimestamp: 1742688000, // 23/03/25 00:00:00
          endTimestamp: 1758671999, // 23/09/25 23:59:59
          pointValue: 2,
        },
      ],
    },
  ],
};
