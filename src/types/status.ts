import { ProviderName } from './api.js';

export enum GlobalStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
}

export type ProvidersStatus = {
  status: GlobalStatus;
  providersStatus: Partial<Record<ProviderName, boolean>>;
};
