import { Router } from 'express';

import { ApiController } from '@/controllers/api.controller.js';
import { HttpCacheMiddleware } from '@/middlewares/cache.middleware.js';
import { GetUserRewardsQuerySchema } from '@/validation/incentives.schema.js';
import { validateQuery } from '@/validation/validation.middleware.js';

const router = Router();

const controller = new ApiController();

const httpCache = new HttpCacheMiddleware();

router.get(
  '/',
  validateQuery(GetUserRewardsQuerySchema),
  httpCache.cacheResponse(),
  controller.getUserRewards.bind(controller),
);

export { router };
