import { Request, Response } from 'express';

import { IncentivesService } from '@/services/incentives-service';
import { GetIncentivesResponse } from '@/types';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema';

export class IncentivesController {
  private incentivesService = new IncentivesService();

  async getAllIncentives(req: Request, res: Response) {
    console.log('req.query', req.query);
    console.log('res.locals.validatedQuery', res.locals.validatedQuery);

    // the middlewear doenst' mutate the req.query, so we either need to store the validated query in res.locals (1st option) or re-parse it here (2nd option)
    // const query = res.locals.validatedQuery as z.infer<typeof GetIncentivesQuerySchema>; // 1st option (good but not super clean)
    const query = GetIncentivesQuerySchema.parse(req.query); // 2nd option (cleaner but we do the same validation twice)

    try {
      const { chainId, status } = query;

      const incentives = await this.incentivesService.getAllIncentives({ chainId });

      const response: GetIncentivesResponse = {
        success: true,
        data: {
          incentives,
          totalCount: incentives.length,
          lastUpdated: new Date().toISOString(),
        },
      };

      console.log('Response:', response);
      res.json(response);
      console.log('Response sent successfully');
    } catch {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch incentives',
          code: 'FETCH_ERROR',
        },
      });
    }
  }

  async getHealthStatus(req: Request, res: Response) {
    try {
      const healthStatus = await this.incentivesService.getHealthStatus();
      res.json({
        success: true,
        data: { providers: healthStatus },
      });
    } catch {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get health status', code: 'HEALTH_ERROR' },
      });
    }
  }
}
