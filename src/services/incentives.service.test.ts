import { getAaveTokenInfo } from '@/lib/aave/aave-tokens';
import { IncentiveProvider } from '@/providers/index';
import { IncentivesService } from '@/services/incentives.service';
import {
  Incentive,
  IncentiveSource,
  IncentiveType,
  Point,
  PointIncentive,
  Status,
  Token,
  TokenIncentive,
} from '@/types/index';

// --- Mocks des imports externes ---
jest.mock('@/lib/aave/aave-tokens', () => ({
  getAaveTokenInfo: jest.fn(),
}));

jest.mock('@/constants/price-feeds/index', () => ({
  __esModule: true,
  default: { 1: { '0xToken': '0xOraclePriceFeed' } },
}));

jest.mock('@/constants/wrapper-address', () => ({
  tokenWrapperMapping: {
    '0xWrapperToken': { ORACLE: '0xWrapperOracle' },
  },
}));

// --- Fake Providers ---
class MockProvider implements IncentiveProvider {
  incentiveSource = IncentiveSource.MERKL_API;

  name = 'test';
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

const baseIncentive = (overrides: Partial<TokenIncentive> = {}): TokenIncentive => ({
  name: 'test',
  chainId: 1,
  rewardedTokens: [],
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

const basePointIncentive = (overrides: Partial<PointIncentive> = {}): PointIncentive => ({
  name: 'test',
  chainId: 1,
  rewardedTokens: [],
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
  beforeEach(() => jest.clearAllMocks());

  test('fetchIncentives() should gather data from all providers', async () => {
    const provider1 = new MockProvider([baseIncentive({ id: 'A' })]);
    const provider2 = new MockProvider([baseIncentive({ id: 'B' })]);

    const service = new IncentivesService();
    service.providers = [provider1, provider2];

    const result = await service.fetchIncentives();

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(['A', 'B']);
  });

  test('applyFilters() should filter by chainId, status, type and source', () => {
    const service = new IncentivesService();

    const incentives = [
      baseIncentive({ id: '1', chainId: 1, status: Status.LIVE }),
      baseIncentive({ id: '2', chainId: 10, status: Status.SOON }),
      basePointIncentive({ id: '3', chainId: 1, status: Status.LIVE, type: IncentiveType.POINT }),
      baseIncentive({
        id: '4',
        chainId: 1,
        status: Status.LIVE,
        source: IncentiveSource.ACI_MASIV_API,
      }),
      baseIncentive({ id: '5', chainId: 10, status: Status.LIVE }),
    ];

    const filters = {
      chainId: 1,
      status: Status.LIVE,
      type: IncentiveType.TOKEN,
      source: IncentiveSource.MERKL_API,
    };

    const result = service['applyFilters'](incentives, filters);

    expect(result).toHaveLength(2);
    expect(result[0]).toBeDefined();
    expect(result[0]!.id).toBe('1');
    expect(result[1]!.id).toBe('5');
  });

  test('enrichedToken() should set priceFeed from Aave token book', () => {
    (getAaveTokenInfo as jest.Mock).mockReturnValue({
      book: { ORACLE: '0xAaveOracle' },
    });

    const service = new IncentivesService();

    const enriched = service['enrichedToken'](baseToken());

    expect(enriched.priceFeed).toBe('0xAaveOracle');
  });

  test('gatherEqualIncentives() should merge duplicates by id and merge campaigns', () => {
    const service = new IncentivesService();

    const incentives = [
      baseIncentive({
        id: 'X',
        allCampaignsConfigs: [{ startTimestamp: 0, endTimestamp: 100 }],
      }),
      baseIncentive({
        id: 'X',
        allCampaignsConfigs: [{ startTimestamp: 100, endTimestamp: 200 }],
      }),
    ];

    const merged = service['gatherEqualIncentives'](incentives);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toBeDefined();
    expect(merged[0]!.allCampaignsConfigs).toHaveLength(2);
  });

  test('getHealthStatus() should return provider health map', async () => {
    const provider1 = new MockProvider([], true);
    const provider2 = new MockProvider([], false);
    provider2.incentiveSource = IncentiveSource.ACI_MASIV_API;

    const service = new IncentivesService();
    service.providers = [provider1, provider2];

    const result = await service.getHealthStatus();

    expect(result).toEqual({
      [IncentiveSource.MERKL_API]: true,
      [IncentiveSource.ACI_MASIV_API]: false,
    });
  });

  test('getIncentives() should run full pipeline (enrich, filter, merge, sort)', async () => {
    const incentive = baseIncentive({
      id: 'A',
      rewardedTokens: [baseToken()],
      rewardToken: baseToken(),
    });

    (getAaveTokenInfo as jest.Mock).mockReturnValue({
      book: { ORACLE: '0xMockOracle' },
    });

    const provider = new MockProvider([incentive]);

    const service = new IncentivesService();
    service.providers = [provider];

    const result = await service.getIncentives();

    expect(result).toHaveLength(1);

    expect(result[0]).toBeDefined();
    expect(result[0]!.rewardedTokens[0]).toBeDefined();

    // Enrich token was applied
    expect(result[0]!.rewardedTokens[0]!.priceFeed).toBe('0xMockOracle');
  });
});
