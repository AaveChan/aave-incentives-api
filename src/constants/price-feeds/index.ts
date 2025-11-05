import { Address } from 'viem';
import { mainnet, plasma } from 'viem/chains';

import { PRICE_FEED_ORACLES as PRICE_FEEDS_MAINNET } from './1.js';
import { PRICE_FEED_ORACLES as PRICE_FEEDS_PLASMA } from './9745.js';

const PRICE_FEED_ORACLES: Record<number, Record<Address, Address>> = {
  [mainnet.id]: PRICE_FEEDS_MAINNET,
  [plasma.id]: PRICE_FEEDS_PLASMA,
};

export default PRICE_FEED_ORACLES;
