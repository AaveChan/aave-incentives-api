import { Router } from 'express';

import { IncentivesController } from '@/controllers/controller';
import { HttpCacheMiddleware } from '@/middlewares/cache.middleware';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema';
import { validateQuery } from '@/validation/validation';

const router = Router();

const controller = new IncentivesController();

const httpCache = new HttpCacheMiddleware();

router.get(
  '/',
  validateQuery(GetIncentivesQuerySchema),
  httpCache.cacheResponse(),
  controller.getAllIncentives.bind(controller),
);

router.get('/health', controller.getHealthStatus.bind(controller));

export { router };
