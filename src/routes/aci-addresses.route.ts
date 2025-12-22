import { Router } from 'express';

import { aciAddressesPerFeeType } from '@/constants/aci-addresses.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(aciAddressesPerFeeType);
});

export { router };
