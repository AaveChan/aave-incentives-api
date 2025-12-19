import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getAaveTokenInfo } from '@/lib/aave/aave-tokens.js';
import { FetchOptions, IncentiveProvider } from '@/providers/index.js';
import { IncentivesService } from '@/services/incentives.service.js';
import {
  GlobalStatus,
  Incentive,
  IncentiveSource,
  IncentiveType,
  Point,
  ProviderName,
  ProvidersStatus,
  RawPointIncentive,
  RawTokenIncentive,
  Status,
  Token,
} from '@/types/index.js';

vi.mock('@/lib/aave/aave-tokens', () => ({
  getAaveTokenInfo: vi.fn(),
}));

vi.mock('@/constants/price-feeds/index', () => ({
  default: { 1: { '0xToken': '0xOraclePriceFeed' } },
}));

vi.mock('@/constants/wrapper-address', () => ({
  wrapperTokenMappingRecord: {
    '0xWrapperToken': { ORACLE: '0xWrapperOracle' },
  },
}));

class MockProvider implements IncentiveProvider {
  incentiveSource = IncentiveSource.MERKL_API;

  name = ProviderName.Merkl;
  incentiveType?: IncentiveType | undefined;

  constructor(private incentives: Incentive[] = [], private healthy = true) {}

  async getIncentives() {
    return this.incentives;
  }

  async isHealthy() {
    return this.healthy;
  }
}

const baseToken = (overrides: Partial<Token> = {}): Token => ({
  address: '0xToken',
  chainId: 1,
  decimals: 18,
  name: 'Test Token',
  symbol: 'TST',
  priceFeed: undefined,
  ...overrides,
});

const baseTokenIncentive = (overrides: Partial<RawTokenIncentive> = {}): Incentive => ({
  name: 'test',
  chainId: 1,
  rewardedToken: baseToken(),
  involvedTokens: [baseToken()],
  type: IncentiveType.TOKEN,
  source: IncentiveSource.MERKL_API,
  status: Status.LIVE,
  description: 'test incentive',
  claimLink: 'https://claim.link',
  id: 'inc_test',
  rewardToken: baseToken(),
  allCampaignsConfigs: [],
  ...overrides,
});

const basePoint = (overrides: Partial<Point> = {}): Point => ({
  name: 'Test Point',
  protocol: 'test-protocol',
  ...overrides,
});

const basePointIncentive = (overrides: Partial<RawPointIncentive> = {}): Incentive => ({
  name: 'test',
  chainId: 1,
  rewardedToken: baseToken(),
  involvedTokens: [baseToken()],
  type: IncentiveType.POINT,
  source: IncentiveSource.MERKL_API,
  status: Status.LIVE,
  description: 'test incentive',
  claimLink: 'https://claim.link',
  id: 'inc_test',
  point: basePoint(),
  pointValue: 100,
  pointValueUnit: 'x',
  allCampaignsConfigs: [],
  ...overrides,
});

describe('IncentivesService', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetchIncentives() should gather data from all providers', async () => {
    const provider1 = new MockProvider([baseTokenIncentive({ id: 'A' })]);
    const provider2 = new MockProvider([baseTokenIncentive({ id: 'B' })]);

    const service = new IncentivesService();
    service.providers = [provider1, provider2];

    const result = await service.fetchIncentives();

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(['A', 'B']);
  });

  test('applyFilters() should filter by chainId, status, type and source', () => {
    const service = new IncentivesService();

    const incentives = [
      baseTokenIncentive({ id: '1', chainId: 1, status: Status.LIVE }),
      baseTokenIncentive({ id: '2', chainId: 1, status: Status.SOON }),
      basePointIncentive({ id: '3', chainId: 1, status: Status.LIVE, type: IncentiveType.POINT }),
      baseTokenIncentive({
        id: '4',
        chainId: 1,
        status: Status.LIVE,
        source: IncentiveSource.ACI_MASIV_API,
      }),
      baseTokenIncentive({ id: '5', chainId: 10, status: Status.LIVE }),
      baseTokenIncentive({ id: '6', chainId: 1, status: Status.LIVE }),
    ];

    const filters: FetchOptions = {
      chainId: [1],
      status: [Status.LIVE],
      type: [IncentiveType.TOKEN],
      source: [IncentiveSource.MERKL_API],
    };

    const result = service['applyFilters'](incentives, filters);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('1');
    expect(result[1]!.id).toBe('6');
  });

  test('enrichedToken() should set priceFeed from Aave token book', () => {
    (getAaveTokenInfo as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      book: { ORACLE: '0xAaveOracle' },
    });

    const service = new IncentivesService();

    const enriched = service['enrichedToken'](baseToken());

    expect(enriched.priceFeed).toBe('0xAaveOracle');
  });

  test('gatherEqualIncentives() should merge duplicates by id and merge campaigns', () => {
    const service = new IncentivesService();

    const incentives = [
      baseTokenIncentive({
        id: '1',
        allCampaignsConfigs: [{ startTimestamp: 0, endTimestamp: 100 }],
      }),
      baseTokenIncentive({
        id: '1',
        allCampaignsConfigs: [{ startTimestamp: 100, endTimestamp: 200 }],
      }),
      baseTokenIncentive({
        id: '2',
        allCampaignsConfigs: [{ startTimestamp: 0, endTimestamp: 50 }],
      }),
    ];

    const merged = service['gatherEqualIncentives'](incentives);

    expect(merged).toHaveLength(2);
    expect(merged[0]!.allCampaignsConfigs).toHaveLength(2);
    expect(merged[1]!.allCampaignsConfigs).toHaveLength(1);
  });

  test('getProvidersStatus()', async () => {
    const provider1 = new MockProvider([], true);
    const provider2 = new MockProvider([], false);
    provider2.name = ProviderName.ACI;

    const service = new IncentivesService();
    service.providers = [provider1, provider2];

    const result = await service.getProvidersStatus();

    const expectedResult: ProvidersStatus = {
      status: GlobalStatus.DEGRADED,
      providersStatus: {
        [ProviderName.Merkl]: true,
        [ProviderName.ACI]: false,
      },
    };

    expect(result).toEqual(expectedResult);
  });

  test('getIncentives() should run full pipeline (enrich, filter, merge, sort)', async () => {
    const incentive = baseTokenIncentive({
      id: 'A',
      rewardedToken: baseToken(),
      involvedTokens: [baseToken()],
      rewardToken: baseToken(),
    });

    (getAaveTokenInfo as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      book: { ORACLE: '0xMockOracle' },
    });

    const provider = new MockProvider([incentive]);

    const service = new IncentivesService();
    service.providers = [provider];

    const result = await service.getIncentives();

    expect(result).toHaveLength(1);
    expect(result[0]!.rewardedToken.priceFeed).toBe('0xMockOracle');
    expect(result[0]!.involvedTokens[0].priceFeed).toBe('0xMockOracle');
  });
});
