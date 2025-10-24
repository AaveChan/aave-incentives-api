import { Router } from 'express';

import { IncentivesController } from '@/controllers/controller';
import { GetIncentivesQuerySchema } from '@/validation/incentives.schema';
import { validateQuery } from '@/validation/validation';

const router = Router();
const controller = new IncentivesController();

router.get(
  '/',
  validateQuery(GetIncentivesQuerySchema),
  controller.getAllIncentives.bind(controller),
);

router.get('/health', controller.getHealthStatus.bind(controller));

export { router };
