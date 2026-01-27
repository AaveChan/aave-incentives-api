import { Address } from 'viem';

/**
 * Merkl Distributor contract address (same across all chains)
 * Source: https://docs.merkl.xyz/
 */
export const MERKL_DISTRIBUTOR_ADDRESS: Address = '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae';

/**
 * Chain-specific exceptions (if any)
 */
const MERKL_DISTRIBUTOR_EXCEPTIONS: Record<number, Address> = {
  // Add exceptions here if needed in the future
  // [chainId]: 'different_address'
};

export function getMerklDistributorAddress(chainId: number): Address {
  return MERKL_DISTRIBUTOR_EXCEPTIONS[chainId] ?? MERKL_DISTRIBUTOR_ADDRESS;
}
