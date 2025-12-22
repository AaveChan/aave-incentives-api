import { Address, isAddress } from 'viem';
import { z } from 'zod';

import { uniqueArray } from '@/lib/utils/array.js';

// ***********
// * Parsers *
// ***********

export const address = z
  .string()
  .refine(isAddress, {
    message: 'Invalid Ethereum address',
  })
  .transform((addr) => addr as Address);

// *****************
// * Parsers lists *
// *****************

export const addressList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  )
  .transform((arr) => uniqueArray(arr))
  .pipe(z.array(address));

export const chainIdList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((v) => parseInt(v.trim()))
      .filter((v) => !isNaN(v)),
  )
  .transform((arr) => uniqueArray(arr));

export const enumList = <T extends Record<string, string | number>>(enumObj: T) => {
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
    .transform((arr) => arr as Array<T[keyof T]>)
    .transform((arr) => uniqueArray(arr));
};
