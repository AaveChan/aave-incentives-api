import { Router } from 'express';

import { aciAddressesPerFeeType } from '@/constants/aci-addresses.js';

export function createAciAddressesRoute() {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(aciAddressesPerFeeType);
  });

  return router;
}
