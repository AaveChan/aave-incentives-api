// import { PointIncentives, PointProgramId } from '../types.js';
import {
  // pointIncentives,
  pointPrograms,
} from './data.js';

// Export in flat
// export const pointIncentivesArray = Object.values(pointIncentives).flat();
export const pointProgramsArray = Object.values(pointPrograms).flat();

// Create a lookup map for O(1) access (memoized)
export const pointProgramsMap = new Map(pointProgramsArray.map((program) => [program.id, program]));

// ===== OPTIMIZATION: Create index by chainId for fast lookups =====
// export const campaignsByChainId = new Map<number, PointIncentives[]>();

// for (const incentive of pointIncentivesArray) {
//   if (!campaignsByChainId.has(incentive.chainId)) {
//     campaignsByChainId.set(incentive.chainId, []);
//   }
//   campaignsByChainId.get(incentive.chainId)!.push(incentive);
// }

// ===== VALIDATION: Detect duplicate program+asset+chain combinations =====
// interface CampaignKey {
//   programId: string;
//   chainId: number;
//   asset: string;
// }

// function validateNoDuplicates(campaigns: Record<PointProgramId, PointIncentives[]>): void {
//   const seen = new Set<string>();
//   const duplicates: CampaignKey[] = [];

//   for (const [programId, programCampaigns] of Object.entries(campaigns)) {
//     for (const campaign of programCampaigns) {
//       for (const rewardedTokenAddress of campaign.rewardedTokenAddresses) {
//         const chainId = campaign.chainId;
//         const key = `${programId}:${chainId}:${rewardedTokenAddress.toLowerCase()}`;

//         if (seen.has(key)) {
//           duplicates.push({
//             programId: programId,
//             chainId,
//             asset: rewardedTokenAddress,
//           });
//         }
//         seen.add(key);
//       }
//     }
//   }

//   if (duplicates.length > 0) {
//     const errorMessage = duplicates
//       .map((d) => `  - ${d.programId} / ${d.asset} / chain ${d.chainId}`)
//       .join('\n');

//     throw new Error(
//       `Duplicate campaigns detected:\n${errorMessage}\n\n` +
//         `Each program+asset+chain combination must be unique.`,
//     );
//   }
// }

// Run validation at module load time (fails fast if duplicates exist)
// validateNoDuplicates(pointIncentives);
