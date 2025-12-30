import { Router } from 'express';

import { IncentivesController } from '@/controllers/controller.js';

const router = Router();

const controller = new IncentivesController();

router.get('/', controller.getProvidersStatus.bind(controller));

export { router };
