import { Router } from 'express';

import { wrapperTokenMappingAddress } from '@/constants/wrapper-address.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(wrapperTokenMappingAddress);
});

export { router };
