import { IncentivesService } from '@/services/incentives.service.js';

export enum GlobalStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Down = 'down',
}

export type Status = {
  status: GlobalStatus;
  providersStatus: Record<string, boolean>;
};

export const getStatus = async (): Promise<Status> => {
  const incentivesService = new IncentivesService();

  const results: Record<string, boolean> = {};

  await Promise.all(
    incentivesService.providers.map(async (provider) => {
      try {
        const healthy = await provider.isHealthy();
        results[provider.name] = healthy;
      } catch {
        results[provider.name] = false;
      }
    }),
  );

  const values = Object.values(results);

  const isHealthy = values.every(Boolean);
  const isUnhealthy = values.every((v) => !v);

  const globalStatus = isHealthy
    ? GlobalStatus.Healthy
    : isUnhealthy
    ? GlobalStatus.Down
    : GlobalStatus.Degraded;

  return { status: globalStatus, providersStatus: results };
};
