import { Request, Response } from 'express';

import { createLogger } from '@/config/logger.js';
import { IncentivesService } from '@/services/incentives.service.js';
import { GetIncentivesResponse } from '@/types/index.js';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema.js';

export class IncentivesController {
  private logger = createLogger('IncentivesController');
  private incentivesService = new IncentivesService();

  async getAllIncentives(req: Request, res: Response) {
    // the middlewear doenst' mutate the req.query, so we either need to store the validated query in res.locals (1st option) or re-parse it here (2nd option)
    // const query = res.locals.validatedQuery as z.infer<typeof GetIncentivesQuerySchema>; // 1st option (good but not super clean)
    const query = GetIncentivesQuerySchema.parse(req.query); // 2nd option (cleaner but we do the same validation twice)

    try {
      const incentives = await this.incentivesService.getIncentives(query);

      const response: GetIncentivesResponse = {
        success: true,
        data: {
          incentives,
          totalCount: incentives.length,
          lastUpdated: new Date().toISOString(),
        },
      };

      this.logger.silly('Response:', response);

      res.json(response);

      this.logger.debug('Response sent successfully');
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

  async getHealthStatus(_req: Request, res: Response) {
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
