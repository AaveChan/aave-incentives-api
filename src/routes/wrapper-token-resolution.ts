import { Router } from 'express';

import { wrapperTokenMapping } from '@/constants/wrapper-address.js';
import { validateQuery } from '@/validation/validation.middleware.js';
import { ResolveWrapperTokenQuerySchema } from '@/validation/wrapper-token-resolution.schema.js';

const router = Router();

router.get('/', validateQuery(ResolveWrapperTokenQuerySchema), (_req, res) => {
  const query = ResolveWrapperTokenQuerySchema.parse(_req.query);
  const wrapperToken = query.wrapperToken;
  const resolvedAddress = wrapperTokenMapping.get(wrapperToken);
  if (!resolvedAddress) {
    return res.json({
      resolvedAddress: null,
    });
  } else {
    res.json({
      resolvedAddress,
    });
  }
});

export { router };
