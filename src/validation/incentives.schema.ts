import { z } from 'zod';

import { IncentiveType, RewardType, Status } from '@/types/index.js';

export const GetIncentivesQuerySchema = z.object({
  chainId: z.coerce.number().optional(),

  status: z.enum(Status).optional(),

  incentiveType: z.enum(IncentiveType).optional(),

  rewardType: z.enum(RewardType).optional(),

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
});

// Type inference automatique depuis le schema
export type GetIncentivesQuery = z.infer<typeof GetIncentivesQuerySchema>;
