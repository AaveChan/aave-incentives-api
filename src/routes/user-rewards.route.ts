import { Router } from 'express';

import { ApiController } from '@/controllers/api.controller.js';
import { HttpCacheMiddleware } from '@/middlewares/cache.middleware.js';
import { GetUserRewardsParamsSchema, GetUserRewardsQuerySchema } from '@/validation/incentives.schema.js';
import { validateParams, validateQuery } from '@/validation/validation.middleware.js';

const router = Router();

const controller = new ApiController();

const httpCache = new HttpCacheMiddleware();

router.get(
  '/:address',
  validateParams(GetUserRewardsParamsSchema),
  validateQuery(GetUserRewardsQuerySchema),
  httpCache.cacheResponse(),
  controller.getUserRewards.bind(controller),
);

export { router };
