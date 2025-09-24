import { Request, Response } from 'express';

import { IncentivesService } from '@/services/incentives-service';
import { GetIncentivesResponse } from '@/types';

export class IncentivesController {
  private incentivesService = new IncentivesService();

  async getAllIncentives(req: Request, res: Response) {
    try {
      const chainId = req.query.chainId ? parseInt(req.query.chainId as string, 10) : undefined;
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
