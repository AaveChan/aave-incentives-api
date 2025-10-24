// validators/incentiveValidators.ts
import { z } from 'zod';
import { Status, IncentiveType, RewardType } from '../types/api';
import { Request, Response, NextFunction } from 'express';

// Schema pour GET /api/incentives query params
export const GetIncentivesQuerySchema = z.object({
  // chainId - doit être un nombre valide
  chainId: z.coerce.number(),

  // status - doit être une valeur de l'enum Status
  status: z.enum(Status).optional(),

  // incentiveType - optionnel
  incentiveType: z.enum(IncentiveType).optional(),

  // rewardType - optionnel
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

// Middleware de validation générique
export function validateQuery<S extends z.ZodSchema>(schema: S) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating query parameters:', req.params);
      console.log('Query parameters validated successfully:', req.query);
      const queryValidated = schema.parse(req.query);

      // (req as any).validatedQuery = queryValidated;
      res.locals.validatedQuery = queryValidated;

      console.log('queryValidated', queryValidated);

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
      }

      next(error);
    }
  };
}

// export function validateQueryFn<S extends z.ZodSchema>(schema: S) {
//   return (req: Request, res: Response) => {
//     try {
//       const queryValidated = schema.parse(req.query);
//       return queryValidated;
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({
//           success: false,
//           error: {
//             message: 'Invalid query parameters',
//             code: 'VALIDATION_ERROR',
//             details: error.issues.map((err) => ({
//               field: err.path.join('.'),
//               message: err.message,
//             })),
//           },
//         });
//       }
//     }
//   };
// }

// export function validateQuery() {
//   return (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const queryValidated = GetIncentivesQuerySchema.parse(req.query);
//       console.log(req);
//       console.log(req.query);
//       console.log('Query parameters validated successfully:', req.query);
//       console.log('queryValidated', queryValidated);
//       next();
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({
//           success: false,
//           error: {
//             message: 'Invalid query parameters',
//             code: 'VALIDATION_ERROR',
//             details: error.issues.map((err) => ({
//               field: err.path.join('.'),
//               message: err.message,
//             })),
//           },
//         });
//       }

//       next(error);
//     }
//   };
// }
