import { Router } from 'express';

import { ApiController } from '@/controllers/api.controller.js';

const router = Router();

const controller = new ApiController();

router.get('/', controller.getProvidersStatus.bind(controller));

export { router };
