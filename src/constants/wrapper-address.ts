import {
  AaveV3Arbitrum,
  AaveV3Base,
  AaveV3Ethereum,
  AaveV3EthereumHorizon,
  AaveV3Linea,
  AaveV3Plasma,
  AaveV3Scroll,
  AaveV3Sonic,
} from '@bgd-labs/aave-address-book';
import { Address } from 'viem';

import { BookType } from '@/lib/aave/aave-tokens.js';

const aEthUSDtbWrapper: Address = '0x04EADd7B10ea9a484c60860aea7A7C0AEc09B9F0';

const aEthUSDeWrapper: Address = '0x3a4de44B29995a3D8Cd02d46243E1563E55bCc8b';
const aEthUSDeWrapperPlasma: Address = '0x63dC02BB25E7BF7Eaa0E42E71D785a388AcD740b';

const aScrSCRWrapper: Address = '0xb8021254f00C1aFb67b861f274cea175FB97c2Af';

const aHorRwaRLUSDWrapper: Address = '0x503D751B13a71D8e69Db021DF110bfa7aE1dA889';

const aHorRwaUSDCWrapper: Address = '0x0AD8ac496B4280bC3B36fb1b6372abdEc8eE7C54';

const aEthRLUSDWrapper: Address = '0x72eEED8043Dcce2Fe7CdAC950D928F80f472ab80';

const aArbARBWrapper: Address = '0x2c63f9da936624Ac7313b972251D340260A4bF08';

const aLinWeETHWrapper: Address = '0xDcC1bcC6eCD1E63cBA178C289bC1dA9f757a2eF4';

const aETHPYUSDWrapper: Address = '0x0f1eb8D5568E9C1ee72E6dE7B5a9e2837A530019';

const EURCWrapper: Address = '0x82a5530942263645dD3B8101740c2a0Ac30c7919'; // withdraw wrapper

const EURCBaseWrapper: Address = '0x917770964387999bd938e6CA033cfFc0A5798757'; // withdraw wrapper

const USDCSonicWrapper: Address = '0xb542b71Bf6A5e907d7A1B34553b47a25cab47F3e'; // withdraw wrapper

const USDtbMainnetWrapper: Address = '0xA74CaB633214C16808Eb0b6F499C98036b227B8a'; // withdraw wrapper

// wrapper aToken || withdraw wrapper token address => book
export const tokenWrapperMapping: Record<Address, BookType> = {
  [aEthUSDtbWrapper]: AaveV3Ethereum.ASSETS.USDtb,
  [USDtbMainnetWrapper]: AaveV3Ethereum.ASSETS.USDtb,
  [aEthUSDeWrapper]: AaveV3Ethereum.ASSETS.USDe,
  [aScrSCRWrapper]: AaveV3Scroll.ASSETS.SCR,
  [aHorRwaRLUSDWrapper]: AaveV3EthereumHorizon.ASSETS.RLUSD,
  [aHorRwaUSDCWrapper]: AaveV3EthereumHorizon.ASSETS.USDC,
  [aEthRLUSDWrapper]: AaveV3Ethereum.ASSETS.RLUSD,
  [aArbARBWrapper]: AaveV3Arbitrum.ASSETS.ARB,
  [aLinWeETHWrapper]: AaveV3Linea.ASSETS.weETH,
  [aEthUSDeWrapperPlasma]: AaveV3Plasma.ASSETS.USDe,
  [aETHPYUSDWrapper]: AaveV3Ethereum.ASSETS.PYUSD,
  [EURCWrapper]: AaveV3Ethereum.ASSETS.EURC,
  [EURCBaseWrapper]: AaveV3Base.ASSETS.EURC,
  [USDCSonicWrapper]: AaveV3Sonic.ASSETS.USDC,
};

// wrapper aToken || withdraw wrapper token => aToken from tokenWrapperMapping mapping
export const mapping: Record<Address, Address> = Object.fromEntries(
  Object.entries(tokenWrapperMapping).map(([wrapperAddress, book]) => [
    wrapperAddress,
    book.A_TOKEN,
  ]),
);
