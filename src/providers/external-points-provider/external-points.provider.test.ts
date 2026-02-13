import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAaveToken } from '@/lib/aave/aave-tokens.js';
import { getCurrentTimestamp } from '@/lib/utils/timestamp.js';
import {
  IncentiveType,
  RawPointIncentive,
  RawPointWithoutValueIncentive,
  Status,
} from '@/types/index.js';

import { pointProgramsMap } from './config/config.js';
import { ExternalPointsProvider } from './external-points.provider.js';
import { POINT_PROGRAM_IDS, PointIncentives, PointProgram } from './types.js';

// ---- Mock external imports ----
vi.mock('@/lib/aave/aave-tokens.js', () => ({
  getAaveToken: vi.fn(),
}));

vi.mock('@/lib/utils/timestamp.js', () => ({
  getCurrentTimestamp: vi.fn(),
}));

// Fake rewarded token
const mockToken = {
  address: '0xToken',
  chainId: 1,
  decimals: 18,
  name: 'Test',
  symbol: 'TST',
};

describe('ExternalPointsProvider - mapPointIncentiveToIncentives', () => {
  let provider: ExternalPointsProvider;

  const program: PointProgram = {
    id: POINT_PROGRAM_IDS.ETHENA,
    name: 'Test Points',
    protocol: 'test-proto',
    type: IncentiveType.POINT,
    description: 'desc',
    externalLink: 'https://claim.test',
    pointValueUnit: 'x',
    tgePrice: 0.5,
    seasons: {
      '1': { startTimestamp: 100, endTimestamp: 200 },
      '2': { startTimestamp: 200, endTimestamp: 300 },
    },
  };

  beforeEach(() => {
    provider = new ExternalPointsProvider();
    vi.clearAllMocks();

    (getAaveToken as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockToken);

    pointProgramsMap.set(POINT_PROGRAM_IDS.ETHENA, program);
  });

  it('POINT: maps using season', () => {
    const pointIncentives: PointIncentives = {
      chainId: 1,
      rewardedTokenAddresses: ['0xToken'],
      pointValues: { '1': 10, '2': 20 },
      campaigns: undefined,
    };

    // time = 150 → we are in season 1
    (getCurrentTimestamp as unknown as ReturnType<typeof vi.fn>).mockReturnValue(150);

    const incentives = provider['mapPointIncentiveToIncentives'](pointIncentives, program);

    expect(incentives).toHaveLength(1);

    const incentive = incentives[0];
    expect(incentive).toBeDefined();
    const rawPointIncentive = incentive as RawPointIncentive;

    if (!rawPointIncentive) {
      throw new Error('Incentive is undefined');
    }

    expect(rawPointIncentive.type).toBe(IncentiveType.POINT);

    expect(rawPointIncentive.rewardedToken).toEqual(mockToken);

    expect(rawPointIncentive.pointValue).toBe(10);

    expect(rawPointIncentive.allCampaignsConfigs.length).toBe(2);

    expect(rawPointIncentive.currentCampaignConfig?.startTimestamp).toBe(100);
    expect(rawPointIncentive.currentCampaignConfig?.endTimestamp).toBe(200);

    expect(rawPointIncentive.nextCampaignConfig?.startTimestamp).toBe(200);

    expect(rawPointIncentive.status).toBe(Status.LIVE);
  });

  it('POINT_WITHOUT_VALUE: maps using seasons', () => {
    const programWithoutValue: PointProgram = {
      ...program,
      type: IncentiveType.POINT_WITHOUT_VALUE,
    };

    const pointIncentives: PointIncentives = {
      chainId: 1,
      rewardedTokenAddresses: ['0xToken'],
      pointValues: {
        '1': -1,
        '2': -1,
      },
    };

    (getCurrentTimestamp as unknown as ReturnType<typeof vi.fn>).mockReturnValue(200);

    const incentives = provider['mapPointIncentiveToIncentives'](
      pointIncentives,
      programWithoutValue,
    );

    expect(incentives).toHaveLength(1);

    const incentive = incentives[0];
    expect(incentive).toBeDefined();
    const rawPointIncentive = incentive as RawPointWithoutValueIncentive;

    expect(rawPointIncentive.type).toBe(IncentiveType.POINT_WITHOUT_VALUE);
    // expect(rawPointIncentive.pointValue).toBeUndefined();
    expect(rawPointIncentive.point).toBeDefined();

    expect(rawPointIncentive.allCampaignsConfigs.length).toBe(2);
    expect(rawPointIncentive.currentCampaignConfig?.startTimestamp).toBe(200);
    expect(rawPointIncentive.nextCampaignConfig).toBeUndefined();
  });

  it('POINT: maps using campaigns 1', () => {
    const pointIncentives: PointIncentives = {
      chainId: 1,
      rewardedTokenAddresses: ['0xToken'],
      campaigns: [
        { startTimestamp: 0, endTimestamp: 100, pointValue: 5 },
        { startTimestamp: 100, endTimestamp: 200, pointValue: 15 },
      ],
    };

    (getCurrentTimestamp as unknown as ReturnType<typeof vi.fn>).mockReturnValue(120);

    const incentives = provider['mapPointIncentiveToIncentives'](pointIncentives, program);

    expect(incentives).toHaveLength(1);

    const incentive = incentives[0];
    expect(incentive).toBeDefined();
    const rawPointIncentive = incentive as RawPointIncentive;

    expect(rawPointIncentive.type).toBe(IncentiveType.POINT);
    expect(rawPointIncentive.pointValue).toBe(15);
    expect(rawPointIncentive.status).toBe(Status.LIVE);

    expect(rawPointIncentive.allCampaignsConfigs.length).toBe(2);
    expect(rawPointIncentive.currentCampaignConfig?.startTimestamp).toBe(100);
  });

  it('POINT: maps using campaigns 2', () => {
    const pointIncentives: PointIncentives = {
      chainId: 1,
      rewardedTokenAddresses: ['0xToken'],
      campaigns: [{ startTimestamp: 5000, endTimestamp: 6000, pointValue: 10 }],
    };

    (getCurrentTimestamp as unknown as ReturnType<typeof vi.fn>).mockReturnValue(1000);

    const incentives = provider['mapPointIncentiveToIncentives'](pointIncentives, program);

    const incentive = incentives[0];
    expect(incentive).toBeDefined();
    if (!incentive) {
      throw new Error('Incentive is undefined');
    }

    expect(incentive.status).toBe(Status.SOON);
    expect(incentive.nextCampaignConfig?.startTimestamp).toBe(5000);
  });

  it('returns empty array when no campaigns nor pointValues', () => {
    const pointIncentives: PointIncentives = {
      chainId: 1,
      rewardedTokenAddresses: ['0xToken'],
      campaigns: undefined,
      pointValues: undefined,
    };

    const incentives = provider['mapPointIncentiveToIncentives'](pointIncentives, program);

    expect(incentives).toEqual([]);
  });
});
