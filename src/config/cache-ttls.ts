export const CACHE_TTLS = {
  REQUEST: 60 * 5, // 5 min
  TOKEN_PRICE: 60 * 10, // 10 min
  TOTAL_SUPPLY: 60 * 15, // 15 min
  UI_INCENTIVES: 60 * 30, // 30 min

  // Per-provider TTLs (based on source data refresh rates)
  PROVIDER: {
    ONCHAIN: 60 * 2, // 2 min - live APR data
    MERKL: 60 * 15, // 15 min - source refreshes every 30min-2h
    ACI: 60 * 30, // 30 min - source refreshes every 1h-6h
    EXTERNAL_POINTS: 60 * 60, // 60 min - static config data
  },
} as const;
