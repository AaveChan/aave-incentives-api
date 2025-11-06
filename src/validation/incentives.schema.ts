import { z } from 'zod';

import { IncentiveSource, IncentiveType, Status } from '@/types/index.js';

export const GetIncentivesQuerySchema = z
  .object({
    chainId: z.coerce.number().optional(),

    status: z.enum(Status).optional(),

    type: z.enum(IncentiveType).optional(),

    source: z.enum(IncentiveSource).optional(),

    // // Pagination
    // page: z
    //   .string()
    //   .regex(/^\d+$/)
    //   .transform((val) => parseInt(val, 10))
    //   .optional(),

    // limit: z
    //   .string()
    //   .regex(/^\d+$/)
    //   .transform((val) => parseInt(val, 10))
    //   .refine((val) => val <= 100, 'limit cannot exceed 100')
    //   .optional(),

    // offset: z
    //   .string()
    //   .regex(/^\d+$/)
    //   .transform((val) => parseInt(val, 10))
    //   .optional(),

    // // Sorting
    // sortBy: z.enum(['name', 'apr', 'startTimestamp', 'endTimestamp', 'budgetSpent']).optional(),

    // sortOrder: z.enum(['asc', 'desc']).optional(),

    // // APR range
    // minApr: z
    //   .string()
    //   .regex(/^\d+(\.\d+)?$/)
    //   .transform((val) => parseFloat(val))
    //   .optional(),

    // maxApr: z
    //   .string()
    //   .regex(/^\d+(\.\d+)?$/)
    //   .transform((val) => parseFloat(val))
    //   .optional(),
  })
  .strict();

// Type inference automatique depuis le schema
export type GetIncentivesQuery = z.infer<typeof GetIncentivesQuerySchema>;
