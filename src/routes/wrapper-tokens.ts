import { Router } from 'express';

import {
  wrapperTokenMappingAddress,
  wrapperTokenMappingAddressNormalized,
} from '@/constants/merkl/wrapper-address.js';
import { normalizeAddress } from '@/lib/address/address.js';
import { validateParams, validateQuery } from '@/validation/validation.middleware.js';
import {
  ResolveWrapperTokenParamsSchema,
  ResolveWrapperTokenQuerySchema,
} from '@/validation/wrapper-tokens.schema.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(wrapperTokenMappingAddress);
});

router.get(
  '/:wrapperTokenAddress/resolved-token',
  validateQuery(ResolveWrapperTokenQuerySchema),
  validateParams(ResolveWrapperTokenParamsSchema),
  (_req, res) => {
    const path = ResolveWrapperTokenParamsSchema.parse(_req.params);
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
