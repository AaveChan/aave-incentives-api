import { NextFunction, Request, Response } from 'express';
import z from 'zod';

import { ApiErrorResponse } from '@/types/api';

export function validateQuery<S extends z.ZodSchema>(schema: S) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryValidated = schema.parse(req.query);

      res.locals.validatedQuery = queryValidated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errResponse: ApiErrorResponse = {
          success: false,
          error: {
            message: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        };
        return res.status(400).json(errResponse);
      }

      next(error);
    }
  };
}
