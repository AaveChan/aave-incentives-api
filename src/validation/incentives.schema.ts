import { Address, isAddress } from 'viem';
import { z } from 'zod';

import { IncentiveSource, IncentiveType, Status } from '@/types/index.js';

// Address list parser

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

// Number list parser

const chainIdList = z.string().transform((value) =>
  value
    .split(',')
    .map((v) => parseInt(v.trim()))
    .filter((v) => !isNaN(v)),
);

// Enum parser

// const enumList = <T extends Record<string, string | number>>(enumObj: T) =>
//   z
//     .string()
//     .transform((value) =>
//       value
//         .split(',')
//         .map((v) => v.trim())
//         .filter(Boolean),
//     )
//     .pipe(z.array(z.enum(Object.values(enumObj) as [string, ...string[]]))) as unknown as z.ZodType<
//     Array<T[keyof T]>
//   >;

const enumList = <T extends Record<string, string | number>>(enumObj: T) => {
  const values = Object.values(enumObj) as [string, ...string[]];

  return z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.enum(values)))
    .transform((arr) => arr as Array<T[keyof T]>);
};

export const GetIncentivesQuerySchema = z
  .object({
    chainId: chainIdList.optional(),

    status: enumList(Status).optional(),

    type: enumList(IncentiveType).optional(),

    source: enumList(IncentiveSource).optional(),

    rewardedTokenAddress: addressesList.optional(),

    rewardTokenAddress: addressesList.optional(),
  })
  .strict();

// Type inference automatique depuis le schema
export type GetIncentivesQuery = z.infer<typeof GetIncentivesQuerySchema>;
