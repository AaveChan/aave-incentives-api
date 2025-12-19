import { Router } from 'express';

import { wrapperTokenMappingRecord } from '@/constants/wrapper-address.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(wrapperTokenMappingRecord);
});

export { router };
