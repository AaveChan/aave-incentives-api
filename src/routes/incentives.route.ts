import { Router } from 'express';

import { IncentivesController } from '@/controllers/controller';

const router = Router();
const controller = new IncentivesController();

router.get('/', controller.getAllIncentives.bind(controller));
// router.get('/chain/:chainId', controller.getIncentivesByChain.bind(controller));
// router.get('/type/:type' /* implement getByType */);
router.get('/health', controller.getHealthStatus.bind(controller));

export { router };
