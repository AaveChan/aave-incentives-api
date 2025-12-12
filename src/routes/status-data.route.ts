import { Router } from 'express';

import { getStatus } from '@/lib/status/status.js';

export function createStatusDataRoute() {
  const router = Router();

  router.get('/', async (_req, res) => {
    const status = await getStatus();

    res.json(status);
  });

  return router;
}
