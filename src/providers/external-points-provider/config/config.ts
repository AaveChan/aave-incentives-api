import { PointIncentive } from '../types';
import { pointCampaigns, pointPrograms } from './data';

// Create a lookup map for O(1) access (memoized)
export const pointProgramsMap = new Map(pointPrograms.map((program) => [program.id, program]));

// ===== OPTIMIZATION: Create index by chainId for fast lookups =====
export const campaignsByChainId = new Map<number, PointIncentive[]>();

for (const campaign of pointCampaigns) {
  if (!campaignsByChainId.has(campaign.chainId)) {
    campaignsByChainId.set(campaign.chainId, []);
  }
  campaignsByChainId.get(campaign.chainId)!.push(campaign);
}

// ===== VALIDATION: Detect duplicate program+asset+chain combinations =====
interface CampaignKey {
  programId: string;
  chainId: number;
  asset: string;
}

function validateNoDuplicates(campaigns: PointIncentive[]): void {
  const seen = new Set<string>();
  const duplicates: CampaignKey[] = [];

  for (const campaign of campaigns) {
    const chainId = campaign.chainId;
    const key = `${campaign.programId}:${chainId}:${campaign.rewardedTokenAddress.toLowerCase()}`;

    if (seen.has(key)) {
      duplicates.push({
        programId: campaign.programId,
        chainId,
        asset: campaign.rewardedTokenAddress,
      });
    }
    seen.add(key);
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
validateNoDuplicates(pointCampaigns);
