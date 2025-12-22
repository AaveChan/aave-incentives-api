import { z } from 'zod';

import { address } from './parsers.js';

export const ResolveWrapperTokenQuerySchema = z
  .object({
    chainId: z.string().transform((val) => parseInt(val)),
  })
  .strict();

export type ResolveWrapperTokenQuery = z.infer<typeof ResolveWrapperTokenQuerySchema>;

export const ResolveWrapperTokenParamsSchema = z
  .object({
    wrapperTokenAddress: address,
  })
  .strict();

export type ResolveWrapperTokenParams = z.infer<typeof ResolveWrapperTokenParamsSchema>;
