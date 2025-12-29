export const HTTP_CONFIG = {
  /**
   * Health check timeout: Maximum acceptable response time for a provider
   * to be considered "healthy". Providers exceeding this are marked as degraded
   * but will still be queried during data fetches.
   */
  HEALTH_CHECK_TIMEOUT_MS: 5000, // 5 seconds

  /**
   * Provider fetch timeout: Maximum time allowed for complete data retrieval
   * More tolerant than health check to handle complex operations.
   */
  PROVIDER_TIMEOUT_MS: 10000, // 10 seconds
} as const;
