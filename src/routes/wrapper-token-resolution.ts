import { Router } from 'express';

import { wrapperTokenMappingAddressNormalized } from '@/constants/wrapper-address.js';
import { normalizeAddress } from '@/lib/address/address.js';
import { validateQuery } from '@/validation/validation.middleware.js';
import { ResolveWrapperTokenQuerySchema } from '@/validation/wrapper-token-resolution.schema.js';

const router = Router();

router.get('/', validateQuery(ResolveWrapperTokenQuerySchema), (_req, res) => {
  const query = ResolveWrapperTokenQuerySchema.parse(_req.query);
  const chainId = query.chainId;
  const wrapperTokenAddress = normalizeAddress(query.wrapperTokenAddress);
  const resolvedAddress = wrapperTokenMappingAddressNormalized[chainId]?.[wrapperTokenAddress];
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
