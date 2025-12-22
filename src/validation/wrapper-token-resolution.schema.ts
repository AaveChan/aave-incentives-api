import { z } from 'zod';

import { address } from './parsers.js';

export const ResolveWrapperTokenQuerySchema = z
  .object({
    chainId: z.string().transform((val) => parseInt(val)),
    wrapperTokenAddress: address,
  })
  .strict();

export type ResolveWrapperTokenQuery = z.infer<typeof ResolveWrapperTokenQuerySchema>;
