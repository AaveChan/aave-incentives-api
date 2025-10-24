import z from 'zod';
import { Request, Response, NextFunction } from 'express';

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
