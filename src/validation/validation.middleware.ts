import { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

import { ApiErrorResponse } from '@/types/api.js';

type RequestSource = 'query' | 'params' | 'body' | 'headers';

export function validate<T>(
  source: RequestSource,
  schema: ZodType<T>,
  errorMessage = 'Invalid request parameters',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);

      res.locals.validated ??= {};
      res.locals.validated[source] = data;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errResponse: ApiErrorResponse = {
          success: false,
          error: {
            message: errorMessage,
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

export function validateQuery<T>(schema: ZodType<T>) {
  return validate('query', schema, 'Invalid query parameters');
}

export function validateParams<T>(schema: ZodType<T>) {
  return validate('params', schema, 'Invalid path parameters');
}
