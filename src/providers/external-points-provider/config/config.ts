import { ProgramPointIncentives } from '../types.js';
import { pointPrograms, programPointIncentives } from './data.js';

const pointProgramsArray = Object.values(pointPrograms).flat();
export const pointProgramsMap = new Map(pointProgramsArray.map((program) => [program.id, program]));

// ===== VALIDATION: Detect duplicate program+asset+chain combinations =====
interface CampaignKey {
  programId: string;
  chainId: number;
  asset: string;
}

function validateNoDuplicates(programPointIncentives: ProgramPointIncentives): void {
  const seen = new Set<string>();
  const duplicates: CampaignKey[] = [];

  for (const [programId, pointIncentives] of Object.entries(programPointIncentives)) {
    for (const incentive of pointIncentives) {
      for (const rewardedTokenAddress of incentive.rewardedTokenAddresses) {
        const chainId = incentive.chainId;
        const key = `${programId}:${chainId}:${rewardedTokenAddress.toLowerCase()}`;

        if (seen.has(key)) {
          duplicates.push({
            programId: programId,
            chainId,
            asset: rewardedTokenAddress,
          });
        }
        seen.add(key);
      }
    }
  }

  if (duplicates.length > 0) {
    const errorMessage = duplicates
      .map((d) => `  - ${d.programId} / ${d.asset} / chain ${d.chainId}`)
      .join('\n');

    throw new Error(
      `Duplicate campaigns detected:\n${errorMessage}\n\n` +
        `Each program+asset+chain combination must be unique.`,
    );
  }
}

// Run validation at module load time (fails fast if duplicates exist)
validateNoDuplicates(programPointIncentives);
