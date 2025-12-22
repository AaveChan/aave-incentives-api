import { Router } from 'express';

import {
  wrapperTokenMappingAddress,
  wrapperTokenMappingAddressNormalized,
} from '@/constants/wrapper-address.js';
import { normalizeAddress } from '@/lib/address/address.js';
import { validateQuery } from '@/validation/validation.middleware.js';
import {
  ResolveWrapperTokenPathSchema,
  ResolveWrapperTokenQuerySchema,
} from '@/validation/wrapper-tokens.schema.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(wrapperTokenMappingAddress);
});

router.get(
  '/:wrapperTokenAddress/resolved-token',
  validateQuery(ResolveWrapperTokenQuerySchema),
  (_req, res) => {
    const path = ResolveWrapperTokenPathSchema.parse(_req.params);
    const query = ResolveWrapperTokenQuerySchema.parse(_req.query);
    const chainId = query.chainId;
    const wrapperTokenAddress = normalizeAddress(path.wrapperTokenAddress);
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
  },
);

export { router };
