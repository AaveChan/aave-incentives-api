import { AaveV3Ethereum } from '@aave-dao/aave-address-book';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';

type PriceFeed = Record<Address, Address>;

const usdPriceFeedsMainnet: PriceFeed = {
  [AaveV3Ethereum.ASSETS.WETH.UNDERLYING]: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  [AaveV3Ethereum.ASSETS.USDC.UNDERLYING]: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
  [AaveV3Ethereum.ASSETS.DAI.UNDERLYING]: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
  [AaveV3Ethereum.ASSETS.weETH.UNDERLYING]: '0xdDb6F90fFb4d3257dd666b69178e5B3c5Bf41136', // RedStone Price feed
  [AaveV3Ethereum.ASSETS.USDT.UNDERLYING]: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
  [AaveV3Ethereum.ASSETS.EURC.UNDERLYING]: '0xb49f677943BC038e9857d61E7d053CaA2C1734C1', // Chainlink EUR (fiat) price feed
  [AaveV3Ethereum.ASSETS.USDe.UNDERLYING]: '0xa569d910839Ae8865Da8F8e70FfFb0cBA869F961',
  [AaveV3Ethereum.ASSETS.PYUSD.UNDERLYING]: '0x8f1dF6D7F2db73eECE86a18b4381F4707b918FB1',
};

const ethPriceFeedsMainnet: PriceFeed = {
  [AaveV3Ethereum.ASSETS.ezETH.UNDERLYING]: '0xF4a3e183F59D2599ee3DF213ff78b1B3b1923696', // RedStone Price feed
  [AaveV3Ethereum.ASSETS.rsETH.UNDERLYING]: '0xA736eAe8805dDeFFba40cAB8c99bCB309dEaBd9B', // Redstone rsETH price feed
};

const priceFeedsMainnet: PriceFeed = {
  ...usdPriceFeedsMainnet,
  ...ethPriceFeedsMainnet,
};

export const priceFeeds: Record<number, PriceFeed> = {
  [mainnet.id]: priceFeedsMainnet,
};
