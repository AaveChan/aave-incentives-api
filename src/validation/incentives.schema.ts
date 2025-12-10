import { Address, isAddress } from 'viem';
import { z } from 'zod';

import { IncentiveSource, IncentiveType, Status } from '@/types/index.js';

const chainIdList = z.string().transform((value) =>
  value
    .split(',')
    .map((v) => parseInt(v.trim()))
    .filter((v) => !isNaN(v)),
);

const ethAddress = z
  .string()
  .refine(isAddress, {
    message: 'Invalid Ethereum address',
  })
  .transform((addr) => addr as Address);

const addressesList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  )
  .pipe(z.array(ethAddress));

export const GetIncentivesQuerySchema = z
  .object({
    chainIds: chainIdList.optional(),

    status: z.enum(Status).optional(),

    type: z.enum(IncentiveType).optional(),

    source: z.enum(IncentiveSource).optional(),

    rewardedTokenAddresses: addressesList.optional(),

    rewardTokenAddresses: addressesList.optional(),
  })
  .strict();

// Type inference automatique depuis le schema
export type GetIncentivesQuery = z.infer<typeof GetIncentivesQuerySchema>;
