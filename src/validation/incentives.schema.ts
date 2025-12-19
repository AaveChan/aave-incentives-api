import { z } from 'zod';

import { IncentiveSource, IncentiveType, Status } from '@/types/index.js';

import { addressList, chainIdList, enumList } from './parsers.js';

export const GetIncentivesQuerySchema = z
  .object({
    chainId: chainIdList.optional(),

    source: enumList(IncentiveSource).optional(),

    type: enumList(IncentiveType).optional(),

    status: enumList(Status).optional(),

    rewardTokenAddress: addressList.optional(),

    rewardedTokenAddress: addressList.optional(),

    involvedTokenAddress: addressList.optional(),
  })
  .strict();

export type GetIncentivesQuery = z.infer<typeof GetIncentivesQuerySchema>;
