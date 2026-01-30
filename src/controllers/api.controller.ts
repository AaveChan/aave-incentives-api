import { Request, Response } from 'express';

import { createLogger } from '@/config/logger.js';
import { IncentivesService } from '@/services/incentives.service.js';
import { UserRewardsService } from '@/services/user-rewards.service.js';
import { GetIncentivesResponse } from '@/types/index.js';
import {
  GetIncentivesQuerySchema,
  GetUserRewardsParamsSchema,
  GetUserRewardsQuerySchema,
} from '@/validation/incentives.schema.js';

export class ApiController {
  private logger = createLogger('ApiController');
  private incentivesService = new IncentivesService();
  private userRewardsService = new UserRewardsService();

  async getAllIncentives(req: Request, res: Response) {
    // the middleware doesn't mutate the req.query, so we either need to store the validated query in res.locals (1st option) or re-parse it here (2nd option)
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
    } catch (e: unknown) {
      this.logger.error('Error fetching incentives:', e);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch incentives',
          code: 'FETCH_ERROR',
        },
      });
    }
  }

  async getProvidersStatus(_req: Request, res: Response) {
    try {
      const healthStatus = await this.incentivesService.getProvidersStatus();
      return res.json(healthStatus);
    } catch {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get health status', code: 'HEALTH_ERROR' },
      });
    }
  }

  async getUserRewards(req: Request, res: Response) {
    const params = GetUserRewardsParamsSchema.parse(req.params);
    const query = GetUserRewardsQuerySchema.parse(req.query);

    try {
      const result = await this.userRewardsService.getUserRewards(params.address, query.chainId, {
        source: query.source,
        includeZeroBalance: query.includeZeroBalance,
      });

      const response = {
        success: true,
        data: result,
      };

      this.logger.silly('Response:', response);

      res.json(response);

      this.logger.debug('User rewards response sent successfully');
    } catch (e: unknown) {
      this.logger.error('Error fetching user rewards:', e);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch user rewards',
          code: 'FETCH_ERROR',
        },
      });
    }
  }
}
