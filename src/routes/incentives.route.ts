import { Router } from 'express';

import { IncentivesController } from '@/controllers/controller.js';
import { HttpCacheMiddleware } from '@/middlewares/cache.middleware.js';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema.js';
import { validateQuery } from '@/validation/validation.middleware.js';

const router = Router();

const controller = new IncentivesController();

const httpCache = new HttpCacheMiddleware();

router.get(
  '/',
  validateQuery(GetIncentivesQuerySchema),
  httpCache.cacheResponse(),
  controller.getAllIncentives.bind(controller),
);

export { router };
