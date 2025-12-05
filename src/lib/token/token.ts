import { Token } from '@/types/index';

export const compareTokens = (tokenA: Token, tokenB: Token) => {
  return tokenA.address === tokenB.address && tokenA.chainId === tokenB.chainId;
};

export const tokenToString = (token: Token) => {
  return `${token.symbol} (${token.address}) on chainId ${token.chainId}`;
};
