import { Address } from 'viem';

import { Brand } from '../utils/brand-type.js';

export type NormalizedAddress = Brand<Address, 'NormalizedAddress'>;

export const normalizeAddress = (address: Address): NormalizedAddress => {
  return address.toLowerCase() as NormalizedAddress;
};
